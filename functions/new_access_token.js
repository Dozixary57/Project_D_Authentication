const Logger = require("../tools/Logger");

module.exports = async (fastify) => {
  fastify.decorate('newAccessToken', function () {
    return async function (accountId) {
      try {
        const collection = "Accounts";

        const account = await fastify.mongo.db.collection(collection).findOne({ _id: new fastify.mongo.ObjectId(accountId) });

        if (!account) {
          return reply.status(401).send({ usernameEmailErrMsg: 'An account with this email or username does not exist.' });
        }

        const userPrivilegesPipeline = [
          {
            $match: {
              _id: new fastify.mongo.ObjectId(account._id)
            }
          },
          {
            $unwind: {
              path: "$Privileges",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: "UserPrivileges",
              localField: "Privileges",
              foreignField: "_id",
              as: "PrivilegeDetails"
            }
          },
          {
            $unwind: {
              path: "$PrivilegeDetails",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: "$_id",
              Username: { $first: "$Username" },
              Email: { $first: "$Email" },
              DateOfBirth: { $first: "$DateOfBirth" },
              Status: { $first: "$Status" },
              Privileges: { $push: "$PrivilegeDetails.Title" }
            }
          },
          {
            $project: {
              Username: 1,
              Email: 1,
              DateOfBirth: 1,
              Status: 1,
              Privileges: {
                $cond: { if: { $eq: [[], "$Privileges"] }, then: null, else: "$Privileges" }
              }
            }
          }
        ];

        let accessTokenPayload = {
          id: account._id,
          username: account.Username
        };

        const userPrivileges = await fastify.mongo.db.collection(collection).aggregate(userPrivilegesPipeline).toArray();

        if (userPrivileges[0].Privileges) {
          accessTokenPayload.privileges = userPrivileges[0].Privileges;
        }

        return fastify.jwt.sign(accessTokenPayload, { sub: 'accessToken', expiresIn: '1m' })

      } catch (error) {
        console.log(error);
      }
    }
  });
}