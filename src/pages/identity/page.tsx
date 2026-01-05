import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import { useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { NoWalletConnected } from "./components/NoWalletConnected";
import { NoDomainRegistered } from "./components/NoDomainRegistered";
import { IdentityProfile } from "./components/IdentityProfile";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Identity() {
  const { connected } = useWallet();
  const { hasRegisteredDomain, isLoading } = useWalletAccount();
  const location = useLocation();
  const navigate = useNavigate();

  const domain = location.state?.domain;

  useEffect(() => {
    if (!domain) {
      navigate("/my-domains");
    }
  }, [domain, navigate]);

  if (!connected) {
    return <NoWalletConnected />;
  }

  if (isLoading) {
    return (
      <main
        className="relative flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-background min-h-screen"
        style={{ minHeight: "calc(100vh - 3.5rem)" }}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your identity...</p>
        </div>
      </main>
    );
  }

  if (!hasRegisteredDomain) {
    return <NoDomainRegistered />;
  }

  return (
    <main
      className="relative flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-background min-h-screen"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <IdentityProfile domainName={domain} />
    </main>
  );
}
