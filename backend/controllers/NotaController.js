const db = require('../database/connection');

exports.gravarNota = async (req, res) => {
  const {
    chave_acesso,
    numero_nota,
    emitente_nome,
    emitente_cnpj,
    destinatario_nome,
    destinatario_cnpj,
    data_emissao,
    valor_total,
    usuario_logado
  } = req.body;

  try {
    const [existente] = await db.query(
      'SELECT * FROM notas_fiscais WHERE chave_acesso = ?',
      [chave_acesso]
    );

    const dataAtual = new Date();

    // Se a nota já existe
    if (existente.length > 0) {
      const nota = existente[0];

      // LOGISTICA atualiza status se estiver EM ANDAMENTO
      if (usuario_logado === 'logistica') {
        if (nota.status === 'EM ANDAMENTO') {
          await db.query(
            `UPDATE notas_fiscais
             SET status = ?, usuario = ?, data_logistica = ?
             WHERE id = ?`,
            ['CONTAINER SENDO OVADO', 'logistica', dataAtual, nota.id]
          );

          const [atualizada] = await db.query(
            'SELECT * FROM notas_fiscais WHERE id = ?',
            [nota.id]
          );

          return res.json({
            message: 'Status atualizado para CONTAINER SENDO OVADO',
            status: 'CONTAINER SENDO OVADO',
            nota: atualizada[0],
          });
        }

        const [completa] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [nota.id]);
        return res.status(400).json({
          message: 'Nota não está em andamento ou já foi finalizada.',
          status: completa[0]?.status,
          nota: completa[0],
        });
      }

      // PH tenta finalizar
      if (usuario_logado === 'ph') {
        if (nota.status === 'CONTAINER SENDO OVADO') {
          return res.json({
            message: 'Nota pronta para finalização.',
            status: nota.status,
            nota,
          });
        }

        return res.status(400).json({
          message: 'Aguardando o setor de LOGÍSTICA bipar a nota.',
          status: nota.status,
          nota,
        });
      }

      // MICHELE tenta bipar nota já registrada
      if (usuario_logado === 'michele') {
        const [completa] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [nota.id]);
        return res.status(400).json({
          message: 'Nota já registrada.',
          status: completa[0]?.status,
          nota: completa[0],
        });
      }

      return res.status(403).json({ message: 'Usuário não autorizado para alterar esta nota.' });
    }

    // Se a nota ainda não existe e for PH ou LOGISTICA → erro
    if (usuario_logado === 'ph' || usuario_logado === 'logistica') {
      return res.status(400).json({
        message: 'Nota ainda não registrada. Aguardando saída pela Michele.',
      });
    }

    // MICHELE grava nova nota
    if (usuario_logado === 'michele') {
      await db.query(
        `INSERT INTO notas_fiscais (
          chave_acesso, numero_nota, emitente_nome, emitente_cnpj,
          destinatario_nome, destinatario_cnpj, data_emissao,
          valor_total, status, usuario, data_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          chave_acesso,
          numero_nota,
          emitente_nome,
          emitente_cnpj,
          destinatario_nome,
          destinatario_cnpj,
          data_emissao,
          valor_total,
          'EM ANDAMENTO',
          'michele'
        ]
      );

      const [nova] = await db.query(
        'SELECT * FROM notas_fiscais WHERE chave_acesso = ?',
        [chave_acesso]
      );

      return res.status(201).json({
        message: 'Nota registrada com sucesso!',
        status: 'EM ANDAMENTO',
        nota: nova[0],
      });
    }

    return res.status(403).json({ message: 'Usuário não autorizado.' });

  } catch (error) {
    console.error('Erro ao gravar nota:', error);
    return res.status(500).json({
      message: 'Erro ao gravar nota',
      error,
    });
  }
};

exports.finalizarNota = async (req, res) => {
  const { id } = req.params;

  try {
    const [existe] = await db.query('SELECT * FROM notas_fiscais WHERE id = ?', [id]);

    if (existe.length === 0) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }

    await db.query(
      `UPDATE notas_fiscais SET status = 'FINALIZADA', data_entrega = NOW() WHERE id = ?`,
      [id]
    );

    return res.json({ message: 'Nota finalizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao finalizar nota:', err);
    return res.status(500).json({ message: 'Erro ao finalizar nota', error: err });
  }
};
