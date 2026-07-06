'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usersApi, uploadApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { User as UserIcon, Mail, LocateFixed, Loader2, CheckCircle2, ArrowRight, Camera } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState<'profile' | 'address'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return toast.error('Please choose a JPG, PNG, or WEBP image');
    }
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

    setUploadingAvatar(true);
    try {
      const res = await uploadApi.uploadSingle(file, 'avatars');
      const url = (res.data.data || res.data).url;
      setAvatar(url);
      toast.success('Photo uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Address fields (optional — user can skip)
  const [address, setAddress] = useState({
    label: 'Home',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [locating, setLocating] = useState(false);

  const goNext = (next: string) => router.push(next && next !== '/login' ? next : '/');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({ name: name.trim(), email: email.trim() || undefined, avatar: avatar || undefined });
      updateUser(res.data.data || res.data || { name, email, avatar });
      setStep('address');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAddress((a) => ({ ...a, latitude, longitude }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const addr = data.address || {};
          setAddress((a) => ({
            ...a,
            fullAddress: a.fullAddress || data.display_name || '',
            city: a.city || addr.city || addr.town || addr.village || '',
            state: a.state || addr.state || '',
            pincode: a.pincode || addr.postcode || '',
          }));
          toast.success('Location detected');
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); toast.error('Could not access your location'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullAddress || !address.city || !address.pincode || address.latitude === undefined) {
      return toast.error('Please fill in the address and detect your location');
    }
    setSaving(true);
    try {
      await usersApi.addAddress(address);
      toast.success('All set!');
      goNext(searchParams.get('next') || '/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipAddress = () => goNext(searchParams.get('next') || '/');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-1.5 w-16 rounded-full ${step === 'profile' ? 'bg-brand-500' : 'bg-brand-200'}`} />
          <div className={`h-1.5 w-16 rounded-full ${step === 'address' ? 'bg-brand-500' : 'bg-slate-200'}`} />
        </div>

        {step === 'profile' ? (
          <div className="card p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
              <UserIcon className="h-6 w-6 text-brand-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1.5">Welcome to HomeServe!</h1>
            <p className="text-sm text-slate-500 mb-6">Let's set up your profile so we can personalize your experience.</p>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center justify-center mb-2">
                <label className="relative cursor-pointer group">
                  <Avatar src={avatar} name={name} size="xl" />
                  <span className="absolute inset-0 rounded-full bg-slate-900/0 group-hover:bg-slate-900/40 flex items-center justify-center transition-colors">
                    {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input-field" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-9" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center flex items-center gap-1.5 mt-2">
                {saving ? 'Saving...' : 'Continue'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="card p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
              <LocateFixed className="h-6 w-6 text-brand-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1.5">Add your address</h1>
            <p className="text-sm text-slate-500 mb-6">So we can find professionals near you. You can also do this later.</p>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  address.latitude !== undefined ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100'
                }`}
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : address.latitude !== undefined ? <CheckCircle2 className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />}
                {locating ? 'Detecting location…' : address.latitude !== undefined ? 'Location detected' : 'Use my current location'}
              </button>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full address</label>
                <textarea value={address.fullAddress} onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })} placeholder="House no, street, area" className="input-field resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" className="input-field" />
                <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State" className="input-field" />
              </div>
              <input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="Pincode" className="input-field" />
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center flex items-center gap-1.5 mt-2">
                {saving ? 'Saving...' : 'Finish setup'} <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleSkipAddress} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-1">
                Skip for now
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center" />}>
      <OnboardingContent />
    </Suspense>
  );
}
