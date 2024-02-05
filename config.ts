import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.PORT || "8000",
    apiPaths: {
        documents: '/api/document',
        user: '/api/user',
        property: '/api/property',
        blocks: '/api/blocks',
        units: '/api/units',
        tickets: '/api/ticket',
        chats: '/api/chat'
    },
    dbConfig: {
        db: process.env.DB || '<DB_NAME>',
        user: process.env.DB_USER || '<DB_USER>',
        password: process.env.DB_PASSWORD || '<DB_PASSWORD>',
        host: process.env.DB_HOST || '<DB_HOST>',
        port: Number(process.env.DB_PORT) || 3306
    }
}