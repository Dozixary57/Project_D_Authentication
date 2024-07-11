const fs = require("fs");
const path = require("path");
const fastifyUUID = require("fastify-uuid");
const Logger = require("./tools/Logger");

module.exports = async function (fastify) {

  const result = require('dotenv').config();

  if (result.error) {
    Logger.Server.Err('Не удалось зарегестрировать Dotenv!');
  } else {
    Logger.Server.Info('Dotenv успешно зарегестрирован!');
  }
  
  // CORS
  fastify.register(require('@fastify/cors'), {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    accessControlAllowCredentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }).ready(() => {
    Logger.Server.Info('@Fastify/Cors успешно зарегестрирован!')
  })

  // MongoDB
  fastify.register(require('@fastify/mongodb'), {
    forceClose: true,
    url: process.env.MONGODB_URL_CLUSTER,
    database: "ProjectD_Accounts"
  }).ready(() => {
    Logger.Server.Info('@Fastify/MongoDB успешно зарегестрирован!')
  })

  fastify.register(require('@fastify/multipart')).ready(() => {
    Logger.Server.Info('@Fastify/Multipart успешно зарегестрирован!')
  });

  fastify.register(require('@fastify/static'), {
    root: path.join(process.cwd(), 'Images', 'Avatars'),
    prefix: '/Avatars/',
    constraints: { host: '127.0.0.1:7000' }
  }).ready(() => {
    Logger.Server.Info('@Fastify/Static успешно зарегестрирован!')
  });

  const MercuriusQueries = require('./MercuriusQueries/MercuriusQueries')
  await MercuriusQueries(fastify);

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
      expiresIn: '1m',
      iss: 'http://localhost:7000'
    },
    cookie: {
      cookieName: 'RefreshToken',
      signed: true
    }
  }).ready(() => {
    Logger.Server.Info('@Fastify/JWT успешно зарегестрирован!')
  })

  // Cookie
  fastify.register(require('@fastify/cookie'), {
    secret: privateKey,
    hook: 'onRequest',
    parseOptions: {}
  }).ready(() => {
    Logger.Server.Info('@Fastify/Cookie успешно зарегестрирован!')
  })

  /*    fastify.register(require('fastify-user-agent')).ready(()=> {
          console.log('Fastify-user-agent успешно зарегестрирован!')
      });*/

  fastify.register(fastifyUUID).ready(() => {
    Logger.Server.Info('UUID успешно зарегестрирован!')
  });

}