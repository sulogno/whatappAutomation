// lib/cache.ts — Segment-aware keyword cache

import type { Business, BusinessSegmentConfig } from "@/types";
import { getTerm } from "./segment";

interface CachePattern {
  keywords: string[];
  response: (
    business: Business,
    config: BusinessSegmentConfig | null,
  ) => string;
}

const SEGMENT_CACHES: Record<string, CachePattern[]> = {
  restaurant: [
    {
      keywords: [
        "menu",
        "kya hai",
        "kya milta",
        "kya available",
        "list",
        "items",
        "khana",
      ],
      response: (b) =>
        `🍛 *${b.name} Menu*\n\n${b.ai_context}\n\nKya order karein? 😊`,
    },
    {
      keywords: ["timing", "time", "open", "close", "kab", "hours", "band"],
      response: (b) =>
        `⏰ *${b.name}*\n\nOpen: ${b.opening_time} - ${b.closing_time}\nStatus: ${b.is_open ? "✅ Open hai!" : "❌ Band hai"}\n\nOrder ke liye message karein 🙏`,
    },
    {
      keywords: ["delivery", "ghar", "home", "deliver", "pahucha"],
      response: () =>
        "🛵 Haan! Home delivery available hai.\n\nAddress bhejein, hum confirm karte hain 😊",
    },
    {
      keywords: ["hi", "hello", "helo", "namaste", "hey", "hii"],
      response: (b) =>
        `Namaste! 🙏 *${b.name}* mein aapka swagat hai!\n\nKya order karein aaj? 😊`,
    },
    {
      keywords: ["order", "chahiye", "dena", "lena", "book"],
      response: () =>
        "Zaroor! 😊 Kya order karna chahenge?\n\nItem ka naam aur quantity likhein, main confirm karta hoon 🍛",
    },
    {
      keywords: ["kitna time", "wait", "ready kab", "how long", "time lagega"],
      response: () =>
        "🕐 Order place karte hi confirm time milega!\n\nAbhi order karein 😊",
    },
  ],

  salon: [
    {
      keywords: ["hi", "hello", "namaste", "hey", "appointment", "book"],
      response: (b, c) =>
        `Namaste! 💇‍♀️ *${b.name}* mein aapka swagat!\n\nKaunsi ${getTerm("service", c).toLowerCase()} chahiye? ${getTerm("appointment", c)} book karein 😊`,
    },
    {
      keywords: ["timing", "time", "open", "close", "kab", "hours"],
      response: (b, c) =>
        `⏰ *${b.name}*\n\nOpen: ${b.opening_time} - ${b.closing_time}\nStatus: ${b.is_open ? "✅ Open hai" : "❌ Band hai"}\n\n${getTerm("appointment", c)} ke liye message karein 🙏`,
    },
    {
      keywords: ["price", "rate", "kitna", "charges", "fees", "cost"],
      response: (b, c) =>
        `💅 *${b.name} — ${getTerm("menu", c)} & Prices*\n\n${b.ai_context}\n\n${getTerm("appointment", c)} book karein! 😊`,
    },
    {
      keywords: ["walkin", "walk in", "direct", "bina appointment", "abhi"],
      response: () =>
        "Walk-in welcome hai! 😊\n\nAbhi aao — wait time batayenge. Ya appointment book karo for guaranteed slot 💇‍♀️",
    },
    {
      keywords: [
        "available",
        "slot",
        "date",
        "kal",
        "aaj",
        "sunday",
        "saturday",
      ],
      response: () =>
        "Availability check karte hain! 📅\n\nKaunsi service aur kab chahiye? Likhein main confirm karta hoon 😊",
    },
  ],

  clinic: [
    {
      keywords: ["hi", "hello", "namaste", "appointment", "doctor", "consul"],
      response: (b) =>
        `Namaste 🙏 *${b.name}* mein aapka swagat hai.\n\nKaunse doctor se consultation chahiye?`,
    },
    {
      keywords: ["timing", "time", "available", "kab", "hours", "open"],
      response: (b) =>
        `*${b.name} — Timings*\n\nOPD: ${b.opening_time} - ${b.closing_time}\nStatus: ${b.is_open ? "Open" : "Closed"}\n\nAppointment ke liye message karein 🙏`,
    },
    {
      keywords: ["fees", "charge", "kitna", "price", "cost", "rate"],
      response: (b) =>
        `*Consultation Fees*\n\n${b.ai_context}\n\nAppointment book karne ke liye doctor ka naam batayein 🙏`,
    },
    {
      keywords: ["emergency", "urgent", "abhi", "immediately", "bahut dard"],
      response: () =>
        "Emergency ke liye seedha clinic aayein ya 📞 call karein.\n\nClinic address aur contact details ke liye reply karein 🙏",
    },
    {
      keywords: ["report", "test", "blood", "xray", "scan", "result"],
      response: () =>
        "Reports aur test ke baare mein reception se contact karein.\n\nAppointment ke liye main help kar sakta hoon 🙏",
    },
  ],

  kirana: [
    {
      keywords: ["hi", "hello", "bhai", "bhaiya", "namaste"],
      response: (b) =>
        `Haan ji! 🙏 *${b.name}* — kya chahiye?\n\nItem ka naam likhein, main batata hoon available hai ya nahi 😊`,
    },
    {
      keywords: ["hai kya", "available", "milega", "stock", "hai"],
      response: () =>
        "Haan batao kya chahiye! Main check karta hoon 😊\n\nItem ka naam likhein 📦",
    },
    {
      keywords: ["rate", "price", "kitna", "daam", "cost"],
      response: () => "Haan batao kaunsa item — rate bata deta hoon turant! 😊",
    },
    {
      keywords: ["delivery", "ghar", "bhejo", "deliver"],
      response: () =>
        "🛵 Delivery available hai!\n\nAddress aur order list bhejo, main confirm karta hoon 😊",
    },
    {
      keywords: ["timing", "open", "close", "kab", "band"],
      response: (b) =>
        `⏰ ${b.opening_time} se ${b.closing_time} tak open hai\nStatus: ${b.is_open ? "✅ Open" : "❌ Band"}\n\nOrder ke liye message karo! 😊`,
    },
  ],

  tutor: [
    {
      keywords: ["hi", "hello", "namaste", "course", "class", "details"],
      response: (b) =>
        `Namaste! 🎓 *${b.name}* mein aapka swagat!\n\nKaunse course mein interest hai? Main poori details bata sakta hoon 😊`,
    },
    {
      keywords: ["fee", "fees", "price", "cost", "kitna", "charges"],
      response: (b) =>
        `*${b.name} — Courses & Fees*\n\n${b.ai_context}\n\nKisi bhi course ke baare mein detail mein poochh sakte hain! 🎓`,
    },
    {
      keywords: ["demo", "trial", "free class", "sample", "try"],
      response: () =>
        "Free demo class available hai! 🎓\n\nApna naam aur kaunsa course — batao, main schedule karta hoon 😊",
    },
    {
      keywords: ["placement", "job", "salary", "career", "future"],
      response: () =>
        "🚀 Hamare students ka track record bahut strong hai!\n\nPlacement details ke liye full course info maangein 😊",
    },
    {
      keywords: ["timing", "batch", "schedule", "time", "kab"],
      response: (b) =>
        `*Current Batches:*\n\n${b.ai_context}\n\nKaunsa timing suit karta hai? 📅`,
    },
  ],

  courses: [
    {
      keywords: ["hi", "hello", "namaste", "course", "class", "details"],
      response: (b) =>
        `Namaste! 🎓 *${b.name}* mein aapka swagat!\n\nKaunse course mein interest hai? Main poori details bata sakta hoon 😊`,
    },
    {
      keywords: ["fee", "fees", "price", "cost", "kitna", "charges"],
      response: (b) =>
        `*${b.name} — Courses & Fees*\n\n${b.ai_context}\n\nKisi bhi course ke baare mein detail mein poochh sakte hain! 🎓`,
    },
    {
      keywords: ["demo", "trial", "free class", "sample", "try"],
      response: () =>
        "Free demo class available hai! 🎓\n\nApna naam aur kaunsa course — batao, main schedule karta hoon 😊",
    },
    {
      keywords: ["placement", "job", "salary", "career", "future"],
      response: () =>
        "🚀 Hamare students ka track record bahut strong hai!\n\nPlacement details ke liye full course info maangein 😊",
    },
    {
      keywords: ["timing", "batch", "schedule", "time", "kab"],
      response: (b) =>
        `*Current Batches:*\n\n${b.ai_context}\n\nKaunsa timing suit karta hai? 📅`,
    },
  ],

  ecommerce: [
    {
      keywords: ["hi", "hello", "namaste", "product", "catalog"],
      response: (b) =>
        `Hi! 👋 Welcome to *${b.name}*\n\nKaunsa product dekhna hai? I can help with variants, price, and shipping 📦`,
    },
    {
      keywords: ["delivery", "shipping", "kab milega", "days", "dispatch"],
      response: () =>
        "📦 Shipping timeline usually 3-5 working days.\n\nOrder details bhejein, main exact update confirm karta hoon 😊",
    },
    {
      keywords: ["return", "exchange", "replace", "refund"],
      response: () =>
        "Return/exchange ke liye order number share karein aur reason batayein.\n\nMain process start kar deta hoon 🙏",
    },
    {
      keywords: ["price", "cost", "kitna", "rate", "variant", "size", "color"],
      response: (b) =>
        `*${b.name} Catalog*\n\n${b.ai_context}\n\nAap product name + size/color bhejein, main confirm karta hoon 📦`,
    },
  ],

  freelancer: [
    {
      keywords: ["hi", "hello", "namaste", "help", "service", "work"],
      response: (b) =>
        `Hello! 👋 *${b.name}* — professional services.\n\nKaunse project ke liye help chahiye? Brief describe karein 😊`,
    },
    {
      keywords: ["price", "cost", "rate", "charges", "kitna", "budget"],
      response: (b) =>
        `Project cost depends on scope 😊\n\nBrief requirement batao — main estimate de sakta hoon. Usually starting from our services list:\n\n${b.ai_context}`,
    },
    {
      keywords: ["portfolio", "work", "sample", "previous", "examples"],
      response: () =>
        "Sure! Portfolio share karta hoon 😊\n\nApna requirement bhi batao — kaunsi industry, kya scope? Better recommendation de sakuunga 💼",
    },
    {
      keywords: ["timing", "available", "kab", "when", "deadline"],
      response: () =>
        "Current availability: check karta hoon!\n\nProject brief bhejo — timeline aur feasibility batata hoon 😊",
    },
    {
      keywords: ["call", "meeting", "discuss", "talk", "connect"],
      response: () =>
        "Sure! Discovery call schedule karte hain 📞\n\nApna preferred time slot batao — 15 minute ka quick call hoga 😊",
    },
  ],

  general: [
    {
      keywords: ["hi", "hello", "namaste", "hey"],
      response: (b) =>
        `Namaste! 🙏 *${b.name}* mein aapka swagat!\n\nKaise help kar sakta hoon? 😊`,
    },
    {
      keywords: ["timing", "time", "open", "close", "kab"],
      response: (b) =>
        `⏰ Open: ${b.opening_time} - ${b.closing_time}\nStatus: ${b.is_open ? "✅ Open" : "❌ Band"} 🙏`,
    },
    {
      keywords: ["price", "rate", "kitna", "cost"],
      response: (b, c) =>
        `Price ke baare mein detail mein batata hoon:\n\n${b.ai_context}\n\nAur koi ${getTerm("service", c).toLowerCase()} related sawaal? 😊`,
    },
    {
      keywords: ["bye", "thanks", "thank", "shukriya", "dhanyawad"],
      response: (b) => `Shukriya! 🙏 *${b.name}* — phir milenge! 😊`,
    },
  ],
};

export function checkCache(
  message: string,
  business: Business,
  config?: BusinessSegmentConfig | null,
): string | null {
  const normalized = message.toLowerCase().trim();
  const cacheKey =
    config?.keyword_cache_set || business.business_type || "general";
  const patterns = SEGMENT_CACHES[cacheKey] || SEGMENT_CACHES.general;

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword)) {
        return pattern.response(business, config || null);
      }
    }
  }
  return null;
}

export function isDeliveryCommand(message: string): boolean {
  const cmd = message.toUpperCase().trim();
  return cmd === "ACCEPT" || cmd === "PICKED" || cmd === "DELIVERED";
}
