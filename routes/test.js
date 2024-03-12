module.exports = async (fastify) => {
    fastify.get('/TEST', async function (req, reply) {
        try {
            // const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);

            // if (!refreshTokenData) return reply.status(401).send('No token!');
            // const refreshToken = refreshTokenData.value;
    
            await req.jwtVerify({onlyCookie: true});
            return reply.send('Good token!')    
        } catch (e) {
            return reply.send(e)
        }
    });
 } 