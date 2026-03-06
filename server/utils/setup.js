/**
 * SETUP SCRIPT
 * Run once: node server/utils/setup.js
 * Follow the prompts to generate your .env file
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\n🔐 viviCL0UD Setup — Generating your secure credentials\n');

rl.question('Choose a login password for your cloud: ', async (password) => {
  console.log('\n⏳ Hashing password...');
  const passwordHash = await bcrypt.hash(password, 12);
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const encryptionKey = crypto.randomBytes(32).toString('hex');

  const envContent = `JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}
PASSWORD_HASH=${passwordHash}
PORT=3000
`;

  const envPath = path.join(__dirname, '../../.env');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env file created successfully!');
  console.log('📁 Saved to:', envPath);
  console.log('\n⚠️  NEVER share or commit your .env file.\n');
  rl.close();
});
