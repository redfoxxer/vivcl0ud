const fs = require('fs');
const path = require('path');
const MAX_VERSIONS = 10;

function saveVersion(filename, encryptedBuffer, versionsDir) {
  const versionDir = path.join(versionsDir, filename);
  fs.mkdirSync(versionDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(versionDir, `${timestamp}.enc`), encryptedBuffer);

  const versions = fs.readdirSync(versionDir).sort();
  if (versions.length > MAX_VERSIONS) {
    versions.slice(0, versions.length - MAX_VERSIONS)
      .forEach(v => fs.unlinkSync(path.join(versionDir, v)));
  }
}

function listVersions(filename, versionsDir) {
  const versionDir = path.join(versionsDir, filename);
  if (!fs.existsSync(versionDir)) return [];
  return fs.readdirSync(versionDir).sort().reverse().map(v => ({
    name: v,
    path: path.join(versionDir, v)
  }));
}

function getVersion(filename, versionName, versionsDir) {
  const versionPath = path.join(versionsDir, filename, versionName);
  if (!fs.existsSync(versionPath)) throw new Error('Version not found');
  return fs.readFileSync(versionPath);
}

module.exports = { saveVersion, listVersions, getVersion };