const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const adapter = new JSONFile(path.join(__dirname, '..', 'data', 'db.json'));
const db = new Low(adapter);

async function loadDB() { await db.read(); db.data ||= { users: [], setups: [] }; }

exports.register = async (req, res) => {
  await loadDB();
  const { name, email, password } = req.body;
  
  // Validações
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }
  
  if (password.length < 4) {
    return res.status(400).json({ message: 'Senha deve ter no mínimo 4 caracteres' });
  }

  const exists = db.data.users.find(u => u.email === email);
  if (exists) return res.status(400).json({ message: 'Email já cadastrado' });

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, email, password: hashed, createdAt: new Date().toISOString() };
  db.data.users.push(user);
  await db.write();
  return res.status(201).json({ message: 'Usuário criado' });
};

exports.login = async (req, res) => {
  await loadDB();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Campos obrigatórios' });

  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
};
