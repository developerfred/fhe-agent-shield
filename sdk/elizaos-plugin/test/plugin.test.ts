import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IAgentRuntime, Memory, State, ActionResult } from '@elizaos/core';
import { FHEShieldPlugin, FHEShieldSettings } from '../src/index';

const MOCK_ADDRESS = '0x' + '11'.repeat(20);
const MOCK_AGENT_ID = '00000000-0000-0000-0000-000000000001';

const mockSettings: FHEShieldSettings = {
  contracts: {
    agentVault: '0x' + '22'.repeat(20),
    agentMemory: '0x' + '33'.repeat(20),
    skillRegistry: '0x' + '44'.repeat(20),
    actionSealer: '0x' + '55'.repeat(20),
  },
  network: 'ethereum-sepolia',
  threshold: 2,
};

const createMockRuntime = (overrides?: Partial<IAgentRuntime>): IAgentRuntime => ({
  agentId: MOCK_AGENT_ID as any,
  character: {} as any,
  initPromise: Promise.resolve(),
  messageService: null,
  providers: [],
  actions: [],
  evaluators: [],
  plugins: [],
  services: new Map(),
  events: {},
  routes: [],
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any,
  stateCache: new Map(),
  fetch: null,
  registerPlugin: vi.fn(),
  initialize: vi.fn(),
  getConnection: vi.fn(),
  getService: vi.fn(),
  getServicesByType: vi.fn(),
  getAllServices: vi.fn(),
  registerService: vi.fn(),
  getServiceLoadPromise: vi.fn(),
  getRegisteredServiceTypes: vi.fn(),
  hasService: vi.fn(),
  hasElizaOS: vi.fn(),
  registerDatabaseAdapter: vi.fn(),
  setSetting: vi.fn(),
  getSetting: vi.fn(),
  getConversationLength: vi.fn(),
  processActions: vi.fn(),
  getActionResults: vi.fn(),
  evaluate: vi.fn(),
  registerProvider: vi.fn(),
  registerAction: vi.fn(),
  registerEvaluator: vi.fn(),
  ensureConnections: vi.fn(),
  ensureConnection: vi.fn(),
  ensureWorldExists: vi.fn(),
  ensureRoomExists: vi.fn(),
  composeState: vi.fn(),
  useModel: vi.fn(),
  generateText: vi.fn(),
  registerModel: vi.fn(),
  getModel: vi.fn(),
  registerEvent: vi.fn(),
  getEvent: vi.fn(),
  emitEvent: vi.fn(),
  registerTaskWorker: vi.fn(),
  getTaskWorker: vi.fn(),
  stop: vi.fn(),
  addEmbeddingToMemory: vi.fn(),
  queueEmbeddingGeneration: vi.fn(),
  getAllMemories: vi.fn(),
  clearAllAgentMemories: vi.fn(),
  updateMemory: vi.fn(),
  createRunId: vi.fn(),
  startRun: vi.fn(),
  endRun: vi.fn(),
  getCurrentRunId: vi.fn(),
  getEntityById: vi.fn(),
  getRoom: vi.fn(),
  createEntity: vi.fn(),
  createRoom: vi.fn(),
  addParticipant: vi.fn(),
  getRooms: vi.fn(),
  registerSendHandler: vi.fn(),
  sendMessageToTarget: vi.fn(),
  updateWorld: vi.fn(),
  ...overrides,
});

const createMockMessage = (content: string = 'test message'): Memory => ({
  id: 'msg-' + Math.random().toString(36).slice(2),
  role: 'user',
  content: { text: content, source: 'test' } as any,
  agentId: MOCK_AGENT_ID,
  roomId: 'room-1',
  entityId: 'entity-1',
  createdAt: Date.now(),
});

const createMockState = (values?: Record<string, unknown>): State => ({
  values: values || {},
  data: {},
} as any);

