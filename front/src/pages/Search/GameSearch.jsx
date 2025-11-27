import React, { useState } from 'react';
import { searchGames } from '../../api/api';
import GameCard from '../../components/GameCard';

export default function GameSearch(){
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) {
      setError('Digite um nome de jogo');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const r = await searchGames(q);
      console.log('Resultados:', r.data);
      setResults(r.data.results || []);
      if (!r.data.results || r.data.results.length === 0) {
        setError('Nenhum jogo encontrado');
      }
    } catch (err) {
      console.error('Erro completo:', err);
      setError(err.response?.data?.message || 'Erro ao buscar jogos. Tente novamente.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Buscar jogos</h2>
      <form onSubmit={handleSearch} style={{ display:'flex', gap:8, marginBottom: 16 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome do jogo..." />
        <button type="submit" disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
      </form>

      {error && <div style={{ color: '#dc2626', padding: 12, background: '#fee2e2', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="game-grid">
        {results.map(g => <GameCard key={g.id} game={g} />)}
      </div>

      {results.length === 0 && !loading && !error && <div style={{ color: '#6b7280', marginTop: 20 }}>Busque um jogo para começar</div>}
    </div>
  )
}
