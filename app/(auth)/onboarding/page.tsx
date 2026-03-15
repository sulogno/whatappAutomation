"use client";

// app/(auth)/onboarding/page.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Store,
  Scissors,
  Heart,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  MoreHorizontal,
} from "lucide-react";
import type { OnboardingField } from "@/types";

const FALLBACK_ONBOARDING_SCHEMAS: Record<string, OnboardingField[]> = {
  restaurant: [
    {
      step: "menu",
      question: "What is on your menu? List items with prices.",
      hint: "Dal Tadka ₹80, Biryani ₹150, Roti ₹10",
      required: true,
    },
    {
      step: "delivery",
      question:
        "Do you offer delivery? If yes, what is the delivery charge and minimum order?",
      hint: "Free delivery above ₹300, otherwise ₹30 charge. Min order ₹100.",
      required: false,
    },
    {
      step: "timing",
      question: "Any daily specials or items available only on certain days?",
      hint: "Special Thali on Sundays ₹120. Biryani only on Friday-Sunday.",
      required: false,
    },
  ],
  salon: [
    {
      step: "services",
      question: "What services do you offer with prices?",
      hint: "Haircut ₹200, Facial ₹500, Threading ₹50, Full body wax ₹600",
      required: true,
    },
    {
      step: "staff",
      question:
        "How many stylists/staff do you have? Do customers book with specific stylists?",
      hint: "3 stylists: Priya (hair specialist), Meena (skin), Ritu (all services)",
      required: false,
    },
    {
      step: "slots",
      question:
        "How long does each appointment take on average? This sets your slot duration.",
      hint: "Haircut 30 mins, Facial 60 mins, Full services 90 mins",
      required: true,
    },
  ],
  clinic: [
    {
      step: "doctors",
      question:
        "Which doctors are available? List their specialization and consultation fees.",
      hint: "Dr. Sharma (General Physician) ₹300, Dr. Patel (Cardiologist) ₹600",
      required: true,
    },
    {
      step: "timing",
      question: "What are each doctor's available days and times?",
      hint: "Dr. Sharma: Mon-Sat 9am-1pm, 5pm-8pm. Dr. Patel: Mon Wed Fri 10am-2pm.",
      required: true,
    },
    {
      step: "facilities",
      question:
        "Do you have diagnostic services? (Blood tests, X-ray, ECG, etc.) List with prices.",
      hint: "Blood test ₹200, X-Ray ₹300, ECG ₹400, Urine test ₹150",
      required: false,
    },
  ],
  kirana: [
    {
      step: "inventory",
      question:
        "List your main products with prices. Focus on top 20-30 items.",
      hint: "Milk 1L ₹56, Aata 5kg ₹220, Rice 1kg ₹60, Sugar 1kg ₹45",
      required: true,
    },
    {
      step: "delivery",
      question:
        "Do you offer home delivery? What is your delivery area and minimum order?",
      hint: "Free delivery within 2km above ₹200 order. ₹20 charge below ₹200.",
      required: false,
    },
    {
      step: "specials",
      question:
        "Any weekly specials, bulk discounts, or regular-customer rules?",
      hint: "10% off on Saturday. Bulk discount above ₹1000. Regular customers get credit.",
      required: false,
    },
  ],
  tutor: [
    {
      step: "courses",
      question: "List your courses with fees, duration, and key outcomes.",
      hint: "Full Stack Web Dev ₹15000 (4 months), Python Data Science ₹12000 (3 months)",
      required: true,
    },
    {
      step: "outcomes",
      question:
        "What are your placement records, success stories, or key student benefits?",
      hint: "200+ placements, avg salary ₹4.5LPA, partnered with 50 companies",
      required: true,
    },
    {
      step: "batches",
      question: "What are your current batch timings and start dates?",
      hint: "Morning 7-9am starts 1st April. Evening 7-9pm starts 15th April.",
      required: true,
    },
  ],
  ecommerce: [
    {
      step: "products",
      question:
        "List your products with prices and available variants (size, color, etc).",
      hint: "Cotton T-Shirt ₹499 (S/M/L/XL, White/Black/Blue). Jeans ₹899 (28-36)",
      required: true,
    },
    {
      step: "shipping",
      question:
        "What are your shipping charges, delivery time, and return policy?",
      hint: "Free shipping above ₹999. Else ₹60. Delivery 3-5 days. 7-day return.",
      required: true,
    },
    {
      step: "payment",
      question: "Do you accept COD? Any prepaid discounts?",
      hint: "COD available. 5% extra discount on prepaid orders.",
      required: false,
    },
  ],
  freelancer: [
    {
      step: "services",
      question:
        "What services do you offer? Give brief descriptions and starting prices.",
      hint: "Logo Design (from ₹2000), Website (from ₹15000)",
      required: true,
    },
    {
      step: "portfolio",
      question:
        "Describe your experience, key past clients, or achievements the AI should mention.",
      hint: "5 years experience, worked with 50+ brands, 4.9 rating",
      required: true,
    },
    {
      step: "process",
      question: "What is your typical project process and delivery timeline?",
      hint: "Discovery call, proposal in 24h, 50% advance, delivery in 7 days",
      required: true,
    },
  ],
  other: [
    {
      step: "description",
      question:
        "Describe your business in detail: what you do, your customers, and problems you solve.",
      hint: "We repair mobile phones and laptops for local customers.",
      required: true,
    },
    {
      step: "offerings",
      question: "List your main services or products with prices.",
      hint: "Screen replacement ₹800-2500, Battery replacement ₹400",
      required: true,
    },
    {
      step: "process",
      question: "How does your typical customer interaction work?",
      hint: "Customer visits, diagnosis, quote, repair in 2-4 hours.",
      required: false,
    },
  ],
};

