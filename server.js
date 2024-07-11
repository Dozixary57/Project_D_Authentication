(async () => {
    // const fastify = require('fastify')({logger: true})
    const fastify = require('fastify')();

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


    const jwt = require('./tools/jwt')
    await jwt(fastify)

    const new_access_token = require('./functions/new_access_token')
    await new_access_token(fastify)

    // const TEST = require('./routes/test')
    // await TEST(fastify)

    const profile_avatars = require('./routes/profile_avatars')
    await profile_avatars(fastify)

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

    const accounts = require('./routes/accounts')
    await accounts(fastify)

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