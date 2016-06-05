const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git')(path.join(__dirname, '..'));

const configPath = path.join(__dirname, '..', 'package.json');

function makeGitTag(version) {
  simpleGit.add(configPath).
      commit('Bump version to ' + version).
      push('origin', 'master').
      addTag(version).
      pushTags('origin');
}

function getNextVersion(curVersion) {
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
  return subVersions.join('.');
}

function bumpVersion(data) {
  const json = JSON.parse(data);
  const curVersion = json.version;
  const newVersion = getNextVersion(curVersion);
  console.log(curVersion + ' -> ' + newVersion);
  json.version = newVersion;
  const newConfig = JSON.stringify(json, null, 2) + '\n';
  fs.writeFile(configPath, newConfig, (writeErr) => {
    if (writeErr) {
      console.error('error updating config', writeErr);
    } else {
      makeGitTag(newVersion);
    }
  });
}

fs.readFile(configPath, function(err, data) {
  if (err) {
    console.error('error reading config', err);
  } else {
    bumpVersion(data);
  }
});
