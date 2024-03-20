const fs = require("fs");
const path = require("path");
const jwt = require('@fastify/jwt');

module.exports = async (fastify) => {

   fastify.get('/Auth', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
      try {
         return;
      } catch (e) {
         console.log(e)
      }
   });

}