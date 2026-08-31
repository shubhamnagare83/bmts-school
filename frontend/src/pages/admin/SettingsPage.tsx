import React, { useEffect, useState } from 'react';
import { settingsApi } from '@/api/settings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Settings, Save, School, Phone, Mail, MapPin, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    hmName: '',
    motto: '',
    reportCardFooter: '',
  });

  useEffect(() => {
    settingsApi.get()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setFormData({
            schoolName: res.data.data.schoolName || '',
            address: res.data.data.address || '',
            phone: res.data.data.phone || '',
            email: res.data.data.email || '',
            principalName: res.data.data.principalName || '',
            hmName: res.data.data.hmName || '',
            motto: res.data.data.motto || '',
            reportCardFooter: res.data.data.reportCardFooter || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(formData);
      toast.success('School settings updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System & School Configuration</h1>
        <p className="text-slate-500 text-sm">Configure school profile, signatures, contact information, and report card footers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" /> Institution Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official School Name</label>
              <Input
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={<Phone className="w-4 h-4 text-slate-400" />}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <Textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Leadership & Mottos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Name</label>
                <Input
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headmaster / HM Name</label>
                <Input
                  value={formData.hmName}
                  onChange={(e) => setFormData({ ...formData, hmName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">School Motto / Tagline</label>
              <Input
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                placeholder="e.g. Knowledge is Power"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Report Card Footer Disclaimer</label>
              <Textarea
                rows={2}
                value={formData.reportCardFooter}
                onChange={(e) => setFormData({ ...formData, reportCardFooter: e.target.value })}
                placeholder="Custom disclaimer text appearing on report cards..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
