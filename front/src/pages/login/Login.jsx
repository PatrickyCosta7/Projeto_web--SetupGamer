import React, { useState, useContext } from 'react';
import { login } from '../../api/api';
import * as Yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import '../../style/Auth.css';

export default function PaginaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [erros, setErros] = useState({});
  const { saveAuth } = useContext(AuthContext);

  // Schema de validação com Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email inválido')
      .required('Email é obrigatório'),
    senha: Yup.string()
      .required('Senha é obrigatória')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setErros({});
    
    try {
      // Validar com Yup
      await validationSchema.validate(
        { email, senha },
        { abortEarly: false }
      );
      
      setCarregando(true);
      const res = await login({ email, password: senha });
      console.log('Login bem-sucedido:', res.data);
      saveAuth(res.data.user, res.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      if (err.inner) {
        // Erros de validação Yup
        const errosMap = {};
        err.inner.forEach(error => {
          errosMap[error.path] = error.message;
        });
        setErros(errosMap);
      } else {
        // Erros da API
        console.error('Erro ao fazer login:', err.response || err.message || err);
        const msg = err.response?.data?.message || err.message || 'Erro ao fazer login';
        setErro(msg);
      }
      setCarregando(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-form-title">Entrar na sua conta</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-group">
          <label className="auth-label">Email</label>
          <input 
            className={`auth-input ${erros.email ? 'error' : ''}`}
            type="email"
            placeholder="seu@email.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
          />
          {erros.email && <span className="auth-error-small">{erros.email}</span>}
        </div>
        
        <div className="auth-input-group">
          <label className="auth-label">Senha</label>
          <input 
            className={`auth-input ${erros.senha ? 'error' : ''}`}
            type="password"
            placeholder="Sua senha" 
            value={senha} 
            onChange={e => setSenha(e.target.value)}
          />
          {erros.senha && <span className="auth-error-small">{erros.senha}</span>}
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={carregando}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        {erro && <div className="auth-error">{erro}</div>}

        <div className="auth-link">
          Não tem uma conta? <a href="/register">Crie uma agora</a>
        </div>
      </form>
    </div>
  );
}

