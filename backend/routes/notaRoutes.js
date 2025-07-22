const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ==================== ROTAS DE NOTAS ====================

// GRAVAR NOTA
router.post('/gravar-nota', async (req, res) => {
  const {
    chave_acesso, numero_nota, emitente_nome, emitente_cnpj,
    destinatario_nome, destinatario_cnpj, data_emissao, valor_total, usuario_logado
  } = req.body;

  try {
    const [existente] = await db.query(
      'SELECT * FROM notas_fiscais WHERE chave_acesso = ?',
      [chave_acesso]
    );

    const dataAtual = new Date();

    if (existente.length > 0) {
      const nota = existente[0];

      if (usuario_logado === 'logistica') {
        if (nota.status === 'EM ANDAMENTO') {
          await db.query(
            'UPDATE notas_fiscais SET status = ?, usuario = ?, data_logistica = ? WHERE id = ?',
            ['CONTAINER SENDO OVADO', 'logistica', dataAtual, nota.id]
          );
          const [atualizada] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [nota.id]);
          return res.json({ message: 'Status atualizado', status: 'CONTAINER SENDO OVADO', nota: atualizada[0] });
        } else if (['CONTAINER FINALIZADO', 'FINALIZADA'].includes(nota.status)) {
          return res.status(400).json({ message: 'Nota já finalizada.', nota });
        } else {
          return res.status(400).json({ message: 'Nota não está em andamento.', nota });
        }
      }

      if (usuario_logado === 'ph') {
        if (nota.status === 'CONTAINER FINALIZADO') {
          return res.json({ message: 'Nota pronta para finalização.', status: nota.status, nota });
        } else {
          return res.status(400).json({ message: 'Aguardando LOGÍSTICA finalizar o container.', nota });
        }
      }

      if (usuario_logado === 'michele') {
        const [completa] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [nota.id]);
        return res.status(400).json({ message: 'Nota já registrada.', nota: completa[0] });
      }

      return res.status(403).json({ message: 'Usuário não autorizado.' });
    }

    if (usuario_logado !== 'michele') {
      return res.status(400).json({ message: 'Nota ainda não registrada. Aguardando saída pela Michele.' });
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
        valor_total, 'EM ANDAMENTO', 'michele'
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

// FINALIZAR NOTA
router.put('/finalizar-nota/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existe] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [id]);
    if (existe.length === 0) return res.status(404).json({ message: 'Nota não encontrada' });

    await db.query(
      'UPDATE notas_fiscais SET status = ?, data_entrega = NOW() WHERE id = ?',
      ['FINALIZADA', id]
    );
    return res.json({ message: 'Nota finalizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao finalizar nota:', error);
    return res.status(500).json({ message: 'Erro ao finalizar nota', error });
  }
});

// FINALIZAR CONTAINER
router.put('/finalizar-container/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existe] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [id]);
    if (existe.length === 0) return res.status(404).json({ message: 'Nota não encontrada' });

    await db.query('UPDATE notas_fiscais SET status = ? WHERE id = ?', ['CONTAINER FINALIZADO', id]);
    return res.json({ message: 'Container finalizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao finalizar container:', error);
    return res.status(500).json({ message: 'Erro ao finalizar container', error });
  }
});

// LISTAR NOTAS
router.get('/listar-notas', async (req, res) => {
  try {
    const [notas] = await db.query('SELECT * FROM notas_fiscais ORDER BY data_registro DESC');
    return res.json(notas);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar notas', error });
  }
});

// MARCAR COMO ENTREGUE
router.put('/marcar-entregue/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE notas_fiscais SET status = ? WHERE id = ?', ['ENTREGUE', id]);
    return res.json({ message: 'Nota marcada como ENTREGUE.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao marcar como entregue', error });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE usuario = ? AND senha = ?', [usuario, senha]);
    if (usuarios.length === 0) return res.status(401).json({ message: 'Usuário ou senha inválidos' });
    return res.json({ message: 'Login bem-sucedido', usuario: usuarios[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao fazer login', error });
  }
});

// ==================== ROTAS DE USUÁRIOS ====================

// LISTAR USUÁRIOS
router.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, nome, usuario FROM usuarios ORDER BY id');
    return res.json(usuarios);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar usuários', error });
  }
});

// ATUALIZAR USUÁRIO
router.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, usuario, senha } = req.body;

  try {
    const [existe] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (existe.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    const campos = [];
    const valores = [];
    if (nome) {
      campos.push('nome = ?');
      valores.push(nome);
    }
    if (usuario) {
      campos.push('usuario = ?');
      valores.push(usuario);
    }
    if (senha) {
      campos.push('senha = ?');
      valores.push(senha);
    }

    if (campos.length === 0) return res.status(400).json({ message: 'Nenhum dado para atualizar' });

    valores.push(id);
    const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
    await db.query(sql, valores);

    return res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ message: 'Erro ao atualizar usuário', error });
  }
});

module.exports = router;
