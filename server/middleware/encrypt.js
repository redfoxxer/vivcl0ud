const crypto = require('crypto');

// Key must be 32 bytes — loaded from .env as hex string
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Run: node server/utils/setup.js');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a file buffer using AES-256-CBC
 * Returns a single Buffer: [16-byte IV][encrypted data]
 */
function encryptFile(buffer) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  // Prepend IV to the encrypted data so we can decrypt later
  return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypt a file buffer — expects [16-byte IV][encrypted data]
 */
function decryptFile(encryptedBuffer) {
  const key = getKey();
  const iv = encryptedBuffer.slice(0, 16);
  const data = encryptedBuffer.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

module.exports = { encryptFile, decryptFile };
