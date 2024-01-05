module.exports = async (fastify) => {

    fastify.get('/Logout', async function (req, reply) {
        reply.clearCookie('RefreshToken').clearCookie('UniqueDeviceIdentifier').send({ msg: 'You have successfully logged out!'})
        return
    })

}