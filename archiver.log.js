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

    output.on('close', () => {
        console.log('archive created')
    })
    await archive.finalize();

    for(let i = 1; i <= maxFiles; i++) {
        const filePath = path.join(logDir, `${name}.${i}.log`);
        if(fsSync.existsSync(filePath)) {
            fs.unlink(filePath)
        }
    }

    return archivePath;
}

module.exports = archiveLogs;