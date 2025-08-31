
const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path')

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../front_end')));

// Create transaction
app.post('/transactions', (req, res) => {
  const { description, amount, category, date } = req.body;
  db.run(
    `INSERT INTO transactions (description, amount, category, date)
     VALUES (?, ?, ?, ?)`,
    [description, amount, category, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get all transactions
app.get('/transactions', (req, res) => {
  db.all(`SELECT * FROM transactions`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete transaction
app.delete('/transactions/:id', (req, res) => {
  db.run(`DELETE FROM transactions WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
