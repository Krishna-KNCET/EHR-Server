# ML Service

Minimal FastAPI service for prediction endpoints used by the EHR stack.

## Run locally

```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## API

- `GET /` health response
- `POST /predict` JSON body: `{ "value": 0.72 }`
- `POST /predict` JSON body with per-model features:
	- `{ "heartbeat_features": [..], "spo2_features": [..], "temperature_features": [..], "value": 0.72 }`
- `POST /predict` multipart form-data: `file=<scan-image-or-pdf>` (optional `value` fallback)

## Trained Models (3-model pipeline)

Place trained artifacts in `ml-service/models/` before starting the service:

- `ml-service/models/heartbeat_model.joblib`
- `ml-service/models/spo2_model.joblib`
- `ml-service/models/temperature_model.joblib`

If any model file is missing, the service uses an internal threshold fallback for that model only.

## When To Set Dataset

1. Keep raw datasets outside the running API folder (recommended: `ml-service/data/`).
2. Train your heartbeat, SpO2, and temperature models offline.
3. Export trained artifacts (`.joblib`) into `ml-service/models/`.
4. Start/restart uvicorn so startup loads the new models.
