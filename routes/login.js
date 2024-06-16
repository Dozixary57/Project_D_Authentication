const bcrypt = require('bcrypt');

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
                const ObjectId = fastify.mongo.ObjectId;
                const userPrivilegesPipeline = [
                    {
                        $match: {
                        _id: new ObjectId(account._id)
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
                
                const userPrivileges = await fastify.mongo.db.collection('Accounts').aggregate(userPrivilegesPipeline).toArray();

                if (userPrivileges[0].Privileges) {
                    accessTokenPayload.privileges = userPrivileges[0].Privileges;
                }  
                
                const refreshToken = fastify.jwt.sign({id: account._id}, {sub: 'refreshToken', expiresIn: '14d'})
                const accessToken = fastify.jwt.sign(accessTokenPayload, {sub: 'accessToken', expiresIn: '1m'})

                // console.log(fastify.jwt.decode(refreshToken))
                // maxAge: 1209600 -14d
                // await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка на 1 секунду
                // await console.log('Успешный вход в аккаунт.')
                return reply.setCookie('RefreshToken', refreshToken, {maxAge: 1209600, path: '/', signed: true, httpOnly: true, secure: 'auto'}).setCookie('UniqueDeviceIdentifier', fastify.uuid.v4(), {maxAge: 1209600, path: '/', signed: true, httpOnly: false, secure: 'auto'}).send({ accessToken, message: 'Login to the account was completed successfully.' });
            } else {
                // await console.log('Ошибка авторизации.')            
                return reply.status(401).send({ passwordErrMsg: 'Incorrect Password.' });
            }
        } catch (e) {
            console.log(e)
        }
    })

}