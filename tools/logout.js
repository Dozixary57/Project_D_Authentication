const Logger = require("./Logger");

module.exports = async (fastify) => {
   fastify.decorate('logout', function () {
      return async function (req, reply) {
         try {
            // Logger.Server.Info('Выход из аккаунта.');
            return reply.clearCookie('RefreshToken').clearCookie('UniqueDeviceIdentifier').send()
         } catch (e) {
            console.log(e);
         }
      }
   });
}

// Добавить логику удаления записи сессии из БД