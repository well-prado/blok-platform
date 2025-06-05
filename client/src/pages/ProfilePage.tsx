import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  User,
  Camera,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Mail,
  MapPin,
  Globe,
  Github,
  Calendar,
  Shield,
  Key
} from 'lucide-react';

import { profileApi, type User as UserType } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';
import { formatDate, generateAvatarUrl } from '../lib/utils';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  github_username: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    // reset: _resetProfile, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      github_username: user?.github_username || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordFormData>();

  const watchNewPassword = watch('newPassword');

  // Fetch user profile
  const { isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserType>) => profileApi.updateProfile(data),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      profileApi.changePassword(data),
    onSuccess: () => {
      resetPassword();
      toast.success('Password changed successfully');
    },
    onError: () => {
      toast.error('Failed to change password');
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    // TODO: Implement image upload to cloud storage
    // For now, we'll simulate upload
    setTimeout(() => {
      setIsUploading(false);
      toast.success('Profile image uploaded successfully');
    }, 2000);
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('One special character');
    return errors;
  };

  const passwordStrength = watchNewPassword ? validatePassword(watchNewPassword) : [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card p-6 animate-pulse">
            <div className="h-8 bg-secondary-200 rounded mb-4"></div>
            <div className="h-4 bg-secondary-200 rounded mb-2"></div>
            <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Profile Settings</h1>
          <p className="mt-2 text-lg text-secondary-600">
            Manage your account settings and profile information
          </p>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile Information', icon: User },
                { id: 'security', label: 'Security', icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'security')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={user?.profile_image_url || generateAvatarUrl(user?.username || '')}
                      alt={user?.username}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-secondary-900">Profile Photo</h3>
                    <p className="text-sm text-secondary-500 mb-3">
                      JPG, GIF or PNG. Max size 5MB.
                    </p>
                    <label className="btn-outline cursor-pointer flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      {...registerProfile('first_name', { required: 'First name is required' })}
                      className="input"
                      placeholder="Enter your first name"
                    />
                    {profileErrors.first_name && (
                      <p className="error-text">{profileErrors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Last Name</label>
                    <input
                      {...registerProfile('last_name', { required: 'Last name is required' })}
                      className="input"
                      placeholder="Enter your last name"
                    />
                    {profileErrors.last_name && (
                      <p className="error-text">{profileErrors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      className="input pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="error-text">{profileErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Bio</label>
                  <textarea
                    {...registerProfile('bio')}
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                      <input
                        {...registerProfile('location')}
                        className="input pl-10"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                      <input
                        {...registerProfile('website')}
                        type="url"
                        className="input pl-10"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">GitHub Username</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      {...registerProfile('github_username')}
                      className="input pl-10"
                      placeholder="Enter your GitHub username"
                    />
                  </div>
                </div>

                {/* Account Information */}
                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-secondary-400" />
                      <span className="text-secondary-600">
                        Member since {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-secondary-400" />
                      <span className="text-secondary-600">
                        Username: @{user?.username}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!isProfileDirty || updateProfileMutation.isPending}
                    className="btn-primary flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                {/* Change Password */}
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Change Password
                  </h3>
                  
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <label className="label">Current Password</label>
                      <div className="relative">
                        <input
                          {...registerPassword('currentPassword', { required: 'Current password is required' })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="input pr-10"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="error-text">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">New Password</label>
                      <div className="relative">
                        <input
                          {...registerPassword('newPassword', { 
                            required: 'New password is required',
                            validate: (value) => {
                              const errors = validatePassword(value);
                              return errors.length === 0 || 'Password does not meet requirements';
                            }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className="input pr-10"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Requirements */}
                      {watchNewPassword && (
                        <div className="mt-2 space-y-1">
                          {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'].map((requirement) => (
                            <div key={requirement} className="flex items-center text-xs">
                              {passwordStrength.includes(requirement) ? (
                                <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                              ) : (
                                <Check className="h-3 w-3 mr-1 text-green-500" />
                              )}
                              <span className={passwordStrength.includes(requirement) ? 'text-red-600' : 'text-green-600'}>
                                {requirement}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {passwordErrors.newPassword && (
                        <p className="error-text">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Confirm New Password</label>
                      <div className="relative">
                        <input
                          {...registerPassword('confirmPassword', { 
                            required: 'Please confirm your new password',
                            validate: (value) => value === watchNewPassword || 'Passwords do not match'
                          })}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="input pr-10"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="error-text">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="btn-primary flex items-center"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Account Status */}
                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Account Status</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-800 font-medium">Account Active</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Your account is in good standing and all features are available.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 