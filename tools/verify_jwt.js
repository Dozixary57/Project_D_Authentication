const Logger = require("./Logger");

module.exports = async (fastify) => {
   fastify.decorate('verifyJWT', function () {
      return async function (req, reply) {
         try {
            // Check valid AccessToken

            await req.jwtVerify();

            const authHeader = req.headers['authorization'];

            if (authHeader != undefined && authHeader.split(' ')[1] != null) {
               return reply.status(200).send();
            } else {
               throw accessTokenError;
            }

         } catch (accessTokenError) {
            try {
               // Else check valid RefreshToken

               await req.jwtVerify({onlyCookie: true});

               const refreshTokenData = fastify.unsignCookie(req.cookies.RefreshToken);

               if (!refreshTokenData.value)
                  return reply.status(401).send();

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
      }
   });

   // fastify.decorate('verify_privilege_UserPrivilegesManaging', function () {
   //    return async function (req, reply) {
   //       try {

   //          await req.jwtVerify();

   //          const authHeader = req.headers['authorization'];

   //          if (authHeader == undefined && authHeader.split(' ')[1] == null) {
   //             throw UserPrivilegeError;
   //          }

   //          const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(req.user._id) });

   //          if (!account)
   //             throw UserPrivilegeError;

   //          const userPrivileges = await fastify.mongo.db.collection('UserPrivileges').find({ _id: { $in: account.Privileges || [] } }).toArray();            
   //          const userPrivilege = userPrivileges.find(userPrivilege => userPrivilege.Title === 'UserPrivilegesManaging');
            
   //          if (!userPrivilege)
   //             throw UserPrivilegeError;
            
   //       } catch (UserPrivilegeError) {
   //          return reply.status(401).send({ msg: 'Access denied' });
   //       }
   //    }
   // });

   fastify.decorate('verify_privilegeByName', function (...privilegeName) {
      return async function (req, reply) {
         try {

            await req.jwtVerify();

            const authHeader = req.headers['authorization'];

            if (authHeader == undefined && authHeader.split(' ')[1] == null) {
               throw UserPrivilegeError;
            }

            const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(req.user._id) });

            if (!account)
               throw UserPrivilegeError;

            const userPrivileges = await fastify.mongo.db.collection('UserPrivileges').find({ _id: { $in: account.Privileges || [] } }).toArray();

            const privilegeNames = Array.isArray(privilegeName) ? privilegeName : [privilegeName];
            const hasAllPrivileges = privilegeNames.every(title => 
              userPrivileges.some(userPrivilege => userPrivilege.Title === title)
            );
                        
            if (!hasAllPrivileges)
               throw UserPrivilegeError;
            
         } catch (UserPrivilegeError) {
            return reply.status(401).send({ msg: 'Access denied' });
         }
      }
   });

}