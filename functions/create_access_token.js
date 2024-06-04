module.exports = async (fastify) => {
   fastify.decorate('createAccessToken', function (accountId, accountUsername) {
      return async function (req, reply) {
         try {
            const accessToken = fastify.jwt.sign({id: accountId, username: accountUsername}, {sub: 'accessToken', expiresIn: '1m'})
         } catch (error) {
            console.log(error);
         }
      }
   });
}