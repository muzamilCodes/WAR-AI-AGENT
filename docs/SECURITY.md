# WAR AI — Security Architecture & Guidelines

## 1. Security Philosophy
The AI model has **zero direct, unrestricted access** to system shells or administrative functions. Every operation passes through a strict multi-layer security gateway:

```
User Prompt
    ↓
Intent & Entity Validation
    ↓
Tool Argument Schema Check (Zod)
    ↓
Risk Tiering & Blacklist Check
    ↓
Permission Gate (Interactive Confirmation for High-Risk)
    ↓
Local Windows Agent Execution
    ↓
Verification Engine
```

---

## 2. Risk Tiers

| Risk Level | Description | Confirmation Required? | Examples |
|------------|-------------|------------------------|----------|
| `LOW` | Read-only operations, searches, opening applications/files | No (Auto-executed) | `open_application`, `read_file`, `project_discovery`, `take_screenshot` |
| `MEDIUM` | Non-destructive edits, safe commands, benign navigation | Configurable | `create_file`, `edit_file`, `type_text`, `open_terminal` |
| `HIGH` | Destructive operations, process termination, arbitrary commands | **YES (Mandatory)** | `delete_file`, `stop_process`, `execute_command` (with dangerous flags) |
| `CRITICAL` | System-level disk wipe, administrative registry tampering | **BLOCKED (Forbidden)** | `format C:`, `rmdir /s /q C:\`, `reg delete` |

---

## 3. Blacklisted Commands
The following patterns are immediately blocked by the `AgentSecurity` sandbox:
- `format [a-z]:`
- `del /f /s /q c:\`
- `rmdir /s /q c:\`
- `reg delete`
- `diskpart`
- `shutdown /s`
- `rm -rf /`

---

## 4. Audit Logging & Redaction
- All tool executions are logged with timestamps, target parameters, and execution outcomes.
- Sensitive arguments containing `password`, `token`, `secret`, `key`, `apikey`, or `auth` are automatically redacted as `******** [REDACTED]`.
