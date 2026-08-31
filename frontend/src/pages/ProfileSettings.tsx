import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';
import { User, Mail, Lock, Settings } from 'lucide-react';

export default function ProfileSettings() {
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (password) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload: any = { email };
      if (password) {
        payload.password = password;
      }

      const res = await apiClient.put('/auth/profile', payload);

      if (res.data.success) {
        // Update user state in authStore
        if (user) {
          useAuthStore.setState({
            user: {
              ...user,
              email: res.data.data.email,
              name: res.data.data.name || user.name,
            },
          });
        }
        toast.success('Profile settings updated successfully!');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500 text-sm">Update your login email address and change your account password</p>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" /> Account Security Info
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Read-Only Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border rounded-lg text-xs text-slate-600">
              <div>
                <span className="font-semibold block text-slate-500 mb-0.5">Account Username (Login ID)</span>
                <span className="font-mono text-sm font-bold text-slate-800">{user?.username}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-500 mb-0.5">Account Access Role</span>
                <span className="font-bold text-sm text-indigo-700">{user?.role}</span>
              </div>
            </div>

            {/* Editable Fields */}
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                iconPrefix={<Mail className="h-4 w-4 text-slate-400" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="New Password (Leave blank to keep current)"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  iconPrefix={<Lock className="h-4 w-4 text-slate-400" />}
                />
              </div>
              <div>
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  iconPrefix={<Lock className="h-4 w-4 text-slate-400" />}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" isLoading={isLoading}>
                Save Profile Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
