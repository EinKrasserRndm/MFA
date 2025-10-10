import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Customer } from '../types/Customer';

const DataFormPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email) {
      setError('Name und E-Mail sind Pflichtfelder.');
      return;
    }

    try {
      await api.post<Customer>('/customers', { name, email, age: Number(age) || null });
      setSuccess('Daten erfolgreich gespeichert!');
      setName('');
      setEmail('');
      setAge('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Datenerfassung (Kunde)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>E-Mail *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Alter</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <button type="submit">Speichern</button>
        <button type="button" onClick={() => navigate('/')}>
          Abbrechen
        </button>
      </form>
    </div>
  );
};

export default DataFormPage;