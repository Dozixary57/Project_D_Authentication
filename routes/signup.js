const axios = require('axios');
const bcrypt = require('bcrypt');
const { Title } = require('../tools/Logger');
const saltRounds = 10;

const collection = "Accounts"

module.exports = async (fastify) => {

    fastify.post('/Signup', async function (req, reply) {
        try {
            const { Username, Email, DateOfBirth, Password, CaptchaToken } = req.body;

            const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
                params: {
                  secret: '6LeLNIcpAAAAAPWQra5iuuvcMfYG9VMMaCQdl0UF',
                  response: CaptchaToken
                }
            })
    
            const accountUsernameExists = await fastify.mongo.db.collection(collection).findOne({ Username: Username })
            const accountEmailExists = await fastify.mongo.db.collection(collection).findOne({ Email: Email })
    
            let ErrMessages = {};
    
            const dateOfBirthFormatted = new Date(DateOfBirth);
    
            if (accountUsernameExists) {
                ErrMessages.usernameErrMsg = 'This Username is already occupied';
            }
            if (accountEmailExists) {
                ErrMessages.emailErrMsg = 'An account with this email already exists';
            }
    
            if (Object.keys(ErrMessages).length > 0) {
                console.log(response.data.score)
                return reply.status(200).send(ErrMessages)
            }
    
            const hashedPassword = await bcrypt.hash(Password, saltRounds);
    
            await fastify.mongo.db.collection(collection).insertOne({
                Username: Username, Title: new fastify.mongo.ObjectId("65f4af7ecff76e4d9800b0b3"), Status: 'Active', Email: Email, DateOfBirth: dateOfBirthFormatted, Password: hashedPassword
            })

            const createdAccount = await fastify.mongo.db.collection(collection).findOne({
                $or: [
                    { Username: Username },
                    { Email: Email }
                ]
            })

            if (createdAccount) {
                const refreshToken = fastify.jwt.sign({ _id: createdAccount._id }, {sub: 'refreshToken', expiresIn: '14d'})

                return reply.status(200).setCookie('RefreshToken', refreshToken, { maxAge: 1209600, path: '/', signed: true, httpOnly: true, sameSite: 'none', secure: 'true' }).send({ accessToken: await fastify.newAccessToken()(createdAccount._id), msg: 'Sign up was completed successfully.' });
            }

            return;    
    
        } catch (e) {
            console.log(e)
        }
    })
}