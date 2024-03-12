
module.exports = async (fastify) => {

    fastify.get('/Logout', async function (req, reply) {
        try {
            await fastify.logout()(req, reply);
            return reply.status(200).send({ msg: 'You have successfully logged out!'});
        } catch (e) {
            console.log(e)
        }
    });


}