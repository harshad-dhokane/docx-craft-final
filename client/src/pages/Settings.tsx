
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { TwoFactorDialog } from "@/components/settings/TwoFactorDialog";
import { ActiveSessionsDialog } from "@/components/settings/ActiveSessionsDialog";
import { DataExportDialog } from "@/components/settings/DataExportDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { User, Bell, Shield, Download, Trash2, Upload, Camera } from "lucide-react";
import { useState, useRef } from "react";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, uploadAvatar, isUpdating, isUploading } = useProfiles();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateProfile = () => {
    updateProfile({ display_name: displayName });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      uploadAvatar(file);
    }
  };

  const getUserInitials = () => {
    const name = profile?.display_name || user?.user_metadata?.name || user?.email || "";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 text-sm lg:text-base">Manage your account preferences and application settings</p>
      </div>

      <div className="grid gap-6 lg:gap-8 max-w-4xl">
        {/* Profile Settings */}
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Profile Information</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  )}
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                <p className="text-xs text-gray-500">Click the camera icon to upload a new photo</p>
                <p className="text-xs text-gray-400">JPG, PNG or GIF. Max size 5MB.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-gray-700">Display Name</Label>
                <Input 
                  id="name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""} 
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Verified
              </Badge>
              <span className="text-xs text-gray-500">Your email is verified</span>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="text-sm text-gray-700">Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive email updates about your documents</p>
              </div>
              <Switch 
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-save" className="text-sm text-gray-700">Auto-save Templates</Label>
                <p className="text-xs text-gray-500">Automatically save your work</p>
              </div>
              <Switch 
                id="auto-save"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChangePasswordDialog>
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
            </ChangePasswordDialog>
            <TwoFactorDialog>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
            </TwoFactorDialog>
            <ActiveSessionsDialog>
              <Button variant="outline" className="w-full justify-start">
                Active Sessions
              </Button>
            </ActiveSessionsDialog>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Data Management</CardTitle>
                <CardDescription>Export or delete your data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataExportDialog>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
            </DataExportDialog>
            <DeleteAccountDialog>
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </DeleteAccountDialog>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
                <p className="text-xs text-gray-500">Sign out of your account on this device</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
