'use client';
import { useState } from 'react';
import { X, LocateFixed, Loader2, CheckCircle2 } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Address } from '@/types';
import toast from 'react-hot-toast';

export default function AddressFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: (a: Address) => void }) {
  const [form, setForm] = useState({
    label: 'Home',
    fullAddress: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setForm((f) => ({ ...f, latitude, longitude }));
        // Reverse geocode via OpenStreetMap Nominatim (free, no API key required).
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address || {};
          setForm((f) => ({
            ...f,
            fullAddress: f.fullAddress || data.display_name || '',
            city: f.city || addr.city || addr.town || addr.village || '',
            state: f.state || addr.state || '',
            pincode: f.pincode || addr.postcode || '',
          }));
          toast.success('Location detected');
        } catch {
          toast.success('Location captured (address lookup failed, please fill manually)');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Could not access your location. Please allow location permission.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullAddress || !form.city || !form.pincode) return toast.error('Please fill all required fields');
    if (form.latitude === undefined || form.longitude === undefined) {
      return toast.error('Please detect your location so we can find nearby professionals');
    }
    setLoading(true);
    try {
      const res = await usersApi.addAddress(form);
      onSaved(res.data.data || res.data);
      toast.success('Address saved');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">Add new address</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              form.latitude !== undefined ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100'
            }`}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : form.latitude !== undefined ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            {locating ? 'Detecting location…' : form.latitude !== undefined ? 'Location detected' : 'Use my current location'}
          </button>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Label</label>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map((l) => (
                <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.label === l ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full address</label>
            <textarea value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
              placeholder="House no, street, area" className="input-field resize-none" rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Landmark <span className="text-xs font-normal text-slate-400">(optional)</span></label>
            <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Near..." className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bhubaneswar" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Odisha" className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Pincode</label>
            <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="751001" className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center">
            {loading ? 'Saving...' : 'Save address'}
          </button>
        </form>
      </div>
    </div>
  );
}
