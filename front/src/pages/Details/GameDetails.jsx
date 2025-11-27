import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame, buildSetupWithBudget } from '../../api/api';
import { AuthContext } from '../../context/AuthContext';

export default function GameDetails(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [budget, setBudget] = useState(null);
  const { token, user } = useContext(AuthContext);

  useEffect(()=> {
    // Carregar orçamento do localStorage
    const savedBudget = localStorage.getItem('userBudget');
    if (savedBudget) setBudget(parseFloat(savedBudget));

    // Carregar jogo
    (async () => {
      try {
        const r = await getGame(id);
        setGame(r.data);
      } catch (e) {
        console.error(e);
        alert('Erro ao carregar jogo');
      }
    })();
  }, [id]);

  const handleBuildWithBudget = async () => {
    if(!token) { alert('Você precisa estar logado para montar um setup.'); return; }
    if(!budget) { 
      alert('Você precisa definir um orçamento primeiro.');
      navigate('/dashboard');
      return; 
    }
    
    setLoading(true);
    try {
      const r = await buildSetupWithBudget(id, budget, token);
      console.log('setup criado com budget:', r.data);
      setSuccess(true);
      // Remover redirecionamento automático - deixar que o usuário clique em "Meus Setups"
      setLoading(false);
    } catch(e) {
      alert('Erro ao criar setup: ' + (e.response?.data?.message || e.message));
      setLoading(false);
    }
  };

  if(!game) return <div className="container">Carregando...</div>;

  return (
    <div className="container">
      <div className="game-header">
        <div>
          <h2>{game.name}</h2>
          {game.released && <div className="muted">Lançamento: {game.released}</div>}
          {budget && <div className="muted" style={{ marginTop: 4 }}>Seu orçamento: R$ {budget.toFixed(0)}</div>}
        </div>
        {game.background_image && <img src={game.background_image} alt={game.name} className="game-hero" />}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Descrição</h3>
        <div className="game-description" dangerouslySetInnerHTML={{ __html: game.description }} />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Requisitos mínimos por plataforma</h3>
        <div className="requirements-list">
          {Array.isArray(game.platforms) && game.platforms.length ? (
            game.platforms.map((p, idx) => {
              const name = p.platform?.name || p.platform || `Plataforma ${idx+1}`;
              const reqObj = p.requirements || {};
              const minimum = reqObj.minimum || reqObj.minimum_system || null;
              if (!minimum) return null;
              return (
                <div key={idx} className="req-item">
                  <strong>{name}</strong>
                  <p className="req-text">{minimum}</p>
                </div>
              )
            })
          ) : (
            <div className="muted">Nenhuma informação de requisitos disponível.</div>
          )}
        </div>
      </div>

      {success && (
        <div style={{ marginTop: 12, padding: 12, background: '#dcfce7', color: '#166534', borderRadius: 8 }}>
          ✓ Setup gerado com sucesso!
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <button onClick={handleBuildWithBudget} disabled={loading || !budget} style={{ opacity: (loading || !budget) ? 0.7 : 1, flex: 1 }}>
          {loading ? 'Gerando...' : 'Gerar Setup com Orçamento'}
        </button>
        {!budget && (
          <button onClick={() => navigate('/dashboard')} style={{ background: '#6b7280' }}>
            Voltar ao Dashboard
          </button>
        )}
      </div>
    </div>
  )
}
