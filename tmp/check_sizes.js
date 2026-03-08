const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, files);
        } else if (fullPath.endsWith('.js')) {
            files.push({ path: fullPath, size: fs.statSync(fullPath).size });
        }
    }
    return files;
}

const all = getFiles(path.join(__dirname, '../src'));
const empty = all.filter(f => f.size === 0).map(f => f.path.replace(__dirname + '\\..\\', ''));
const short = all.filter(f => f.size > 0 && f.size < 300).map(f => ({ file: f.path.replace(__dirname + '\\..\\', ''), size: f.size }));

console.log(JSON.stringify({ empty, short }, null, 2));
