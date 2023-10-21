(async () => {
    const fastify = require('fastify')()
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(path.join(process.cwd(), 'CryptoKeyPair', 'publicKey.pem')) || !fs.existsSync(path.join(process.cwd(), 'CryptoKeyPair', 'privateKey.pem'))) {
        const keyPairGenerator = require("./tools/CryptoKeyPair_Generator");
        keyPairGenerator()
    }

    const modules_registration = require('./modules_registration')
    await modules_registration(fastify)

    // Declare a service route
    fastify.get('/', (request, reply) => {
        reply.send('Server is running!')
    })

    // Declare a main routes
    const signup = require('./routes/signup')
    await signup(fastify)

    const login = require('./routes/login')
    await login(fastify)

    const protected_data = require('./routes/protected_data')
    await protected_data(fastify)

    const logout = require('./routes/logout')
    await logout(fastify)

    // Error handler for non-existent routes
    fastify.setNotFoundHandler((req, reply) => {
        reply.code(404).send('This route not found.');
    })

    // Run the server
    fastify.listen({ port: 7000 }, (err, address) => {
        if (err) throw err
        console.log(`The server is running! ( ${address} )`)
    })
})();