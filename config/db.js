const mongoose = require('mongoose');

// Pega a string de conexão do seu ficheiro .envv
const db = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      // Opções para evitar avisos de depreciação no console
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Conectado...');
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err.message);
    // Encerra o processo com falha se não conseguir conectar ao DB
    process.exit(1);
  }
};

module.exports = connectDB;