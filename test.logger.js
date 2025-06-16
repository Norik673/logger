const MyLogger = require('./logger');
const logger = new MyLogger('app', 150, 3, 'production');

// (async () => {
//     for (let i = 0; i < 5; i++) {
//         logger.info(`This is log message number ${i}`);
//     }
// })();
logger.info(`This is log message number`);
logger.info(`This is log message number`);
logger.info(`This is log message number`);
logger.info(`This is log message number`);
// logger.log('this is log');
// logger.warn('this is warn');
// logger.error('this is error');