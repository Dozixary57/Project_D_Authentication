const Logger = require("../tools/Logger");

module.exports = async function (fastify) {
  // let ParamsId;

  // Declare a route
  fastify.get('/Accounts', async function (req, reply) {
    try {
      const query = `
              query {
                AccountsQuery {
                  _id
                  Username
                  AccountStatus
                  Email
                }
              }
            `;

      const result = await fastify.graphql(query);
      reply.status(200).send(result.data.AccountsQuery)
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Accounts not found.' })
    }
  })

  fastify.get('/Account/:id', async function (req, reply) {
    try {
      const ParamsId = req.params.id;

      const query = `
        query {
          AccountQuery(ParamsId: "${ParamsId}") {
            _id
            Username
            AccountStatus
            Status {
              _id
              Title
            }
            Email
            DateOfBirth
            Privileges {
              _id
              Title
            }
          }
        }
      `;

      const result = await fastify.graphql(query);

      reply.status(200).send(result.data.AccountQuery)
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found.' })
    }
  })

  fastify.post('/Account/Update', { preHandler: fastify.verify_privilegeByName('UserPrivilegesManaging', 'UserEdit') }, async function (req, reply) {
    try {
      const { _id, Username, AccountStatus, Email, DateOfBirth, Privileges } = req.body;

      console.log(req.body);

      const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(_id) });
      
      if (!account)
        reply.status(404).send({ msg: 'Account not found.' })

      if (Username !== account.Username && (await fastify.mongo.db.collection('Accounts').findOne({ Username: Username })))
        reply.status(404).send({ msg: 'Username already exists.' })

      await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(_id) }, {
        $set: {
          Username: Username || account.Username,
          AccountStatus: AccountStatus || account.AccountStatus,
          Email: Email || account.Email,
          DateOfBirth: DateOfBirth || account.DateOfBirth,
          Privileges: Privileges || account.Privileges
        }
      });

      reply.status(200).send({ msg: 'Account updated.', account: await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(_id) }) })
      
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found.' })
    }
  });

  fastify.get('/User/Statuses', async function (req, reply) {
    try {
      const query = `
            query {
              StatusesQuery {
                _id
                Title
              }
            }
          `;

      const result = await fastify.graphql(query);

      reply.status(200).send(result.data.StatusesQuery)
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found.' })
    }
  })

  fastify.get('/User/Privileges', async function (req, reply) {
    try {
      const query = `
            query {
              PrivilegesQuery {
                _id
                Title
              }
            }
          `;

      const result = await fastify.graphql(query);

      reply.status(200).send(result.data.PrivilegesQuery)
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found.' })
    }
  })
}