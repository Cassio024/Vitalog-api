// ARQUIVO LIMPO: routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @route   POST api/auth/register
router.post('/register', [
    check('name', 'Por favor, adicione um nome').not().isEmpty(),
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('password', 'Por favor, insira uma senha com 6 ou mais caracteres').isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Usuário já existe' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('ERRO CRÍTICO NO REGISTRO:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   POST api/auth/login
router.post('/login', [
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('password', 'Senha é obrigatória').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('ERRO CRÍTICO NO LOGIN:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   POST api/auth/forgot-password
router.post('/forgot-password', [check('email', 'Email é obrigatório').isEmail()], async (req, res) => {
    let user;
    try {
        user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).json({ success: true, msg: 'Se o email estiver em nossa base de dados, um código será enviado.' });
        }
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.passwordResetCode = resetCode;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await user.save();
        const message = `Você está recebendo este email porque solicitou a redefinição de senha. Seu código de verificação é: ${resetCode}`;
        await sendEmail({
            email: user.email,
            subject: 'VitaLog - Código de Redefinição de Senha',
            message,
        });
        res.status(200).json({ success: true, msg: 'Email enviado' });
    } catch (err) {
        console.error('ERRO CRÍTICO AO ENVIAR EMAIL:', err);
        if (user) {
            user.passwordResetCode = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
        }
        res.status(500).send('Erro ao enviar o email.');
    }
});

// @route   POST api/auth/reset-password
router.post('/reset-password', [
    check('code', 'Código é obrigatório').not().isEmpty(),
    check('password', 'A nova senha é obrigatória').isLength({ min: 6 }),
    check('email', 'Email é obrigatório').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { code, password, email } = req.body;
    try {
        const user = await User.findOne({
            email,
            passwordResetCode: code,
            passwordResetExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ msg: 'Código inválido ou expirado' });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.status(200).json({ success: true, msg: 'Senha redefinida com sucesso' });
    } catch (err) {
        console.error('ERRO AO RESETAR SENHA:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;