import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HistoricoNotas() {
  const [notas, setNotas] = useState([]);
  const [filtro, setFiltro] = useState('');

  const buscarNotas = async () => {
    try {
      const { data } = await axios.get('http://localhost:3001/api/listar-notas');
      setNotas(data);
    } catch (error) {
      console.error('Erro ao buscar notas:', error); // linha 12
    }
  };

  useEffect(() => {
    buscarNotas();
  }, []);

  const notasFiltradas = notas.filter((n) =>
    n.chave_acesso.includes(filtro) || n.status.includes(filtro.toUpperCase())
  );

  return (
    <div style={{ padding: 30, fontFamily: 'Arial', background: '#1e1e1e', color: '#fff', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 20 }}>📋 Histórico de Notas</h2>

      <input
        placeholder="Filtrar por chave ou status"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{
          marginBottom: 20,
          padding: 10,
          width: 300,
          borderRadius: 8,
          fontSize: 16,
        }}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#333' }}>
            <th style={th}>Chave</th>
            <th style={th}>Status</th>
            <th style={th}>Emitente</th>
            <th style={th}>Destinatário</th>
            <th style={th}>Data Emissão</th>
            <th style={th}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {notasFiltradas.map((nota) => (
            <tr key={nota.id} style={{ borderBottom: '1px solid #555' }}>
              <td style={td}>{nota.chave_acesso}</td>
              <td style={td}>{nota.status}</td>
              <td style={td}>{nota.emitente_nome}</td>
              <td style={td}>{nota.destinatario_nome}</td>
              <td style={td}>{nota.data_emissao}</td>
              <td style={td}>
                {nota.status !== 'ENTREGUE' ? (
                  <button
                    style={botao}
                    onClick={async () => {
                      try {
                        await axios.put(`http://localhost:3001/api/marcar-entregue/${nota.id}`);
                        alert('✅ Nota marcada como ENTREGUE!');
                        buscarNotas();
                      } catch (err) {
                      console.error('Erro ao marcar nota como entregue:', err); // linha 70
                    }

                    }}
                  >
                    ENTREGAR
                  </button>
                ) : (
                  <span style={{ color: 'lightgreen', fontWeight: 'bold' }}>✔️</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: '10px',
  textAlign: 'left',
  borderBottom: '2px solid #555',
};

const td = {
  padding: '10px',
  fontSize: 14,
};

const botao = {
  padding: '5px 10px',
  fontSize: '14px',
  borderRadius: '5px',
  backgroundColor: '#ffd700',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
};
