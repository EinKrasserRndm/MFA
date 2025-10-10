import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Customer } from '../types/Customer';

const DataManagementPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await api.get<Customer[]>('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Wirklich löschen?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
      setMessage('Eintrag gelöscht.');
    } catch (err: any) {
      setMessage('Fehler beim Löschen: ' + (err.response?.data?.error || 'Unbekannt'));
    }
  };

  if (loading) return <p>Lade Daten...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Datenverwaltung</h2>
      {message && <p style={{ color: message.includes('Fehler') ? 'red' : 'green' }}>{message}</p>}
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>E-Mail</th>
            <th>Alter</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.age || '–'}</td>
              <td>
                <button onClick={() => handleDelete(c.id)}>Löschen</button>
                {/* Bearbeiten könnte hier hinzugefügt werden */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataManagementPage;