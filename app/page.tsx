'use client';

// app/page.tsx
import Link from 'next/link';
import { useState } from 'react';
import {
  MessageCircle, Zap, Users, Truck, Calendar, Check,
  ChevronDown, Star, ArrowRight, Bot, Phone, Clock
} from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Replies 24/7',
    desc: 'Gemini-powered AI answers orders, bookings, and queries in Hinglish — even while you sleep.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Live Queue Board',
    desc: 'Walk-ins get a token number via WhatsApp. Your team sees the live queue on the dashboard.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Truck,
    title: 'Delivery Coordination',
    desc: 'AI assigns orders to delivery boys via WhatsApp. They reply ACCEPT, PICKED, DELIVERED.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Calendar,
    title: 'Appointment Booking',
    desc: 'Customers book slots via WhatsApp. Automatic reminders sent 1 hour before.',
    color: 'bg-green-50 text-green-600',
  },
];

const PLANS = [
  { name: 'Free', price: '₹0', messages: '50 messages/mo', cta: 'Start Free', highlight: false },
  { name: 'Starter', price: '₹199', messages: '500 messages/mo', cta: 'Get Started', highlight: false },
  { name: 'Growth', price: '₹399', messages: '2,000 messages/mo', cta: 'Most Popular', highlight: true },
  { name: 'Pro', price: '₹999', messages: '10,000 messages/mo', cta: 'Go Pro', highlight: false },
];

const FAQS = [
  {
    q: 'Do my customers need to download an app?',
    a: 'No! Everything works through WhatsApp. Customers just message your WhatsApp number and the AI handles it. No app needed.',
  },
  {
    q: 'How does the delivery coordination work?',
    a: 'When a delivery order comes in, the AI sends a WhatsApp message to your delivery boy with order details. They reply ACCEPT to take it, PICKED when they\'ve picked it up, and DELIVERED when done. The customer gets automatic updates.',
  },
  {
    q: 'What languages does the AI support?',
    a: 'The AI supports Hindi, English, and Hinglish. It automatically detects what language the customer is writing in and replies accordingly.',
  },
  {
    q: 'Can I try it for free?',
    a: 'Yes! The free plan gives you 50 AI messages per month — enough to test with real customers. No credit card required.',
  },
  {
    q: 'What WhatsApp account do I need?',
    a: 'You need a WhatsApp Business API account through Meta (Facebook). We provide step-by-step instructions during onboarding. It\'s free from Meta.',
  },
  {
    q: 'Can I control what the AI says?',
    a: 'Yes. You set the menu, prices, timings, and business rules. The AI uses your information to answer customers. You can also turn the AI off and reply manually anytime.',
  },
];

// Simulated chat messages for hero animation
const DEMO_MESSAGES = [
  { from: 'customer', text: 'Hi, kya aaj delivery ho sakti hai?' },
  { from: 'ai', text: 'Haan bilkul! 🛵 Aaj delivery available hai.\n\nHamari timing: 11am–10pm\nFree delivery above ₹300\n\nKya order karna chahenge? 😊' },
  { from: 'customer', text: '2 butter chicken aur 1 dal tadka' },
  { from: 'ai', text: '✅ Order confirm!\n\n• Butter Chicken x2 — ₹300\n• Dal Tadka x1 — ₹80\n\n*Total: ₹380*\n\nAapka order #42 ready hoga 30 min mein 🙏' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-secondary/50 transition-colors">
        <span className="font-semibold text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ReplyFast</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/login"
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered WhatsApp Automation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
              Your business on{' '}
              <span className="text-wa-dark">WhatsApp</span>
              {' '}— handled by AI
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              ReplyFast gives Indian small businesses an AI agent that answers customers 24/7, manages queues, coordinates deliveries, and handles bookings — all through WhatsApp. No app needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login"
                className="flex items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Start Free — No credit card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {['🍛', '✂️', '🏥'].map((e, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-base">
                      {e}
                    </div>
                  ))}
                </div>
                <span>100+ businesses in India</span>
              </div>
            </div>
          </div>

          {/* Demo chat */}
          <div className="relative animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-border max-w-sm mx-auto">
              {/* Chat header */}
              <div className="bg-wa-dark px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">🍛</div>
                <div>
                  <p className="text-white font-semibold text-sm">Sharma Dhaba</p>
                  <p className="text-white/60 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                    AI Active
                  </p>
                </div>
              </div>
              {/* Messages */}
              <div className="p-4 space-y-3 wa-bg min-h-[280px]">
                {DEMO_MESSAGES.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'ai' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from === 'ai' && (
                      <div className="flex flex-col items-end gap-1 max-w-[85%]">
                        <div className="flex items-center gap-1 text-xs text-wa-dark mb-0.5">
                          <Bot className="w-3 h-3" />
                          <span>AI</span>
                        </div>
                        <div className="wa-bubble-out text-xs whitespace-pre-line">{msg.text}</div>
                      </div>
                    )}
                    {msg.from === 'customer' && (
                      <div className="wa-bubble text-xs max-w-[85%]">{msg.text}</div>
                    )}
                  </div>
                ))}
              </div>
              {/* Input bar */}
              <div className="p-3 border-t border-border flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full px-4 py-2 text-xs text-muted-foreground">
                  Type a message...
                </div>
                <div className="w-8 h-8 bg-wa-green rounded-full flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Replied in 0.8s
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs font-semibold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              ₹1.2L revenue this month
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything your business needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From a small kirana to a chain of salons — ReplyFast works for any Indian business on WhatsApp.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-card rounded-2xl border border-border p-5">
                  <div className={`w-10 h-10 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { emoji: '🍛', name: 'Sharma Dhaba, Delhi', text: '"Orders badh gaye 40%!"' },
              { emoji: '✂️', name: 'Priya Beauty, Mumbai', text: '"Booking easy ho gayi!"' },
              { emoji: '🏥', name: 'Dr. Gupta Clinic, Pune', text: '"Patients khush hain!"' },
            ].map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-5 max-w-xs text-left">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-secondary/50 py-20" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Simple, honest pricing</h2>
            <p className="text-muted-foreground">Start free, scale as you grow</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-card rounded-2xl border p-5 flex flex-col ${plan.highlight ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
                {plan.highlight && (
                  <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full self-start mb-3">⚡ Most Popular</div>
                )}
                <h3 className="font-bold">{plan.name}</h3>
                <p className="text-2xl font-bold mt-1 mb-0.5">{plan.price}</p>
                <p className="text-xs text-muted-foreground mb-4">{plan.messages}</p>
                <div className="space-y-2 flex-1 text-sm text-muted-foreground mb-5">
                  {['AI replies', 'Queue management', 'Dashboard', plan.name !== 'Free' ? 'Priority support' : ''].filter(Boolean).map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/login"
                  className={`text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.highlight ? 'bg-primary text-white hover:bg-primary/90' : 'bg-secondary text-foreground hover:bg-secondary/70 border border-border'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to automate your WhatsApp?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Join 100+ Indian businesses saving hours daily with ReplyFast.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition-all shadow-lg">
            Start for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/50 text-sm mt-4">No credit card • Setup in 10 minutes • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold">ReplyFast</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <span>© 2024 ReplyFast</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
