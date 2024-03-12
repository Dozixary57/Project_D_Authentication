const bcrypt = require('bcrypt');
const UDI_Generator = require("../tools/UniqueDeviceIdentifier_Generator");

const collection = "Accounts"

module.exports = async (fastify) => {

    fastify.post('/Login', async function (req, reply) {
        try {
            // const userAgent = req.userAgent;
            const { UsernameEmail, Password } = req.body;

            const account = await fastify.mongo.db.collection(collection).findOne({
                $or: [
                    { Username: UsernameEmail },
                    { Email: UsernameEmail }
                ]
            })

            if (!account) {
                return reply.status(200).send({ usernameEmailErrMsg: 'An account with this email or username does not exist.' });
            }

            const match = await bcrypt.compare(Password, account.Password);

            if (match) {
                const refreshToken = fastify.jwt.sign({id: account._id, username: account.Username}, {sub: 'refreshToken', expiresIn: '10m'})
                const accessToken = fastify.jwt.sign({id: account._id, username: account.Username}, {sub: 'accessToken', expiresIn: '1m'})

                // console.log('1! ' + refreshToken)


                // console.log(fastify.jwt.decode(refreshToken))
                // maxAge: 1209600 -14d
                // await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка на 1 секунду
                // await console.log('Успешный вход в аккаунт.')
                return reply.setCookie('RefreshToken', refreshToken, {maxAge: 600, path: '/', signed: true, httpOnly: true, secure: 'auto'}).setCookie('UniqueDeviceIdentifier', fastify.uuid.v4(), {maxAge: 600, path: '/', signed: true, httpOnly: false, secure: 'auto'}).send({ accessToken, message: 'Login to the account was completed successfully.' });
            } else {
                // await console.log('Ошибка авторизации.')            
                return reply.status(200).send({ passwordErrMsg: 'Incorrect Password.' });
            }
        } catch (e) {
            console.log(e)
        }
    })

}