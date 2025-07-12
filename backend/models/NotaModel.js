const db = require('../database/connection');

const buscarNotaPorChave = async (chave) => {
  const [rows] = await db.query('SELECT * FROM notas_fiscais WHERE chave_acesso = ?', [chave]);
  return rows[0];
};

const registrarNota = async (dados) => {
  const { chave_acesso, emitente_nome, emitente_cnpj, destinatario_nome, destinatario_cnpj, data_emissao } = dados;
  await db.query(`
    INSERT INTO notas_fiscais (
      chave_acesso, emitente_nome, emitente_cnpj,
      destinatario_nome, destinatario_cnpj, data_emissao
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [chave_acesso, emitente_nome, emitente_cnpj, destinatario_nome, destinatario_cnpj, data_emissao]
  );
};

module.exports = { buscarNotaPorChave, registrarNota };
