// ARQUIVO LIMPO: routes/chatbot.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const KnowledgeArticle = require('../models/KnowledgeArticle');

router.post('/query', auth, async (req, res) => {
    const { message } = req.body;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
        return res.status(500).send('Chave da API da Groq não configurada no servidor.');
    }

    try {
        const relevantArticles = await KnowledgeArticle.find({ $text: { $search: message } }).limit(2);
        let context = "Nenhuma informação específica encontrada na base de dados.";
        if (relevantArticles.length > 0) {
            context = "Contexto: " + relevantArticles.map(article => article.content).join('\n\n');
        }

        const systemPrompt = "Você é um assistente de saúde chamado VitaLog. Responda às perguntas do utilizador de forma clara e segura, baseando-se APENAS no contexto fornecido. Se a resposta não estiver no contexto, diga que não tem essa informação e recomende consultar um médico. NUNCA dê conselhos médicos diretos.";
        const userPrompt = `${context}\n\nPergunta do Utilizador: "${message}"`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${groqApiKey}` }
        });

        const botResponse = response.data.choices[0].message.content;
        res.json({ response: botResponse });

    } catch (err) {
        console.error("Erro na rota do chatbot:", err.response ? err.response.data : err.message);
        res.status(500).send('Erro no servidor ao processar a mensagem do chatbot.');
    }
});

module.exports = router;