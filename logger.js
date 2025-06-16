const fs = require('fs/promises');
const path = require('path');
const archiveLogs = require('./archiver.log');
const {fork} = require('child_process');

class MyLogger {
    constructor(name, fileSize = 1024 * 1024, maxFiles = 5, env = 'development') {
        this.name = name;
        this.fileSize = fileSize;
        this.maxFiles = maxFiles;
        this.env = env;
        this.logDir = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logDir, `${this.name}.1.log`);
        this.quer = Promise.resolve();
    }

    async init() {
        try {
            await fs.mkdir(this.logDir, {recursive: true});
        } catch(err) {
            console.error('Error throw make file:', err);
        }
    }

    async _handleLog(type, message) {
        return new Promise(async (resolve, reject) => {
            const fullMessage = `[${type}] ${message}\n`;

            await this.init();

            if(this.env === 'development') {
                console.log(fullMessage.trim());
                resolve();
            } else if(this.env === 'production') {
                try { 
                    let stat = null;
                    try {
                        stat = await fs.stat(this.logFile);
                    } catch(_) {}

                    const newLogSize = Buffer.byteLength(fullMessage, 'utf8');
                    if(stat && (stat.size + newLogSize > this.fileSize)) {
                        await this._rotateLogsIfNeeded();
                        resolve();
                        console.log('rotated');
                    }
                    await fs.appendFile(this.logFile, fullMessage, 'utf8');
                    console.log('appended');
                    resolve();
                } catch(err) {
                    console.error('Error throw log:', err);
                    reject(err)
                }
            }
        })
    }

    async _rotateLogsIfNeeded() {
        try {
            for(let i = this.maxFiles; i >= 1; i--) {
                console.log(i)
                const src = path.join(this.logDir, `${this.name}.${i}.log`);
                const dest = path.join(this.logDir, `${this.name}.${i + 1}.log`);
                
                try {
                    await fs.access(src);
                    if(i + 1 > this.maxFiles) {
                        //await archiveLogs(this.logDir, this.name, this.maxFiles)
                        await new Promise((resolve, reject) => { 
                            const child = fork(path.join(__dirname, 'archiver.log.js'), [
                                this.logDir,
                                this.name,
                                this.maxFiles.toString()
                            ]);

                            child.on('close', (code) => {
                                if(code === 0) {
                                    console.log('archiver is finished in child process');
                                    resolve();
                                } else {
                                    reject(new Error(`archiver is finished with ${code}`));
                                }
                            });

                            child.on('error', (err) => {
                                reject(err);
                            });
                        });
                        break; 
                    } else {
                        console.log('true');
                        await fs.rename(src, dest);
                        console.log('finish');
                    }
                } catch(_) {}
            }
            try {
                await fs.access(this.logFile);
                await fs.rename(this.logFile, path.join(this.logDir, `${this.name}.1.log`));
            } catch(_) {}
            
        } catch(err) {
            console.error('Error throw changing:', err);
        }
    }
    
    async info(message) {
        this.quer = this.quer.then(() => this._handleLog('INFO', message));
    }

    async log(message) {
        this.quer = this.quer.then(() => this._handleLog('LOG', message));
    }

    async warn(message) {
        this.quer = this.quer.then(() => this._handleLog('WARN', message));
    }

    async error(message) {
        this.quer = this.quer.then(() => this._handleLog('ERROR', message));
    }
}

module.exports = MyLogger;