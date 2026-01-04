import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Github, FileText, CheckCircle2, AlertCircle, RefreshCw, MessageCircle, Send, Upload, User } from "lucide-react";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { fetchProfile, saveProfile, uploadProfilePicture } from "@/api/profile";
import { getBlockNumber } from "@/api/metadata";
import type { ProfilePayload } from "@/api/profile";
import { useTheme } from "@/components/ThemeProvider";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import { ImageCropper } from "@/components/ImageCropper";

// Field length limits
const FIELD_LIMITS = {
  bio: 500,
  twitter: 50,
  github: 50,
  discord: 50,
  telegram: 50,
} as const;

const formSchema = z.object({
  bio: z.string()
    .max(FIELD_LIMITS.bio, `Bio must be ${FIELD_LIMITS.bio} characters or less`)
    .optional(),
  twitter: z.string()
    .max(FIELD_LIMITS.twitter, `Twitter handle must be ${FIELD_LIMITS.twitter} characters or less`)
    .optional(),
  github: z.string()
    .max(FIELD_LIMITS.github, `GitHub username must be ${FIELD_LIMITS.github} characters or less`)
    .optional(),
  discord: z.string()
    .max(FIELD_LIMITS.discord, `Discord username must be ${FIELD_LIMITS.discord} characters or less`)
    .optional(),
  telegram: z.string()
    .max(FIELD_LIMITS.telegram, `Telegram handle must be ${FIELD_LIMITS.telegram} characters or less`)
    .optional(),
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
  const { connected } = useWallet();
  const { isAuthenticated } = useWalletAccount();

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Profile data
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [domainPurchaseDate, setDomainPurchaseDate] = useState<Date>(new Date());
  const [lastModifiedDate, setLastModifiedDate] = useState<Date>(new Date());

  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");

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
        setImagePreview(""); // Clear any local preview
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

    if (!isAuthenticated) {
      toast.error("Please wait for authentication to complete");
      return;
    }

    try {
      setIsLoading(true);
      setSubmissionResult(null);

      // Get current block number
      const blockNumberResult = await getBlockNumber();
      if (!blockNumberResult.success || blockNumberResult.data === undefined) {
        throw new Error(blockNumberResult.error || "Failed to get block number");
      }

      // Determine final image URL
      const finalImageUrl = imageUrl || "";

      // Submit to API (session cookie handles authentication)
      const payload: ProfilePayload = {
        bio: data.bio?.trim() || "",
        twitter: data.twitter?.trim() || "",
        github: data.github?.trim() || "",
        discord: data.discord?.trim() || "",
        telegram: data.telegram?.trim() || "",
        image_url: finalImageUrl,
        block_number: blockNumberResult.data,
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

  // Handle image file selection - opens cropper
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !domainName) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Create URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropperOpen(true);

    // Reset input so same file can be selected again
    event.target.value = '';
  };

  // Handle cropped image upload
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!domainName) return;

    // Create a File from the Blob for upload
    const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });

    // Show preview immediately
    const previewUrl = URL.createObjectURL(croppedBlob);
    setImagePreview(previewUrl);

    try {
      setIsUploadingImage(true);
      const result = await uploadProfilePicture(domainName, croppedFile);

      if (result.success && result.data) {
        setImageUrl(result.data.image_url);
        setCropperOpen(false);
        setImageToCrop('');
        toast.success("Profile picture uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
        setImagePreview(""); // Clear preview on error
      }
    } catch {
      toast.error("Failed to upload image");
      setImagePreview(""); // Clear preview on error
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle cropper close
  const handleCropperClose = () => {
    setCropperOpen(false);
    setImageToCrop('');
  };

  // Fetch profile when component mounts or domain changes (after authentication)
  useEffect(() => {
    if (domainName && connected && isAuthenticated) {
      fetchExistingProfile(domainName);
    }
  }, [domainName, connected, isAuthenticated, fetchExistingProfile]);

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

            {/* Profile Picture Skeleton */}
            <div className="flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-8 w-28 mt-3" />
            </div>

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
                {/* Profile Picture Upload - Centered at top */}
                <FormItem className="flex flex-col items-center">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2">
                    {(imagePreview || imageUrl) ? (
                      <img
                        src={imagePreview || imageUrl}
                        alt="Profile"
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col items-center">
                    <label htmlFor="profile-picture-upload">
                      <Input
                        id="profile-picture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={isLoading || isUploadingImage || !isAuthenticated}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading || isUploadingImage || !isAuthenticated}
                        onClick={() => document.getElementById('profile-picture-upload')?.click()}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Change Picture
                          </>
                        )}
                      </Button>
                    </label>
                    <FormDescription className="mt-2 text-center">
                      Output: 512x512px. Max 5MB.
                    </FormDescription>
                  </div>
                </FormItem>

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
                          maxLength={FIELD_LIMITS.bio}
                        />
                      </FormControl>
                      <FormDescription>
                        {(field.value?.length || 0)}/{FIELD_LIMITS.bio} characters
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
                          <img
                            src="/icons/twitter.png"
                            alt="Twitter"
                            className="h-4 w-4"
                            style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }}
                          />
                          Twitter
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="@username"
                            {...field}
                            disabled={isLoading}
                            maxLength={FIELD_LIMITS.twitter}
                          />
                        </FormControl>
                        <FormDescription>
                          {(field.value?.length || 0)}/{FIELD_LIMITS.twitter} characters
                        </FormDescription>
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
                          <Input
                            placeholder="username"
                            {...field}
                            disabled={isLoading}
                            maxLength={FIELD_LIMITS.github}
                          />
                        </FormControl>
                        <FormDescription>
                          {(field.value?.length || 0)}/{FIELD_LIMITS.github} characters
                        </FormDescription>
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
                          <Input
                            placeholder="username#0000"
                            {...field}
                            disabled={isLoading}
                            maxLength={FIELD_LIMITS.discord}
                          />
                        </FormControl>
                        <FormDescription>
                          {(field.value?.length || 0)}/{FIELD_LIMITS.discord} characters
                        </FormDescription>
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
                          <Input
                            placeholder="@username"
                            {...field}
                            disabled={isLoading}
                            maxLength={FIELD_LIMITS.telegram}
                          />
                        </FormControl>
                        <FormDescription>
                          {(field.value?.length || 0)}/{FIELD_LIMITS.telegram} characters
                        </FormDescription>
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
          </>
        )}
      </Card>

      {/* Image Cropper Dialog */}
      <ImageCropper
        imageSrc={imageToCrop}
        open={cropperOpen}
        onClose={handleCropperClose}
        onCropComplete={handleCropComplete}
        isUploading={isUploadingImage}
      />
    </div>
  );
}