const BUSINESS_TYPES = [
  {
    id: "restaurant",
    label: "Restaurant",
    icon: Store,
    desc: "Food & Beverages",
  },
  {
    id: "salon",
    label: "Salon/Parlour",
    icon: Scissors,
    desc: "Beauty & Grooming",
  },
  { id: "clinic", label: "Clinic", icon: Heart, desc: "Healthcare" },
  {
    id: "kirana",
    label: "Kirana Store",
    icon: ShoppingBag,
    desc: "Grocery & Retail",
  },
  {
    id: "ecommerce",
    label: "Ecommerce",
    icon: ShoppingBag,
    desc: "Online Shop",
  },
  {
    id: "tutor",
    label: "Tutor/Coaching",
    icon: GraduationCap,
    desc: "Education",
  },
  { id: "freelancer", label: "Freelancer", icon: Briefcase, desc: "Services" },
  { id: "other", label: "Other", icon: MoreHorizontal, desc: "Any business" },
];

// Which business types support delivery vs booking
const DELIVERY_TYPES = ["restaurant", "kirana", "ecommerce"];
const BOOKING_TYPES = ["salon", "clinic", "tutor", "other"];
const QUEUE_TYPES = ["salon", "clinic"];

const STEPS = [
  "Business Basics",
  "Menu & Services",
  "Timings",
  "WhatsApp Connect",
  "Final Setup",
];

