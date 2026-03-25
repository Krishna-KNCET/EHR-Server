import io
from pathlib import Path
import joblib
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

heart_model = None
diabetes_model = None
ecg_model = None
model_load_errors = {}


class ECGClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(187, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 32)
        self.fc4 = nn.Linear(32, 2)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.relu(self.fc3(x))
        return self.fc4(x)

try:
    heart_model = joblib.load(MODEL_DIR / "heart_model.pkl")
    print("Heart model loaded")
except Exception as e:
    model_load_errors["heart"] = str(e)
    print("Heart model error:", e)

try:
    diabetes_model = joblib.load(MODEL_DIR / "diabetes_model.pkl")
    print("Diabetes model loaded")
except Exception as e:
    model_load_errors["diabetes"] = str(e)
    print("Diabetes model error:", e)

try:
    loaded_ecg = torch.load(MODEL_DIR / "ecg_model.pth", map_location="cpu")
    if isinstance(loaded_ecg, dict):
        model = ECGClassifier()
        model.load_state_dict(loaded_ecg, strict=True)
        ecg_model = model
    else:
        ecg_model = loaded_ecg

    if hasattr(ecg_model, "eval"):
        ecg_model.eval()
    print("ECG model loaded")
except Exception as e:
    model_load_errors["ecg"] = str(e)
    print("ECG model error:", e)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class HeartRequest(BaseModel):
    age: float
    sex: float
    cp: float
    trestbps: float
    chol: float
    thalach: float

class DiabetesRequest(BaseModel):
    pregnancies: float = 1.0
    glucose: float
    bloodPressure: float = 72.0
    skinThickness: float = 20.0
    bmi: float
    insulin: float
    diabetesPedigreeFunction: float = 0.5
    age: float

@app.get("/")
def home():
    return {"status": "running"}

@app.post("/predict-heart")
def predict_heart(data: HeartRequest):
    if heart_model is None:
        raise HTTPException(500, "Heart model missing")

    features = np.array([[data.age, data.sex, data.cp, data.trestbps, data.chol, data.thalach]])
    pred = heart_model.predict(features)[0]

    return {
        "prediction": "High Risk" if pred == 1 else "Low Risk",
        "confidence": 0.85,
        "source": "model",
    }


def fallback_diabetes_prediction(data: DiabetesRequest):
    score = 0.0
    if data.glucose >= 140:
        score += 0.45
    if data.bmi >= 30:
        score += 0.25
    if data.insulin >= 180:
        score += 0.20
    if data.age >= 45:
        score += 0.10

    confidence = max(0.55, min(0.95, score if score > 0 else 0.55))
    prediction = "High Risk" if score >= 0.5 else "Low Risk"
    return {
        "prediction": prediction,
        "confidence": round(float(confidence), 3),
        "source": "fallback",
    }

@app.post("/predict-diabetes")
def predict_diabetes(data: DiabetesRequest):
    if diabetes_model is None:
        return fallback_diabetes_prediction(data)

    try:
        n_features = int(getattr(diabetes_model, "n_features_in_", 4))
        if n_features >= 8:
            features = np.array([[
                data.pregnancies,
                data.glucose,
                data.bloodPressure,
                data.skinThickness,
                data.insulin,
                data.bmi,
                data.diabetesPedigreeFunction,
                data.age,
            ]], dtype=float)
        else:
            features = np.array([[data.glucose, data.bmi, data.insulin, data.age]], dtype=float)

        pred = diabetes_model.predict(features)[0]
        confidence = 0.85
        if hasattr(diabetes_model, "predict_proba"):
            proba = diabetes_model.predict_proba(features)
            confidence = float(np.max(proba[0]))

        return {
            "prediction": "High Risk" if pred == 1 else "Low Risk",
            "confidence": round(max(0.5, min(0.99, confidence)), 3),
            "source": "model",
        }
    except Exception as e:
        print("Diabetes inference error:", e)
        return fallback_diabetes_prediction(data)

def process_signal(file_bytes):
    try:
        decoded = file_bytes.decode("utf-8")
        signal = np.genfromtxt(io.StringIO(decoded), delimiter=",")
        return np.array(signal).reshape(-1)
    except Exception:
        return np.frombuffer(file_bytes, dtype=np.uint8).astype(float)


def normalize_signal_length(signal: np.ndarray, target_length: int = 187):
    if signal.size == 0:
        return np.zeros(target_length, dtype=np.float32)

    if signal.size == target_length:
        return signal.astype(np.float32)

    x_old = np.linspace(0.0, 1.0, num=signal.size)
    x_new = np.linspace(0.0, 1.0, num=target_length)
    resized = np.interp(x_new, x_old, signal.astype(float))
    return resized.astype(np.float32)


def fallback_ecg_prediction(signal: np.ndarray):
    if signal.size == 0:
        return {
            "prediction": "Uncertain",
            "confidence": 0.5,
            "source": "fallback",
        }

    normalized = signal.astype(float)
    max_val = np.max(np.abs(normalized))
    if max_val > 0:
        normalized = normalized / max_val

    variability = float(np.std(normalized))
    peak_ratio = float(np.mean(np.abs(normalized) > 0.75))
    risk_score = min(1.0, (variability * 1.4) + (peak_ratio * 0.8))

    prediction = "Abnormal" if risk_score >= 0.55 else "Normal"
    confidence = max(0.55, min(0.93, 0.55 + abs(risk_score - 0.5)))

    return {
        "prediction": prediction,
        "confidence": round(float(confidence), 3),
        "source": "fallback",
    }

@app.post("/predict-ecg")
async def predict_ecg(file: UploadFile = File(...)):
    data = await file.read()
    signal = process_signal(data)
    signal = normalize_signal_length(signal, 187)

    if ecg_model is None or not callable(ecg_model):
        return fallback_ecg_prediction(signal)

    try:
        tensor = torch.tensor(signal, dtype=torch.float32).view(1, -1)
        with torch.no_grad():
            output = ecg_model(tensor)

        if isinstance(output, torch.Tensor) and output.ndim == 2 and output.shape[1] >= 2:
            probs = torch.softmax(output, dim=1).detach().cpu().numpy()[0]
            pred_idx = int(np.argmax(probs))
            prediction = "Abnormal" if pred_idx == 1 else "Normal"
            confidence = float(probs[pred_idx])
        elif isinstance(output, torch.Tensor):
            output_value = float(output.detach().cpu().flatten()[0].item())
            prediction = "Abnormal" if output_value >= 0.5 else "Normal"
            confidence = max(0.5, min(0.95, abs(output_value - 0.5) + 0.5))
        else:
            output_value = float(output)
            prediction = "Abnormal" if output_value >= 0.5 else "Normal"
            confidence = max(0.5, min(0.95, abs(output_value - 0.5) + 0.5))

        return {
            "prediction": prediction,
            "confidence": round(float(confidence), 3),
            "source": "model",
        }
    except Exception as e:
        print("ECG inference error:", e)
        return fallback_ecg_prediction(signal)