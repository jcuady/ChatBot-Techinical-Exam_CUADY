/**
 * DCBSD Chatbot Simulation — Application Entry Point
 *
 * This is the main server that hosts the chatbot agent.
 * It serves both the bot API endpoint and the web client UI.
 *
 * Architecture:
 *   Browser (Web Client) → Express Server → Agent Handler → Conversation Flow
 */

import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import { loadConfig } from './config/environment';
import { onMessageActivity, onConversationUpdate, ActivityContext } from './agents/chatbot';
import { handleMessage, BotResponse } from './conversation/flow';
import { PROMPTS } from './conversation/prompts';

// Load environment variables before anything else
dotenv.config();

const config = loadConfig();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve the web client from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * Bot messaging endpoint — compatible with Bot Framework Emulator
 * and Microsoft Agents SDK messaging protocol.
 *
 * POST /api/messages
 */
app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const activity = req.body;

    if (!activity || typeof activity !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const responses: { type: string; text?: string; attachments?: unknown[] }[] = [];

    // Create a context that collects responses
    const context: ActivityContext = {
      activity,
      sendActivity: async (message) => {
        if (typeof message === 'string') {
          responses.push({ type: 'message', text: message });
        } else {
          responses.push(message);
        }
      },
    };

    if (activity.type === 'message') {
      await onMessageActivity(context);
    } else if (activity.type === 'conversationUpdate') {
      await onConversationUpdate(context);
    }

    res.status(200).json({ responses });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] request_error: ${errorMessage}`);
    // Safe error response — no internals exposed
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * REST API endpoint for the custom web client.
 * Simpler interface than the full Bot Framework protocol.
 *
 * POST /api/chat
 * Body: { "conversationId": "...", "text": "..." }
 */
app.post('/api/chat', (req: Request, res: Response) => {
  try {
    const { conversationId, text } = req.body as { conversationId?: string; text?: string };

    if (!conversationId || typeof conversationId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid conversationId' });
      return;
    }

    if (text === undefined || text === null) {
      res.status(400).json({ error: 'Missing text field' });
      return;
    }

    const responses: BotResponse[] = handleMessage(conversationId, String(text));
    res.status(200).json({ responses });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] chat_error: ${errorMessage}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Initialize a new conversation and get the welcome messages.
 *
 * POST /api/chat/start
 * Body: { "conversationId": "..." }
 */
app.post('/api/chat/start', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body as { conversationId?: string };

    if (!conversationId || typeof conversationId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid conversationId' });
      return;
    }

    const responses = PROMPTS.WELCOME.map(text => ({ text }));
    res.status(200).json({ responses });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] chat_start_error: ${errorMessage}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the server (only when not running inside Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.warn(`
========================================
  DCBSD Chatbot Simulation
========================================
  Environment:  ${config.nodeEnv}
  Port:         ${config.port}
  Web Client:   http://localhost:${config.port}
  Bot Endpoint: http://localhost:${config.port}/api/messages
  Chat API:     http://localhost:${config.port}/api/chat
  Health:       http://localhost:${config.port}/api/health
========================================
`);
  });
}

export default app;
