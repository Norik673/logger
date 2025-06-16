const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const archiver = require('archiver');

async function archiveLogs(logDir, name, maxFiles) {
    const archiveDir = path.join(__dirname, 'archive');
    await fs.mkdir(archiveDir, {recursive: true});

    const archivePath = path.join(archiveDir, `${name}-${Date.now()}.zip`);
    const output = fsSync.createWriteStream(archivePath);
    const archive = archiver('zip', {zlib: {level: 9}});

    archive.pipe(output);
    
    for(let i = 1; i <= maxFiles; i++) {
        const filePath = path.join(logDir, `${name}.${i}.log`);
        if(fsSync.existsSync(filePath)) {
            archive.file(filePath, {name: `${name}.${i}.log`});
        }
    }

    await new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log('archive created')
            resolve();
        });
        output.on('error', reject);
        archive.finalize();
    });
    
    await archive.finalize();

    for(let i = 1; i <= maxFiles; i++) {
        const filePath = path.join(logDir, `${name}.${i}.log`);
        if(fsSync.existsSync(filePath)) {
            fs.unlink(filePath)
        }
    }

    return archivePath;
}

if (require.main === module) {
    const logDir = process.argv[2];
    const name = process.argv[3];
    const maxFiles = parseInt(process.argv[4], 10);

    archiveLogs(logDir, name, maxFiles)
    .then(() => {
        console.log('archiver run as child process');
        process.exit(0);
    })
    .catch((err) => {
        console.error('error throw child process', err);
        process.exit(1);
    });
}

module.exports = archiveLogs;