const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git')(path.join(__dirname, '..'));

const configPath = path.join(__dirname, '..', 'package.json');
fs.readFile(configPath, function(err, data) {
  if (err) {
    console.error('error reading config', err);
  } else {
    const json = JSON.parse(data);
    const curVersion = json.version;
    const subVersions = curVersion.split('.').map(i => parseInt(i, 10));
    if (subVersions[2] < 9) {
      subVersions[2]++;
    } else if (subVersions[2] === 9 && subVersions[1] < 9) {
      subVersions[2] = 0;
      subVersions[1]++;
    } else if (subVersions[2] === 9 && subVersions[1] === 9) {
      subVersions[2] = 0;
      subVersions[1] = 0;
      subVersions[0]++;
    }
    const newVersion = subVersions.join('.');
    console.log(curVersion + ' -> ' + newVersion);
    json.version = newVersion;
    const newData = JSON.stringify(json, null, 2) + '\n';
    fs.writeFile(configPath, newData, (writeErr) => {
      if (err) {
        console.error('error updating config', err);
      } else {
        console.log('updated ' + configPath);
      }
    });
  }
});
