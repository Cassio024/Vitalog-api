const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  console.log('🔍 Headers recebidos:', req.headers);
  
  const token = req.header('x-auth-token');
  console.log('🔑 Token extraído:', token ? 'Token presente' : 'Sem token');
  
  if (!token) {
    console.log('❌ Middleware: Token não encontrado');
    return res.status(401).json({ msg: 'Sem token, autorização negada' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido para usuário:', decoded.user);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log('❌ Token inválido:', err.message);
    res.status(401).json({ msg: 'Token não é válido' });
  }
};