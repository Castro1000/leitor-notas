const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306, // <-- adicionado
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leitor_nf',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: true // ← necessário para Railway
  }
});

module.exports = pool;
