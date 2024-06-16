const mercurius = require('mercurius');
const Logger = require('../tools/Logger');

module.exports = async function (fastify) {

  const schema = `
    type Accounts {
      _id: String
      Username: String
      AccountStatus: String
      Email: String
    }

    type status {
      _id: String
      Title: String
    }

    type privileges {
      _id: String
      Title: String
    }

    type Account {
      _id: String
      Username: String
      AccountStatus: String
      Status: status
      Email: String
      DateOfBirth: String
      Privileges: [privileges]
    }

    type Statuses {
      _id: String
      Title: String
    }

    type Query {
      AccountsQuery: [Accounts]
      AccountQuery(ParamsId: String!): Account
      StatusesQuery: [Statuses]
      PrivilegesQuery: [privileges]
    }
    `;

  const resolvers = {
    Query: {
      AccountsQuery: async () => {
        const accounts = await fastify.mongo.db.collection("Accounts").find().toArray()

        const result = await Promise.all(accounts.map(document => ({
          _id: document._id,
          Username: document.Username,
          AccountStatus: document.AccountStatus,
          Email: document.Email,
        })));
        return result;
      },
      AccountQuery: async (obj, { ParamsId }, context) => {
        const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });
      
        const userStatus = await fastify.mongo.db.collection('UserStatus').findOne({ _id: new fastify.mongo.ObjectId(account.Status) });

        let status;

        if (!userStatus) {
          status = null;
        } else {
          status = {
            _id: userStatus._id,
            Title: userStatus.Title
          }
        }

        const userPrivileges = await fastify.mongo.db.collection('UserPrivileges').find({ _id: { $in: account.Privileges || [] } }).toArray();
                
        let privileges;

        if (!userPrivileges || userPrivileges.length === 0) {
          privileges = null;
        } else {
          privileges = userPrivileges.map(privilege => ({
            _id: privilege._id,
            Title: privilege.Title
          }));
        }

        return {
          _id: account._id,
          Username: account.Username,
          AccountStatus: account.AccountStatus,
          Status: status,
          Email: account.Email,
          DateOfBirth: account.DateOfBirth,
          Privileges: privileges
        };
      },
      StatusesQuery: async () => {
        const statuses = await fastify.mongo.db.collection('UserStatus').find().toArray()

        const result = await Promise.all(statuses.map(document => ({
          _id: document._id,
          Title: document.Title,
        })));
        
        return result;
      },
      PrivilegesQuery: async () => {
        const privileges = await fastify.mongo.db.collection('UserPrivileges').find().toArray()

        const result = await Promise.all(privileges.map(document => ({
          _id: document._id,
          Title: document.Title,
        })));

        return result;
      },
    },
  };

  fastify.register(mercurius, {
    schema,
    resolvers,
    graphiql: false,
  }).ready(() => {
    Logger.Server.Ok('@Fastify/Mercurius успешно зарегестрирован!');
  });
}