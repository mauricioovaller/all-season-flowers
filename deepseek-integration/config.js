require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekApiUrl: 'https://api.deepseek.com/chat/completions',
    
    // Configuración del modelo
    model: 'deepseek-chat',
    
    // Configuración de headers para la API
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.deepseekApiKey}`
        };
    },
    
    // Configuración por defecto para las peticiones
    getDefaultBody() {
        return {
            model: this.model,
            messages: [],
            max_tokens: 2000,
            temperature: 0.7,
            stream: false
        };
    }
};

// Verificar que la API key esté configurada
if (!config.deepseekApiKey) {
    console.error('❌ ERROR: DEEPSEEK_API_KEY no está configurada en .env');
    console.log('Por favor, agrega tu API key en el archivo .env');
    process.exit(1);
}

module.exports = config;