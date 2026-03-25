import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './styles.css';

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [patientId, setPatientId] = useState('PT-TEST');
  const [patient, setPatient] = useState(null);

  const login = async () => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setToken(data.data.accessToken);
  };

  const searchPatient = async () => {
    const { data } = await axios.get(`/api/doctors/search?patientId=${patientId}`, { headers: { Authorization: `Bearer ${token}` } });
    setPatient(data.data);
  };

  return (
    <div className="container">
      <h1>EHR Dashboard</h1>
      <section>
        <h2>Login</h2>
        <p>Use a registered account. No default credentials are prefilled.</p>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
        <button onClick={login}>Login</button>
      </section>
      <section>
        <h2>Doctor - Search Patient</h2>
        <input value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Patient ID" />
        <button onClick={searchPatient} disabled={!token}>Search</button>
        {patient && (
          <div className="card">
            <div><b>Patient ID:</b> {patient.patientId}</div>
            <div><b>Name:</b> {patient.name}</div>
            <div><b>Age:</b> {patient.age}</div>
          </div>
        )}
      </section>
      <section>
        <h2>Swagger Docs</h2>
        <a href="http://localhost:4000/api/docs" target="_blank" rel="noreferrer">Open API Docs</a>
      </section>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
