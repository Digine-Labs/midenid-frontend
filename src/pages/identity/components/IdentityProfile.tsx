import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Github, FileText, CheckCircle2, AlertCircle, RefreshCw, MessageCircle, Send } from "lucide-react";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { ToastCause } from "@/types/toast";
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
import type { SignedData } from "@/types/auth";
import { ThemedIcon } from "@/components/ui/themed-icon";

const formSchema = z.object({
  bio: z.string()
    .max(280, "Bio must be 280 characters or less")
    .optional(),
  twitter: z.string().max(20, "Maximum 20 characters").optional(),
  github: z.string().max(20, "Maximum 20 characters").optional(),
  discord: z.string().max(20, "Maximum 20 characters").optional(),
  telegram: z.string().max(20, "Maximum 20 characters").optional(),
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
  const { signBytes, connected, publicKey } = useWallet();

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Profile data
  const [imageUrl, setImageUrl] = useState("");
  const [domainPurchaseDate, setDomainPurchaseDate] = useState<Date | null>(null);
  const [lastModifiedDate, setLastModifiedDate] = useState<Date | null>(null);

  // Toast hook
  const showToast = useToast();

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
      showToast(ToastCause.WALLET_NOT_CONNECTED);
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
      showToast(ToastCause.DOMAIN_REQUIRED);
      return;
    }

    try {
      setIsLoading(true);

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
        showToast(isEditMode ? ToastCause.PROFILE_UPDATED : ToastCause.PROFILE_CREATED);

        // Mark as edit mode for future updates
        setIsEditMode(true);

        // Refetch to get latest data
        await fetchExistingProfile(domainName);

        // Call optional callback
        onProfileUpdate?.();
      } else {
        showToast(isEditMode ? ToastCause.PROFILE_UPDATE_FAILED : ToastCause.PROFILE_CREATE_FAILED);
      }
    } catch (error) {
      showToast(ToastCause.PROFILE_SUBMIT_FAILED);
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
          <div className="space-y-6">
            {/* Edit Mode Indicator Skeleton */}
            {isEditMode && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            )}

            {/* Bio Field Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Social Media Section Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-40" />

              {/* 4 Social Fields */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>

            {/* Domain Information Skeleton */}
            <div className="space-y-2 pt-4 border-t">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-background rounded-md p-3 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="bg-background rounded-md p-3 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>

            {/* Submit Button Skeleton */}
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!isFetchingProfile && (
          <>
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

                {/* Social Media Fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Social Media Accounts</h3>

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ThemedIcon src="/icons/twitter.png" alt="Twitter" />
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
                          <Github className="h-4 w-4" />
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
                      <p className="font-medium">{domainPurchaseDate?.toLocaleDateString("fr-FR") ?? "-"}</p>
                    </div>
                    <div className="bg-background rounded-md p-3">
                      <p className="text-muted-foreground text-xs mb-1">Last Modified</p>
                      <p className="font-medium">{lastModifiedDate?.toLocaleDateString("fr-FR") ?? "-"}</p>
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
          </>
        )}
      </Card>
    </div>
  );
}
