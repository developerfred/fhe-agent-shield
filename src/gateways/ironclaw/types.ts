/**
 * Types for IronClaw/ZeroClaw Gateway
 */

export interface Skill {
  name: string;
  description: string;
  parameters: string[];
  execute: (input: unknown) => Promise<unknown>;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  skills: Skill[];
  tools: Tool[];
}
