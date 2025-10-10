const express = require('express');
const cors = require('cors');
const path = require('path');
const customersRouter = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Statische Dateien (optional für Build)
app.use(express.static(path.join(__dirname, '../client/build')));

// API-Routen
app.use('/api/customers', customersRouter);

// Fallback für React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});