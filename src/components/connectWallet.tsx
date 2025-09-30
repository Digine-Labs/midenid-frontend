import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter-reactui";
import type { CSSProperties } from "react";

interface ConnectWalletProps {
    style?: CSSProperties;
}

export function ConnectWallet({ style }: ConnectWalletProps) {
    const defaultStyle = { background: '#FF9A00', borderRadius: "0.75rem" };
    const mergedStyle = { ...defaultStyle, ...style };

    return <WalletMultiButton style={mergedStyle} />;
}