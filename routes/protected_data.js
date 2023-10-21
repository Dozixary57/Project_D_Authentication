module.exports = async (fastify) => {

    fastify.decorate('authenticate', async function (req, reply) {
        try {
            await req.jwtVerify();
        } catch {
            reply.send('Not authorized.')
            // reply.redirect(302, `/Authorization/Signin`)
        }
    })

    fastify.get('/Account', { preValidation: [fastify.authenticate] }, async function (req, reply) {
        reply.send({ protectedData: 'You have accessed protected data.' });
    });

}