interface FormData {
  name: string;
  businessType: string;
  segmentAnswers: Record<string, string>;
  openingTime: string;
  closingTime: string;
  closedDays: string[];
  language: string;
  whatsappNumber: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  hasDelivery: boolean;
  deliveryBoys: Array<{ name: string; phone: string }>;
  hasBookings: boolean;
  ownerPhone: string;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function OnboardingPage() {
  const router = useRouter();

  // ✅ GUARD: If business already exists, skip onboarding → go straight to dashboard
  useEffect(() => {
    fetch('/api/businesses')
      .then((r) => r.json())
      .then((data) => {
        if (data.business) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [onboardingSchema, setOnboardingSchema] = useState<OnboardingField[]>(
    [],
  );
  const [form, setForm] = useState<FormData>({
    name: "",
    businessType: "",
    segmentAnswers: {},
    openingTime: "09:00",
    closingTime: "21:00",
    closedDays: [],
    language: "hinglish",
    whatsappNumber: "",
    whatsappPhoneId: "",
    whatsappAccessToken: "",
    hasDelivery: false,
    deliveryBoys: [{ name: "", phone: "" }],
    hasBookings: false,
  });

  const updateForm = (updates: Partial<FormData>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  // Derived booleans based on selected business type
  const showDelivery = DELIVERY_TYPES.includes(form.businessType);
  const showBooking = BOOKING_TYPES.includes(form.businessType);
  const showQueue = QUEUE_TYPES.includes(form.businessType);

  useEffect(() => {
    if (!form.businessType) {
      setOnboardingSchema([]);
      return;
    }

    setSchemaLoading(true);
    fetch(`/api/segment-config?type=${form.businessType}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        const schema =
          ((config?.onboarding_schema || []) as OnboardingField[]) || [];
        if (schema.length > 0) {
          setOnboardingSchema(schema);
          return;
        }

        setOnboardingSchema(
          FALLBACK_ONBOARDING_SCHEMAS[form.businessType] ||
            FALLBACK_ONBOARDING_SCHEMAS.other,
        );
      })
      .catch(() =>
        setOnboardingSchema(
          FALLBACK_ONBOARDING_SCHEMAS[form.businessType] ||
            FALLBACK_ONBOARDING_SCHEMAS.other,
        ),
      )
      .finally(() => setSchemaLoading(false));
  }, [form.businessType]);

  const aiDescription = useMemo(() => {
    if (onboardingSchema.length === 0) {
      return "";
    }

    return onboardingSchema
      .map((field) => {
        const answer = form.segmentAnswers[field.step]?.trim() || "";
        if (!answer) {
          return "";
        }
        return `${field.question}: ${answer}`;
      })
      .filter(Boolean)
      .join(" | ");
  }, [form.segmentAnswers, onboardingSchema]);

  const nextStep = () => {
    setError("");
    setStep((s) => Math.min(s + 1, 5));
  };
  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          businessType: form.businessType,
          whatsappNumber: form.whatsappNumber,
          whatsappPhoneId: form.whatsappPhoneId,
          whatsappAccessToken: form.whatsappAccessToken,
          language: form.language,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          closedDays: form.closedDays,
          description: aiDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create business");
      }

      // Add delivery boys if configured
      if (form.hasDelivery) {
        for (const boy of form.deliveryBoys) {
          if (boy.name && boy.phone) {
            await fetch("/api/delivery", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: boy.name,
                phone: boy.phone,
                whatsappNumber: boy.phone,
              }),
            });
          }
        }
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim() && form.businessType;
    if (step === 2) {
      if (onboardingSchema.length === 0) {
        return false;
      }
      return onboardingSchema.every((field) => {
        if (!field.required) {
          return true;
        }
        return Boolean(form.segmentAnswers[field.step]?.trim());
      });
    }
    if (step === 3) return form.openingTime && form.closingTime;
    if (step === 4)
      return (
        form.whatsappPhoneId && form.whatsappAccessToken && form.whatsappNumber
      );
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl">ReplyFast</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-border"}`}
              />
              <span
                className={`text-xs hidden sm:block ${i + 1 === step ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Step 1 — Business basics */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">
                  Tell us about your business
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Step 1 of 5
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="e.g. Sharma Dhaba, Priya Beauty Parlour"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2.5">
                  Business Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = form.businessType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateForm({ businessType: type.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — What you sell */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">What do you sell?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  The AI will use this segment-specific info to answer customer
                  questions
                </p>
              </div>
              {schemaLoading && (
                <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                  Loading onboarding questions...
                </div>
              )}
              {!schemaLoading && onboardingSchema.length === 0 && (
                <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                  Unable to load segment questions. Please go back and select
                  business type again.
                </div>
              )}
              {!schemaLoading &&
                onboardingSchema.map((field) => (
                  <div key={field.step}>
                    <label className="block text-sm font-medium mb-1.5">
                      {field.question} {field.required ? "*" : "(Optional)"}
                    </label>
                    <textarea
                      rows={4}
                      value={form.segmentAnswers[field.step] || ""}
                      onChange={(e) =>
                        updateForm({
                          segmentAnswers: {
                            ...form.segmentAnswers,
                            [field.step]: e.target.value,
                          },
                        })
                      }
                      placeholder={field.hint}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Step 3 — Timings */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Business Timings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI will tell customers you're closed outside these hours
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "openingTime", label: "Opening Time" },
                  { key: "closingTime", label: "Closing Time" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5">
                      {label}
                    </label>
                    <input
                      type="time"
                      value={form[key as keyof FormData] as string}
                      onChange={(e) =>
                        updateForm({
                          [key]: e.target.value,
                        } as Partial<FormData>)
                      }
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Closed on (select days)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const isSelected = form.closedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          updateForm({
                            closedDays: isSelected
                              ? form.closedDays.filter((d) => d !== day)
                              : [...form.closedDays, day],
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${isSelected ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-secondary border-border hover:border-primary/30"}`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  AI Reply Language
                </label>
                <select
                  value={form.language}
                  onChange={(e) => updateForm({ language: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="hinglish">
                    Hinglish (mix of Hindi + English) — Recommended
                  </option>
                  <option value="hindi">Hindi only</option>
                  <option value="english">English only</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4 — WhatsApp connection */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Connect WhatsApp</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll need a Meta Business Account with WhatsApp API access
                </p>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                <p className="font-semibold text-primary mb-2">
                  📱 How to get your credentials:
                </p>
                <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>
                    Go to{" "}
                    <a
                      href="https://developers.facebook.com"
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline"
                    >
                      developers.facebook.com
                    </a>
                  </li>
                  <li>Create a Meta App → Add WhatsApp product</li>
                  <li>Go to WhatsApp → API Setup</li>
                  <li>Copy Phone Number ID and Access Token</li>
                </ol>
              </div>
              {[
                {
                  key: "whatsappNumber",
                  label: "WhatsApp Business Number",
                  placeholder: "919876543210 (with country code, no +)",
                },
                {
                  key: "whatsappPhoneId",
                  label: "Phone Number ID",
                  placeholder: "1234567890123456",
                },
                {
                  key: "whatsappAccessToken",
                  label: "Access Token",
                  placeholder: "EAABx... (from Meta Developer Console)",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={form[key as keyof FormData] as string}
                    onChange={(e) =>
                      updateForm({ [key]: e.target.value } as Partial<FormData>)
                    }
                    placeholder={placeholder}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 5 — Smart setup based on business type */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Final Setup</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional features for your{" "}
                  {
                    BUSINESS_TYPES.find((b) => b.id === form.businessType)
                      ?.label
                  }
                </p>
              </div>

              {/* Delivery — only for restaurant and kirana */}
              {showDelivery && (
                <div className="bg-secondary rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Home Delivery 🛵</p>
                      <p className="text-xs text-muted-foreground">
                        AI assigns orders to delivery boys via WhatsApp
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateForm({ hasDelivery: !form.hasDelivery })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.hasDelivery ? "bg-primary" : "bg-muted"}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.hasDelivery ? "translate-x-7" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                  {form.hasDelivery && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Add Delivery Boys
                      </p>
                      {form.deliveryBoys.map((boy, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={boy.name}
                            placeholder="Name"
                            onChange={(e) => {
                              const updated = [...form.deliveryBoys];
                              updated[i] = { ...boy, name: e.target.value };
                              updateForm({ deliveryBoys: updated });
                            }}
                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <input
                            type="tel"
                            value={boy.phone}
                            placeholder="WhatsApp number"
                            onChange={(e) => {
                              const updated = [...form.deliveryBoys];
                              updated[i] = { ...boy, phone: e.target.value };
                              updateForm({ deliveryBoys: updated });
                            }}
                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateForm({
                            deliveryBoys: [
                              ...form.deliveryBoys,
                              { name: "", phone: "" },
                            ],
                          })
                        }
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        + Add another delivery boy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Appointment Booking — only for salon, clinic, tutor */}
              {showBooking && (
                <div className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        Appointment Booking 📅
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {form.businessType === "clinic"
                          ? "Patients book OPD slots via WhatsApp"
                          : form.businessType === "tutor"
                            ? "Students book demo classes via WhatsApp"
                            : "Customers book slots via WhatsApp"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateForm({ hasBookings: !form.hasBookings })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.hasBookings ? "bg-primary" : "bg-muted"}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.hasBookings ? "translate-x-7" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Queue — only for salon and clinic */}
              {showQueue && (
                <div className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Walk-in Queue 🎫</p>
                      <p className="text-xs text-muted-foreground">
                        Walk-in customers get token numbers via WhatsApp. Live
                        queue on your dashboard.
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-lg">
                      Auto ON
                    </span>
                  </div>
                </div>
              )}

              {/* If freelancer or other — just AI replies */}
              {!showDelivery && !showBooking && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="font-semibold text-sm text-primary mb-1">
                    ✨ AI replies activated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your AI will automatically reply to all customer enquiries,
                    quotes, and questions on WhatsApp 24/7.
                  </p>
                </div>
              )}

              {/* Webhook info */}
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm">
                <p className="font-semibold text-green-800 dark:text-green-200 mb-1">
                  ✅ You're almost ready!
                </p>
                <p className="text-green-700 dark:text-green-300 text-xs">
                  Set this as your webhook URL in Meta Developer Console:
                </p>
                <code className="block mt-1.5 bg-green-100 dark:bg-green-900 px-3 py-1.5 rounded-lg text-xs font-mono text-green-800 dark:text-green-200 break-all">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : "https://yourapp.com"}
                  /api/whatsapp/webhook
                </code>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Launch ReplyFast!
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {step} of {STEPS.length} — {STEPS[step - 1]}
        </p>
      </div>
    </div>
  );
}
