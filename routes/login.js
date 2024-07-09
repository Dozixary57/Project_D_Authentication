const bcrypt = require('bcrypt');
const { Title } = require('../tools/Logger');

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
        return reply.status(401).send({ usernameEmailErrMsg: 'An account with this email or username does not exist.' });
      }

      const match = await bcrypt.compare(Password, account.Password);

      if (match) {
        const refreshToken = fastify.jwt.sign({ _id: account._id }, { sub: 'refreshToken', expiresIn: '14d' })

        return reply.setCookie('RefreshToken', refreshToken, { maxAge: 1209600, path: '/', signed: true, httpOnly: true, sameSite: 'none', secure: 'true' }).send({ accessToken: await fastify.newAccessToken()(account._id), msg: 'Login to the account was completed successfully.' });
      } else {
        return reply.status(401).send({ passwordErrMsg: 'Incorrect Password.' });
      }
    } catch (e) {
      console.log(e)
    }
  })
}