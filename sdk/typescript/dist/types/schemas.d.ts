import { z } from 'zod';
export declare const NetworkNameSchema: z.ZodEnum<["fhenix-helium", "fhenix-nitrogen", "arbitrum-sepolia", "base-sepolia"]>;
export declare const NetworkConfigSchema: z.ZodObject<{
    name: z.ZodEnum<["fhenix-helium", "fhenix-nitrogen", "arbitrum-sepolia", "base-sepolia"]>;
    rpcUrl: z.ZodString;
    chainId: z.ZodNumber;
    explorerUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia";
    chainId?: number;
    rpcUrl?: string;
    explorerUrl?: string;
}, {
    name?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia";
    chainId?: number;
    rpcUrl?: string;
    explorerUrl?: string;
}>;
export declare const ContractAddressesSchema: z.ZodObject<{
    agentVault: z.ZodString;
    agentMemory: z.ZodString;
    skillRegistry: z.ZodString;
    actionSealer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agentVault?: string;
    agentMemory?: string;
    skillRegistry?: string;
    actionSealer?: string;
}, {
    agentVault?: string;
    agentMemory?: string;
    skillRegistry?: string;
    actionSealer?: string;
}>;
export declare const CredentialResultSchema: z.ZodObject<{
    handle: z.ZodString;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    handle?: string;
    success?: boolean;
}, {
    handle?: string;
    success?: boolean;
}>;
export declare const CredentialEntrySchema: z.ZodObject<{
    key: z.ZodString;
    handle: z.ZodString;
    threshold: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    key?: string;
    handle?: string;
    threshold?: number;
}, {
    key?: string;
    handle?: string;
    threshold?: number;
}>;
export declare const ActionResultSchema: z.ZodObject<{
    actionId: z.ZodString;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    actionId?: string;
    success?: boolean;
}, {
    actionId?: string;
    success?: boolean;
}>;
export declare const ActionStatusSchema: z.ZodObject<{
    status: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
    statusText: z.ZodEnum<["Sealed", "Approved", "Released", "Cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status?: 0 | 1 | 2 | 3;
    statusText?: "Sealed" | "Approved" | "Released" | "Cancelled";
}, {
    status?: 0 | 1 | 2 | 3;
    statusText?: "Sealed" | "Approved" | "Released" | "Cancelled";
}>;
export declare const ContextResultSchema: z.ZodObject<{
    length: z.ZodBigInt;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    length?: bigint;
    success?: boolean;
}, {
    length?: bigint;
    success?: boolean;
}>;
export declare const FHEAgentShieldConfigSchema: z.ZodObject<{
    network: z.ZodUnion<[z.ZodEnum<["fhenix-helium", "fhenix-nitrogen", "arbitrum-sepolia", "base-sepolia"]>, z.ZodObject<{
        name: z.ZodEnum<["fhenix-helium", "fhenix-nitrogen", "arbitrum-sepolia", "base-sepolia"]>;
        rpcUrl: z.ZodString;
        chainId: z.ZodNumber;
        explorerUrl: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia";
        chainId?: number;
        rpcUrl?: string;
        explorerUrl?: string;
    }, {
        name?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia";
        chainId?: number;
        rpcUrl?: string;
        explorerUrl?: string;
    }>]>;
    privateKey: z.ZodString;
    contracts: z.ZodObject<{
        agentVault: z.ZodString;
        agentMemory: z.ZodString;
        skillRegistry: z.ZodString;
        actionSealer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        agentVault?: string;
        agentMemory?: string;
        skillRegistry?: string;
        actionSealer?: string;
    }, {
        agentVault?: string;
        agentMemory?: string;
        skillRegistry?: string;
        actionSealer?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    contracts?: {
        agentVault?: string;
        agentMemory?: string;
        skillRegistry?: string;
        actionSealer?: string;
    };
    privateKey?: string;
    network?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia" | {
        name?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia";
        chainId?: number;
        rpcUrl?: string;
        explorerUrl?: string;
    };
}, {
    contracts?: {
        agentVault?: string;
        agentMemory?: string;
        skillRegistry?: string;
        actionSealer?: string;
    };
    privateKey?: string;
    network?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia" | {
        name?: "fhenix-helium" | "fhenix-nitrogen" | "arbitrum-sepolia" | "base-sepolia";
        chainId?: number;
        rpcUrl?: string;
        explorerUrl?: string;
    };
}>;
export type NetworkName = z.infer<typeof NetworkNameSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type ContractAddresses = z.infer<typeof ContractAddressesSchema>;
export type CredentialResult = z.infer<typeof CredentialResultSchema>;
export type CredentialEntry = z.infer<typeof CredentialEntrySchema>;
export type ActionResult = z.infer<typeof ActionResultSchema>;
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
export type ContextResult = z.infer<typeof ContextResultSchema>;
export type FHEAgentShieldConfig = z.infer<typeof FHEAgentShieldConfigSchema>;
export declare function validateNetworkConfig(config: unknown): NetworkConfig;
export declare function validateContractAddresses(addresses: unknown): ContractAddresses;
export declare function validateCredentialEntry(entry: unknown): CredentialEntry;
export declare function validateActionResult(result: unknown): ActionResult;
//# sourceMappingURL=schemas.d.ts.map