import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { NoWalletConnected } from "./components/NoWalletConnected";
import { IdentityProfile } from "./components/IdentityProfile";

export default function Identity() {
  const { connected } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  // Get domain from location state (passed from MyDomains page)
  const domain = location.state?.domain;

  // Redirect to my-domains if no domain is provided in state
  useEffect(() => {
    if (!domain) {
      navigate("/my-domains");
    }
  }, [domain]);

  // Show wallet connection prompt if not connected
  if (!connected) {
    return <NoWalletConnected />;
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
