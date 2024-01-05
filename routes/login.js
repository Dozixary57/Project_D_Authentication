const bcrypt = require('bcrypt');
const UDI_Generator = require("../tools/UniqueDeviceIdentifier_Generator");

const collection = "Accounts"

module.exports = async (fastify) => {

    fastify.post('/Login', async function (req, reply) {
        // const userAgent = req.userAgent;
        const { Login, Password } = req.body;

        const account = await fastify.mongo.db.collection(collection).findOne({
            $or: [
                { Username: Login },
                { Email: Login }
            ]
        })

        if (!account) {
            return { errLogin: 'An account with this email or username does not exist.', errPassword: ' ' }
        }

        const match = await bcrypt.compare(Password, account.Password);

        if (match) {
            const refreshToken = fastify.jwt.sign({Login}, {sub: 'refreshToken', expiresIn: '10m'})
            const accessToken = fastify.jwt.sign({Login}, {sub: 'accessToken', expiresIn: '1m'})

/*            await fastify.mongo.db.collection(collection).updateOne( { Username: Username }, {
                $set: {
                    'Authentication.RefreshToken': refreshToken
                },
                $push: {
                    'Authentication.Sessions': {
                        Time: new Date(),
                        Timezone: '',
                        OS: req.userAgent.os.family + ' ' + req.userAgent.os.major,
                        Browser: req.userAgent.family,
                        Country: '',
                        Region: '',
                        City: ''
                    }
                }
            } )*/
            // maxAge: 1209600 -14d
            // await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка на 1 секунду
            reply.setCookie('RefreshToken', refreshToken, {maxAge: 600, path: '/', signed: true, httpOnly: true, secure: 'auto'}).setCookie('UniqueDeviceIdentifier', fastify.uuid.v4(), {maxAge: 600, path: '/', signed: true, httpOnly: false, secure: 'auto'}).send({ accessToken, msgSuccess: 'Login to the account was completed successfully.' });
            await console.log('Успешный вход в аккаунт.')
            return
        } else {
            reply.send({ errLogin: null, errPassword: 'Incorrect Password.' });
            await console.log('Ошибка авторизации.')
            return
        }
    })

}