const bcrypt = require('bcrypt');
const saltRounds = 10;

const collection = "Accounts"

module.exports = async (fastify) => {

    fastify.post('/Signup', async function (req, reply) {
        const { Username, Password, Email } = req.body;

        const accountUsernameExists = await fastify.mongo.db.collection(collection).findOne({ Username: Username })
        const accountEmailExists = await fastify.mongo.db.collection(collection).findOne({ Email: Email })
        if (accountUsernameExists) {
            return { usernameErr: 'An account with this username already exists.'}
        } else if (accountEmailExists) {
            return { emailErr: 'An account with this email already exists.'}
        }

        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        await fastify.mongo.db.collection(collection).insertOne({
            Username: Username, Password: hashedPassword, Email: Email
        })
        reply.status(200).send({ success: 'The account has been successfully registered.' })
        return
    })

}