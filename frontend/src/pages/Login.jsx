import { useState } from "react";
import { useNavigate } from "react-router-dom";
import pneuForteLogo from "../assets/logo.png";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const { data } = await api.post("/api/login", { usuario, senha });

      // Salvar token e usuário no localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));

      // Redirecionamento conforme tipo de usuário
      if (data.usuario.usuario === "administrador") {
        navigate("/admin");
      } else {
        navigate("/leitor");
      }
    } catch (error) {
      setErro(error.response?.data?.message || "Erro ao tentar login");
    }
  };

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={handleLogin}>
        <img src={pneuForteLogo} alt="Logo Pneu Forte" style={styles.logo} />
        <h2 style={styles.title}>Acesso ao Sistema</h2>

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={styles.input}
        />

        {erro && <p style={styles.erro}>{erro}</p>}

        <button type="submit" style={styles.botao}>Entrar</button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    background: "linear-gradient(to bottom, #000000, #333)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: "40px",
    borderRadius: "16px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 25px rgba(255, 215, 0, 0.2)",
    width: "100%",
    maxWidth: "350px",
    textAlign: "center",
  },
  logo: {
    width: "180px",
    marginBottom: "20px",
    borderRadius: "12px",
  },
  title: {
    color: "#fff",
    fontSize: "20px",
    marginBottom: "20px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#222",
    color: "#fff",
    fontSize: "16px",
  },
  botao: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#ffd700",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    color: "#000",
  },
  erro: {
    color: "red",
    marginBottom: "10px",
    fontWeight: "bold",
  },
};
