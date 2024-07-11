const fs = require('fs');
const path = require('path');

module.exports = async function (fastify) {

  fastify.get('/Avatars_info', async function (req, reply) {
    try {
      const dirPath = path.join(process.cwd(), 'Images', 'Avatars');

      let filesInfo = {};

      const files = fs.readdirSync(dirPath);
      filesInfo.Quality = files.length;

      let totalSizeB = 0;
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        totalSizeB += stats.size;
      }
      filesInfo.SizeMB = Math.ceil((totalSizeB / (1024 * 1024)) * 100) / 100;

      return reply.status(200).send({ file: filesInfo });

    } catch (err) {
      console.log(err);
    }
  });

  fastify.post('/Avatars', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
    try {
      const file = await req.file();

      console.log(file);

    } catch (err) {
      console.log(err);
    }
  });


  // fastify.get('/Avatars', async function (req, reply) {
  //   try {
  //     const host = req.headers.host;
  //     const protocol = req.protocol;
  //     let fileUrl;

  //     fileUrl = `${protocol}://${host}/Icon/${fileName.replace(/ /g, "_")}`;

  //     const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });

  //     let fileCursor = bucket.find({ filename: (req.params.id.replace(/_/g, ' ') + '.png') });
  //     if (await fileCursor.hasNext()) {
  //       const fileName = (await fileCursor.next()).filename;
  //       if (fs.existsSync(path.join('GridFS', 'MediaStore', 'Icons', `${fileName}`))) {
  //         // http://localhost:5000/Covers/Branch.png
  //         fileUrl = `${protocol}://${host}/Icon/${fileName.replace(/ /g, "_")}`;
  //         reply.status(200).send(fileUrl);
  //         // reply.redirect(302, `/Icon/${fileName.replace(/ /g, '_')}`).type('image/png').sendFile(`${fileName}`);
  //         return;
  //       } else {
  //         bucket.openDownloadStreamByName(fileName).pipe(fs.createWriteStream(`./GridFS/MediaStore/Icons/${fileName}`))
  //         reply.status(200).send(fileUrl)
  //         // reply.redirect(302, `/Icon/${fileName.replace(/ /g, '_')}`);
  //         // reply.redirect(302, `/Covers/${fileName.replace(/ /g, '_')}`).type('image/png').sendFile(`${fileName}`)
  //         return
  //       }
  //     } else {
  //       Logger.Server.Warn(`Не удалось найти иконку [${req.params.id}] по filename. Поиск иконки [${req.params.id}] по _id...`);
  //       const id = new this.mongo.ObjectId(req.params.id)
  //       fileCursor = bucket.find({ _id: id });
  //       if (await fileCursor.hasNext()) {
  //         Logger.Server.Ok(`Иконка [${req.params.id}] найдена в БД. Поиск иконки [${req.params.id}] на сервере...`);
  //         const fileName = (await fileCursor.next()).filename;
  //         if (fs.existsSync(path.join('GridFS', 'MediaStore', 'Icons', `${fileName}`))) {
  //           Logger.Server.Info(`Иконка [${req.params.id}] найдена на сервере. Отправка на клиент...`);
  //           fileUrl = `${protocol}://${host}/Icon/${fileName.replace(/ /g, "_")}`;
  //           reply.status(200).send(fileUrl)
  //           Logger.Server.Ok(`Иконка [${req.params.id}] успешно отправлена на клиент.`);
  //           // reply.redirect(302, `/Icon/${fileName.replace(/ /g, '_')}`);
  //           // reply.redirect(302, `/Covers/${fileName.replace(/ /g, '_')}`).type('image/png').sendFile(`${fileName}`)
  //           return;
  //         } else {
  //           Logger.Server.Warn(`Не удалось найти иконку [${req.params.id}] на сервере. Отправка иконки [${req.params.id}] из БД на сервер...`);
  //           bucket.openDownloadStream(id).pipe(fs.createWriteStream(`./GridFS/MediaStore/Icons/${fileName}`))
  //           Logger.Server.Info(`Иконка [${req.params.id}] успешно получена сервером. Отправка иконки [${req.params.id}] на клиент...`);
  //           fileUrl = `${protocol}://${host}/Icon/${fileName.replace(/ /g, "_")}`;
  //           reply.status(200).send(fileUrl)
  //           Logger.Server.Ok(`Иконка [${req.params.id}] успешно отправлена на клиент.`);
  //           // reply.redirect(302, `/Icon/${fileName.replace(/ /g, '_')}`);
  //           // reply.redirect(302, `/Covers/${fileName.replace(/ /g, '_')}`).type('image/png').sendFile(`${fileName}`)
  //           return;
  //         }
  //       } else {
  //         reply.status(200).send(null)
  //         return;
  //       }
  //     }

  //   } catch (err) {

  //   }
  // });

}