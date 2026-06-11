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
    // Greetings
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    // Dashboard hero
    welcomeTitle: "Welcome to IELTS Anywhere",
    welcomeText: "Let's estimate your IELTS level first with a short diagnostic — then we'll guide your practice.",
    startFreeDiagnosticBtn: "Start Free Diagnostic",
    targetBand: "Target band",
    moduleBreakdown: "Module breakdown",
    noModuleData: "Complete a test to see your per-module band breakdown here. Start with a free diagnostic to estimate your current level.",
    // Dashboard stats
    testsTaken: "Tests taken",
    bestBand: "Best band",
    averageBand: "Average band",
    target: "Target",
    achieved: "achieved 🎉",
    inProgress: "in progress",
    overall: "overall",
    allTests: "all tests",
    viewAll: "View all",
    // Getting started
    gettingStarted: "Getting started",
    pctComplete: "% complete",
    setTargetBand: "Set your target band",
    takeDiagnostic: "Take a free diagnostic",
    practiceModule: "Practice a module",
    completeMock: "Complete a full mock test",
    // Practice cards
    startPractice: "Start practice",
    practiceCta: "Practice",
    unlock: "Unlock",
    readingSub: "Practice passages and question types, untimed and pressure-free.",
    listeningSub: "Train with authentic audio and exam-style questions.",
    writingSub: "Task 1 & 2 with AI grading on all four criteria.",
    speakingSub: "3-part simulation with AI evaluation and feedback.",
    // Recent activity
    recentActivity: "Recent activity",
    noTestsYet: "No completed tests yet.",
    startFreeDiagnostic: "Start your free diagnostic →",
    ieltsTestFallback: "IELTS test",
    needsAttention: "Needs attention",
    focusHere: "— focus here to raise your overall score.",
    // Dashboard tabs
    overviewTab: "Overview",
    progressTab: "Progress",
    studyPlanTab: "Study Plan",
    vocabularyTab: "Vocabulary",
    // Progress section
    bandScoreHistory: "Band score history",
    complete2Tests: "Complete at least 2 tests to see your progress chart.",
    overallLegend: "Overall",
    trackProgressTitle: "Track your progress over time",
    trackProgressDesc: "Pro unlocks band-score history charts and module trend tracking so you can see exactly how you improve.",
    // Study plan
    criterionAnalysis: "Criterion analysis",
    weakest: "Weakest:",
    completeCritTests: "Complete Writing or Speaking tests to see criterion-level analysis.",
    completeTipsTests: "Complete more tests to generate tips.",
    studyPlanTitle: "Get a personalized study plan",
    studyPlanDesc: "Pro turns your Writing and Speaking AI feedback into module-by-module tips and criterion-level weakness analysis.",
    // Vocabulary section
    vocabTipsNote: "Vocabulary tips extracted from your Writing and Speaking AI feedback.",
    practiceExercisesBtn: "Practice exercises",
    noVocabTips: "No vocabulary tips yet — complete Writing and Speaking modules to generate feedback.",
    buildVocabTitle: "Build exam-ready vocabulary",
    buildVocabDesc: "Pro extracts vocabulary tips from your AI feedback and unlocks dedicated vocabulary and grammar exercises.",
    // Shared learn pages
    back: "← Back",
    generateExercises: "Generate exercises",
    refresh: "Refresh ↺",
    studyTipLabel: "Study tip:",
    proRequired: "Pro subscription required.",
    failedGenerate: "Failed to generate exercises. Try again.",
    // Grammar page
    grammarPractice: "Grammar Practice",
    grammarDesc: "AI-generated exercises targeting your grammatical weak points.",
    grammarGenDesc: "Generate grammar exercises based on patterns identified in your Writing and Speaking tests. Exercises are tailored to your current band level.",
    exercises: "Exercises",
    grammarPatterns: "Grammar Patterns",
    exampleLabel: "Example",
    yourTurn: "Your turn — transform this sentence",
    modelAnswer: "Model answer",
    showModelAnswer: "Show model answer",
    commonError: "Common error:",
    activeDirect: "Active / Direct",
    preferredTransformed: "Preferred / Transformed",
    // Vocabulary page
    vocabPractice: "Vocabulary Practice",
    vocabDesc: "AI-generated exercises personalised to your IELTS weak areas.",
    vocabGenDesc: "Click below to generate vocabulary exercises tailored to your performance history. Each set focuses on lexical gaps identified in your Writing and Speaking tests.",
    gapFill: "Gap fill",
    showAnswer: "Show answer",
    collocations: "Collocations:",
    wordsAndExpressions: "Words & Expressions",
    academicPhrases: "Academic Phrases",
    showExampleSentence: "Show example sentence",
    // Exam list
    availableTests: "Available tests",
    searchTests: "Search tests…",
    noTestsAvailable: "No tests available yet",
    noTestsMatch: "No tests match",
    startTest: "Start test",
    opening: "Opening…",
    viewPastResults: "View your past results",
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
    // Greetings
    goodMorning: "শুভ সকাল",
    goodAfternoon: "শুভ বিকেল",
    goodEvening: "শুভ সন্ধ্যা",
    // Dashboard hero
    welcomeTitle: "IELTS Anywhere-তে স্বাগতম",
    welcomeText: "চলুন প্রথমে একটি ছোট ডায়াগনস্টিকের মাধ্যমে আপনার IELTS স্তর নির্ধারণ করি — তারপর আমরা আপনার অনুশীলন পরিচালনা করব।",
    startFreeDiagnosticBtn: "বিনামূল্যে ডায়াগনস্টিক শুরু করুন",
    targetBand: "লক্ষ্য ব্যান্ড",
    moduleBreakdown: "মডিউল বিশ্লেষণ",
    noModuleData: "এখানে প্রতিটি মডিউলের ব্যান্ড দেখতে একটি পরীক্ষা দিন। আপনার বর্তমান স্তর বোঝার জন্য বিনামূল্যে ডায়াগনস্টিক দিয়ে শুরু করুন।",
    // Dashboard stats
    testsTaken: "পরীক্ষা দেওয়া হয়েছে",
    bestBand: "সেরা ব্যান্ড",
    averageBand: "গড় ব্যান্ড",
    target: "লক্ষ্যমাত্রা",
    achieved: "অর্জিত 🎉",
    inProgress: "চলমান",
    overall: "সামগ্রিক",
    allTests: "সব পরীক্ষা",
    viewAll: "সব দেখুন",
    // Getting started
    gettingStarted: "শুরু করুন",
    pctComplete: "% সম্পন্ন",
    setTargetBand: "আপনার লক্ষ্য ব্যান্ড নির্ধারণ করুন",
    takeDiagnostic: "বিনামূল্যে ডায়াগনস্টিক দিন",
    practiceModule: "একটি মডিউল অনুশীলন করুন",
    completeMock: "একটি ফুল মক পরীক্ষা সম্পন্ন করুন",
    // Practice cards
    startPractice: "অনুশীলন শুরু করুন",
    practiceCta: "অনুশীলন করুন",
    unlock: "আনলক করুন",
    readingSub: "বিনা সময়সীমায় পাসেজ ও প্রশ্নের ধরন অনুশীলন করুন।",
    listeningSub: "প্রামাণিক অডিও ও পরীক্ষার মতো প্রশ্ন দিয়ে অনুশীলন করুন।",
    writingSub: "চারটি মানদণ্ডে AI মূল্যায়নসহ Task 1 ও 2 অনুশীলন।",
    speakingSub: "AI মূল্যায়ন ও ফিডব্যাকসহ ৩-অংশের সিমুলেশন।",
    // Recent activity
    recentActivity: "সাম্প্রতিক কার্যক্রম",
    noTestsYet: "এখনো কোনো পরীক্ষা সম্পন্ন হয়নি।",
    startFreeDiagnostic: "বিনামূল্যে ডায়াগনস্টিক শুরু করুন →",
    ieltsTestFallback: "IELTS পরীক্ষা",
    needsAttention: "মনোযোগ প্রয়োজন",
    focusHere: "— সামগ্রিক স্কোর বাড়াতে এখানে মনোযোগ দিন।",
    // Dashboard tabs
    overviewTab: "ওভারভিউ",
    progressTab: "অগ্রগতি",
    studyPlanTab: "পড়ার পরিকল্পনা",
    vocabularyTab: "শব্দভাণ্ডার",
    // Progress section
    bandScoreHistory: "ব্যান্ড স্কোরের ইতিহাস",
    complete2Tests: "অগ্রগতির চার্ট দেখতে কমপক্ষে ২টি পরীক্ষা সম্পন্ন করুন।",
    overallLegend: "সামগ্রিক",
    trackProgressTitle: "সময়ের সাথে আপনার অগ্রগতি ট্র্যাক করুন",
    trackProgressDesc: "প্রো আনলক করলে ব্যান্ড স্কোরের ইতিহাস চার্ট এবং মডিউল ট্রেন্ড ট্র্যাকিং পাবেন, যাতে আপনি ঠিক বুঝতে পারবেন কতটা উন্নতি হচ্ছে।",
    // Study plan
    criterionAnalysis: "মানদণ্ড বিশ্লেষণ",
    weakest: "দুর্বলতম:",
    completeCritTests: "মানদণ্ড বিশ্লেষণ দেখতে Writing বা Speaking পরীক্ষা সম্পন্ন করুন।",
    completeTipsTests: "পরামর্শ তৈরি করতে আরও পরীক্ষা দিন।",
    studyPlanTitle: "ব্যক্তিগতকৃত পড়ার পরিকল্পনা পান",
    studyPlanDesc: "প্রো আপনার Writing ও Speaking AI ফিডব্যাককে মডিউল-ওয়ারি পরামর্শ এবং মানদণ্ড-স্তরের দুর্বলতা বিশ্লেষণে রূপান্তরিত করে।",
    // Vocabulary section
    vocabTipsNote: "আপনার Writing ও Speaking AI ফিডব্যাক থেকে শব্দভাণ্ডার পরামর্শ নেওয়া হয়েছে।",
    practiceExercisesBtn: "অনুশীলন এক্সারসাইজ",
    noVocabTips: "এখনো কোনো শব্দভাণ্ডার পরামর্শ নেই — ফিডব্যাক তৈরি করতে Writing ও Speaking মডিউল সম্পন্ন করুন।",
    buildVocabTitle: "পরীক্ষার জন্য শব্দভাণ্ডার তৈরি করুন",
    buildVocabDesc: "প্রো আপনার AI ফিডব্যাক থেকে শব্দভাণ্ডার পরামর্শ নিষ্কাশন করে এবং ডেডিকেটেড শব্দভাণ্ডার ও ব্যাকরণ এক্সারসাইজ আনলক করে।",
    // Shared learn pages
    back: "← পিছনে",
    generateExercises: "এক্সারসাইজ তৈরি করুন",
    refresh: "রিফ্রেশ ↺",
    studyTipLabel: "পড়ার পরামর্শ:",
    proRequired: "প্রো সদস্যতা প্রয়োজন।",
    failedGenerate: "এক্সারসাইজ তৈরি করতে ব্যর্থ। আবার চেষ্টা করুন।",
    // Grammar page
    grammarPractice: "ব্যাকরণ অনুশীলন",
    grammarDesc: "আপনার ব্যাকরণগত দুর্বলতা লক্ষ্য করে AI-তৈরি এক্সারসাইজ।",
    grammarGenDesc: "আপনার Writing ও Speaking পরীক্ষায় চিহ্নিত ধরনের উপর ভিত্তি করে ব্যাকরণ এক্সারসাইজ তৈরি করুন। এক্সারসাইজগুলো আপনার বর্তমান ব্যান্ড স্তর অনুযায়ী তৈরি।",
    exercises: "এক্সারসাইজ",
    grammarPatterns: "ব্যাকরণের ধরন",
    exampleLabel: "উদাহরণ",
    yourTurn: "আপনার পালা — এই বাক্যটি রূপান্তরিত করুন",
    modelAnswer: "আদর্শ উত্তর",
    showModelAnswer: "আদর্শ উত্তর দেখুন",
    commonError: "সাধারণ ভুল:",
    activeDirect: "সক্রিয় / সরাসরি",
    preferredTransformed: "পছন্দনীয় / রূপান্তরিত",
    // Vocabulary page
    vocabPractice: "শব্দভাণ্ডার অনুশীলন",
    vocabDesc: "আপনার IELTS দুর্বল ক্ষেত্রের জন্য AI-ব্যক্তিগতকৃত এক্সারসাইজ।",
    vocabGenDesc: "আপনার পারফরম্যান্সের ইতিহাস অনুযায়ী শব্দভাণ্ডার এক্সারসাইজ তৈরি করতে নিচে ক্লিক করুন। প্রতিটি সেট আপনার Writing ও Speaking পরীক্ষায় চিহ্নিত শব্দভাণ্ডারের ঘাটতিতে মনোযোগ দেয়।",
    gapFill: "শূন্যস্থান পূরণ",
    showAnswer: "উত্তর দেখুন",
    collocations: "শব্দ-সমাহার:",
    wordsAndExpressions: "শব্দ ও প্রকাশভঙ্গি",
    academicPhrases: "একাডেমিক বাক্যাংশ",
    showExampleSentence: "উদাহরণ বাক্য দেখুন",
    // Exam list
    availableTests: "উপলব্ধ পরীক্ষা",
    searchTests: "পরীক্ষা খুঁজুন…",
    noTestsAvailable: "এখনো কোনো পরীক্ষা নেই",
    noTestsMatch: "কোনো পরীক্ষা মেলেনি",
    startTest: "পরীক্ষা শুরু করুন",
    opening: "খোলা হচ্ছে…",
    viewPastResults: "আপনার আগের ফলাফল দেখুন",
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