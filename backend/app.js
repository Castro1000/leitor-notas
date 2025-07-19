const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const notaRoutes = require("./routes/notaRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API
app.use("/api", notaRoutes);

// Servir frontend buildado
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    const indexFile = path.join(distPath, "index.html");
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send("index.html não encontrado.");
    }
  } else {
    next();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando em http://0.0.0.0:${PORT}`);
});
