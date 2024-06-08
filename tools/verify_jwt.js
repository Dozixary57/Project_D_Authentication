const Logger = require("./Logger");

module.exports = async (fastify) => {
   fastify.decorate('verifyJWT', function () {
      return async function (req, reply) {
         try {
            // Check valid AccessToken

            await req.jwtVerify();

            const authHeader = req.headers['authorization'];

            if (authHeader != undefined && authHeader.split(' ')[1] != null) {
               Logger.Server.Deb("AccessToken is valid!");
            } else {
               throw accessTokenError;
            }

            Logger.Server.Deb("AccessToken is valid!");

            return reply.status(200).send();

         } catch (accessTokenError) {
            try {
               // Else check valid RefreshToken

               Logger.Server.Deb("AccessToken isn't valid! Checking RefreshToken...");

               await req.jwtVerify({onlyCookie: true});

               // Update AccessToken by RefreshToken

               const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);

               // Logger.Server.Deb(refreshTokenData);

               if (!refreshTokenData.value)
                  return reply.status(401).send();

               const refreshToken = refreshTokenData.value;

               const decoded = fastify.jwt.decode(refreshToken);
                        
               return reply.status(200).send({ accessToken: await fastify.newAccessToken()(decoded.id) });

            } catch (refreshTokenError) {
               Logger.Server.Deb("RefreshToken isn't valid!");

               fastify.logout();

               return reply.status(401).send({ msg: 'You should log in again' });
            }
         }
      }
   });
}