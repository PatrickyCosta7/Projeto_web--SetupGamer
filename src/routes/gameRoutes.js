const express = require('express');
const router = express.Router();
const { searchGames, getGameDetails, buildSetup, getMySetups, deleteSetup, buildSetupWithBudget, updateSetup } = require('./controllers/gameController');
const auth = require('./middleware/authMiddleware');

// Rotas com caminhos específicos ANTES de /:id
router.get('/search', searchGames); // ?q=nome
router.get('/my-setups', auth, getMySetups); // listar setups do usuário
router.delete('/setups/:setupId', auth, deleteSetup); // deletar setup específico
router.put('/setups/:setupId', auth, updateSetup); // atualizar setup específico

// Rotas dinâmicas de jogo
router.post('/:id/build-with-budget', auth, buildSetupWithBudget); // gerar setup com budget
router.post('/:id/build', auth, buildSetup); // gerar setup simples
router.get('/:id', getGameDetails); // DEVE SER POR ÚLTIMO

module.exports = router;
