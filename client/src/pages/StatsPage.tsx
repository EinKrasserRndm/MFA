import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import { Customer } from '../types/Customer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatsPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await api.get<Customer[]>('/customers');
      setCustomers(res.data);
    };
    fetch();
  }, []);

  // Beispiel: Altersverteilung
  const ageGroups = [0, 18, 30, 50, 100];
  const labels = ['<18', '18–29', '30–49', '50+'];
  const counts = Array(labels.length).fill(0);

  customers.forEach(c => {
    if (c.age == null) return;
    if (c.age < 18) counts[0]++;
    else if (c.age < 30) counts[1]++;
    else if (c.age < 50) counts[2]++;
    else counts[3]++;
  });

  const data = {
    labels,
    datasets: [{
      label: 'Anzahl Kunden',
      data: counts,
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }]
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Auswertung</h2>
      <p><strong>Gesamtanzahl Kunden:</strong> {customers.length}</p>
      <div style={{ width: '600px', height: '400px' }}>
        <Bar data={data} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default StatsPage;