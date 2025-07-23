const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const jwt = require('jsonwebtoken');

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================
const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET || 'segredo123', (err, usuario) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
};

// ==================== GRAVAR NOTA ====================
router.post('/gravar-nota', autenticarToken, async (req, res) => {
  const {
    chave_acesso, numero_nota, emitente_nome, emitente_cnpj,
    destinatario_nome, destinatario_cnpj, data_emissao, valor_total
  } = req.body;

  const usuario_logado = req.usuario.usuario;
  const isOperador = usuario_logado === 'operador' || usuario_logado === 'operador2';

  try {
    const [existente] = await db.query(
      'SELECT * FROM notas_fiscais WHERE chave_acesso = ?',
      [chave_acesso]
    );

    const dataAtual = new Date();

    if (existente.length > 0) {
      const nota = existente[0];

      if (isOperador) {
        if (nota.status === 'EM ANDAMENTO') {
          await db.query(
            'UPDATE notas_fiscais SET status = ?, usuario = ?, data_logistica = ? WHERE id = ?',
            ['CONTAINER SENDO OVADO', usuario_logado, dataAtual, nota.id]
          );
          const [atualizada] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [nota.id]);
          return res.json({ message: 'Status atualizado', status: 'CONTAINER SENDO OVADO', nota: atualizada[0] });
        } else if (['CONTAINER FINALIZADO', 'FINALIZADA'].includes(nota.status)) {
          return res.status(400).json({ message: 'Nota já finalizada.', nota });
        } else {
          return res.status(400).json({ message: 'Nota não está em andamento.', nota });
        }
      }

      if (usuario_logado === 'validador') {
        if (nota.status === 'CONTAINER FINALIZADO') {
          return res.json({ message: 'Nota pronta para finalização.', status: nota.status, nota });
        } else {
          return res.status(400).json({ message: 'Aguardando OPERADOR finalizar o container.', nota });
        }
      }

      if (usuario_logado === 'licenciador') {
        const [completa] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [nota.id]);
        return res.status(400).json({ message: 'Nota já registrada.', nota: completa[0] });
      }

      return res.status(403).json({ message: 'Usuário não autorizado.' });
    }

    if (usuario_logado !== 'licenciador') {
      return res.status(400).json({ message: 'Nota ainda não registrada. Aguardando saída pelo Licenciador.' });
    }

    await db.query(
      `INSERT INTO notas_fiscais (
        chave_acesso, numero_nota, emitente_nome, emitente_cnpj,
        destinatario_nome, destinatario_cnpj, data_emissao,
        valor_total, status, usuario, data_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        chave_acesso, numero_nota, emitente_nome, emitente_cnpj,
        destinatario_nome, destinatario_cnpj, data_emissao,
        valor_total, 'EM ANDAMENTO', 'licenciador'
      ]
    );

    const [nova] = await db.query('SELECT * FROM notas_fiscais WHERE chave_acesso = ?', [chave_acesso]);

    return res.status(201).json({
      message: 'Nota registrada com sucesso!',
      status: 'EM ANDAMENTO',
      nota: nova[0]
    });

  } catch (error) {
    console.error('Erro ao gravar nota:', error);
    return res.status(500).json({ message: 'Erro ao gravar nota', error });
  }
});

// ==================== FINALIZAR CONTAINER ====================
router.put('/finalizar-container/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  const usuario_logado = req.usuario.usuario;
  const isOperador = usuario_logado === 'operador' || usuario_logado === 'operador2';

  if (!isOperador) {
    return res.status(403).json({ message: 'Usuário não autorizado a finalizar o container.' });
  }

  try {
    await db.query(
      'UPDATE notas_fiscais SET status = ?, data_logistica = NOW() WHERE id = ?',
      ['CONTAINER FINALIZADO', id]
    );
    return res.json({ message: 'Container finalizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao finalizar container:', error);
    return res.status(500).json({ message: 'Erro ao finalizar container', error });
  }
});

// ==================== FINALIZAR NOTA ====================
router.put('/finalizar-nota/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'UPDATE notas_fiscais SET status = ?, data_entrega = NOW() WHERE id = ?',
      ['FINALIZADA', id]
    );
    return res.json({ message: 'Nota finalizada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao finalizar nota', error });
  }
});

// ==================== LISTAR NOTAS ====================
router.get('/listar-notas', autenticarToken, async (req, res) => {
  try {
    const [notas] = await db.query('SELECT * FROM notas_fiscais ORDER BY data_registro DESC');
    return res.json(notas);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar notas', error });
  }
});

// ==================== LISTAR USUÁRIOS ====================
router.get('/usuarios', autenticarToken, async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, usuario FROM usuarios ORDER BY id');
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

// ==================== ATUALIZAR USUÁRIO ====================
router.put('/usuarios/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    await db.query(
      'UPDATE usuarios SET usuario = ?, senha = ? WHERE id = ?',
      [usuario, senha, id]
    );
    res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário', error });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const [usuarios] = await db.query(
      'SELECT * FROM usuarios WHERE usuario = ? AND senha = ?',
      [usuario, senha]
    );
    if (usuarios.length === 0)
      return res.status(401).json({ message: 'Usuário ou senha inválidos' });

    const payload = { id: usuarios[0].id, usuario: usuarios[0].usuario };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'segredo123', {
      expiresIn: '2h',
    });

    return res.json({ message: 'Login bem-sucedido', usuario: usuarios[0], token });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao fazer login', error });
  }
});

module.exports = router;
