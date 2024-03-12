const axios = require('axios');
const bcrypt = require('bcrypt');
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
                Username: Username,  Email: Email, DateOfBirth: dateOfBirthFormatted, Password: hashedPassword
            })

            const createdAccount = await fastify.mongo.db.collection(collection).findOne({
                $or: [
                    { Username: Username },
                    { Email: Email }
                ]
            })

            if (createdAccount) {
                const userId = createdAccount._id;
                const refreshToken = fastify.jwt.sign({userId}, {sub: 'refreshToken', expiresIn: '10m'})
                const accessToken = fastify.jwt.sign({userId}, {sub: 'accessToken', expiresIn: '1m'})    
    
                // maxAge: 1209600 -14d
                reply.status(200).setCookie('RefreshToken', refreshToken, {maxAge: 600, path: '/', signed: true, httpOnly: true, secure: 'auto'}).setCookie('UniqueDeviceIdentifier', fastify.uuid.v4(), {maxAge: 600, path: '/', signed: true, httpOnly: false, secure: 'auto'}).send({ accessToken, message: 'The account has been successfully registered' });    
                return;
            }

            return;    
    
        } catch (e) {
            console.log(e)
        }
    })
}