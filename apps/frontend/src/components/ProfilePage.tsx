'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account information and preferences
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-medium">
              {user?.name ? user.name.split(' ').map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-medium text-foreground">{user?.name || 'Unknown User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email || 'No email provided'}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {user?.name || 'Not provided'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {user?.email || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">User ID</label>
                <div className="p-3 bg-muted rounded-md text-sm font-mono">
                  {user?.id || 'Not available'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Account Type</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  Figma Connected
                </div>
              </div>
            </div>
          </div>

          {/* Connected Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Connected Services</h3>
            <div className="border border-border rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zm7.704 0h-.002L12.735 12l3.117 3.019c2.476 0 4.49-2.014 4.49-4.49s-2.014-4.49-4.49-4.49z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Figma</div>
                    <div className="text-sm text-muted-foreground">Connected and active</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <div className="font-medium text-foreground">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive updates about your projects</div>
                </div>
                <button className="w-10 h-6 bg-primary rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <div className="font-medium text-foreground">Auto-save Projects</div>
                  <div className="text-sm text-muted-foreground">Automatically save your work</div>
                </div>
                <button className="w-10 h-6 bg-primary rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Edit Profile
              </button>
              <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                Change Password
              </button>
              <button className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}