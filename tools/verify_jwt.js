module.exports = async (fastify) => {
   fastify.decorate('verifyJWT', function () {
      return async function (req, reply) {
         try {
            await req.jwtVerify();
            const authHeader = req.headers['authorization'];

            if (authHeader != undefined && authHeader.split(' ')[1] != null) {
               // msg: 'Access is allowed'
               return reply.status(200).send();
            } else {
               try {

                  await req.jwtVerify({onlyCookie: true});
   
                  const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);
   
                  // msg: 'RefreshToken is not valid'
                  if (!refreshTokenData.value)
                     return reply.status(401).send();
   
                  const refreshToken = refreshTokenData.value;
   
                  const decoded = fastify.jwt.decode(refreshToken);
                  
                  const newRefreshToken = fastify.jwt.sign({id: decoded.id, username: decoded.username}, {sub: 'refreshToken', expiresIn: '10m'})
                  const newAccessToken = fastify.jwt.sign({id: decoded.id, username: decoded.username}, {sub: 'accessToken', expiresIn: '1m'});
            
                  return reply.status(200).setCookie('RefreshToken', newRefreshToken, {maxAge: 600, path: '/', signed: true, httpOnly: true, secure: 'auto'}).setCookie('UniqueDeviceIdentifier', fastify.uuid.v4(), {maxAge: 600, path: '/', signed: true, httpOnly: false, secure: 'auto'}).send({ accessToken: newAccessToken });
   
               } catch (refreshTokenError) {
                  fastify.logout();
   
                  // console.log('3! ' + refreshTokenError)
                  return reply.status(401).send({ msg: 'You should log in again' });
   
               }
            }

         } catch (accessTokenError) {
            try {

               await req.jwtVerify({onlyCookie: true});

               const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);

               // msg: 'RefreshToken is not valid'
               if (!refreshTokenData.value)
                  return reply.status(401).send();

               const refreshToken = refreshTokenData.value;

               const decoded = fastify.jwt.decode(refreshToken);
               
               const newRefreshToken = fastify.jwt.sign({id: decoded.id, username: decoded.username}, {sub: 'refreshToken', expiresIn: '10m'})
               const newAccessToken = fastify.jwt.sign({id: decoded.id, username: decoded.username}, {sub: 'accessToken', expiresIn: '1m'});
         
               // console.log("UPDATED!")
               // console.log('1! ' + accessTokenError)
               return reply.status(200).setCookie('RefreshToken', newRefreshToken, {maxAge: 600, path: '/', signed: true, httpOnly: true, secure: 'auto'}).setCookie('UniqueDeviceIdentifier', fastify.uuid.v4(), {maxAge: 600, path: '/', signed: true, httpOnly: false, secure: 'auto'}).send({ accessToken: newAccessToken });

            } catch (refreshTokenError) {
               fastify.logout();

               // console.log('2! ' + refreshTokenError)
               return reply.status(401).send({ msg: 'You should log in again' });

            }
         }
      }
   });
}