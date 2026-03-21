/**
 * @title OpenClaw Integration Types
 * @notice Type definitions for OpenClaw + FHE integration
 */

export interface Skill {
  id: string;
  name: string;
  execute: (context: SkillExecutionContext) => Promise<unknown>;
}

export interface SkillExecutionContext {
  input: unknown;
  agentId: string;
  skillId: string;
  metadata?: Record<string, unknown>;
}

export interface EncryptedSkillResult {
  output: unknown;
  encryptedOutput: string;
  proof: string;
}

export interface Agent {
  id: string;
  owner: string;
  context: EncryptedChunk[];
  createdAt: number;
}

export interface EncryptedChunk {
  data: string;
  index: number;
  timestamp: number;
}

export interface MemoryContext {
  agentId: string;
  context: EncryptedChunk[];
  length: number;
}
