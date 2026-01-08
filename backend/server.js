const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// ============================================================
// CREDENCIAIS DA BASE DE DADOS NA HOSTINGER
// ============================================================
const dbConfig = {
  host: 'localhost',
  user: 'u123456789_utilizador', // Atualize com o seu utilizador Hostinger
  password: 'SuaSenhaSegura',     // Atualize com a sua senha Hostinger
  database: 'u123456789_messe_db',// Atualize com o nome da sua BD Hostinger
  waitForConnections: true,
  connectionLimit: 10
};

const pool = mysql.createPool(dbConfig);

// Rotas da API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length > 0) {
      const user = rows[0];
      delete user.password;
      res.json(user);
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stock', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stock_items ORDER BY name ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [[total]] = await pool.query('SELECT COUNT(*) as cnt FROM stock_items');
    const [[low]] = await pool.query('SELECT COUNT(*) as cnt FROM stock_items WHERE quantity <= minLevel');
    const [[done]] = await pool.query("SELECT COUNT(*) as cnt FROM requisitions WHERE status = 'CONCLUIDO'");
    res.json({ totalItems: total.cnt, lowStockItems: low.cnt, pendingRequisitions: 0, completedRequisitions: done.cnt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Outras rotas da API... (Sectors, Users, Requisitions, Movements)
// [Omitido por brevidade, manter a lógica do arquivo anterior]

// SERVIR O FRONTEND (ESTÁTICOS)
// Importante: Assume-se que a estrutura na Hostinger é:
// /public_html (ou pasta do site)
//    /dist (onde estão os assets do build)
//    /backend (onde está este server.js)
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Huambo ativo na porta ${PORT}`);
});