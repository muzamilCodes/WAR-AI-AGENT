# 🤖 WAR AI — Your Personal AI Computer Agent

[![Windows](https://img.shields.io/badge/Windows-10%2F11-0078D6?logo=windows&logoColor=white)](https://microsoft.com/windows)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Security-Sandboxed-emerald)](./docs/SECURITY.md)

**WAR AI** is an autonomous AI computer-control agent designed for Windows. It understands natural voice and chat in **English, Hindi, Urdu, Roman Hindi, Roman Urdu, and Hinglish**, plans and executes multi-step system workflows on your actual Windows computer, **strictly verifies** each action in real-time, and enforces a high-security permission boundary.

---

## 🌟 Key Features

- 🧠 **Multilingual AI Brain**: Seamlessly understands *«VS Code kholo»*, *«Sportify project run karo»*, *«Ab iska terminal kholo»*, *«Screen par kya error hai?»*, *«VS Code کھولو»*, and *«VS Code खोलो»*.
- 🖥️ **Real Windows Automation**: Native application control, multi-root project discovery, controlled PowerShell terminal execution, file & folder manipulation, browser automation, and screen inspection.
- ✅ **Mandatory State Verification Engine**: No fake actions or simulated responses. Every process, window title, filesystem modification, and port binding is verified before saying "Done".
- 🎙️ **Voice System & Instant Interruption**: Hands-free voice control with wake word (*«Hey WAR»*), natural Text-to-Speech, and instant interruption (*«Ruko»*, *«Stop»*, *«Bas»*, *«Cancel»*).
- 🔗 **Context Memory & Pronoun Resolution**: Seamless context continuity between chat and voice (*«Sportify kholo»* ➔ *«Ab iska terminal kholo»*).
- 🛡️ **Security & Permission Gate**: High-risk actions (file deletion, system modifications, dangerous commands) require explicit interactive user confirmation.
- 🌌 **Futuristic Cyberpunk / Sci-Fi UI**: Interactive audio orb visualizer, real-time activity stream, dark glassmorphism styling, and mobile responsiveness.

---

## 📁 Monorepo Structure

```
WAR-AI/
├── frontend/          # Next.js 15 App Router, React 19, TailwindCSS, Voice & Visualizer
├── backend/           # Node.js + Express + WebSocket Hub, Multilingual NLP, Task Planner
├── windows-agent/     # Local Windows Automation Daemon (PowerShell, WMI, Screen, Verifier)
├── shared/            # Shared TypeScript types, schemas (Zod), and security constants
├── docs/              # Comprehensive Documentation (Architecture, Security, API, Tools)
├── .env.example       # Environment variables template
├── package.json       # Root monorepo workspace orchestration
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Launch Development Environment
```bash
npm run dev
```
- **Frontend**: `http://localhost:3000`
- **Backend Hub**: `http://localhost:4000`
- **Windows Agent**: Connected via WebSocket to `ws://localhost:4000/agent`

---

## 📖 Documentation
- [Architecture & Data Flow](./docs/ARCHITECTURE.md)
- [Security Model & Sandboxing](./docs/SECURITY.md)
- [API Reference](./docs/API.md)
- [Windows Tool Reference](./docs/TOOLS.md)
- [Development & Deployment Guide](./docs/DEVELOPMENT.md)

---

## 🔒 Security Notice
WAR AI operates within strict safety parameters. Commands containing destructive patterns (such as disk wiping or administrative registry deletion) are blocked by default. High-risk actions prompt the user with interactive approval dialogs.

---

## 📜 License
MIT © WAR AI Team
