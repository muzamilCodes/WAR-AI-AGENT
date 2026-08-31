# WAR AI — System Architecture

## Overview
**WAR AI** is an autonomous AI computer control agent designed for Windows. It operates with a hybrid, sandboxed architecture that combines high-level AI reasoning with low-level, verified Windows automation.

```
                            USER
                     (Voice / Chat UI)
                            │
                            ▼
                ┌────────────────────────┐
                │   WAR AI Frontend      │  (Next.js 15, React 19, Tailwind)
                │   Audio Orb Visualizer │  (Canvas 60fps, Web Speech STT/TTS)
                └───────────┬────────────┘
                            │ (WebSocket + REST)
                            ▼
                ┌────────────────────────┐
                │   WAR AI Backend Hub   │  (Node.js / Express / WS Hub)
                │   • Multilingual NLP   │  (Hindi / Urdu / Hinglish / English)
                │   • Context Memory     │  (Pronouns: "iska", "usko")
                │   • Task Planner       │  (Multi-step sequential plans)
                │   • Permission Gate    │  (Tiered Security & Confirmations)
                │   • Audit Logger       │  (Redacted Security Logs)
                └───────────┬────────────┘
                            │ (Secure Realtime WS Channel)
                            ▼
                ┌────────────────────────┐
                │  Local Windows Agent   │  (Windows Host Daemon)
                │   • App Controller     │  (WMI / Process / Registry / Focus)
                │   • VS Code Engine     │  (Multi-path detection & workspace)
                │   • Project Discovery  │  (Multi-root deep scanner)
                │   • Terminal Engine    │  (Controlled PowerShell runner)
                │   • Browser Control    │  (Navigation / Search)
                │   • Keyboard / Mouse   │  (Native User32 & SendKeys)
                │   • Screen & OCR       │  (System.Drawing screenshot)
                │   • State Verifier     │  (Process / Window / Port / File)
                └───────────┬────────────┘
                            │
                            ▼
                     Actual Windows OS
```

---

## 1. Frontend Layer
- **Tech Stack**: Next.js 15 App Router, React 19, TypeScript, TailwindCSS.
- **Audio Orb Visualizer**: Reacts in real-time to agent states (`idle`, `listening`, `thinking`, `planning`, `executing`, `speaking`).
- **Live Activity Stream**: Tree-based step tracker displaying progress and verified state badges.
- **Voice System**: Web Speech API speech-to-text with auto-language detection, SpeechSynthesis TTS, wake word («Hey WAR»), and instant interruption («Ruko», «Stop», «Bas», «Cancel»).

---

## 2. Backend Orchestration Layer
- **Multilingual NLP Engine**: Normalizes variations across Hindi, Urdu, Roman Hindi/Urdu, Hinglish, and English into unified structured intents.
- **Context Memory Manager**: Maintains short-term conversational context (`currentProject`, `currentApplication`, `currentTerminalDirectory`) and resolves pronouns (`"iska"`, `"usko"`, `"ye wala"`).
- **Task Planner**: Decomposes complex compound requests into sequential tool steps.
- **Permission Manager**: Classifies risk levels (`LOW`, `MEDIUM`, `HIGH`) and requests interactive confirmation when needed.
- **Audit Logger**: Stores full action audit trails with automatic credential redaction.

---

## 3. Local Windows Agent
- **Standalone Daemon**: Connects directly to the backend over WebSocket.
- **Pure Native Automation**: Uses PowerShell, Windows API (`user32.dll`), and .NET assemblies without requiring unstable external C++ dependencies.
- **Mandatory State Verification Engine**: Verifies that processes are active, window titles match, files exist, or ports are open before returning success.
