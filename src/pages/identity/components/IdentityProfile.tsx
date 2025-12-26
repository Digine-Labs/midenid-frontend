import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Github as GithubIcon, FileText, CheckCircle2, AlertCircle, RefreshCw, MessageCircle, Send } from "lucide-react";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { fetchProfile, saveProfile } from "@/api/profile";
import type { ProfilePayload } from "@/api/profile";
import { signProfileData } from "@/lib/midenClient";
import type { SignedData } from "@/lib/midenClient";
import { useTheme } from "@/components/theme-provider";

const formSchema = z.object({
  bio: z.string()
    .max(280, "Bio must be 280 characters or less")
    .optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  discord: z.string().optional(),
  telegram: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IdentityProfileProps {
  domainName?: string;
  onProfileUpdate?: () => void;
}

export function IdentityProfile({
  domainName,
  onProfileUpdate,
}: IdentityProfileProps) {
  const { resolvedTheme } = useTheme()
  // Wallet integration
  const { signBytes, connected, publicKey } = useWallet();

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Profile data
  const [imageUrl, setImageUrl] = useState<string>("");
  const [domainPurchaseDate, setDomainPurchaseDate] = useState<Date>(new Date());
  const [lastModifiedDate, setLastModifiedDate] = useState<Date>(new Date());

  // API result
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: "",
      twitter: "",
      github: "",
      discord: "",
      telegram: "",
    },
  });

  // Sign profile data with wallet
  const signData = async (
    profileData: FormValues,
    imageUrlString: string
  ): Promise<SignedData | null> => {
    if (!connected || !signBytes || !publicKey) {
      toast.error("Please connect your wallet first");
      return null;
    }

    try {
      const signed = await signProfileData(
        {
          domain: domainName || "",
          bio: profileData.bio?.trim() || "",
          twitter: profileData.twitter?.trim() || "",
          github: profileData.github?.trim() || "",
          discord: profileData.discord?.trim() || "",
          telegram: profileData.telegram?.trim() || "",
          image_url: imageUrlString.trim(),
        },
        signBytes,
        publicKey
      );
      return signed;
    } catch (error) {
      console.error('Signing failed:', error);
      throw error;
    }
  };

  // Fetch existing profile from API
  const fetchExistingProfile = useCallback(async (domain: string) => {
    if (!domain) return;

    try {
      setIsFetchingProfile(true);
      const data = await fetchProfile(domain);

      if (data) {
        setIsEditMode(true);
        setLastModifiedDate(new Date(data.updated_at))
        setDomainPurchaseDate(new Date(data.created_at))

        // Populate React Hook Form with existing data
        form.reset({
          bio: data.bio || "",
          twitter: data.twitter || "",
          github: data.github || "",
          discord: data.discord || "",
          telegram: data.telegram || "",
        });

        // Set image URL separately (string vs File)
        setImageUrl(data.image_url || "");
      } else {
        // No profile exists yet
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setIsEditMode(false);
    } finally {
      setIsFetchingProfile(false);
    }
  }, [form]);

  // Submit profile data
  const onSubmit = async (data: FormValues) => {
    if (!domainName) {
      toast.error("Domain name is required");
      return;
    }

    try {
      setIsLoading(true);
      setSubmissionResult(null);

      // Determine final image URL
      const finalImageUrl = imageUrl || "";

      // Sign the data
      const signed = await signData(data, finalImageUrl);
      if (!signed) {
        setIsLoading(false);
        return;
      }

      // Submit to API
      const payload: ProfilePayload = {
        message_hex: signed.message_hex,
        pubkey_hex: signed.pubkey_hex,
        signature_hex: signed.signature_hex,
        bio: data.bio?.trim() || "",
        twitter: data.twitter?.trim() || "",
        github: data.github?.trim() || "",
        discord: data.discord?.trim() || "",
        telegram: data.telegram?.trim() || "",
        image_url: finalImageUrl,
        block_number: Date.now()
      };

      const result = await saveProfile(domainName, payload);

      if (result.success) {
        const successMessage = isEditMode
          ? "Profile updated successfully!"
          : "Profile created successfully!";
        setSubmissionResult({ success: true, message: result.message || successMessage });
        toast.success(successMessage);

        // Mark as edit mode for future updates
        setIsEditMode(true);

        // Refetch to get latest data
        await fetchExistingProfile(domainName);

        // Call optional callback
        onProfileUpdate?.();
      } else {
        const errorMsg = result.error || "Unknown error";
        setSubmissionResult({ success: false, message: errorMsg });
        toast.error(`${isEditMode ? "Update" : "Creation"} failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSubmissionResult({ success: false, message: errorMsg });
      toast.error(`Failed to submit: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile when component mounts or domain changes
  useEffect(() => {
    if (domainName && connected) {
      fetchExistingProfile(domainName);
    }
  }, [domainName, connected, fetchExistingProfile]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-2 mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold md:tracking-tight">
          Your Miden Identity
        </h1>
        {domainName && (
          <p className="text-primary text-lg sm:text-xl font-semibold">
            {domainName}.miden
          </p>
        )}
        <p className="text-muted-foreground text-base sm:text-lg px-2">
          Manage your Miden identity and connected services.
        </p>
      </div>

      <Card className="p-4 sm:p-6 bg-card">
        {/* Wallet Connection Check */}
        {!connected && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your Miden wallet to manage your profile.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Profile Indicator */}
        {isFetchingProfile && (
          <div className="flex items-center justify-center py-4 mb-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading profile...</span>
          </div>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Editing existing profile</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => domainName && fetchExistingProfile(domainName)}
              disabled={isFetchingProfile}
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingProfile ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}

        {/* Submission Result */}
        {submissionResult && (
          <Alert variant={submissionResult.success ? "default" : "destructive"} className="mb-4">
            {submissionResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {submissionResult.message}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bio Field */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bio
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tell us about yourself..."
                      {...field}
                      disabled={isLoading}
                      maxLength={280}
                    />
                  </FormControl>
                  <FormDescription>
                    {(field.value?.length || 0)}/280 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image URL Input */}
            {/* <FormItem>
              <FormLabel>Profile Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Direct URL to your profile image
              </FormDescription>
            </FormItem> */}

            {/* Social Media Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Social Media Accounts</h3>

              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <img
                        src="/icons/twitter.png"
                        alt="Twitter"
                        className="h-4 w-4"
                        style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }}
                      />
                      Twitter
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="@username" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <GithubIcon className="h-4 w-4" />
                      GitHub
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Discord
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="username#0000" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telegram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Telegram
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="@username" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Domain Info */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium">Domain Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-background rounded-md p-3">
                  <p className="text-muted-foreground text-xs mb-1">Purchase Date</p>
                  <p className="font-medium">{domainPurchaseDate.toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="bg-background rounded-md p-3">
                  <p className="text-muted-foreground text-xs mb-1">Last Modified</p>
                  <p className="font-medium">{lastModifiedDate.toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isFetchingProfile || !connected}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                isEditMode ? "Update Profile" : "Save Profile"
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
