import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Relatorio() {
  const [notas, setNotas] = useState([]);

  useEffect(() => {
    carregarNotas();
  }, []);

  const carregarNotas = async () => {
    try {
      const { data } = await axios.get('http://localhost:3001/api/listar-notas');
      setNotas(data);
    } catch (err) {
      console.error('Erro ao buscar notas:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h2>📊 Relatório de Notas Bipadas</h2>
      <table style={styles.tabela}>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Status</th>
            <th>Usuário</th>
            <th>Data Registro</th>
            <th>Data Entrega</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((n) => (
            <tr key={n.id}>
              <td>{n.numero_nota}</td>
              <td>{n.destinatario_nome}</td>
              <td>{n.status}</td>
              <td>{n.usuario}</td>
              <td>{new Date(n.data_registro).toLocaleString()}</td>
              <td>{n.data_entrega ? new Date(n.data_entrega).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    color: '#fff',
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#333',
  },
  th: {
    background: '#444',
    padding: '10px',
  },
  td: {
    padding: '8px',
    borderBottom: '1px solid #666',
  },
};
