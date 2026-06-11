"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "bn", label: "বাংলা", short: "বাং" },
];

const STORAGE_KEY = "ia_lang";

export const translations = {
  en: {
    // Sidebar
    home: "Home",
    myReports: "My Reports",
    practice: "Practice",
    reading: "Reading",
    listening: "Listening",
    writing: "Writing",
    speaking: "Speaking",
    diagnostic: "Diagnostic",
    fullMock: "Full Mock",
    lessons: "Lessons",
    managePlan: "Manage plan",
    upgrade: "Upgrade",
    logOut: "Log out",
    collapse: "Collapse",
    admin: "Admin",
    affiliate: "Affiliate",
    // Topbar
    upgradeToPro: "Upgrade to Pro",
    // Dashboard
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    dashboard: "Dashboard",
    startPractice: "Start practice",
    recentActivity: "Recent activity",
    noTestsYet: "No completed tests yet.",
    startFreeDiagnostic: "Start your free diagnostic →",
    testsTaken: "Tests taken",
    bestBand: "Best band",
    averageBand: "Average band",
    target: "Target",
    achieved: "achieved 🎉",
    inProgress: "in progress",
    overall: "overall",
    allTests: "all tests",
    viewAll: "View all",
    // Exam list
    availableTests: "Available tests",
    searchTests: "Search tests…",
    noTestsAvailable: "No tests available yet",
    noTestsMatch: "No tests match",
    startTest: "Start test",
    opening: "Opening…",
    viewPastResults: "View your past results",
    // Getting started
    setTargetBand: "Set your target band",
    takeDiagnostic: "Take a free diagnostic",
    practiceModule: "Practice a module",
    completeMock: "Complete a full mock test",
    // Writing / Speaking
    pro: "Pro",
    free: "Free",
    instant: "Instant band",
    duration: "Duration",
    scoring: "Scoring",
    // Affiliate
    affiliateDashboard: "Affiliate Dashboard",
    referralLink: "Referral link",
    yourCode: "Your code",
    copyLink: "Copy link",
    copyCode: "Copy code",
    copied: "Copied!",
    totalReferrals: "Total referrals",
    confirmedEarnings: "Confirmed earnings",
    pendingEarnings: "Pending earnings",
    commissionRate: "Commission rate",
    yourReferrals: "Your Referrals",
    noReferralsYet: "No referrals yet. Share your link to start earning!",
    notAffiliate: "You're not an affiliate yet",
    notAffiliateDesc: "Contact us to join the affiliate program and start earning commissions for every subscriber you refer.",
  },

  bn: {
    // Sidebar
    home: "হোম",
    myReports: "আমার রিপোর্ট",
    practice: "অনুশীলন",
    reading: "রিডিং",
    listening: "লিসেনিং",
    writing: "রাইটিং",
    speaking: "স্পিকিং",
    diagnostic: "ডায়াগনস্টিক",
    fullMock: "ফুল মক",
    lessons: "পাঠ",
    managePlan: "প্ল্যান পরিচালনা",
    upgrade: "আপগ্রেড",
    logOut: "লগ আউট",
    collapse: "সংকুচিত",
    admin: "অ্যাডমিন",
    affiliate: "অ্যাফিলিয়েট",
    // Topbar
    upgradeToPro: "প্রো-তে আপগ্রেড করুন",
    // Dashboard
    goodMorning: "শুভ সকাল",
    goodAfternoon: "শুভ বিকেল",
    goodEvening: "শুভ সন্ধ্যা",
    dashboard: "ড্যাশবোর্ড",
    startPractice: "অনুশীলন শুরু করুন",
    recentActivity: "সাম্প্রতিক কার্যক্রম",
    noTestsYet: "এখনো কোনো পরীক্ষা সম্পন্ন হয়নি।",
    startFreeDiagnostic: "বিনামূল্যে ডায়াগনস্টিক শুরু করুন →",
    testsTaken: "পরীক্ষা দেওয়া হয়েছে",
    bestBand: "সেরা ব্যান্ড",
    averageBand: "গড় ব্যান্ড",
    target: "লক্ষ্যমাত্রা",
    achieved: "অর্জিত 🎉",
    inProgress: "চলমান",
    overall: "সামগ্রিক",
    allTests: "সব পরীক্ষা",
    viewAll: "সব দেখুন",
    // Exam list
    availableTests: "উপলব্ধ পরীক্ষা",
    searchTests: "পরীক্ষা খুঁজুন…",
    noTestsAvailable: "এখনো কোনো পরীক্ষা নেই",
    noTestsMatch: "কোনো পরীক্ষা মেলেনি",
    startTest: "পরীক্ষা শুরু করুন",
    opening: "খোলা হচ্ছে…",
    viewPastResults: "আপনার আগের ফলাফল দেখুন",
    // Getting started
    setTargetBand: "আপনার লক্ষ্য ব্যান্ড নির্ধারণ করুন",
    takeDiagnostic: "বিনামূল্যে ডায়াগনস্টিক দিন",
    practiceModule: "একটি মডিউল অনুশীলন করুন",
    completeMock: "একটি ফুল মক পরীক্ষা সম্পন্ন করুন",
    // Writing / Speaking
    pro: "প্রো",
    free: "বিনামূল্যে",
    instant: "তাৎক্ষণিক ব্যান্ড",
    duration: "সময়কাল",
    scoring: "স্কোরিং",
    // Affiliate
    affiliateDashboard: "অ্যাফিলিয়েট ড্যাশবোর্ড",
    referralLink: "রেফারেল লিংক",
    yourCode: "আপনার কোড",
    copyLink: "লিংক কপি করুন",
    copyCode: "কোড কপি করুন",
    copied: "কপি হয়েছে!",
    totalReferrals: "মোট রেফারেল",
    confirmedEarnings: "নিশ্চিত আয়",
    pendingEarnings: "অপেক্ষমাণ আয়",
    commissionRate: "কমিশন হার",
    yourReferrals: "আপনার রেফারেলসমূহ",
    noReferralsYet: "এখনো কোনো রেফারেল নেই। আয় শুরু করতে আপনার লিংক শেয়ার করুন!",
    notAffiliate: "আপনি এখনো অ্যাফিলিয়েট নন",
    notAffiliateDesc: "অ্যাফিলিয়েট প্রোগ্রামে যোগ দিতে এবং প্রতিটি সাবস্ক্রাইবারের জন্য কমিশন আয় শুরু করতে আমাদের সাথে যোগাযোগ করুন।",
  },
};

const LangContext = createContext({ lang: "en", t: translations.en, setLang: () => {} });

function applyLang(code) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
  if (code === "bn") {
    document.documentElement.classList.add("lang-bn");
    if (!document.getElementById("ia-bn-font")) {
      const link = document.createElement("link");
      link.id = "ia-bn-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  } else {
    document.documentElement.classList.remove("lang-bn");
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const code = (saved && translations[saved]) ? saved : "en";
    setLangState(code);
    applyLang(code);
  }, []);

  const setLang = (code) => {
    setLangState(code);
    applyLang(code);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, code);
  };

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}