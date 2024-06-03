const fs = require("fs");
const path = require('path');
const chalk = require("chalk");

function DataTime() {
   const DT = new Date();
   const DataTime = `${DT.getHours() % 12 ? (DT.getHours() % 12).toString().padStart(2, '0') : 12}:${DT.getMinutes().toString().padStart(2, '0')}:${DT.getSeconds().toString().padStart(2, '0')}:${Math.round(DT.getMilliseconds() / 10).toString().padStart(2, '0')} ${DT.getHours() > 12 ? 'PM' : 'AM'}  ${(DT.getMonth() + 1).toString().padStart(2, '0')}/${DT.getDate()}/${DT.getFullYear().toString().slice(-2).padStart(2, '0')}`;
   return DataTime
}

const Logger = {
   Server: {
      Ok: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgCyanBright(' Server ') + chalk.bold.whiteBright.bgGreenBright(' Ok ') + chalk.bold.greenBright(' > ' + str))
         log('[' + currentTime + ']' + ' Server[Ok]>     ' + str)
      },
      Err: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgCyanBright(' Server ') + chalk.bold.whiteBright.bgRedBright(' Err ') + chalk.bold.redBright(' > ' + str))
         log('[' + currentTime + ']' + ' Server[Err]>    ' + str)
      },
      Warn: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgCyanBright(' Server ') + chalk.bold.whiteBright.bgYellowBright(' Warn ') + chalk.bold.yellowBright(' > ' + str))
         log('[' + currentTime + ']' + ' Server[Warn]>   ' + str)
      },
      Info: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgCyanBright(' Server ') + chalk.bold.whiteBright.bgBlueBright(' Info ') + chalk.bold.blueBright(' > ' + str))
         log('[' + currentTime + ']' + ' Server[Info]>   ' + str)
      },
      Deb: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgCyanBright(' Server ') + chalk.bold.whiteBright.bgMagentaBright(' Deb ') + chalk.bold.magentaBright(' > ' + str))
         log('[' + currentTime + ']' + ' Server[Deb]>    ' + str)
      }
   },
   Database: {
      Ok: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgBlackBright(' Database ') + chalk.bold.whiteBright.bgGreenBright(' Ok ') + chalk.bold.greenBright(' > ' + str))
         log('[' + currentTime + ']' + ' Database[Ok]>   ' + str)
      },
      Err: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + DataTime() + '] ') + chalk.bold.whiteBright.bgBlackBright(' Database ') + chalk.bold.whiteBright.bgRedBright(' Err ') + chalk.bold.redBright(' > ' + str))
         log('[' + DataTime + ']' + ' Database[Err]>  ' + str)
      },
      Warn: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgBlackBright(' Database ') + chalk.bold.whiteBright.bgYellowBright(' Warn ') + chalk.bold.yellowBright(' > ' + str))
         log('[' + currentTime + ']' + ' Database[Warn]> ' + str)
      },
      Info: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgBlackBright(' Database ') + chalk.bold.whiteBright.bgBlueBright(' Info ') + chalk.bold.blueBright(' > ' + str))
         log('[' + currentTime + ']' + ' Database [Info]> ' + str)
      },
      Deb: (str) => {
         const currentTime = DataTime()
         console.log(chalk.white('[' + currentTime + '] ') + chalk.bold.whiteBright.bgBlackBright(' Database ') + chalk.bold.whiteBright.bgMagentaBright(' Deb ') + chalk.bold.magentaBright(' > ' + str))
         log('[' + currentTime + ']' + ' Database[Deb]>  ' + str)
      }
   },
   Title: (str) => {
      const currentTime = DataTime()
      console.log(chalk.whiteBright('[' + currentTime + '] ') + chalk.whiteBright.bgBlack('< = = = = = [ ' + str + ' ] = = = = = > '))
      log('[' + currentTime + '] < = = = = = [ ' + str + ' ] = = = = = > ')
   }
}

const log = (message) => {
   const date = new Date();
   const formattedDate = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear().toString().slice(-2)}`; // Месяц-Число-Год
   const logFileName = `log_${formattedDate}.txt`; // log_Месяц-Число-Год.txt

   const logsDir = path.join(process.cwd(), 'Logs');
   if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
   }

   fs.open(`${process.cwd()}/Logs/${logFileName}`, 'a', (err, fd) => {
      if (err) throw err;
      fs.appendFile(fd, message + '\n', (err) => {
         if (err) throw err;
         fs.close(fd, (err) => {
            if (err) throw err;
         });
      });
   });
};

module.exports = Logger