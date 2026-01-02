'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateGradient } from '@/lib/utils';
import { IPFSService } from '@/services/ipfs-service';
import { Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ProfileEditFormProps {
  address: string;
}

export function ProfileEditForm({ address }: ProfileEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
    discord: '',
    telegram: '',
    email: '',
    avatar_url: '',
    cover_url: '',
    show_email: false,
    show_nfts: true,
    show_badges: true,
    show_activity: true,
    is_public: true,
  });

  const gradient = generateGradient(address);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/profiles/${address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setFormData({
              display_name: data.data.display_name || '',
              username: data.data.username || '',
              bio: data.data.bio || '',
              location: data.data.location || '',
              website: data.data.website || '',
              twitter: data.data.twitter || '',
              github: data.data.github || '',
              discord: data.data.discord || '',
              telegram: data.data.telegram || '',
              email: data.data.email || '',
              avatar_url: data.data.avatar_url || '',
              cover_url: data.data.cover_url || '',
              show_email: data.data.show_email || false,
              show_nfts: data.data.show_nfts ?? true,
              show_badges: data.data.show_badges ?? true,
              show_activity: data.data.show_activity ?? true,
              is_public: data.data.is_public ?? true,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [address]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await IPFSService.uploadFile(file, 'avatar');
      const url = IPFSService.getGatewayUrl(result.cid);
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      toast({
        title: 'Avatar uploaded',
        description: 'Your avatar has been uploaded to IPFS',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const result = await IPFSService.uploadFile(file, 'cover');
      const url = IPFSService.getGatewayUrl(result.cid);
      setFormData((prev) => ({ ...prev, cover_url: url }));
      toast({
        title: 'Cover uploaded',
        description: 'Your cover image has been uploaded to IPFS',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload cover image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/profiles/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      toast({
        title: 'Profile saved',
        description: 'Your profile has been updated successfully',
      });

      router.push(`/profile/${address}`);
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover & Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Image</CardTitle>
          <CardDescription>
            Upload your avatar and cover image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover */}
          <div>
            <Label>Cover Image</Label>
            <div 
              className="mt-2 relative h-32 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {formData.cover_url ? (
                <img
                  src={formData.cover_url}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingCover ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          {/* Avatar */}
          <div>
            <Label>Avatar</Label>
            <div className="mt-2 flex items-center gap-4">
              <div
                className="relative cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.avatar_url || undefined} />
                  <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white text-xl`}>
                    {formData.display_name?.[0] || address.slice(2, 4)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Click to upload a new avatar
                <br />
                Recommended: 400x400px
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Tell the world about yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Connect your social profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yoursite.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="username"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                name="discord"
                value={formData.discord}
                onChange={handleInputChange}
                placeholder="username#0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                placeholder="@username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control what others can see on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to view your profile
              </p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Display your email on your profile
              </p>
            </div>
            <Switch
              checked={formData.show_email}
              onCheckedChange={(checked) => handleSwitchChange('show_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show NFTs</Label>
              <p className="text-sm text-muted-foreground">
                Display your NFT collection
              </p>
            </div>
            <Switch
              checked={formData.show_nfts}
              onCheckedChange={(checked) => handleSwitchChange('show_nfts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Badges</Label>
              <p className="text-sm text-muted-foreground">
                Display your earned badges
              </p>
            </div>
            <Switch
              checked={formData.show_badges}
              onCheckedChange={(checked) => handleSwitchChange('show_badges', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Activity</Label>
              <p className="text-sm text-muted-foreground">
                Display your activity feed
              </p>
            </div>
            <Switch
              checked={formData.show_activity}
              onCheckedChange={(checked) => handleSwitchChange('show_activity', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
