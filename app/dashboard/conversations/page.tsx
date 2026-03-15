'use client';

// app/dashboard/conversations/page.tsx
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Bot, User } from 'lucide-react';

interface ConversationItem {
  id: string;
  message_text: string;
  direction: string;
  sender: string;
  created_at: string;
  intent: string | null;
  customer?: { name?: string; phone?: string };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/businesses')
      .then((r) => r.json())
      .then(async ({ business }) => {
        if (!business) return;
        const { supabaseAdmin } = await import('@/lib/supabase');
        const { data } = await supabaseAdmin
          .from('conversations')
          .select('*, customer:customers(name, phone)')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(100);
        setConversations((data || []) as ConversationItem[]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Group by customer phone
  const grouped = conversations.reduce((acc, msg) => {
    const key = msg.customer?.phone || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {} as Record<string, ConversationItem[]>);

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Conversations</h1>
        <p className="text-sm text-muted-foreground">WhatsApp chat history with customers</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState icon="💬" title="No conversations yet"
          description="WhatsApp messages from your customers will appear here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer list */}
          <div className="space-y-2">
            {Object.entries(grouped).map(([phone, msgs]) => {
              const last = msgs[0];
              const customer = last.customer;
              return (
                <div key={phone} className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-wa-green/10 rounded-xl flex items-center justify-center text-wa-dark font-bold text-sm flex-shrink-0">
                      {customer?.name?.charAt(0) || phone.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{customer?.name || phone}</p>
                      <p className="text-xs text-muted-foreground truncate">{last.message_text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(last.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat preview */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-wa-dark/5">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-wa-dark" />
                <span className="font-semibold text-sm">Recent Messages</span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto wa-bg">
              {conversations.slice(0, 30).reverse().map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={msg.direction === 'outbound' ? 'wa-bubble-out' : 'wa-bubble'}>
                    {msg.direction === 'outbound' && (
                      <div className="flex items-center gap-1 mb-1 opacity-70">
                        <Bot className="w-3 h-3" />
                        <span className="text-xs">AI</span>
                      </div>
                    )}
                    {msg.direction === 'inbound' && msg.customer?.name && (
                      <div className="flex items-center gap-1 mb-1 text-wa-dark">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-semibold">{msg.customer.name}</span>
                      </div>
                    )}
                    <p className="text-sm">{msg.message_text}</p>
                    <p className="text-xs opacity-60 mt-1 text-right">{formatDateTime(msg.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
