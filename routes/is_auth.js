module.exports = async (fastify) => {

   fastify.get('/Auth', async function (req, reply) {
      try {
         return fastify.updateJWT()(req, reply);
      } catch (e) {
         console.log(e)
      }
   });

}