import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NoWalletConnected } from "../identity/components/NoWalletConnected";
import { NoDomainRegistered } from "../identity/components/NoDomainRegistered";
import { IdentityProfile } from "../identity/components/IdentityProfile";

type ViewState = "no-wallet" | "no-domain" | "profile";

export default function IdentityDemo() {
  const [currentView, setCurrentView] = useState<ViewState>("no-wallet");

  const renderView = () => {
    switch (currentView) {
      case "no-wallet":
        return <NoWalletConnected />;
      case "no-domain":
        return <NoDomainRegistered />;
      case "profile":
        return (
          <IdentityProfile
            domainName="alice"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Control Panel */}
      <div className="fixed top-16 left-0 right-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Identity Components Demo</h2>
                <p className="text-sm text-muted-foreground">
                  Switch between different states to preview components
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant={currentView === "no-wallet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("no-wallet")}
                >
                  No Wallet
                </Button>
                <Button
                  variant={currentView === "no-domain" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("no-domain")}
                >
                  No Domain
                </Button>
                <Button
                  variant={currentView === "profile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("profile")}
                >
                  Identity Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* View Container */}
      <div >
        {renderView()}
      </div>
    </div>
  );
}
