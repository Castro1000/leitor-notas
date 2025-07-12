const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const notaRoutes = require('./routes/notaRoutes');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', notaRoutes);

// Servir arquivos estáticos do frontend (pasta dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Rota para SPA: sempre entregar index.html se a rota não começar com /api
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexFile = path.join(distPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send('index.html não encontrado.');
    }
  } else {
    next();
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
