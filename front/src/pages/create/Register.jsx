import React, { useState } from 'react';
import { register } from '../../api/api';
import * as Yup from 'yup';
import '../../style/Auth.css';

export default function PaginaCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [erros, setErros] = useState({});

  // Schema de validação com Yup
  const validationSchema = Yup.object().shape({
    nome: Yup.string().required('Nome é obrigatório'),
    email: Yup.string()
      .email('Email inválido')
      .required('Email é obrigatório'),
    senha: Yup.string()
      .min(4, 'Senha deve ter no mínimo 4 caracteres')
      .required('Senha é obrigatória'),
    confirmaSenha: Yup.string()
      .oneOf([Yup.ref('senha')], 'As senhas não conferem')
      .required('Confirmação de senha é obrigatória')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setErros({});
    
    try {
      // Validar com Yup
      await validationSchema.validate(
        { nome, email, senha, confirmaSenha },
        { abortEarly: false }
      );
      
      setCarregando(true);
      const res = await register({ name: nome, email, password: senha });
      console.log('Cadastro bem-sucedido:', res.data);
      alert('Conta criada com sucesso! Faça login para continuar.');
      window.location.href = '/login';
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
        console.error('Erro ao cadastrar:', err.response || err.message || err);
        const msg = err.response?.data?.message || err.message || 'Erro ao cadastrar';
        setErro(msg);
      }
      setCarregando(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-form-title">Criar nova conta</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-group">
          <label className="auth-label">Nome completo</label>
          <input 
            className={`auth-input ${erros.nome ? 'error' : ''}`}
            type="text"
            placeholder="Seu nome" 
            value={nome} 
            onChange={e => setNome(e.target.value)}
          />
          {erros.nome && <span className="auth-error-small">{erros.nome}</span>}
        </div>

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
          <label className="auth-label">Senha (mínimo 4 caracteres)</label>
          <input 
            className={`auth-input ${erros.senha ? 'error' : ''}`}
            type="password"
            placeholder="Crie uma senha segura" 
            value={senha} 
            onChange={e => setSenha(e.target.value)}
          />
          {erros.senha && <span className="auth-error-small">{erros.senha}</span>}
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Confirmar Senha</label>
          <input 
            className={`auth-input ${erros.confirmaSenha ? 'error' : ''}`}
            type="password"
            placeholder="Confirme sua senha" 
            value={confirmaSenha} 
            onChange={e => setConfirmaSenha(e.target.value)}
          />
          {erros.confirmaSenha && <span className="auth-error-small">{erros.confirmaSenha}</span>}
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={carregando}
        >
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>

        {erro && <div className="auth-error">{erro}</div>}

        <div className="auth-link">
          Já tem uma conta? <a href="/login">Faça login aqui</a>
        </div>
      </form>
    </div>
  );
}