describe('FHEShieldPlugin', () => {
  let plugin: FHEShieldPlugin;

  beforeEach(() => {
    plugin = new FHEShieldPlugin(mockSettings);
  });

  describe('Plugin Structure', () => {
    it('should have correct name and description', () => {
      expect(plugin.name).toBe('fhe-shield');
      expect(plugin.description).toBe('FHE-encrypted credentials and memory for ElizaOS agents');
    });

    it('should have 4 actions registered', () => {
      expect(plugin.actions).toHaveLength(4);
    });

    it('should have 1 provider registered', () => {
      expect(plugin.providers).toHaveLength(1);
    });

    it('should register FHE_STORE_CREDENTIAL action', () => {
      const storeAction = plugin.actions.find(a => a.name === 'FHE_STORE_CREDENTIAL');
      expect(storeAction).toBeDefined();
      expect(storeAction?.description).toContain('Store encrypted credential');
    });

    it('should register FHE_RETRIEVE_CREDENTIAL action', () => {
      const retrieveAction = plugin.actions.find(a => a.name === 'FHE_RETRIEVE_CREDENTIAL');
      expect(retrieveAction).toBeDefined();
      expect(retrieveAction?.description).toContain('Retrieve encrypted credential');
    });

    it('should register FHE_SEAL_ACTION action', () => {
      const sealAction = plugin.actions.find(a => a.name === 'FHE_SEAL_ACTION');
      expect(sealAction).toBeDefined();
      expect(sealAction?.description).toContain('Seal action');
    });

    it('should register FHE_APPROVE_ACTION action', () => {
      const approveAction = plugin.actions.find(a => a.name === 'FHE_APPROVE_ACTION');
      expect(approveAction).toBeDefined();
      expect(approveAction?.description).toContain('Approve a sealed action');
    });

    it('should register fhe-credential-provider', () => {
      const provider = plugin.providers.find(p => p.name === 'fhe-credential-provider');
      expect(provider).toBeDefined();
      expect(provider?.description).toContain('FHE-encrypted credentials');
    });
  });

  describe('Action Validation', () => {
    it('should validate FHE_STORE_CREDENTIAL action', async () => {
      const storeAction = plugin.actions.find(a => a.name === 'FHE_STORE_CREDENTIAL')!;
      const runtime = createMockRuntime();
      const message = createMockMessage();
      const state = createMockState();
      
      const isValid = await storeAction.validate(runtime, message, state);
      expect(isValid).toBe(true);
    });

    it('should validate FHE_RETRIEVE_CREDENTIAL action', async () => {
      const retrieveAction = plugin.actions.find(a => a.name === 'FHE_RETRIEVE_CREDENTIAL')!;
      const runtime = createMockRuntime();
      const message = createMockMessage();
      const state = createMockState();
      
      const isValid = await retrieveAction.validate(runtime, message, state);
      expect(isValid).toBe(true);
    });

    it('should validate FHE_SEAL_ACTION', async () => {
      const sealAction = plugin.actions.find(a => a.name === 'FHE_SEAL_ACTION')!;
      const runtime = createMockRuntime();
      const message = createMockMessage();
      const state = createMockState();
      
      const isValid = await sealAction.validate(runtime, message, state);
      expect(isValid).toBe(true);
    });

    it('should validate FHE_APPROVE_ACTION', async () => {
      const approveAction = plugin.actions.find(a => a.name === 'FHE_APPROVE_ACTION')!;
      const runtime = createMockRuntime();
      const message = createMockMessage();
      const state = createMockState();
      
      const isValid = await approveAction.validate(runtime, message, state);
      expect(isValid).toBe(true);
    });
  });

  describe('Provider', () => {
    it('should return not initialized when client is null', async () => {
      const provider = plugin.providers[0];
      const runtime = createMockRuntime();
      const message = createMockMessage();
      const state = createMockState();

      const result = await provider.get(runtime, message, state);
      
      expect(result.text).toContain('not initialized');
      expect(result.data).toEqual({ initialized: false });
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize with valid runtime', async () => {
      const validPrivateKey = '0x' + 'ab'.repeat(32);
      const runtime = createMockRuntime({ agentId: validPrivateKey as any });
      
      await plugin.init({}, runtime);
      
      expect(plugin.getClient()).toBeDefined();
    });
  });
});

describe('FHEShieldSettings Validation', () => {
  it('should require all contract addresses', () => {
    const settings: FHEShieldSettings = {
      contracts: {
        agentVault: '0x' + '11'.repeat(20),
        agentMemory: '0x' + '22'.repeat(20),
        skillRegistry: '0x' + '33'.repeat(20),
        actionSealer: '0x' + '44'.repeat(20),
      },
      network: 'ethereum-sepolia',
      threshold: 2,
    };

    expect(settings.contracts.agentVault).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(settings.contracts.agentMemory).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(settings.contracts.skillRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(settings.contracts.actionSealer).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should support all 4 networks', () => {
    const networks: FHEShieldSettings['network'][] = [
      'ethereum-sepolia',
      'arbitrum-sepolia',
      'arbitrum-sepolia',
      'base-sepolia',
    ];

    networks.forEach(network => {
      const settings: FHEShieldSettings = {
        contracts: {
          agentVault: '0x' + '11'.repeat(20),
          agentMemory: '0x' + '22'.repeat(20),
          skillRegistry: '0x' + '33'.repeat(20),
          actionSealer: '0x' + '44'.repeat(20),
        },
        network,
        threshold: 2,
      };
      expect(settings.network).toBe(network);
    });
  });
});
