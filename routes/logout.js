module.exports = async (fastify) => {

    fastify.get('/Logout', async function (req, reply) {
        reply.clearCookie('RefreshToken').send({ msg: 'You have successfully logged out!'})
        return
    })

}