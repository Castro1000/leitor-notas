// backend/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido" });

    req.usuario = decoded;
    next();
  });
};

module.exports = verificarToken;
