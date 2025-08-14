const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Conecta ao banco de dados
connectDB();

const app = express();

// ✅ CORS configurado para aceitar requisições do frontend
app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-frontend.render.com'], // substitua com o domínio real do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware para interpretar JSON
app.use(express.json({ extended: false }));

// Rota de teste
app.get('/', (req, res) => res.send('API VitaLog está a funcionar!'));

// Rotas da Aplicação
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/', require('./routes/chatbot'));

// Porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a rodar na porta ${PORT}`));
