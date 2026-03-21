import type {
  SealedAction,
  ReleaseCondition,
  Permit,
  TransactionResult,
  address,
  bytes32,
} from '../utils/types';
import { getFHEClient, type FHEClient } from './useFHEClient';

export interface UseSealedActionReturn {
  sealAction: (
    agentId: address,
    encryptedPayload: string,
    threshold: bigint,
    timeout: bigint
  ) => Promise<address>;
  registerCondition: (
    actionId: address,
    threshold: bigint,
    timeout: bigint
  ) => Promise<TransactionResult>;
  approveRelease: (actionId: address) => Promise<TransactionResult>;
  releaseAction: (actionId: address, permit: Permit) => Promise<TransactionResult>;
  cancelAction: (actionId: address) => Promise<TransactionResult>;
  getStatus: (actionId: address) => Promise<SealedAction | null>;
  getCondition: (actionId: address) => Promise<ReleaseCondition | null>;
  isReleased: (actionId: address) => Promise<boolean>;
  hasApproved: (actionId: address, approver: address) => Promise<boolean>;
}

export function useSealedAction(): UseSealedActionReturn {
  const client = getFHEClient();

  async function sealAction(
    agentId: address,
    encryptedPayload: string,
    threshold: bigint,
    timeout: bigint
  ): Promise<address> {
    const actionId = await client.callContract('sealAction', {
      agentId,
      encryptedPayload,
    });
    if (threshold > 0n || timeout > 0n) {
      await client.callContract('registerReleaseCondition', {
        actionId,
        threshold,
        timeout,
      });
    }
    return actionId as address;
  }

  async function registerCondition(
    actionId: address,
    threshold: bigint,
    timeout: bigint
  ): Promise<TransactionResult> {
    const tx = await client.callContract('registerReleaseCondition', {
      actionId,
      threshold,
      timeout,
    });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function approveRelease(actionId: address): Promise<TransactionResult> {
    const tx = await client.callContract('approveRelease', { actionId });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function releaseAction(actionId: address, _permit: Permit): Promise<TransactionResult> {
    const tx = await client.callContract('releaseAction', { actionId });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function cancelAction(actionId: address): Promise<TransactionResult> {
    const tx = await client.callContract('cancelAction', { actionId });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function getStatus(actionId: address): Promise<SealedAction | null> {
    try {
      const result = await client.callContract('getActionStatus', { actionId });
      return result as SealedAction;
    } catch {
      return null;
    }
  }

  async function getCondition(actionId: address): Promise<ReleaseCondition | null> {
    try {
      const result = await client.callContract('getReleaseCondition', { actionId });
      return result as ReleaseCondition;
    } catch {
      return null;
    }
  }

  async function isReleased(actionId: address): Promise<boolean> {
    const status = await getStatus(actionId);
    return status?.status === 'Released';
  }

  async function hasApproved(actionId: address, approver: address): Promise<boolean> {
    const condition = await getCondition(actionId);
    if (!condition) return false;
    return condition.approvals.some((a) => a === approver);
  }

  return {
    sealAction,
    registerCondition,
    approveRelease,
    releaseAction,
    cancelAction,
    getStatus,
    getCondition,
    isReleased,
    hasApproved,
  };
}
