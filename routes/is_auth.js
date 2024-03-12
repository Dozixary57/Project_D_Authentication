const fs = require("fs");
const path = require("path");
const jwt = require('@fastify/jwt');

module.exports = async (fastify) => {

   fastify.get('/Auth', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
      try {
         console.log('VALID!');
         // return reply.status(200).send('VALID!');
         return;
      } catch (e) {
         console.log(e)
      }
   });

}