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

    // const create_jwt_session = require('./functions/create_jwt_session')
    // await create_jwt_session(fastify)

    const create_access_token = require('./functions/create_access_token')
    await create_access_token(fastify)

    const verify_jwt = require('./tools/verify_jwt')
    await verify_jwt(fastify)

    // const TEST = require('./routes/test')
    // await TEST(fastify)


    const logout_func = require('./tools/logout')
    await logout_func(fastify)

    // Declare a main routes
    const signup = require('./routes/signup')
    await signup(fastify)

    const login = require('./routes/login')
    await login(fastify)

    const isAuth = require('./routes/is_auth')
    await isAuth(fastify)

    const logout = require('./routes/logout')
    await logout(fastify)

    const protected_data = require('./routes/protected_data')
    await protected_data(fastify)

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