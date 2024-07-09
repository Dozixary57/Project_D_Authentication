const Logger = require("./Logger");

module.exports = async (fastify) => {
  // fastify.decorate('verifyAndUpdateJWT', function () {
  //   return async function (req, reply) {
  //     try {
  //       await req.jwtVerify();

  //       const authHeader = req.headers['authorization'];

  //       if (authHeader != undefined && authHeader.split(' ')[1] != null) {
  //         return reply.status(200).send();
  //       } else {
  //         throw accessTokenError;
  //       }

  //     } catch (accessTokenError) {
  //       return fastify.updateJWT()(req, reply);
  //     }
  //   }
  // });

  fastify.decorate('updateJWT', function () {
    return async function (req, reply) {
      try {
        await req.jwtVerify({ onlyCookie: true });

        const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);

        if (!refreshTokenData.value)
          return reply.status(401).send({ msg: 'You should log in again' });

        const refreshToken = refreshTokenData.value;
        const decoded = fastify.jwt.decode(refreshToken);

        const newAccessToken = await fastify.newAccessToken()(decoded._id);

        if (newAccessToken) {
          return reply.status(200).send({ accessToken: newAccessToken });
        } else {
          return reply.status(401).send({ msg: 'You should log in again' });
        }

      } catch (refreshTokenError) {
        fastify.logout();
        return reply.status(401).send({ msg: 'You should log in again' });
      }
    }
  });

  fastify.decorate('verifyJWT', function () {
    return async function (req, reply) {
      try {

        // console.log(req.headers['authorization'])

        await req.jwtVerify();

        const authHeader = req.headers['authorization'];

        if (authHeader === undefined && authHeader.split(' ')[1] === null) {
          throw accessTokenError;
        }

      } catch (accessTokenError) {
        console.log(accessTokenError)
        return reply.status(401).send({ msg: 'Access denied' });
      }
    }
  });

  fastify.decorate('verify_privilegeByName', (privilegeName) => {
    return async function (req, reply) {

      class Err extends Error {
        toString() {
          return this.message;
        }
      }
      
      await req.jwtVerify();

      const authHeader = req.headers['authorization'];

      if (authHeader == undefined && authHeader.split(' ')[1] == null)
        throw new Error('Access denied');

      const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(req.user._id) });

      if (!account)
        throw new Error('Access denied');

      const userPrivileges = await fastify.mongo.db.collection('UserPrivileges').find({ _id: { $in: account.Privileges || [] } }).toArray();

      const privilegeNames = Array.isArray(privilegeName) ? privilegeName : [privilegeName];
      const hasPrivileges = privilegeNames.every(title =>
        userPrivileges.some(userPrivilege => userPrivilege.Title === title)
      );

      if (!hasPrivileges)
        throw new Err(`${privilegeName}`);

    }
  });

}