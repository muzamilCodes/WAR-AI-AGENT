import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/apiRoutes';
import { WSHub } from './services/wsHub';

// Load environment configuration
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (_req, res) => {
  res.send({
    name: '🤖 WAR AI Backend Engine',
    tagline: 'Your Personal AI Computer Agent',
    version: '1.0.0',
    status: 'ONLINE'
  });
});

const server = http.createServer(app);

// Attach Realtime WebSocket Hub
new WSHub(server);

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🤖 WAR AI Backend Engine running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Hub active on ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});
