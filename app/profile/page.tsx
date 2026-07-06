'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { usersApi, walletApi, uploadApi } from '@/lib/api';
import { Address, WalletTransaction } from '@/types';
import Avatar from '@/components/ui/Avatar';
import AddressFormModal from '@/components/booking/AddressFormModal';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import {
  User, MapPin, Wallet, HelpCircle, FileText, Shield, LogOut,
  ChevronRight, Plus, Trash2, Edit2, Check, X, Camera, Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [activeSection, setActiveSection] = useState<'profile' | 'addresses'>('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    usersApi.getAddresses().then((res) => setAddresses(res.data.data || res.data || []));
    walletApi.get().then((res) => setWallet(res.data.data || res.data)).catch(() => {});
    walletApi.getTransactions().then((res) => {
      const payload = res.data.data || res.data || {};
      setTransactions(payload.transactions || (Array.isArray(payload) ? payload : []));
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const handleSaveName = async () => {
    try {
      await usersApi.updateProfile({ name: nameInput });
      updateUser({ name: nameInput });
      setEditingName(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return toast.error('Please choose a JPG, PNG, or WEBP image');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5MB');
    }

    setUploadingAvatar(true);
    try {
      const uploadRes = await uploadApi.uploadSingle(file, 'avatars');
      const url = (uploadRes.data.data || uploadRes.data).url;
      await usersApi.updateProfile({ avatar: url });
      updateUser({ avatar: url });
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await usersApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const menuItems = [
    { icon: Wallet, label: 'Wallet', sub: wallet ? `₹${wallet.balance} balance` : '', href: '/profile#wallet' },
    { icon: HelpCircle, label: 'Help & Support', href: '/support' },
    { icon: FileText, label: 'Terms of Service', href: '/terms' },
    { icon: Shield, label: 'Privacy Policy', href: '/privacy' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Profile</h1>

      {/* Profile card */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <label className="relative flex-shrink-0 cursor-pointer group">
          <Avatar src={user.avatar} name={user.name} size="xl" />
          <span className="absolute inset-0 rounded-full bg-slate-900/0 group-hover:bg-slate-900/40 flex items-center justify-center transition-colors">
            {uploadingAvatar ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
        </label>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="input-field py-1.5 text-sm" autoFocus />
              <button onClick={handleSaveName} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg bg-slate-50 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display font-bold text-lg text-slate-900 truncate">{user.name || 'Add your name'}</h2>
              <button onClick={() => { setNameInput(user.name || ''); setEditingName(true); }} className="text-slate-400 hover:text-brand-500">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-slate-500">+91 {user.phone}</p>
        </div>
      </div>

      {/* Saved addresses */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <MapPin className="h-4.5 w-4.5 text-brand-500" /> Saved addresses
          </h2>
          <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {addresses.length === 0 ? (
          <div className="card p-5 text-center text-sm text-slate-500">No saved addresses yet.</div>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div key={a.id} className="card p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800">{a.label} {a.isDefault && <span className="badge bg-brand-50 text-brand-600 ml-1">Default</span>}</p>
                  <p className="text-xs text-slate-500 truncate">{a.fullAddress}, {a.city}, {a.state} {a.pincode}</p>
                </div>
                <button onClick={() => handleDeleteAddress(a.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wallet */}
      {wallet && (
        <section id="wallet" className="mb-6">
          <div className="card p-5 bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-3">
            <p className="text-brand-100 text-sm mb-1">Wallet balance</p>
            <p className="font-display text-3xl font-bold">₹{wallet.balance}</p>
          </div>
          {transactions.length > 0 && (
            <div className="card divide-y divide-slate-50">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{t.description || (t.type === 'CREDIT' ? 'Wallet credit' : 'Wallet debit')}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(t.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                  <p className={`font-semibold text-sm flex-shrink-0 ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'CREDIT' ? '+' : '−'}₹{t.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Menu */}
      <section className="card divide-y divide-slate-50 mb-6">
        {menuItems.map(({ icon: Icon, label, sub, href }) => (
          <a key={label} href={href} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4.5 w-4.5 text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">{label}</p>
              {sub && <p className="text-xs text-slate-400">{sub}</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </a>
        ))}
      </section>

      <button onClick={() => { logout(); router.push('/login'); }}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors">
        <LogOut className="h-4.5 w-4.5" /> Logout
      </button>

      {showAddressModal && (
        <AddressFormModal onClose={() => setShowAddressModal(false)} onSaved={(a) => setAddresses((prev) => [...prev, a])} />
      )}
    </div>
  );
}
