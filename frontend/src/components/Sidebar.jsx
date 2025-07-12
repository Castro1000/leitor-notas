// src/components/Sidebar.jsx
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div style={styles.sidebar}>
      <h2 style={styles.titulo}>📂 Menu</h2>
      <Link to="/leitor" style={styles.link}>📦 Leitor</Link>
      <Link to="/historico" style={styles.link}>📄 Histórico de Notas</Link>
      <Link to="/relatorio" style={styles.link}>📊 Relatórios</Link>
    </div>
  );
}

const styles = {
  sidebar: {
    background: '#2c2c2c',
    color: '#fff',
    padding: '20px',
    width: '220px',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
  },
  titulo: {
    marginBottom: '20px',
    fontSize: '20px',
  },
  link: {
    display: 'block',
    color: '#fff',
    textDecoration: 'none',
    marginBottom: '12px',
    fontSize: '16px',
  },
};
