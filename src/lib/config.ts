export interface NetworkConfig {
    readonly rpcEndpoint: string;
}

export const NETWORK: NetworkConfig = {
    rpcEndpoint: 'https://rpc.testnet.miden.io'
} as const;