// ARQUIVO server.js PARA TESTE DE DEPURAÇÃO

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Conecta ao banco de dados
connectDB();

const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 
app.use(express.json({ extended: false }));

// Rota de teste
app.get('/', (req, res) => res.send('API VitaLog - TESTE DE DEPURAÇÃO'));

// --- INÍCIO DO TESTE ---
// Estamos a carregar apenas UM ficheiro de rotas de cada vez.
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/medications', require('./routes/medications'));
// app.use('/api/interactions', require('./routes/interactions'));
// app.use('/api/chatbot', require('./routes/chatbot'));
// --- FIM DO TESTE ---

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));