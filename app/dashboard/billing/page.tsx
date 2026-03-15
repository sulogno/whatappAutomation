'use client';

// app/dashboard/billing/page.tsx
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/utils';
import { Check, Zap } from 'lucide-react';
import { PLAN_PRICES, PLAN_LIMITS } from '@/types';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['50 messages/month', '1 delivery boy', '20 inventory items', '20 queue/day', 'Basic AI replies'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    features: ['500 messages/month', '2 delivery boys', '100 inventory items', '100 queue/day', 'AI replies + intent detection'],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 399,
    features: ['2,000 messages/month', '5 delivery boys', '500 inventory items', '500 queue/day', 'Full AI + booking management'],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    features: ['10,000 messages/month', '20 delivery boys', 'Unlimited inventory', 'Unlimited queue', 'Priority support'],
  },
];

export default function BillingPage() {
  const { business } = useAppStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === business?.plan) return;
    setIsLoading(planId);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.shortUrl) {
        window.open(data.shortUrl, '_blank');
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-sm text-muted-foreground">
          Current plan: <span className="font-semibold capitalize text-primary">{business?.plan}</span>
        </p>
      </div>

      {/* Usage */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-bold mb-4">Current Usage</h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">AI Messages</span>
              <span className="font-semibold">{business?.monthly_message_count || 0} / {business?.monthly_message_limit || 50}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((business?.monthly_message_count || 0) / (business?.monthly_message_limit || 50)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = business?.plan === plan.id;
          const isPopular = (plan as typeof plan & { popular?: boolean }).popular;

          return (
            <div
              key={plan.id}
              className={`bg-card border rounded-2xl p-5 relative flex flex-col ${
                isPopular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
              } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-1">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isLoading === plan.id || plan.price === 0}
                className={`mt-5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-primary/10 text-primary cursor-default'
                    : plan.price === 0
                    ? 'bg-secondary text-muted-foreground cursor-default'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {isCurrent ? 'Current Plan' : isLoading === plan.id ? 'Loading...' : plan.price === 0 ? 'Free' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Payments processed securely by Razorpay. Cancel anytime. GST applicable.
      </p>
    </div>
  );
}
