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
      reply.status(404).send({ 'massage': 'Accounts not found.' })
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
      reply.status(404).send({ 'massage': 'Account not found.' })
    }
  })

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
      reply.status(404).send({ 'massage': 'Account not found.' })
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
      reply.status(404).send({ 'massage': 'Account not found.' })
    }
  })
}