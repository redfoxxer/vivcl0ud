# ☁️ MyCloud — Complete Step-by-Step Setup Guide

## Prerequisites (install these first)
- Node.js 18+ → https://nodejs.org
- VS Code → https://code.visualstudio.com
- Homebrew → https://brew.sh (for Cloudflare tunnel)

---

## 📁 PART 1 — PROJECT SETUP

### Step 1 · Open VS Code and create the project

1. Open **VS Code**
2. Open **Terminal** in VS Code: menu bar → Terminal → New Terminal
3. Run these commands one by one:

```bash
cd ~/Desktop
mkdir my-cloud
cd my-cloud
code .
```

VS Code will reopen inside your `my-cloud` folder.

---

### Step 2 · Copy all project files

Place each file from the zip into the matching location:

```
my-cloud/
├── package.json                         ← root
├── .env.example                         ← root
├── .gitignore                           ← root
├── server/
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── files.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── encrypt.js
│   └── utils/
│       ├── setup.js
│       └── versioning.js
└── client/
    └── src/
        ├── App.jsx                      ← replace default App.js
        └── pages/
            ├── Login.jsx
            └── Dashboard.jsx
```

---

### Step 3 · Install server dependencies

In the VS Code terminal (make sure you're in `my-cloud/` folder):

```bash
npm install
```

---

### Step 4 · Create the React frontend

In the SAME terminal:

```bash
npx create-react-app client
```

> ⚠️ This takes 2–3 minutes. Wait for it to finish.

Then install the React dependencies:

```bash
cd client
npm install axios react-router-dom
cd ..
```

---

### Step 5 · Replace the default React files

In VS Code's file explorer (left sidebar):

1. Open `client/src/App.js`
2. **Delete all its contents**
3. **Paste the contents of the provided `App.jsx`**
4. Save the file (⌘ + S)

Then:
1. Create folder `client/src/pages/`
2. Copy `Login.jsx` into `client/src/pages/Login.jsx`
3. Copy `Dashboard.jsx` into `client/src/pages/Dashboard.jsx`

---

## 🔐 PART 2 — SECURITY SETUP

### Step 6 · Generate your secret keys

In the VS Code terminal (in `my-cloud/` folder):

```bash
node server/utils/setup.js
```

You'll see:
```
🔐 MyCloud Setup — Generating your secure credentials

Choose a login password for your cloud: █
```

Type a **strong password** and press Enter.

This automatically creates your `.env` file with:
- A hashed version of your password
- A random JWT signing secret
- A random AES-256 encryption key

> ✅ You should now see a `.env` file in your project root.
> ⚠️ NEVER share this file or commit it to Git.

---

## 🚀 PART 3 — RUNNING THE APP

### Step 7 · Start the backend server

Open a **new terminal tab** in VS Code (⌘ + T or click the + icon in the terminal panel).

```bash
cd ~/Desktop/my-cloud
npm run dev
```

You should see:
```
☁️  MyCloud server running at http://localhost:3000
🔐 Auth:  http://localhost:3000/api/auth/login
📁 Files: http://localhost:3000/api/files
```

> If you see "cannot find module bcryptjs" etc., run `npm install` again.

---

### Step 8 · Start the React frontend

Open **another new terminal tab** in VS Code.

```bash
cd ~/Desktop/my-cloud/client
npm start
```

Your browser will open at `http://localhost:3000` automatically.

> The React dev server runs on port 3000 and proxies API calls.
> Add `"proxy": "http://localhost:3001"` to `client/package.json` and change
> your server PORT in `.env` to `3001` to avoid the port conflict.

---

### Step 9 · Log in

1. Go to `http://localhost:3000` in your browser
2. Username: `admin`
3. Password: whatever you chose in Step 6
4. Click Sign In ✅

---

## 🌐 PART 4 — ACCESS FROM ANYWHERE

### Step 10 · Install Cloudflare Tunnel

In a terminal:

```bash
brew install cloudflare/cloudflare/cloudflared
```

---

### Step 11 · Expose your server to the internet (temporary URL)

Make sure your backend is running (Step 7), then in a new terminal:

```bash
cloudflared tunnel --url http://localhost:3001
```

You'll see something like:
```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

Open that URL on **any device** (phone, work computer, etc.) and you'll reach your MyCloud! 🎉

---

### Step 12 · Permanent URL (optional but recommended)

For a permanent address that doesn't change every restart:

1. Create a free Cloudflare account at https://cloudflare.com
2. Run: `cloudflared tunnel login`
3. Run: `cloudflared tunnel create my-cloud`
4. Follow the setup guide at: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

---

## 📋 DAILY USE

To start your cloud each time:

```bash
# Terminal 1 — backend
cd ~/Desktop/my-cloud && npm run dev

# Terminal 2 — tunnel (access from anywhere)
cloudflared tunnel --url http://localhost:3001
```

Or build the React app and serve everything from one port:

```bash
cd ~/Desktop/my-cloud/client && npm run build
cd .. && npm start
cloudflared tunnel --url http://localhost:3001
```

---

## 🆘 TROUBLESHOOTING

| Problem | Fix |
|---|---|
| `Cannot find module 'bcryptjs'` | Run `npm install` in `my-cloud/` |
| `Cannot find module 'axios'` | Run `npm install` in `my-cloud/client/` |
| Port 3000 already in use | Change PORT in `.env` to 3001 |
| Login says "Invalid credentials" | Re-run `node server/utils/setup.js` |
| Files not showing after upload | Check `server/storage/` folder exists |
| Cloudflare URL not working | Make sure backend server is running first |

---

## 🔒 SECURITY NOTES

- Your files are **encrypted on disk** — even if someone accesses your Mac storage, they can't read the files without your key
- Passwords are **hashed with bcrypt** — never stored in plaintext
- All sessions use **JWT tokens** that expire after 7 days
- Cloudflare Tunnel provides **automatic HTTPS** — all traffic is encrypted in transit
- Never share your `.env` file with anyone
