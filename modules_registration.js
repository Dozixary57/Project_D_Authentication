const fs = require("fs");
const path = require("path");
const fastifyUUID = require("fastify-uuid");
module.exports = async function (fastify) {
    // CORS
    fastify.register(require('@fastify/cors'), {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }).ready(() => {
        console.log('@Fastify/Cors успешно зарегестрирован!')
    })

    // MongoDB
    fastify.register(require('@fastify/mongodb'), {
        forceClose: true,
        url: "mongodb+srv://dozixary57:_pP-s8s5q2LFyaT@cluster0.lut9y3e.mongodb.net/?retryWrites=true&w=majority",
        database: "WebsiteProjectD"
    }).ready(()=> {
        console.log('@Fastify/MongoDB успешно зарегестрирован!')
    })

    const privateKey = fs.readFileSync(path.join(process.cwd(), 'CryptoKeyPair', 'privateKey.pem'), 'utf8');
    const publicKey = fs.readFileSync(path.join(process.cwd(), 'CryptoKeyPair', 'publicKey.pem'), 'utf8');

    // JWT
    fastify.register(require('@fastify/jwt'), {
        secret: {
            private: privateKey,
            public: publicKey
        },
        sign: {
            algorithm: 'RS256',
            iss: 'http://localhost:7000'
        }
    }).ready(()=> {
        console.log('@Fastify/JWT успешно зарегестрирован!')
    })

    // Cookie
    fastify.register(require('@fastify/cookie'), {
        secret: privateKey,
        hook: 'onRequest',
        parseOptions: {}
    }).ready(()=> {
        console.log('@Fastify/Cookie успешно зарегестрирован!')
    })

/*    fastify.register(require('fastify-user-agent')).ready(()=> {
        console.log('Fastify-user-agent успешно зарегестрирован!')
    });*/

    fastify.register(fastifyUUID).ready(()=> {
        console.log('Fastify-UUID успешно зарегестрирован!')
    });

}