import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter-reactui";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export function NoWalletConnected() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Wallet className="h-16 w-16 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
            <p className="text-muted-foreground max-w-md">
              To create and manage your Miden identity, you need to connect your wallet first.
            </p>
          </div>

          <div className="pt-4">
            <WalletMultiButton />
          </div>

          <div className="text-sm text-muted-foreground text-center max-w-md pt-4">
            <p>
              Don't have a Miden wallet yet?{" "}
              <a
                href="https://docs.miden.io/wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get started here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}