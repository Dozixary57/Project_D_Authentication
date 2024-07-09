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
                  Status
                  Email
                }
              }
            `;

      const result = await fastify.graphql(query);
      reply.status(200).send(result.data.AccountsQuery)
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Accounts not found' })
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
            Status
            Title {
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
      reply.status(404).send({ msg: 'Account not found' })
    }
  });

  fastify.put('/Account/Update', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
    try {
      const { _id, Username, Status, Email, Title, DateOfBirth, Privileges } = req.body;

      const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(_id) });

      if (!account)
        return reply.status(404).send({ msg: 'Account not found' })

      if (req.user.Username === account.Username)
        return reply.status(401).send({ msg: 'You cannot administer your account' })

      let msg = {};
      let set = {};

      if (Username && Username !== account.Username)
        set.Username = Username;
      if (Status && Status !== account.Status)
        set.Status = Status;
      if (Email && Email !== account.Email)
        set.Email = Email;
      if (Title && Title._id && Title._id !== account.Title.toString())
        set.Title = new fastify.mongo.ObjectId(Title._id);
      if (DateOfBirth && DateOfBirth !== account.DateOfBirth)
        set.DateOfBirth = DateOfBirth;

      if (Privileges && Privileges.map(Privilege => Privilege._id).toString() !== account.Privileges?.toString()) {
        if (Privileges.length > 0)
          set.Privileges = Privileges.map(Privilege => new fastify.mongo.ObjectId(Privilege._id));
        else
          set.Privileges = [];
      }

      if (Object.keys(set).length > 0) {
        try {
          if ('Username' in set || 'Status' in set || 'Email' in set || 'Title' in set || 'DateOfBirth' in set) {
            await fastify.verify_privilegeByName('UserEdit')(req, reply);
          }
          if ('Privileges' in set) {
            await fastify.verify_privilegeByName('UserPrivilegesManaging')(req, reply);
          }
        } catch (privilegeName) {
          Logger.Server.Err(`User ${req.user.Username} [${req.user._id}] failed to verify privilege ${privilegeName}.`);
          return reply.status(401).send({ msg: 'Access denied' });
        }
      }

      if (Status === null)
        set.Status = 'Active';

      if (Username !== account.Username && (await fastify.mongo.db.collection('Accounts').findOne({ Username: Username })))
        msg.UsernameError = 'Username already exists.'

      if (Email !== account.Email && (await fastify.mongo.db.collection('Accounts').findOne({ Email: Email })))
        msg.EmailError = 'Email already exists.'

      if (Object.keys(msg).length > 0)
        return reply.status(200).send({ msg })

      await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(_id) }, {
        $set: {
          ...set
        }
      });

      const query = `
        query {
          AccountQuery(ParamsId: "${_id}") {
            _id
            Username
            Status
            Title {
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
      const updatedAccount = result.data.AccountQuery;

      Logger.Server.Ok(`User ${req.user.Username} [ ${req.user._id} ] updated account ${updatedAccount.Username} [ ${updatedAccount._id} ].`);

      return reply.status(200).send({ msg: 'Account updated', Account: updatedAccount });

    } catch (err) {
      Logger.Server.Err(err);
      return reply.status(404).send({ msg: 'Account not found' })
    }
  });

  // fastify.put('/Account/:id', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
  //   try {
  //     const ParamsId = req.params.id;

  //     const { arg } = req.body;

  //     const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

  //     if (!account)
  //       return reply.status(404).send({ msg: 'Account not found' })

  //     if (req.user.Username === account.Username) {
  //       await fastify.logout()(req, reply);
  //     }

  //     if (arg === null)
  //       return reply.status(200).send({ msg: 'Args not found' })

  //     console.log(arg)

  //     if (arg === 'delete') {
  //       await fastify.verify_privilegeByName('UserDelete')(req, reply);

  //       await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(ParamsId) }, {
  //         $set: {
  //           Status: 'Deleted'
  //         }
  //       });
  //     } else if (arg === 'restore') {
  //       await fastify.verify_privilegeByName('UserRestore')(req, reply);

  //       await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(ParamsId) }, {
  //         $set: {
  //           Status: 'Active'
  //         }
  //       });
  //     }

  //     reply.status(200).send({ account: fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) }), msg: 'Account deleted' })
  //   } catch (err) {
  //     Logger.Server.Err(err);
  //     reply.status(404).send({ msg: 'Account not found' })
  //   }
  // });

  fastify.delete('/Account/:id', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
    try {
      const ParamsId = req.params.id;

      const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

      if (!account)
        return reply.status(404).send({ msg: 'Account not found' })

      if (req.user.Username === account.Username) {
        await fastify.logout()(req, reply);
        await fastify.mongo.db.collection('Accounts').deleteOne({ _id: new fastify.mongo.ObjectId(ParamsId) });
        return reply.status(200).send({ msg: 'Account was successfully deleted' })
      }

      const query = `
      query {
        AccountQuery(ParamsId: "${ParamsId}") {
          _id
          Username
          Status
          Title {
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

      if (account.Status !== 'Deleted') {
        try {
          await fastify.verify_privilegeByName('UserDeletePreliminarily')(req, reply);
        } catch (err) {
          return reply.status(404).send({ msg: 'Access denied' })
        }
        await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(ParamsId) }, {
          $set: {
            Status: 'Deleted'
          }
        });

        return reply.status(200).send({ account: (await fastify.graphql(query)).data.AccountQuery, msg: 'Account deleted preliminary' })
      }

      if (account.Status === 'Deleted') {
        try {
          await fastify.verify_privilegeByName('UserDeletePermanently')(req, reply);
        } catch (err) {
          return reply.status(404).send({ msg: 'Access denied' })
        }
        await fastify.mongo.db.collection('Accounts').deleteOne({ _id: new fastify.mongo.ObjectId(ParamsId) });
        return reply.status(200).send({ msg: 'Account deleted permanently' })
      }

      const newAccount = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

      if (!newAccount)
        return reply.status(404).send({ msg: 'Account is already deleted' })
      else
        return reply.status(404).send({ account: (await fastify.graphql(query)).data.AccountQuery })

    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found' })
    }
  });

  fastify.put('/Account/:id', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
    try {
      const ParamsId = req.params.id;

      const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

      if (!account)
        return reply.status(404).send({ msg: 'Account not found' })

      const query = `
      query {
        AccountQuery(ParamsId: "${ParamsId}") {
          _id
          Username
          Status
          Title {
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

      await fastify.verify_privilegeByName('UserRestore')(req, reply);

      await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(ParamsId) }, {
        $set: {
          Status: 'Active'
        }
      });

      reply.status(200).send({ account: (await fastify.graphql(query)).data.AccountQuery, msg: 'Account was successfully restored' })
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found' })
    }
  });

  fastify.post('/Account/:id', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
    try {
      const { Username, Status, Title, Email, DateOfBirth, Privileges } = req.body;

      const account = await fastify.mongo.db.collection('Accounts').findOne({
        $or: [
          { Username: Username },
          { Email: Email }
        ]
      })

      if (account)
        return reply.status(401).send({ msg: 'An account with this email or username already exists' });

      try {
        await fastify.verify_privilegeByName('UserCreate')(req, reply);
      } catch (err) {
        return reply.status(404).send({ msg: 'Access denied' })
      }

      let set = {};

      if (Username)
        set.Username = Username;
      else
        return reply.status(401).send({ msg: 'Username is required' });

      try {
        if (Status) {
          await fastify.verify_privilegeByName('UserStatusManaging')(req, reply);
          set.Status = Status;
        } else {
          set.Status = 'Active';
        }
      } catch (err) {
        return reply.status(404).send({ msg: 'Access denied' })
      }

      if (Email)
        set.Email = Email;
      else
        return reply.status(401).send({ msg: 'Email is required' });

      if (Title && Title._id)
        set.Title = new fastify.mongo.ObjectId(Title._id);

      if (DateOfBirth)
        set.DateOfBirth = DateOfBirth;

      try {
        if (Privileges) {
          await fastify.verify_privilegeByName('UserPrivilegesManaging')(req, reply);
          if (Privileges.length > 0)
            set.Privileges = Privileges.map(Privilege => new fastify.mongo.ObjectId(Privilege._id));
          else
            set.Privileges = [];
        }
      } catch (err) {
        return reply.status(404).send({ msg: 'Access denied' })
      }

      const createdAccount = await fastify.mongo.db.collection('Accounts').insertOne(set);

      reply.status(200).send({ _id: createdAccount.insertedId.toString(), msg: 'Account was successfully restored' })
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found' })
    }
  });

  // fastify.put('/Account/:id', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
  //   try {
  //     const ParamsId = req.params.id;

  //     const { arg } = req.body;

  //     const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

  //     if (!account)
  //       return reply.status(404).send({ msg: 'Account not found' })

  //     if (req.user.Username === account.Username) {
  //       await fastify.logout()(req, reply);
  //     }

  //     if (arg === null)
  //       return reply.status(200).send({ msg: 'Args not found' })

  //     console.log(arg)

  //     if (arg === 'delete') {
  //       await fastify.verify_privilegeByName('UserDelete')(req, reply);

  //       await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(ParamsId) }, {
  //         $set: {
  //           Status: 'Deleted'
  //         }
  //       });
  //     } else if (arg === 'restore') {
  //       await fastify.verify_privilegeByName('UserRestore')(req, reply);

  //       await fastify.mongo.db.collection('Accounts').updateOne({ _id: new fastify.mongo.ObjectId(ParamsId) }, {
  //         $set: {
  //           Status: 'Active'
  //         }
  //       });
  //     }

  //     reply.status(200).send({ account: fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) }), msg: 'Account deleted' })
  //   } catch (err) {
  //     Logger.Server.Err(err);
  //     reply.status(404).send({ msg: 'Account not found' })
  //   }
  // });

  // fastify.delete('/Account/:id', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
  //   try {
  //     const ParamsId = req.params.id;

  //     const account = await fastify.mongo.db.collection('Accounts').findOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

  //     if (!account)
  //       return reply.status(404).send({ msg: 'Account not found' })

  //     if (req.user.Username === account.Username) {
  //       await fastify.logout()(req, reply);
  //     } else {
  //       await fastify.verify_privilegeByName('UserDelete')(req, reply);
  //     }

  //     await fastify.mongo.db.collection('Accounts').deleteOne({ _id: new fastify.mongo.ObjectId(ParamsId) });

  //     reply.status(200).send({ isDeleted: true, msg: 'Account deleted' })
  //   } catch (err) {
  //     Logger.Server.Err(err);
  //     reply.status(404).send({ msg: 'Account not found' })
  //   }
  // });

  fastify.get('/User/Titles', async function (req, reply) {
    try {
      const query = `
        query {
          TitlesQuery {
            _id
            Title
          }
        }
      `;

      const result = await fastify.graphql(query);

      reply.status(200).send(result.data.TitlesQuery)
    } catch (err) {
      Logger.Server.Err(err);
      reply.status(404).send({ msg: 'Account not found' })
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
      reply.status(404).send({ msg: 'Account not found' })
    }
  })
}