// components/dashboard/WhatsAppStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  tested: boolean;
  testing: boolean;
  error: string | null;
  phoneNumber: string | null;
  lastTested: Date | null;
}

interface Props {
  business: {
    id: string;
    whatsapp_phone_id: string;
    whatsapp_access_token: string;
    whatsapp_number: string;
    name: string;
  };
}

export default function WhatsAppStatus({ business }: Props) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    tested: false,
    testing: false,
    error: null,
    phoneNumber: null,
    lastTested: null,
  });
  const [showSetup, setShowSetup] = useState(false);

  const hasCredentials =
    business.whatsapp_phone_id &&
    business.whatsapp_phone_id !== '' &&
    business.whatsapp_access_token &&
    business.whatsapp_access_token !== '' &&
    business.whatsapp_number &&
    business.whatsapp_number !== '';

  async function testConnection() {
    if (!hasCredentials) return;
    setStatus(s => ({ ...s, testing: true, error: null }));

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      });

      const data = await res.json();

      if (res.ok && data.connected) {
        setStatus({
          connected: true,
          tested: true,
          testing: false,
          error: null,
          phoneNumber: data.phoneNumber || business.whatsapp_number,
          lastTested: new Date(),
        });
      } else {
        setStatus({
          connected: false,
          tested: true,
          testing: false,
          error: data.error || 'Connection failed',
          phoneNumber: null,
          lastTested: new Date(),
        });
      }
    } catch {
      setStatus({
        connected: false,
        tested: true,
        testing: false,
        error: 'Network error — check your internet connection',
        phoneNumber: null,
        lastTested: new Date(),
      });
    }
  }

  // Auto-test on mount if credentials exist
  useEffect(() => {
    if (hasCredentials) {
      testConnection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Not connected at all — show setup banner
  if (!hasCredentials) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">
              WhatsApp not connected
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Your AI is ready but not receiving messages yet. Connect your WhatsApp number to go live.
            </p>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200 underline hover:no-underline"
            >
              {showSetup ? 'Hide setup' : 'Set up WhatsApp →'}
            </button>

            {showSetup && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Choose one:</p>

                <a href="https://interakt.ai" target="_blank" rel="noopener"
                  className="flex items-center justify-between p-3 bg-white dark:bg-amber-900 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-colors group">
                  <div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Interakt — Recommended for India</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">Easy setup, Hindi support, 10 mins</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-amber-400 group-hover:text-amber-600" />
                </a>

                <a href="https://developers.facebook.com" target="_blank" rel="noopener"
                  className="flex items-center justify-between p-3 bg-white dark:bg-amber-900 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-colors group">
                  <div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Meta Cloud API — Free forever</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">Free but needs developer account</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-amber-400 group-hover:text-amber-600" />
                </a>

                <a href="/dashboard/settings"
                  className="block text-center text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors">
                  Add credentials in Settings →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Has credentials — show test status
  return (
    <div className={`rounded-xl p-4 mb-6 border ${
      status.testing
        ? 'bg-secondary border-border'
        : status.tested && status.connected
        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
        : status.tested && !status.connected
        ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
        : 'bg-secondary border-border'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {status.testing ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
          ) : status.tested && status.connected ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : status.tested && !status.connected ? (
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}

          <div>
            {status.testing ? (
              <p className="text-sm font-semibold text-foreground">Testing WhatsApp connection...</p>
            ) : status.tested && status.connected ? (
              <>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  WhatsApp connected ✓
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  +{status.phoneNumber} — AI is live and receiving messages
                </p>
              </>
            ) : status.tested && !status.connected ? (
              <>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  WhatsApp connection failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  {status.error}
                </p>
                <a href="/dashboard/settings" className="text-xs text-red-700 dark:text-red-300 underline mt-1 inline-block">
                  Update credentials in Settings →
                </a>
              </>
            ) : (
              <p className="text-sm font-semibold text-foreground">WhatsApp — not tested yet</p>
            )}
          </div>
        </div>

        <button
          onClick={testConnection}
          disabled={status.testing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 whitespace-nowrap text-foreground"
        >
          {status.testing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wifi className="w-3 h-3" />
          )}
          {status.testing ? 'Testing...' : 'Test now'}
        </button>
      </div>

      {/* Webhook reminder when connected */}
      {status.tested && status.connected && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
            Webhook URL (set this in Meta/Interakt dashboard):
          </p>
          <code className="text-xs font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded block break-all">
            {typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook
          </code>
        </div>
      )}
    </div>
  );
}