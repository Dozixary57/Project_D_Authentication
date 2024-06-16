const Logger = require("./Logger");

module.exports = async (fastify) => {
   fastify.decorate('verifyJWT', function () {
      return async function (req, reply) {
         try {
            // Check valid AccessToken

            await req.jwtVerify();

            const authHeader = req.headers['authorization'];

            if (authHeader != undefined && authHeader.split(' ')[1] != null) {
               return reply.status(200).send();
            } else {
               throw accessTokenError;
            }

         } catch (accessTokenError) {
            try {
               // Else check valid RefreshToken

               await req.jwtVerify({onlyCookie: true});

               const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);

               if (!refreshTokenData.value)
                  return reply.status(401).send();

               const refreshToken = refreshTokenData.value;

               const decoded = fastify.jwt.decode(refreshToken);
                        
               return reply.status(200).send({ accessToken: await fastify.newAccessToken()(decoded.id) });

            } catch (refreshTokenError) {

               fastify.logout();

               return reply.status(401).send({ msg: 'You should log in again' });
            }
         }
      }
   });
}