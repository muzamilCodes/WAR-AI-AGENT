# WAR AI — API Documentation

## REST Endpoints

### 1. Send Message / Command
- **Endpoint**: `POST /api/chat`
- **Request Body**:
```json
{
  "text": "Hey WAR, VS Code kholo aur Sportify project run karo",
  "isVoice": false,
  "language": "hinglish"
}
```
- **Response**:
```json
{
  "success": true,
  "message": {
    "id": "msg_1717200000000",
    "sender": "agent",
    "text": "Done boss ✅ Sportify project VS Code mein open ho gaya.",
    "timestamp": 1717200000000,
    "language": "hinglish"
  },
  "plan": {
    "id": "plan_123",
    "summary": "Multi-step execution...",
    "steps": [ ... ]
  }
}
```

---

### 2. Connected Devices
- **Endpoint**: `GET /api/devices`
- **Response**: List of connected and paired Windows agents.

---

### 3. Generate Pairing Code
- **Endpoint**: `POST /api/pair`
- **Response**:
```json
{
  "success": true,
  "code": "849201",
  "token": "pair_tok_xyz123",
  "expiresAt": 1717200600000
}
```

---

### 4. Confirm High-Risk Action
- **Endpoint**: `POST /api/confirm`
- **Request Body**:
```json
{
  "actionRequest": { ... },
  "approved": true,
  "planId": "plan_123"
}
```

---

### 5. Audit Logs
- **Endpoint**: `GET /api/audit`
- **Response**: Returns the most recent 100 security audit log entries.

---

### 6. Context Memory
- **Endpoint**: `GET /api/context`
- **Response**: Current short-term context memory (`currentProject`, `currentApplication`, `recentProjects`).
