const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN || '8403400788:AAEbCN7oZRdQRqLdrmyJ44NL3TtB71i-b74';
const RENDER_APP_URL = process.env.RENDER_APP_URL || 'https://your-app.onrender.com';

// Используем только polling (вебхуки не работают на бесплатном Render)
const bot = new TelegramBot(TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Расширенные тексты для ответов
const responses = {
    'price': {
        keywords: ['сколько', 'стоит', 'цена', 'стоимость', 'price', 'cost', 'money', 'деньги', 'aed', 'дирхам'],
        text: `💎 Стоимость наших услуг:\n\n• 1 час: 1500 AED\n• 2 часа: 2500 AED\n• Ночь: 5000 AED\n• VIP пакет: от 8000 AED\n\nВсе цены обсуждаются индивидуально с оператором.`
    },
    'payment': {
        keywords: ['платить', 'оплата', 'карта', 'наличные', 'крипта', 'биткоин', 'payment', 'pay', 'cash', 'card'],
        text: `💳 Способы оплаты:\n\n• Наличные AED\n• Криптовалюта (BTC, ETH)\n• Банковский перевод\n• Карты (по согласованию)\n\nОператор подробно расскажет о доступных вариантах.`
    },
    'credit': {
        keywords: ['долг', 'рассрочка', 'кредит', 'потом', 'позже', 'завтра', 'credit', 'debt', 'later'],
        text: `🚫 К сожалению, мы не предоставляем услуги в долг.\n\nВсе услуги оплачиваются предварительно или при встрече.\nМы ценим ваше понимание! 💎`
    },
    'philosophy': {
        keywords: ['смысл', 'жизни', 'философия', 'зачем', 'почему', 'meaning', 'life', 'philosophy'],
        text: `✨ Смысл жизни в том, чтобы наслаждаться каждым моментом!\n\nА мы поможем сделать ваши моменты в Дубае незабываемыми! 🌴\n\nЖелаете выбрать спутницу?`
    },
    'girls': {
        keywords: ['девушки', 'модели', 'спутница', 'дамы', 'выбор', 'girls', 'models', 'ladies', 'choose'],
        text: `👩‍❤️‍💋‍👨 У нас лучший выбор спутниц в Дубае!\n\n• Модели из Европы и Азии\n• VIP сопровождение\n• Индивидуальный подход\n\nОператор поможет с выбором!`
    },
    'time': {
        keywords: ['время', 'когда', 'сейчас', 'сегодня', 'завтра', 'time', 'now', 'today', 'tomorrow'],
        text: `⏰ Мы работаем 24/7!\n\n• Доступны круглосуточно\n• Быстрое прибытие\n• Любой район Дубая\n\nУточните детали у оператора.`
    },
    'location': {
        keywords: ['где', 'адрес', 'локация', 'отель', 'приехать', 'location', 'address', 'where', 'hotel'],
        text: `📍 Мы работаем по всему Дубаю:\n• Downtown\n• Marina\n• JBR\n• Пальма\n• Все 5* отели\n\nПриезжаем к вам или предлагаем свои апартаменты.`
    }
};

// Функция для поиска ключевых слов
function findResponse(text) {
    if (!text) return null;
    
    const lowerText = text.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        for (const keyword of response.keywords) {
            if (lowerText.includes(keyword)) {
                return response.text;
            }
        }
    }
    
    return null;
}

// Клавиатура
function getKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['💰 Сколько стоит?', '💳 Чем платить?'],
                ['⏰ Время работы', '📍 Локация'],
                ['👩 Девушки', '❓ Другие вопросы']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `👋 Здравствуйте! Оператор скоро подойдёт, пока я могу ответить на часто задаваемые вопросы:`;
    
    bot.sendMessage(chatId, welcomeText, getKeyboard());
});

// Обработка команды /ping для проверки работы
bot.onText(/\/ping/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🏓 Pong! Бот активен и работает!');
});

// Обработка команды /status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const statusText = `📊 Статус бота:\n• Работает: Да\n• Uptime: ${Math.floor(process.uptime() / 60)} минут\n• Сервер: Render\n• Режим: Polling`;
    bot.sendMessage(chatId, statusText);
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/')) return;
    
    // Поиск по ключевым словам
    const foundResponse = findResponse(text);
    
    if (foundResponse) {
        bot.sendMessage(chatId, foundResponse, getKeyboard());
    } else {
        const defaultText = `🤖 Я не совсем понял ваш вопрос. Вот что я могу рассказать:\n\nВыберите вариант ниже или опишите вопрос подробнее ⬇️`;
        bot.sendMessage(chatId, defaultText, getKeyboard());
    }
});

// Обработка нажатий на кнопки
bot.on('text', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/')) return;
    
    const buttonHandlers = {
        '💰 сколько стоит?': responses.price.text,
        '💳 чем платить?': responses.payment.text,
        '⏰ время работы': responses.time.text,
        '📍 локация': responses.location.text,
        '👩 девушки': responses.girls.text,
        '❓ другие вопросы': `🤔 Задайте ваш вопрос текстом, и я постараюсь помочь!\n\nИли дождитесь оператора для консультации.`
    };
    
    const lowerText = text.toLowerCase();
    if (buttonHandlers[lowerText]) {
        bot.sendMessage(chatId, buttonHandlers[lowerText], getKeyboard());
    }
});

// Функция для самопинга (чтобы сервер не засыпал)
async function pingSelf() {
    try {
        if (RENDER_APP_URL && RENDER_APP_URL !== 'https://your-app.onrender.com') {
            await axios.get(`${RENDER_APP_URL}/health`);
            console.log('✅ Self-ping successful:', new Date().toLocaleString());
        }
    } catch (error) {
        console.log('⚠️ Self-ping error (normal for free tier):', error.message);
    }
}

// Запускаем самопинг каждые 5 минут
setInterval(pingSelf, 5 * 60 * 1000);

// Express server
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: 'Dubai Escort Bot is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mode: 'polling'
    });
});

// Health check endpoint для Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        time: new Date().toLocaleString('ru-RU'),
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

app.get('/ping', (req, res) => {
    res.json({ message: 'Pong!', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔄 Self-ping enabled for: ${RENDER_APP_URL}`);
    console.log(`📱 Bot mode: Polling (webhooks disabled for Render free tier)`);
});

// Пингуем сразу при старте
setTimeout(pingSelf, 5000);

console.log('🤖 Dubai Escort Bot started with anti-sleep protection...');
