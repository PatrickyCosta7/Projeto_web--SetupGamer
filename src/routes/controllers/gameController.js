const axios = require('axios');
const { Low, JSONFile } = require('lowdb');
const path = require('path');
const fs = require('fs');

const dbAdapter = new JSONFile(path.join(__dirname, '..', 'data', 'db.json'));
const db = new Low(dbAdapter);

const compPath = path.join(__dirname, '..', 'data', 'components.json');
const RAWG_KEY = process.env.RAWG_API_KEY || '';
const RAWG_BASE = 'https://api.rawg.io/api';

async function loadDB() { await db.read(); db.data ||= { users: [], setups: [] }; }

function loadComponentsCatalog() {
  try {
    const raw = fs.readFileSync(compPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { gpus: [], cpus: [], rams: [] };
  }
}

/**
 * Busca jogos via RAWG
 */
exports.searchGames = async (req, res) => {
  const q = req.query.q || '';
  console.log(`[searchGames] Buscando: "${q}" com key: ${RAWG_KEY ? 'configurada' : 'SEM CONFIGURAR'}`);
  
  if (!q.trim()) {
    return res.status(400).json({ message: 'Parâmetro de busca vazio', results: [] });
  }

  try {
    const r = await axios.get(`${RAWG_BASE}/games`, { params: { key: RAWG_KEY, search: q, page_size: 12 } });
    console.log(`[searchGames] Sucesso: ${r.data.results?.length || 0} jogos encontrados`);
    return res.json(r.data);
  } catch (err) {
    console.error('[searchGames] Erro:', err?.response?.data || err.message);
    return res.status(500).json({ message: 'Erro ao buscar jogos', error: err.message });
  }
};

/**
 * Detalhes do jogo via RAWG
 */
exports.getGameDetails = async (req, res) => {
  const id = req.params.id;
  try {
    const r = await axios.get(`${RAWG_BASE}/games/${id}`, { params: { key: RAWG_KEY } });
    return res.json(r.data);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    return res.status(500).json({ message: 'Erro ao obter detalhes do jogo' });
  }
};

/**
 * Monta um setup simples baseado em regras (mapeamento de texto)
 * Salva no db.json sob setups com userId
 */
exports.buildSetup = async (req, res) => {
  await loadDB();
  const userId = req.user.id;
  const gameId = req.params.id;

  // obtem dados do RAWG (pode falhar)
  let game = null;
  try {
    const r = await axios.get(`${RAWG_BASE}/games/${gameId}`, { params: { key: RAWG_KEY } });
    game = r.data;
  } catch (e) {
    console.warn('Não foi possível obter dados RAWG; criando setup genérico');
  }

  // carrega catálogo local
  const catalog = loadComponentsCatalog();

  // regra simples de mapeamento: procura palavras-chave na descrição ou nome
  const text = ((game && (game.name + ' ' + (game.description_raw || game.description || ''))) || '').toLowerCase();

  // heurísticas simples
  const isUltra = /ultra|very high|4k|1440p|ray tracing|rtx/i.test(text);
  const isHigh = /high|1080p|very good|gtx|rtx/i.test(text) && !isUltra;
  const isLow = /low|720p|minimum|minimo|minimun|low settings/i.test(text);

  // escolher componentes do catálogo (fallbacks)
  const pick = (arr, fallback) => (arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : fallback);

  const gpu = isUltra ? pick(catalog.gpus.ultra, 'NVIDIA RTX 3080') 
            : isHigh ? pick(catalog.gpus.high, 'NVIDIA RTX 3060')
            : isLow ? pick(catalog.gpus.low, 'NVIDIA GTX 1650')
            : pick(catalog.gpus.high, 'NVIDIA RTX 3060');

  const cpu = isUltra ? pick(catalog.cpus.high, 'Intel i7-12700K')
            : isHigh ? pick(catalog.cpus.mid, 'Intel i5-12400')
            : pick(catalog.cpus.low, 'Intel i3-10100');

  const ram = isUltra || isHigh ? pick(catalog.rams.high, '16GB DDR4') : pick(catalog.rams.low, '8GB DDR4');

  const setup = {
    id: Date.now().toString(),
    userId,
    gameId,
    gameName: game?.name || null,
    components: [
      { type: 'GPU', model: gpu },
      { type: 'CPU', model: cpu },
      { type: 'RAM', model: ram },
      { type: 'Storage', model: '1TB NVMe (sugestão)' }
    ],
    createdAt: new Date().toISOString()
  };

  db.data.setups.push(setup);
  await db.write();
  return res.status(201).json(setup);
};

/**
 * Lista setups do usuário logado
 */
exports.getMySetups = async (req, res) => {
  await loadDB();
  const userId = req.user.id;
  let userSetups = db.data.setups.filter(s => s.userId === userId);
  
  // Migração: adicionar gameImage aos setups antigos que não têm
  let needsWrite = false;
  userSetups = userSetups.map(setup => {
    if (!setup.gameImage) {
      setup.gameImage = null; // ou fetch do RAWG se quiser
      needsWrite = true;
    }
    return setup;
  });
  
  if (needsWrite) {
    await db.write();
  }
  
  return res.json({ setups: userSetups });
};

/**
 * Deleta um setup específico
 */
exports.deleteSetup = async (req, res) => {
  await loadDB();
  const userId = req.user.id;
  const setupId = req.params.setupId;
  
  const setupIdx = db.data.setups.findIndex(s => s.id === setupId && s.userId === userId);
  if (setupIdx === -1) {
    return res.status(404).json({ message: 'Setup não encontrado ou não é seu' });
  }
  
  db.data.setups.splice(setupIdx, 1);
  await db.write();
  return res.json({ message: 'Setup removido com sucesso' });
};

/**
 * Mapeia budget para tier e retorna componentes sugeridos
 */
function getBudgetTier(budget) {
  if (budget < 5000) return 'minimum';
  if (budget < 10000) return 'intermediate';
  return 'premium';
}

/**
 * Gera setup baseado em budget + requisitos do jogo
 * POST /games/:id/build-with-budget
 * Body: { budget: number }
 */
exports.buildSetupWithBudget = async (req, res) => {
  try {
    await loadDB();
    const userId = req.user.id;
    const gameId = req.params.id;
    const budget = req.body.budget;

    console.log(`[buildSetupWithBudget] userId: ${userId}, gameId: ${gameId}, budget: ${budget}`);

    if (!budget || budget <= 0) {
      return res.status(400).json({ message: 'Budget inválido' });
    }

    // obtem dados do jogo
    let game = null;
    try {
      const r = await axios.get(`${RAWG_BASE}/games/${gameId}`, { params: { key: RAWG_KEY } });
      game = r.data;
      console.log(`[buildSetupWithBudget] Jogo encontrado: ${game.name}`);
    } catch (e) {
      console.warn('Não foi possível obter dados RAWG; criando setup genérico', e.message);
    }

    // carrega catálogo local
    const catalog = loadComponentsCatalog();
    console.log(`[buildSetupWithBudget] Catálogo carregado:`, { gpus: Object.keys(catalog.gpus), cpus: Object.keys(catalog.cpus) });
    
    const tier = getBudgetTier(budget);
    console.log(`[buildSetupWithBudget] Tier determinado: ${tier}`);

    // Heurística: detectar dificuldade do jogo
    const text = ((game && (game.name + ' ' + (game.description_raw || game.description || ''))) || '').toLowerCase();
    const isHeavy = /ultra|very high|4k|1440p|ray tracing|rtx 4090|rtx 3090/i.test(text);
    const isModerate = /high|1080p|very good|gtx|rtx 3060/i.test(text);

    // Selecionar componentes baseado em budget + dificuldade
    const pick = (arr, fallback) => (arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : fallback);

    let gpu, cpu, ram, storage, so, priceEstimate;

    if (tier === 'minimum') {
      gpu = pick(catalog.gpus?.low, 'NVIDIA GTX 1050 Ti');
      cpu = pick(catalog.cpus?.low, 'Intel i3-10100');
      ram = pick(catalog.rams?.low, '8GB DDR4');
      storage = '240GB SSD';
      so = 'Windows 10/11';
      priceEstimate = 4500;
    } else if (tier === 'intermediate') {
      if (isHeavy) {
        gpu = pick(catalog.gpus?.high, 'NVIDIA RTX 3070');
        cpu = pick(catalog.cpus?.mid, 'Intel i7-11700K');
        ram = pick(catalog.rams?.high, '16GB DDR4');
      } else {
        gpu = pick(catalog.gpus?.mid, 'NVIDIA RTX 3060');
        cpu = pick(catalog.cpus?.mid, 'Intel i5-12400');
        ram = pick(catalog.rams?.mid, '16GB DDR4');
      }
      storage = '512GB NVMe SSD';
      so = 'Windows 10/11';
      priceEstimate = 8500;
    } else {
      // premium
      gpu = pick(catalog.gpus?.ultra, 'NVIDIA RTX 4080');
      cpu = pick(catalog.cpus?.high, 'Intel i7-13700K');
      ram = pick(catalog.rams?.high, '32GB DDR5');
      storage = '1TB NVMe SSD';
      so = 'Windows 11';
      priceEstimate = 15000;
    }

    const setup = {
      id: Date.now().toString(),
      userId,
      gameId,
      gameName: game?.name || 'Jogo desconhecido',
      gameImage: game?.background_image || null,
      budget,
      tier,
      components: [
        { type: 'GPU', model: gpu },
        { type: 'CPU', model: cpu },
        { type: 'RAM', model: ram },
        { type: 'Storage', model: storage },
        { type: 'SO', model: so }
      ],
      estimatedPrice: priceEstimate,
      createdAt: new Date().toISOString()
    };

    console.log(`[buildSetupWithBudget] Setup criado:`, setup);

    db.data.setups.push(setup);
    await db.write();
    console.log(`[buildSetupWithBudget] Setup salvo com sucesso`);
    
    return res.status(201).json(setup);
  } catch (err) {
    console.error('[buildSetupWithBudget] Erro:', err);
    return res.status(500).json({ message: 'Erro ao criar setup: ' + err.message });
  }
};

/**
 * Atualiza um setup específico do usuário
 * PUT /api/games/setups/:setupId
 * Body: { budget? }
 */
exports.updateSetup = async (req, res) => {
  try {
    await loadDB();
    const userId = req.user.id;
    const setupId = req.params.setupId;
    const { budget } = req.body;

    console.log(`[updateSetup] userId: ${userId}, setupId: ${setupId}, novo budget: ${budget}`);

    // Encontrar setup
    const setupIdx = db.data.setups.findIndex(s => s.id === setupId && s.userId === userId);
    if (setupIdx === -1) {
      return res.status(404).json({ message: 'Setup não encontrado ou não é seu' });
    }

    if (budget === undefined || budget <= 0) {
      return res.status(400).json({ message: 'Orçamento deve ser maior que 0' });
    }

    const setup = db.data.setups[setupIdx];
    const oldTier = setup.tier;

    // Atualizar budget e recalcular tier
    setup.budget = budget;
    setup.tier = getBudgetTier(budget);

    console.log(`[updateSetup] Budget: ${oldTier} → ${setup.tier}`);

    // Recarregar catálogo de componentes
    const catalog = loadComponentsCatalog();
    const pick = (arr, fallback) => (arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : fallback);

    // Heurística do jogo (manter a mesma)
    const text = ((setup.gameName || '') + ' ' + (setup.gameDescription || '')).toLowerCase();
    const isHeavy = /ultra|very high|4k|1440p|ray tracing|rtx 4090|rtx 3090/i.test(text);

    let gpu, cpu, ram, storage, so, priceEstimate;

    // Recalcular componentes baseado no novo tier
    if (setup.tier === 'minimum') {
      gpu = pick(catalog.gpus?.low, 'NVIDIA GTX 1050 Ti');
      cpu = pick(catalog.cpus?.low, 'Intel i3-10100');
      ram = pick(catalog.rams?.low, '8GB DDR4');
      storage = '240GB SSD';
      so = 'Windows 10/11';
      priceEstimate = 4500;
    } else if (setup.tier === 'intermediate') {
      if (isHeavy) {
        gpu = pick(catalog.gpus?.high, 'NVIDIA RTX 3070');
        cpu = pick(catalog.cpus?.mid, 'Intel i7-11700K');
        ram = pick(catalog.rams?.high, '16GB DDR4');
      } else {
        gpu = pick(catalog.gpus?.mid, 'NVIDIA RTX 3060');
        cpu = pick(catalog.cpus?.mid, 'Intel i5-12400');
        ram = pick(catalog.rams?.mid, '16GB DDR4');
      }
      storage = '512GB NVMe SSD';
      so = 'Windows 10/11';
      priceEstimate = 8500;
    } else {
      // premium
      gpu = pick(catalog.gpus?.ultra, 'NVIDIA RTX 4080');
      cpu = pick(catalog.cpus?.high, 'Intel i7-13700K');
      ram = pick(catalog.rams?.high, '32GB DDR5');
      storage = '1TB NVMe SSD';
      so = 'Windows 11';
      priceEstimate = 15000;
    }

    // Atualizar componentes
    setup.components = [
      { type: 'GPU', model: gpu },
      { type: 'CPU', model: cpu },
      { type: 'RAM', model: ram },
      { type: 'Storage', model: storage },
      { type: 'SO', model: so }
    ];
    setup.estimatedPrice = priceEstimate;
    setup.updatedAt = new Date().toISOString();

    console.log(`[updateSetup] Componentes recalculados para tier ${setup.tier}:`, setup.components);
    
    await db.write();
    console.log(`[updateSetup] Setup atualizado com sucesso`);
    
    return res.json({ message: 'Setup atualizado com sucesso', setup });
  } catch (err) {
    console.error('[updateSetup] Erro:', err);
    return res.status(500).json({ message: 'Erro ao atualizar setup: ' + err.message });
  }
};
