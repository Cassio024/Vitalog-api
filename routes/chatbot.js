// routes/chatbot.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Função para chamar a API Groq
const callGroqAPI = async (messages, userContext = {}) => {
  try {
    console.log('🤖 Iniciando chamada para Groq API...');
    
    // Verificar se a API key existe
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada nas variáveis de ambiente');
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192', // ou 'mixtral-8x7b-32768'
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em saúde e medicamentos. 
                     Forneça informações precisas sobre medicamentos, interações e cuidados de saúde.
                     Sempre recomende consultar um médico para questões médicas específicas.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 segundos
      }
    );

    console.log('✅ Resposta recebida da Groq API');
    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erro na chamada Groq API:', error.message);
    
    // Log detalhado do erro
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Erro de rede/conexão:', error.request);
    }
    
    throw error;
  }
};

// Rota do chatbot
router.post('/ask', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem não pode estar vazia'
      });
    }

    // Preparar histórico de conversa
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('📨 Processando mensagem do usuário:', message);

    // Chamar a API Groq
    const response = await callGroqAPI(messages);

    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro no endpoint do chatbot:', error);

    // Respostas de erro específicas
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error.response && error.response.status === 401) {
      errorMessage = 'API Key inválida ou expirada';
      statusCode = 401;
    } else if (error.response && error.response.status === 429) {
      errorMessage = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
      statusCode = 429;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Erro de conexão com a internet ou API indisponível';
      statusCode = 503;
      
      // Log detalhado para debug
      console.error('Detalhes do erro de conexão:');
      console.error('- Código:', error.code);
      console.error('- Hostname:', error.hostname);
      console.error('- Syscall:', error.syscall);
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout na conexão. Tente novamente.';
      statusCode = 408;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota para testar a conectividade
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testando conectividade com Groq API...');
    
    const testMessages = [
      { role: 'user', content: 'Olá, você está funcionando?' }
    ];

    const response = await callGroqAPI(testMessages);
    
    res.json({
      success: true,
      message: 'Conexão com Groq API funcionando!',
      response: response
    });

  } catch (error) {
    console.error('❌ Teste de conexão falhou:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Falha na conexão com Groq API',
      details: error.message
    });
  }
});

module.exports = router;