const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET alle Kunden
router.get('/', (req, res) => {
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST neuen Kunden
router.post('/', (req, res) => {
  const { name, email, age } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name und E-Mail sind Pflichtfelder.' });
  }

  const stmt = db.prepare('INSERT INTO customers (name, email, age) VALUES (?, ?, ?)');
  stmt.run([name, email, age], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, email, age });
  });
  stmt.finalize();
});

// PUT (Update)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, age } = req.body;
  db.run(
    'UPDATE customers SET name = ?, email = ?, age = ? WHERE id = ?',
    [name, email, age, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
      res.json({ id, name, email, age });
    }
  );
});

// DELETE
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM customers WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
    res.json({ message: 'Gelöscht' });
  });
});

module.exports = router;