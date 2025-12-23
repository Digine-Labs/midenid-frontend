import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Search } from "lucide-react";
import { useNavigate } from "react-router";

export function NoDomainRegistered() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="rounded-full bg-primary/10 p-6">
              <Globe className="h-16 w-16 text-primary" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">No Domain Registered</h2>
              <p className="text-muted-foreground max-w-md">
                You don't have a registered .miden domain yet. Register a domain to create your
                decentralized identity on the Miden network.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" onClick={() => navigate("/")}>
                <Search className="mr-2 h-4 w-4" />
                Search for a Domain
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/my-domains")}
              >
                View My Domains
              </Button>
            </div>

            <div className="text-sm text-muted-foreground text-center max-w-md pt-4 space-y-2">
              <p className="font-medium">Why register a domain?</p>
              <ul className="text-left space-y-1 list-disc list-inside">
                <li>Create a unique decentralized identity</li>
                <li>Simplify your wallet address</li>
                <li>Build your on-chain reputation</li>
                <li>Connect with the Miden ecosystem</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
