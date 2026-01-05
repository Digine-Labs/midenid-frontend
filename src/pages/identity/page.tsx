import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import { useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { NoWalletConnected } from "./components/NoWalletConnected";
import { NoDomainRegistered } from "./components/NoDomainRegistered";
import { IdentityProfile } from "./components/IdentityProfile";

export default function Identity() {
  const { connected } = useWallet();
  const { hasRegisteredDomain, isLoading } = useWalletAccount();
  const location = useLocation();
  const navigate = useNavigate();

  // Get domain from location state (passed from MyDomains page)
  const domain = location.state?.domain;

  // Redirect to my-domains if no domain is provided in state
  useEffect(() => {
    console.log(domain)
    if (!domain) {
      navigate("/my-domains");
    }
  }, [domain]);

  // Show wallet connection prompt if not connected
  if (!connected) {
    return <NoWalletConnected />;
  }

  // Show loading state while checking for domain
  if (isLoading) {
    return (
      <main
        className="relative flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-background min-h-screen"
        style={{ minHeight: "calc(100vh - 3.5rem)" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your identity...</p>
        </div>
      </main>
    );
  }

  // Show domain registration prompt if no domain is registered
  if (!hasRegisteredDomain) {
    return <NoDomainRegistered />;
  }

  // Show identity profile if domain is registered
  return (
    <main
      className="relative flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-background min-h-screen"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <IdentityProfile
        domainName={domain}
      />
    </main>
  );
}
