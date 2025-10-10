import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Willkommen zur Datenerfassungs-App</h1>
      <p>Wählen Sie eine Aktion aus:</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/form">
          <button>Datenerfassung</button>
        </Link>
        <Link to="/manage">
          <button>Datenverwaltung</button>
        </Link>
        <Link to="/stats">
          <button>Auswertung</button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;