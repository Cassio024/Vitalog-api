// routes/chatbot.js
const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Inicializar cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Função para chamar a API Groq usando o SDK oficial
const getGroqResponse = async (messages) => {
  try {
    console.log('🤖 Enviando mensagem para Groq...');
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em saúde e medicamentos chamado Vitalog. 
                   Suas responsabilidades:
                   - Fornecer informações gerais sobre medicamentos e saúde
                   - Explicar interações medicamentosas básicas
                   - Dar dicas de bem-estar e saúde preventiva
                   - SEMPRE recomendar consultar um médico ou farmacêutico para questões específicas
                   - Nunca diagnosticar ou prescrever medicamentos
                   - Responder de forma clara e amigável em português brasileiro
                   - Nunca sair tema de remedios
                   - Sempre garantir a resposta completa
                   Importante: Você NÃO é um substituto para consulta médica profissional.`
        },
        ...messages
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    console.log('✅ Resposta recebida do Groq');
    return chatCompletion.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erro ao chamar Groq API:', error);
    
    // Log detalhado do erro para debug
    if (error instanceof Groq.APIError) {
      console.error('API Error Details:');
      console.error('- Status:', error.status);
      console.error('- Type:', error.name);
      console.error('- Message:', error.message);
      console.error('- Headers:', error.headers);
    }
    
    throw error;
  }
};

// Endpoint principal do chatbot
router.post('/ask', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validação da mensagem
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem é obrigatória e deve ser uma string não vazia'
      });
    }

    // Validação da API key
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY não configurada');
      return res.status(500).json({
        success: false,
        error: 'Configuração de API incompleta'
      });
    }

    // Preparar histórico de conversa (limitar para evitar excesso de tokens)
    const limitedHistory = conversationHistory.slice(-6); // Últimas 6 mensagens
    const messages = [
      ...limitedHistory,
      { role: 'user', content: message.trim() }
    ];

    console.log(`📨 Processando mensagem: "${message.substring(0, 50)}..."`);

    // Chamar a API Groq
    const response = await getGroqResponse(messages);

    // Resposta de sucesso
    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        model: 'llama3-8b-8192'
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint do chatbot:', error);

    // Tratamento de erros específicos
    let errorMessage = 'Desculpe, ocorreu um erro interno. Tente novamente.';
    let statusCode = 500;

    if (error instanceof Groq.AuthenticationError) {
      errorMessage = 'Erro de autenticação com a API';
      statusCode = 401;
      console.error('🔑 API Key inválida ou expirada');
    } else if (error instanceof Groq.RateLimitError) {
      errorMessage = 'Muitas requisições. Aguarde um momento antes de tentar novamente.';
      statusCode = 429;
      console.error('⏳ Rate limit excedido');
    } else if (error instanceof Groq.APIConnectionError) {
      errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      statusCode = 503;
      console.error('🌐 Erro de conexão de rede');
    } else if (error instanceof Groq.InternalServerError) {
      errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
      statusCode = 503;
      console.error('🔧 Erro interno do servidor Groq');
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      // Incluir detalhes apenas em desenvolvimento
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        type: error.constructor.name 
      })
    });
  }
});

// Endpoint de teste de conectividade
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testando conectividade com Groq API...');
    
    // Verificar se a API key existe
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GROQ_API_KEY não configurada',
        timestamp: new Date().toISOString()
      });
    }

    // Testar uma requisição simples
    const testMessages = [
      { role: 'user', content: 'Diga apenas "Teste de conexão bem-sucedido!"' }
    ];

    const response = await getGroqResponse(testMessages);
    
    res.json({
      success: true,
      message: 'Conexão com Groq API funcionando perfeitamente!',
      response: response,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.GROQ_API_KEY
    });

  } catch (error) {
    console.error('❌ Teste de conexão falhou:', error);
    
    let errorDetails = 'Erro desconhecido';
    if (error instanceof Groq.APIError) {
      errorDetails = `${error.name}: ${error.message}`;
    }
    
    res.status(500).json({
      success: false,
      error: 'Falha na conexão com Groq API',
      details: errorDetails,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.GROQ_API_KEY
    });
  }
});

// Endpoint para listar modelos disponíveis (opcional)
router.get('/models', async (req, res) => {
  try {
    const models = await groq.models.list();
    
    res.json({
      success: true,
      models: models.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao obter lista de modelos',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de status da API
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'API Chatbot online',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.GROQ_API_KEY,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;