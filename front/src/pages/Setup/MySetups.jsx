import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';

export default function MySetups() {
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editBudget, setEditBudget] = useState('');
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await API.get('/games/my-setups', { headers: { Authorization: `Bearer ${token}` } });
        setSetups(res.data.setups || []);
      } catch (err) {
        console.error('Erro ao carregar setups:', err);
        setError(err.response?.data?.message || 'Erro ao carregar setups');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleDelete = async (setupId) => {
    if (!window.confirm('Tem certeza que deseja remover este setup?')) return;
    try {
      await API.delete(`/games/setups/${setupId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSetups(setups.filter(s => s.id !== setupId));
      alert('Setup removido com sucesso');
    } catch (err) {
      alert('Erro ao remover setup: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditStart = (setup) => {
    setEditingId(setup.id);
    setEditBudget(setup.budget || '');
  };

  const handleEditSave = async (setupId) => {
    if (!editBudget || editBudget <= 0) {
      alert('Orçamento deve ser maior que 0');
      return;
    }

    try {
      const res = await API.put(`/games/setups/${setupId}`, { budget: parseInt(editBudget) }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Atualizar setup na lista
      const updatedSetups = setups.map(s => s.id === setupId ? res.data.setup : s);
      setSetups(updatedSetups);
      
      setEditingId(null);
      setEditBudget('');
      alert('Setup atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar setup: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditBudget('');
  };

  if (!user) return <div className="container">Faça login para ver seus setups</div>;
  if (loading) return <div className="container">Carregando...</div>;

  return (
    <div className="container">
      <h2>Meus Setups ({setups.length})</h2>
      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      
      {setups.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <p>Você ainda não tem nenhum setup. <a href="/search">Busque um jogo</a> para montar seu primeiro setup!</p>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {setups.map(setup => (
            <div key={setup.id} className="card" style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
              {setup.gameImage ? (
                <img src={setup.gameImage} alt={setup.gameName} style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 200, height: 120, background: '#e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0 }}>
                  Sem imagem
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h4>{setup.gameName || 'Jogo desconhecido'}</h4>
                <p className="muted">ID do jogo: {setup.gameId} | Criado em: {new Date(setup.createdAt).toLocaleDateString('pt-BR')}</p>
                
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {setup.tier === 'minimum' && 'Mínimo'}
                    {setup.tier === 'intermediate' && 'Intermediário'}
                    {setup.tier === 'premium' && 'Premium'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280 ' }}>
                    Orçamento: <strong>R$ {setup.budget?.toFixed(0) || 'N/A'}</strong> | Preço estimado: <strong>R$ {setup.estimatedPrice?.toFixed(0) || 'N/A'}</strong>
                  </div>
                </div>
                
                <div style={{ marginTop: 12 }}>
                  <strong>Componentes recomendados:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                    {setup.components.map((comp, idx) => (
                      <li key={idx}>
                        <strong>{comp.type}:</strong> {comp.model}
                      </li>
                    ))}
                  </ul>
                </div>

                {editingId === setup.id ? (
                  <div style={{ marginTop: 12, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
                    <input 
                      type="number" 
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      placeholder="Novo orçamento"
                      style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 4, border: '1px solid #ddd' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleEditSave(setup.id)} style={{ background: '#10b981', flex: 1 }}>Salvar</button>
                      <button onClick={handleEditCancel} style={{ background: '#6b7280', flex: 1 }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEditStart(setup)} style={{ background: '#3b82f6', flex: 1 }}>Editar Orçamento</button>
                    <button onClick={() => handleDelete(setup.id)} style={{ background: '#dc2626', flex: 1 }}>Remover</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
