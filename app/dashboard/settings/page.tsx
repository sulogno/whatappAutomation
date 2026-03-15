'use client';

// app/dashboard/settings/page.tsx
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Save, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetch('/api/businesses')
      .then(r => r.json())
      .then(d => {
        if (d.business) {
          setBusiness(d.business);
          setForm(d.business);
        } else {
          setError('Could not load business. Try refreshing.');
        }
      })
      .catch(() => setError('Network error loading settings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!business?.id) {
      setError('Business not found. Please refresh the page.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          ai_context: form.ai_context,
          whatsapp_number: form.whatsapp_number,
          whatsapp_phone_id: form.whatsapp_phone_id,
          whatsapp_access_token: form.whatsapp_access_token,
          opening_time: form.opening_time,
          closing_time: form.closing_time,
          closed_days: form.closed_days,
          language: form.language,
          is_open: form.is_open,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBusiness(data.business);
        setForm(data.business);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error — try again');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  );

  if (!business) return (
    <div className="max-w-2xl">
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
        {error || 'Could not load business. Please refresh.'}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your business and AI behavior</p>
      </div>

      {/* Business Info */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Business Info</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Business Name</label>
          <input type="text" value={form.name || ''}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">AI Context</label>
          <p className="text-xs text-muted-foreground mb-2">
            Describe your business — menu, services, prices, special rules. AI uses this to answer customers.
          </p>
          <textarea rows={5} value={form.ai_context || ''}
            onChange={e => setForm({ ...form, ai_context: e.target.value })}
            placeholder="e.g. Dal Tadka ₹80, Biryani ₹150. Free delivery above ₹300. Min order ₹100."
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
      </section>

      {/* WhatsApp Credentials */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">WhatsApp Credentials</h2>
          <a href="https://developers.facebook.com" target="_blank" rel="noopener"
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            Get credentials <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
          Meta Developer Console → Your App → WhatsApp → API Setup
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">WhatsApp Business Number</label>
          <input type="tel" value={form.whatsapp_number || ''}
            onChange={e => setForm({ ...form, whatsapp_number: e.target.value })}
            placeholder="919876543210 (with country code, no +)"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Phone Number ID</label>
          <input type="text" value={form.whatsapp_phone_id || ''}
            onChange={e => setForm({ ...form, whatsapp_phone_id: e.target.value })}
            placeholder="e.g. 1066509389876110"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Access Token</label>
          <div className="relative">
            <input type={showToken ? 'text' : 'password'}
              value={form.whatsapp_access_token || ''}
              onChange={e => setForm({ ...form, whatsapp_access_token: e.target.value })}
              placeholder="EAAxxxxxxxx..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
            <button type="button" onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Temporary tokens expire in 24h. For permanent: Meta Business Settings → System Users → Generate Token.
          </p>
        </div>

        <div className="bg-secondary rounded-xl p-3">
          <p className="text-xs font-semibold mb-1">Webhook URL</p>
          <p className="text-xs text-muted-foreground mb-2">Set this in Meta → WhatsApp → Configuration → Webhook</p>
          <code className="text-xs font-mono bg-background border border-border px-3 py-2 rounded-lg block break-all">
            {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.vercel.app'}/api/whatsapp/webhook
          </code>
        </div>
      </section>

      {/* Business Hours */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Business Hours</h2>
        <div className="grid grid-cols-2 gap-4">
          {[{ key: 'opening_time', label: 'Opening Time' }, { key: 'closing_time', label: 'Closing Time' }].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input type="time" value={form[key] || '09:00'}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Closed Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const isSelected = (form.closed_days || []).includes(day);
              return (
                <button key={day} type="button"
                  onClick={() => {
                    const current = form.closed_days || [];
                    setForm({ ...form, closed_days: isSelected ? current.filter((d: string) => d !== day) : [...current, day] });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${isSelected ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'}`}>
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Settings */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">AI Settings</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Reply Language</label>
          <select value={form.language || 'hinglish'}
            onChange={e => setForm({ ...form, language: e.target.value })}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="hinglish">Hinglish — Hindi + English mix (Recommended)</option>
            <option value="hindi">Hindi only</option>
            <option value="english">English only</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
          <div>
            <p className="font-medium text-sm">Business Status</p>
            <p className="text-xs text-muted-foreground">
              {form.is_open ? '✅ Open — AI is replying to customers' : "❌ Closed — AI tells customers you're closed"}
            </p>
          </div>
          <button onClick={() => setForm({ ...form, is_open: !form.is_open })}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.is_open ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_open ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
          <div>
            <p className="font-medium text-sm">AI Message Limit</p>
            <p className="text-xs text-muted-foreground">
              {business.monthly_message_count} / {business.monthly_message_limit} messages used this month
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold capitalize text-primary">{business.plan} plan</p>
            <a href="/dashboard/billing" className="text-xs text-muted-foreground hover:text-primary underline">Upgrade →</a>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">{error}</div>
      )}

      <button onClick={handleSave} disabled={isSaving}
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60">
        {saved ? <><Check className="w-4 h-4" /> Saved!</>
          : isSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
          : <><Save className="w-4 h-4" /> Save Changes</>}
      </button>
    </div>
  );
}