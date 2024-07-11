const mercurius = require('mercurius');
const Logger = require('../tools/Logger');

module.exports = async function (fastify) {

  const schema = `
    type Titles {
      _id: String
      Title: String
    }

    type Privileges {
      _id: String
      Title: String
    }

    type Accounts {
      _id: String
      Username: String
      Status: String
      Email: String
    }

    type Account {
      _id: String
      Username: String
      Status: String
      Title: Titles
      Email: String
      DateOfBirth: String
      Privileges: [Privileges]
    }

    type Query {
      AccountsQuery: [Accounts]
      AccountQuery(ParamsId: String!): Account
      DeletedAccountQuery(ParamsId: String!): Account
      TitlesQuery: [Titles]
      PrivilegesQuery: [Privileges]
    }
    `;

  const resolvers = {
    Query: {
      AccountsQuery: async () => {
        const accounts = await fastify.mongo.db.collection("Accounts").find().toArray()

        const result = await Promise.all(accounts.map(document => ({
          _id: document._id,
          Username: document.Username,
          Status: document.Status,
          Email: document.Email,
        })));
        return result;
      },
      AccountQuery: async (obj, { ParamsId }, context) => {
        const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });
      
        const userTitle = await fastify.mongo.db.collection('UserTitles').findOne({ _id: new fastify.mongo.ObjectId(account.Title) });

        let title;

        if (!userTitle) {
          title = null;
        } else {
          title = {
            _id: userTitle._id,
            Title: userTitle.Title
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
          Status: account.Status,
          Title: title,
          Email: account.Email,
          DateOfBirth: account.DateOfBirth,
          Privileges: privileges
        };
      },
      TitlesQuery: async () => {
        const titles = await fastify.mongo.db.collection('UserTitles').find().toArray()

        const result = await Promise.all(titles.map(document => ({
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
    Logger.Server.Info('@Fastify/Mercurius успешно зарегестрирован!');
  });
}