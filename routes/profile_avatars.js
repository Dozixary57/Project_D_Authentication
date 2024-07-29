const fs = require('fs');
const path = require('path');
const fileType = require('file-type-cjs');
const mime = require('mime-types');
const sharp = require('sharp');
const mongodb = require("mongodb");

module.exports = async function (fastify) {

  fastify.get('/Avatars_info', async function (req, reply) {
    try {
      const dirPath = path.join(process.cwd(), 'Images', 'Avatars');

      const ignoredFiles = ['.gitkeep'];

      let filesInfo = {};

      const files = fs.readdirSync(dirPath).filter(file => !ignoredFiles.includes(file));
      filesInfo.Quality = files.length;

      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      filesInfo.Size = totalSize;

      return reply.status(200).send({ file: filesInfo });

    } catch (err) {
      console.log(err);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.get('/Avatars', async function (req, reply) {
    try {
      let serverFileUrlString = `${req.protocol}://${req.headers.host}/Avatars/`;
      let databaseFileUrlString = `${req.protocol}://${req.headers.host}/Database/Avatars/`;

      let files = [];

      const filesDirPath = path.join(process.cwd(), 'Images', 'Avatars');
      const ignoredFiles = ['.gitkeep'];

      // file system read
      const directoryFiles = fs.readdirSync(filesDirPath).filter(file => !ignoredFiles.includes(file));

      // database read
      const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });
      let fileCursor = bucket.find();
      const dbFiles = await fileCursor.toArray();
      const databaseFiles = dbFiles.map(file => file.filename);

      // all files
      const allFiles = [...new Set([...directoryFiles, ...databaseFiles])];

      // console.log(allFiles);

      for (const file of allFiles) {

        // get file system file url
        const filePath = path.join(filesDirPath, file);

        let serverImageUrl = null;

        if (fs.existsSync(filePath)) {
          serverImageUrl = serverFileUrlString + file;
        }

        // get database file url
        const fileCursor = bucket.find({ filename: file });

        let databaseImageUrl = null;

        const db_file = await fileCursor.toArray();

        if (db_file && db_file.length > 0) {
          databaseImageUrl = databaseFileUrlString + file;
        }

        files.push({
          filename: file,
          serverImageUrl: serverImageUrl,
          databaseImageUrl: databaseImageUrl,
        });
      }

      reply.send(files);
    } catch (err) {
      console.log(err);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.get('/SyncImagesStorage/:filename', async function (req, reply) {
    try {
      const filename = req.params.filename;

      let serverFileUrlString = `${req.protocol}://${req.headers.host}/Avatars/`;
      let databaseFileUrlString = `${req.protocol}://${req.headers.host}/Database/Avatars/`;

      // file system
      const filesDirPath = path.join(process.cwd(), 'Images', 'Avatars');

      // database
      const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });
      const fileCursor = await bucket.find({ filename: filename }).toArray();

      const filePath = path.join(filesDirPath, filename);

      if (!fs.existsSync(filePath) && !fileCursor.length > 0) {
        return reply.status(200).send({ msg: 'Synchronize is not available' });
      }

      if (fs.existsSync(filePath) && fileCursor.length > 0) {
        return reply.status(200).send({ msg: 'Synchronize is not required' });
      }

      if (fs.existsSync(filePath)) {
        const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });

        const uploadStream = bucket.openUploadStream(filename);
        const uploadStreamPromise = new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', resolve);
        });
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(uploadStream);
        await uploadStreamPromise;

        const databaseFileUrl = databaseFileUrlString + filename;

        return reply.send({ databaseImageUrl: databaseFileUrl });
      }

      if (fileCursor && fileCursor.length > 0) {
        const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });

        const downloadStream = bucket.openDownloadStreamByName(filename);
        const writeStream = fs.createWriteStream(filePath);

        const downloadStreamPromise = new Promise((resolve, reject) => {
          writeStream.on('error', reject);
          writeStream.on('close', resolve);
          downloadStream.on('error', reject);
        });

        downloadStream.pipe(writeStream);
        await downloadStreamPromise;

        const serverFileUrl = serverFileUrlString + filename;

        return reply.send({ serverImageUrl: serverFileUrl });
      }

      return reply.send({ msg: 'Synchronize is not available' });
    } catch (err) {
      console.log(err);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // fastify.get('/Avatars', async function (req, reply) {
  //   try {
  //     let serverFileUrlString = `${req.protocol}://${req.headers.host}/Avatars/`;
  //     let databaseFileUrlString = `${req.protocol}://${req.headers.host}/Database/Avatars/`;

  //     let files = [];

  //     const filesDirPath = path.join(process.cwd(), 'Images', 'Avatars');
  //     const ignoredFiles = ['.gitkeep'];

  //     // file system read
  //     const directoryFiles = fs.readdirSync(filesDirPath).filter(file => !ignoredFiles.includes(file));

  //     // database read
  //     const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });
  //     let fileCursor = bucket.find();
  //     const dbFiles = await fileCursor.toArray();
  //     const databaseFiles = dbFiles.map(file => file.filename);

  //     // all files
  //     const allFiles = [...new Set([...directoryFiles, ...databaseFiles])];

  //     // console.log(allFiles);

  //     for (const file of allFiles) {

  //       // get file system stats part
  //       const filePath = path.join(filesDirPath, file);

  //       let fs_stats = null;

  //       if (fs.existsSync(filePath)) {
  //         fs_stats = fs.statSync(filePath);
  //         const metadata = await sharp(filePath).metadata();

  //         fs_stats = {
  //           extension: path.extname(file),
  //           format: mime.lookup(filePath).split('/')[0],
  //           resolution: `${metadata.width}x${metadata.height}`,
  //           size: fs_stats.size,
  //           url: serverFileUrlString + file,
  //         }

  //         // console.log("1")
  //         // console.log(fs_stats);
  //       }

  //       // get database stats part
  //       const fileCursor = bucket.find({ filename: file });

  //       let db_stats = null;

  //       const db_file = await fileCursor.toArray();

  //       if (db_file && db_file.length > 0) {
  //         async function readStreamToBuffer(stream) {
  //           return new Promise((resolve, reject) => {
  //             const chunks = [];
  //             stream.on('data', chunk => chunks.push(chunk));
  //             stream.on('end', () => resolve(Buffer.concat(chunks)));
  //             stream.on('error', err => reject(err));
  //           });
  //         }

  //         const downloadStream = bucket.openDownloadStreamByName(file);

  //         const buffer = await readStreamToBuffer(downloadStream);
  //         if (buffer) {
  //           const metadata = await sharp(buffer).metadata();

  //           const fileTypeResult = await fileType.fromBuffer(buffer);
  //           const extension = fileTypeResult ? `.${fileTypeResult.ext}` : '';

  //           const mimeType = fileTypeResult ? fileTypeResult.mime : mime.lookup(extension);

  //           const size = buffer.length;

  //           db_stats = {
  //             extension: extension,
  //             format: mimeType.split('/')[0],
  //             resolution: `${metadata.width}x${metadata.height}`,
  //             size: size,
  //             url: databaseFileUrlString + file,
  //           }

  //           // console.log("2")
  //           // console.log(db_stats);

  //           // console.log(extension);
  //           // console.log(mimeType);
  //           // console.log(size);

  //           // console.log(metadata);
  //         }

  //         // reply.header('Content-Type', 'image/png').send(buffer);

  //       }

  //       let joint_stats = null;

  //       if (fs_stats && db_stats) {
  //         const fs_stats_keys = Object.keys(fs_stats).filter(key => key !== 'url');
  //         const db_stats_keys = Object.keys(db_stats).filter(key => key !== 'url');

  //         if (fs_stats_keys.length === db_stats_keys.length) {
  //           let isEqual = true;
  //           for (let key of fs_stats_keys) {
  //             if (fs_stats[key] !== db_stats[key]) {
  //               isEqual = false;
  //               break;
  //             }
  //           }
  //           if (isEqual) {
  //             joint_stats = fs_stats;
  //             fs_stats = null;
  //             db_stats = null;
  //           }
  //         }
  //       }

  //       files.push({
  //         filename: file,
  //         fs_stats: fs_stats,
  //         db_stats: db_stats,
  //         joint_stats: joint_stats
  //       });
  //     }

  //     reply.send(files);
  //   } catch (err) {
  //     console.log(err);
  //     return reply.status(500).send({ error: 'Internal Server Error' });
  //   }
  // });

  // fastify.get('/Avatars', async function (req, reply) {
  //   try {
  //     let fileUrlString = `${req.protocol}:/${req.headers.host}/Avatars/`;

  //     let files = [];

  //     const filesDirPath = path.join(process.cwd(), 'Images', 'Avatars');
  //     const ignoredFiles = ['.gitkeep'];
  //     const directoryFiles = fs.readdirSync(filesDirPath).filter(file => !ignoredFiles.includes(file));

  //     for (const file of directoryFiles) {
  //       const filePath = path.join(filesDirPath, file);
  //       const stats = fs.statSync(filePath);

  //       const metadata = await sharp(filePath).metadata();

  //       if (stats.isFile()) {
  //         files.push({
  //           filename: file,
  //           extension: path.extname(file),
  //           format: mime.lookup(filePath).split('/')[0],
  //           resolution: `${metadata.width}x${metadata.height}`,
  //           size: stats.size,
  //           url: fileUrlString + file,
  //         });
  //       }
  //     }


  //     reply.send(files);
  //   } catch (err) {
  //     console.log(err);
  //     return reply.status(500).send({ error: 'Internal Server Error' });
  //   }
  // });

  fastify.get('/Avatars/:filename', async function (req, reply) {
    try {
      const filename = req.params.filename;
      return reply.sendFile(filename);
    } catch (err) {
      console.log(err);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/Avatars', { preHandler: fastify.verifyJWT() }, async function (req, reply) {
    try {
      const parts = req.parts();

      let file;
      let fileProperties;

      // get file properties
      for await (const part of parts) {
        if (part.fieldname === 'file') {
          file = part;
        } else if (part.fieldname === 'fileProperties') {
          fileProperties = JSON.parse(part.value);
        }
      }

      if (!file || !fileProperties) {
        return reply.status(400).send({ error: 'Missing file or file properties' });
      }

      const fileBuffer = await new Promise((resolve, reject) => {
        const buffers = [];
        file.file.on('data', (chunk) => buffers.push(chunk));
        file.file.on('end', () => resolve(Buffer.concat(buffers)));
        file.file.on('error', reject);
      });

      let uploadErrors = {};

      // upload to server
      const uploadToServer = async () => {
        if (fileProperties.uploadToServer) {
          const filePath = path.join(process.cwd(), 'Images', 'Avatars', file.filename);

          if (fs.existsSync(filePath)) {
            if (fileProperties.uploadServerRewrite) {
              await fs.promises.writeFile(filePath, fileBuffer);
              uploadErrors.errorUploadToServer = false;
              uploadErrors.serverImageUrl = `${req.protocol}://${req.headers.host}/Avatars/${file.filename}`;
            } else {
              uploadErrors.errorUploadToServer = true;
              uploadErrors.serverImageUrl = `${req.protocol}://${req.headers.host}/Avatars/${file.filename}`;
            }
          } else {
            await fs.promises.writeFile(filePath, fileBuffer);
            uploadErrors.errorUploadToServer = false;
            uploadErrors.serverImageUrl = `${req.protocol}://${req.headers.host}/Avatars/${file.filename}`;
          }
        }
      };

      // upload to database
      const uploadToDatabase = async () => {
        if (fileProperties.uploadToDatabase) {
          const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });

          let fileCursor = bucket.find({ filename: file.filename });
          const files = await fileCursor.toArray();

          if (files.length > 0) {
            if (fileProperties.uploadDatabaseRewrite) {
              for (const file of files) {
                await bucket.delete(file._id);
              }

              const uploadStream = bucket.openUploadStream(file.filename);
              const uploadStreamPromise = new Promise((resolve, reject) => {
                uploadStream.on('error', reject);
                uploadStream.on('finish', resolve);
              });

              uploadStream.end(fileBuffer);
              await uploadStreamPromise;

              uploadErrors.errorUploadToDatabase = false;
              uploadErrors.databaseImageUrl = `${req.protocol}://${req.headers.host}/Database/Avatars/${file.filename}`;
            } else {
              uploadErrors.errorUploadToDatabase = true;
              uploadErrors.databaseImageUrl = `${req.protocol}://${req.headers.host}/Database/Avatars/${file.filename}`;
            }
          } else {
            const uploadStream = bucket.openUploadStream(file.filename);
            const uploadStreamPromise = new Promise((resolve, reject) => {
              uploadStream.on('error', reject);
              uploadStream.on('finish', resolve);
            });

            uploadStream.end(fileBuffer);
            await uploadStreamPromise;

            uploadErrors.errorUploadToDatabase = false;
            uploadErrors.databaseImageUrl = `${req.protocol}://${req.headers.host}/Database/Avatars/${file.filename}`;
          }
        }
      };

      await Promise.all([uploadToServer(), uploadToDatabase()]);

      if (Object.keys(uploadErrors).length > 0) {
        return reply.send(uploadErrors);
      }

      return reply.status(200).send({ success: true });

    } catch (err) {
      console.log(err);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/Database/Avatars/:filename', async (req, reply) => {
    async function readStreamToBuffer(stream) {
      return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', err => reject(err));
      });
    }

    const { filename } = req.params;
    const bucket = new mongodb.GridFSBucket(fastify.mongo.db, { bucketName: 'avatars' });

    // let fileCursor = bucket.find({ filename: filename });
    // await fileCursor.toArray().then((files) => {
    //   console.log(files);
    // })

    const downloadStream = bucket.openDownloadStreamByName(filename);

    const buffer = await readStreamToBuffer(downloadStream);
    if (!buffer) {
      console.log('Error reading file');
      return reply.status(400).send({ err: 'Error reading file' });
    }

    // console.log(buffer);
    reply.header('Content-Type', 'image/png').send(buffer);
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