/**
 * FHE-Agent Shield Moltworker
 * 
 * Cloudflare Worker that provides FHE proxy for Moltbot/OpenClaw.
 * Routes FHE requests through Cloudflare edge network.
 */

import { Hono } from 'hono';
import type { Env } from './types.js';
import { FHEProxy } from './fhe-proxy.js';
import { FHECredentialStore } from './credentials.js';

const app = new Hono<{ Bindings: Env }>();

/**
 * Health check endpoint
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'fhe-agent-shield-moltworker',
    version: '0.1.0',
    network: c.env.COFHE_NETWORK,
  });
});

/**
 * FHE Credential Store endpoint
 * POST /credentials - Store FHE encrypted credential
 * GET /credentials/:id - Retrieve credential with threshold
 */
app.post('/credentials', async (c) => {
  const body = await c.req.json<{
    key: string;
    value: string;
    threshold?: number;
  }>();

  const store = new FHECredentialStore({
    network: c.env.COFHE_NETWORK as 'sepolia' | 'arbitrum-sepolia',
    contractAddress: c.env.FHE_CONTRACT_ADDRESS,
    kv: c.env.CREDENTIAL_KV,
  });

  const id = await store.store(body.key, body.value, body.threshold || 2);
  return c.json({ id, success: true });
});

app.get('/credentials/:id', async (c) => {
  const id = c.req.param('id');
  const permits = parseInt(c.req.query('permits') || '2', 10);

  const store = new FHECredentialStore({
    network: c.env.COFHE_NETWORK as 'sepolia' | 'arbitrum-sepolia',
    contractAddress: c.env.FHE_CONTRACT_ADDRESS,
    kv: c.env.CREDENTIAL_KV,
  });

  const value = await store.retrieve(id, permits);
  return c.json({ value, success: true });
});

/**
 * FHE Proxy endpoint - routes to Fhenix CoFHE
 */
app.post('/fhe/:action', async (c) => {
  const action = c.req.param('action');
  const body = await c.req.json();
  const proxy = new FHEProxy({
    network: c.env.COFHE_NETWORK as 'sepolia' | 'arbitrum-sepolia',
    rpcUrl: c.env.COFHE_NETWORK === 'sepolia' ? 'https://rpc.sepolia.org' : 'https://sepolia-rollup.arbitrum.io/rpc',
    contractAddress: c.env.FHE_CONTRACT_ADDRESS,
  });

  const result = await proxy.route(action, body);
  return c.json(result);
});

/**
 * WebSocket upgrade for Moltbot real-time communication
 */
app.get('/ws', (c) => {
  // WebSocket handling would be implemented here
  // For now, return error indicating WebSocket is not supported
  return c.json({ error: 'WebSocket not implemented in this version' }, 501);
});

/**
 * Admin endpoint for credentials management
 */
app.get('/admin/credentials', async (c) => {
  const store = new FHECredentialStore({
    network: c.env.COFHE_NETWORK as 'sepolia' | 'arbitrum-sepolia',
    contractAddress: c.env.FHE_CONTRACT_ADDRESS,
    kv: c.env.CREDENTIAL_KV,
  });

  const list = await store.list();
  return c.json({ credentials: list });
});

export default app;
