import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../style/Dashboard.css';

export default function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const saved = localStorage.getItem('userBudget');
    if (saved) {
      setBudget(JSON.parse(saved));
    }
  }, [user, navigate]);

  const handleBudget = () => {
    navigate('/budget');
  };

  const handleSearch = () => {
    if (!budget) {
      alert('Primeiro defina um orçamento');
      return;
    }
    navigate('/search');
  };

  const handleSetups = () => {
    if (!budget) {
      alert('Primeiro defina um orçamento e crie um setup');
      return;
    }
    navigate('/my-setups');
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <img src="/game.jpg" alt="GameSetup Logo" className="dashboard-logo" />
          <h1>GameSetup</h1>
          <p className="welcome">Bem-vindo, {user?.name}!</p>
          <p className="subtitle">Configure seu PC ideal para jogar</p>
        </div>

        <div className="dashboard-steps">
          {/* Step 1: Budget */}
          <div 
            className={`step-card card ${budget ? 'budget' : 'budget inactive'}`}
            onClick={handleBudget}
          >
            <div className="step-content">
              <div className={`step-number ${budget ? 'active' : 'inactive'} budget`}>1</div>
              <div className="step-info">
                <h4>Definir Orçamento</h4>
                <p>
                  {budget ? `R$ ${budget.toFixed(0)} - ${budget < 5000 ? 'Mínimo' : budget < 10000 ? 'Intermediário' : 'Premium'}` : 'Declare seu orçamento'}
                </p>
              </div>
              <div className="step-arrow">→</div>
            </div>
          </div>

          {/* Step 2: Search */}
          <div 
            className={`step-card card search ${budget ? '' : 'inactive'} ${budget ? '' : 'disabled'}`}
            onClick={handleSearch}
          >
            <div className="step-content">
              <div className={`step-number ${budget ? 'active' : 'inactive'} search`}>2</div>
              <div className="step-info">
                <h4>Buscar Jogo</h4>
                <p>{budget ? 'Procure o jogo que deseja rodar' : 'Defina um orçamento primeiro'}</p>
              </div>
              <div className="step-arrow">→</div>
            </div>
          </div>

          {/* Step 3: Setups */}
          <div 
            className={`step-card card setups ${budget ? '' : 'inactive'} ${budget ? '' : 'disabled'}`}
            onClick={handleSetups}
          >
            <div className="step-content">
              <div className={`step-number ${budget ? 'active' : 'inactive'} setups`}>3</div>
              <div className="step-info">
                <h4>Meus Setups</h4>
                <p>{budget ? 'Veja seus setups gerados' : 'Crie um setup primeiro'}</p>
              </div>
              <div className="step-arrow">→</div>
            </div>
          </div>
        </div>

        <div className="dashboard-features">
          <div className="feature-box card">
            <img src="./lupa.png" alt="Buscar" className="feature-icon" />
            <h5>Busque</h5>
            <p>Encontre títulos</p>
          </div>
          <div className="feature-box card">
            <img src="./lampada.jpg" alt="Recomendações" className="feature-icon" />
            <h5>Recomendações</h5>
            <p>Mínimas necessárias</p>
          </div>
          <div className="feature-box card">
            <img src="./hardware.jpg" alt="Montar" className="feature-icon" />
            <h5>Monte</h5>
            <p>Seu setup</p>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Siga os passos acima para montar seu PC ideal</p>
      </div>
    </div>
  );
}
