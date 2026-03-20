import { FHEAgentShield, NETWORKS } from '@fhe-agent-shield/sdk';
function getCredentialParams(state) {
    const key = state?.values?.credentialKey || 'default';
    const value = state?.values?.credentialValue;
    return { key, value };
}
function getActionParams(state) {
    const values = state?.values;
    return {
        action: values?.action,
        payload: values?.payload,
        actionId: values?.actionId,
    };
}
const createFHEStoreCredentialAction = (getClient) => ({
    name: 'FHE_STORE_CREDENTIAL',
    description: 'Store encrypted credential with FHE protection',
    validate: async (_runtime, _message, _state) => {
        return true;
    },
    handler: async (_runtime, _message, state, _options, _callback, _responses) => {
        const client = getClient();
        if (!client) {
            return { success: false, error: 'Plugin not initialized' };
        }
        try {
            const { key, value } = getCredentialParams(state);
            if (!value) {
                return { success: false, error: 'No credential value provided' };
            }
            const hash = await client.vault.storeCredential(client.account.address, value);
            return { success: true, text: `Credential stored: ${key}`, data: { key, txHash: hash } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    },
});
const createFHERetrieveCredentialAction = (getClient) => ({
    name: 'FHE_RETRIEVE_CREDENTIAL',
    description: 'Retrieve encrypted credential with threshold decryption',
    validate: async (_runtime, _message, _state) => {
        return true;
    },
    handler: async (_runtime, _message, state, _options, _callback, _responses) => {
        const client = getClient();
        if (!client) {
            return { success: false, error: 'Plugin not initialized' };
        }
        try {
            const { key } = getCredentialParams(state);
            const value = await client.vault.retrieveCredential(key);
            return { success: true, text: `Credential retrieved: ${key}`, data: { key, value } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    },
});
const createFHESealActionAction = (getClient) => ({
    name: 'FHE_SEAL_ACTION',
    description: 'Seal action requiring threshold approval for release',
    validate: async (_runtime, _message, _state) => {
        return true;
    },
    handler: async (_runtime, _message, state, _options, _callback, _responses) => {
        const client = getClient();
        if (!client) {
            return { success: false, error: 'Plugin not initialized' };
        }
        try {
            const { action, payload } = getActionParams(state);
            if (!action || !payload) {
                return { success: false, error: 'No action or payload provided' };
            }
            const actionId = await client.sealer.sealAction(client.account.address, JSON.stringify(payload));
            return { success: true, text: `Action sealed: ${action}`, data: { actionId } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    },
});
const createFHEApproveAction = (getClient) => ({
    name: 'FHE_APPROVE_ACTION',
    description: 'Approve a sealed action for release',
    validate: async (_runtime, _message, _state) => {
        return true;
    },
    handler: async (_runtime, _message, state, _options, _callback, _responses) => {
        const client = getClient();
        if (!client) {
            return { success: false, error: 'Plugin not initialized' };
        }
        try {
            const { actionId } = getActionParams(state);
            if (!actionId) {
                return { success: false, error: 'No actionId provided' };
            }
            await client.sealer.approveRelease(actionId);
            return { success: true, text: `Action approved: ${actionId}`, data: { actionId } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    },
});
const createFHEProvider = (getClient) => ({
    name: 'fhe-credential-provider',
    description: 'Provides FHE-encrypted credentials to agent context',
    dynamic: false,
    get: async (_runtime, _message, _state) => {
        const client = getClient();
        if (!client) {
            return { text: 'FHE Shield not initialized', data: { initialized: false } };
        }
        return {
            text: 'FHE Shield initialized - credentials and memory are encrypted',
            data: {
                initialized: true,
                network: client.network.name,
                address: client.account.address,
            },
        };
    },
});
export class FHEShieldPlugin {
    name = 'fhe-shield';
    description = 'FHE-encrypted credentials and memory for ElizaOS agents';
    actions;
    providers;
    settings;
    client = null;
    constructor(settings) {
        this.settings = settings;
        this.actions = [
            createFHEStoreCredentialAction(() => this.client),
            createFHERetrieveCredentialAction(() => this.client),
            createFHESealActionAction(() => this.client),
            createFHEApproveAction(() => this.client),
        ];
        this.providers = [createFHEProvider(() => this.client)];
    }
    async init(_config, runtime) {
        this.client = new FHEAgentShield({
            network: NETWORKS[this.settings.network],
            privateKey: runtime.agentId,
            contracts: this.settings.contracts,
        });
    }
    getClient() {
        return this.client;
    }
}
export default FHEShieldPlugin;
//# sourceMappingURL=index.js.map