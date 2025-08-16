const mongoose = require('mongoose');
const db = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log('MongoDB Conectado...');
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
