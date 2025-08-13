const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors'); // <-- ALTERAÇÃO NECESSÁRIA (já feita por você)
const connectDB = require('./config/db');

// Conecta ao banco de dados
connectDB();

const app = express();

// Middlewares
app.use(cors()); // <-- ALTERAÇÃO NECESSÁRIA (já feita por você)
app.use(express.json({ extended: false }));

// Rota de teste
app.get('/', (req, res) => res.send('API VitaLog está a funcionar!'));

// As linhas de console.log abaixo podem ser removidas se desejar
console.log('Express version:', require('express/package.json').version);
console.log('path-to-regexp version:', require('path-to-regexp/package.json').version);

// Rotas da Aplicação
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/chatbot', require('./routes/chatbot'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));