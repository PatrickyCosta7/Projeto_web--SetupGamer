import React, { useState } from 'react';
import SetupCard from '../../components/SetupCard';

export default function SetupBuilder(){
  const [mockSetup, setMockSetup] = useState(null);

  // página de gerenciamento simples — mais tarde vamos carregar setups do backend
  const createFake = () => {
    const s = {
      id: '1',
      createdAt: new Date().toISOString(),
      components: [
        { type: 'GPU', model: 'NVIDIA RTX 3060' },
        { type: 'CPU', model: 'Intel Core i5-12400' },
        { type: 'RAM', model: '16GB DDR4' },
        { type: 'Storage', model: '1TB NVMe' }
      ]
    };
    setMockSetup(s);
  };

  return (
    <div className="container">
      <h2>Meus Setups</h2>
      <p>Aqui você verá os setups que salvou. (integração com backend em seguida)</p>
      <div style={{ marginTop: 12 }}>
        <button onClick={createFake}>Gerar setup de exemplo</button>
      </div>

      <div style={{ marginTop: 12 }}>
        {mockSetup ? <SetupCard setup={mockSetup} /> : <div>Nenhum setup salvo</div>}
      </div>
    </div>
  )
}
