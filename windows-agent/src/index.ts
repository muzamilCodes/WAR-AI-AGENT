import dotenv from 'dotenv';
import path from 'path';
import { AgentWSClient } from './communication/wsClient';

// Load .env from root or agent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const AGENT_NAME = process.env.AGENT_NAME || 'WAR-Windows-PC';
const AGENT_WS_URL = process.env.AGENT_WS_URL || 'ws://localhost:4000/agent';
const AGENT_PAIRING_TOKEN = process.env.AGENT_PAIRING_TOKEN || '';

console.log(`=======================================================`);
console.log(`🤖 WAR AI — Local Windows Automation Agent v1.0.0`);
console.log(`=======================================================`);
console.log(`💻 Device Name: ${AGENT_NAME}`);
console.log(`🔗 Target Hub : ${AGENT_WS_URL}`);
console.log(`🛡️  Security   : Active (Sandboxing & Risk Management)`);
console.log(`=======================================================\n`);

const client = new AgentWSClient(AGENT_WS_URL, AGENT_PAIRING_TOKEN, AGENT_NAME);
client.start();

process.on('SIGINT', () => {
  console.log('\n[WAR Windows Agent] Shutting down gracefully...');
  client.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  client.stop();
  process.exit(0);
});
