"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Headphones,
  Lightbulb,
  RefreshCw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

const PROGRESS_KEY = "ielts_vocab_srs_v1";

const WORD_BANK = [
  {
    word: "mitigate",
    module: "Writing",
    topic: "Environment",
    band: "7+",
    partOfSpeech: "verb",
    definition: "to make a problem, risk, or effect less severe",
    example: "Governments can mitigate air pollution by improving public transport.",
    mnemonic: "Imagine a heavy gate blocking smoke; closing the gate mitigates the damage.",
    collocations: ["mitigate risk", "mitigate climate change", "mitigate the impact"],
  },
  {
    word: "substantial",
    module: "Writing",
    topic: "Writing Task 1",
    band: "7+",
    partOfSpeech: "adjective",
    definition: "large in amount, value, or importance",
    example: "There was a substantial increase in online sales after 2015.",
    mnemonic: "Substance means something real; substantial means a real, noticeable amount.",
    collocations: ["substantial increase", "substantial evidence", "substantial investment"],
  },
  {
    word: "prevalent",
    module: "Speaking",
    topic: "Society",
    band: "7+",
    partOfSpeech: "adjective",
    definition: "common or widespread in a particular place or time",
    example: "Remote work has become more prevalent in many industries.",
    mnemonic: "Prevalent sounds like present everywhere.",
    collocations: ["highly prevalent", "prevalent among", "prevalent in society"],
  },
  {
    word: "detrimental",
    module: "Speaking",
    topic: "Health",
    band: "7+",
    partOfSpeech: "adjective",
    definition: "causing harm or damage",
    example: "A sedentary lifestyle can be detrimental to long-term health.",
    mnemonic: "Detrimental has detriment inside it; detriment means harm.",
    collocations: ["detrimental effect", "detrimental to health", "environmentally detrimental"],
  },
  {
    word: "allocate",
    module: "Writing",
    topic: "Education",
    band: "6.5+",
    partOfSpeech: "verb",
    definition: "to officially set aside money, time, or resources for a purpose",
    example: "Schools should allocate more funding to teacher training.",
    mnemonic: "A location for each resource: allocate means put it in its place.",
    collocations: ["allocate resources", "allocate funding", "allocate time"],
  },
  {
    word: "coherent",
    module: "Writing",
    topic: "Writing",
    band: "7+",
    partOfSpeech: "adjective",
    definition: "clear, logical, and easy to understand",
    example: "A coherent essay uses clear topic sentences and logical transitions.",
    mnemonic: "Co-here: all ideas are here together in a sensible order.",
    collocations: ["coherent argument", "coherent structure", "coherent response"],
  },
  {
    word: "scarce",
    module: "Reading",
    topic: "Resources",
    band: "6.5+",
    partOfSpeech: "adjective",
    definition: "not available in large enough quantities",
    example: "Clean water is scarce in some rural communities.",
    mnemonic: "Scarce sounds like scared; people get scared when resources run out.",
    collocations: ["scarce resources", "increasingly scarce", "scarce supply"],
  },
  {
    word: "notion",
    module: "Reading",
    topic: "Ideas",
    band: "6.5+",
    partOfSpeech: "noun",
    definition: "an idea, belief, or understanding of something",
    example: "The notion that technology always reduces inequality is too simplistic.",
    mnemonic: "A notion is a note in your mind.",
    collocations: ["popular notion", "reject the notion", "basic notion"],
  },
  {
    word: "incentive",
    module: "Listening",
    topic: "Work",
    band: "7+",
    partOfSpeech: "noun",
    definition: "something that encourages a person to do something",
    example: "Tax reductions can provide an incentive for companies to hire graduates.",
    mnemonic: "In-cent-ive: money cents can push people into action.",
    collocations: ["financial incentive", "strong incentive", "provide an incentive"],
  },
  {
    word: "consequence",
    module: "Writing",
    topic: "Cause and Effect",
    band: "6.5+",
    partOfSpeech: "noun",
    definition: "a result or effect of an action or situation",
    example: "One consequence of urbanisation is increased demand for housing.",
    mnemonic: "Con-sequence: what comes in sequence after an action.",
    collocations: ["serious consequence", "as a consequence", "long-term consequences"],
  },
  {
    word: "whereas",
    module: "Writing",
    topic: "Contrast",
    band: "6.5+",
    partOfSpeech: "conjunction",
    definition: "used to compare two facts and show contrast",
    example: "The north experienced rapid growth, whereas the south remained stable.",
    mnemonic: "Whereas creates a bridge between two different places or ideas.",
    collocations: ["whereas the figure", "whereas others", "whereas in contrast"],
  },
  {
    word: "feasible",
    module: "Speaking",
    topic: "Planning",
    band: "7+",
    partOfSpeech: "adjective",
    definition: "possible and practical to do",
    example: "It is not feasible for every city to ban private cars completely.",
    mnemonic: "Feasible feels like doable.",
    collocations: ["feasible solution", "economically feasible", "technically feasible"],
  },
  {
    word: "venue",
    module: "Listening",
    topic: "Places",
    band: "6+",
    partOfSpeech: "noun",
    definition: "the place where an event or activity happens",
    example: "The conference venue is close to the central train station.",
    mnemonic: "Venue sounds like where you go for an event.",
    collocations: ["conference venue", "wedding venue", "change the venue"],
  },
  {
    word: "deposit",
    module: "Listening",
    topic: "Bookings",
    band: "6+",
    partOfSpeech: "noun",
    definition: "money paid in advance to reserve something",
    example: "Students must pay a small deposit to reserve a room.",
    mnemonic: "Deposit means you put money down before the full payment.",
    collocations: ["pay a deposit", "refundable deposit", "security deposit"],
  },
  {
    word: "approximately",
    module: "Listening",
    topic: "Numbers",
    band: "6+",
    partOfSpeech: "adverb",
    definition: "almost, but not exactly",
    example: "The journey takes approximately forty minutes by bus.",
    mnemonic: "Approx means close; approximately means close to the real number.",
    collocations: ["approximately half", "approximately 20 percent", "approximately the same"],
  },
  {
    word: "infer",
    module: "Reading",
    topic: "Question Skills",
    band: "7+",
    partOfSpeech: "verb",
    definition: "to understand something from evidence rather than direct statement",
    example: "Readers can infer the writer's attitude from the final paragraph.",
    mnemonic: "Infer means information enters your mind from clues.",
    collocations: ["infer meaning", "infer from context", "reasonably infer"],
  },
  {
    word: "contradict",
    module: "Reading",
    topic: "Question Skills",
    band: "6.5+",
    partOfSpeech: "verb",
    definition: "to say or show that something is opposite or not true",
    example: "The second study appears to contradict earlier research.",
    mnemonic: "Contra means against; contradict means speak against.",
    collocations: ["contradict a claim", "contradict evidence", "directly contradict"],
  },
  {
    word: "elaborate",
    module: "Speaking",
    topic: "Fluency",
    band: "7+",
    partOfSpeech: "verb",
    definition: "to explain something in more detail",
    example: "I would like to elaborate on why public parks matter.",
    mnemonic: "Elaborate means add layers to an idea.",
    collocations: ["elaborate on a point", "elaborate answer", "elaborate explanation"],
  },
];

const MODULES = ["All", "Listening", "Reading", "Writing", "Speaking"];

const s = {
  wrap: { maxWidth: 1060, margin: "0 auto", padding: "38px 20px 56px" },
  muted: { color: "#64748b" },
  card: {
    background: "#fff",
    border: "1px solid #e6e8ef",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(15,23,42,.04)",
  },
  btn: {
    border: "none",
    borderRadius: 11,
    padding: "10px 15px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 9px",
    fontSize: 11.5,
    fontWeight: 700,
    gap: 5,
  },
};

function readProgress() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(next) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  }
}

function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z\s-]/g, "");
}

function buildGap(example, word) {
  const rx = new RegExp(`\\b${word}\\b`, "i");
  if (rx.test(example)) return example.replace(rx, "_____");
  return `${example} (${word.length} letters: _____)`;
}

function mergeWordData(base, dictionaryEntry, relatedWords) {
  const firstMeaning = dictionaryEntry?.meanings?.[0];
  const firstDefinition = firstMeaning?.definitions?.[0];
  const phonetic = dictionaryEntry?.phonetic || dictionaryEntry?.phonetics?.find((p) => p.text)?.text;
  const audio = dictionaryEntry?.phonetics?.find((p) => p.audio)?.audio;
  const synonyms = [
    ...(firstMeaning?.synonyms || []),
    ...(firstDefinition?.synonyms || []),
    ...(relatedWords || []).map((item) => item.word),
  ];

  return {
    ...base,
    partOfSpeech: firstMeaning?.partOfSpeech || base.partOfSpeech,
    definition: firstDefinition?.definition || base.definition,
    example: firstDefinition?.example || base.example,
    phonetic,
    audio,
    related: Array.from(new Set(synonyms.filter(Boolean))).slice(0, 8),
    source: dictionaryEntry ? "Free Dictionary API + Datamuse" : "IELTS Anywhere word bank",
  };
}

async function fetchWordDetails(base) {
  const dictionaryUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(base.word)}`;
  const datamuseUrl = `https://api.datamuse.com/words?ml=${encodeURIComponent(base.word)}&topics=${encodeURIComponent(base.topic)}&max=8`;

  const [dictionaryResult, datamuseResult] = await Promise.allSettled([
    fetch(dictionaryUrl).then((res) => {
      if (!res.ok) throw new Error("No dictionary result");
      return res.json();
    }),
    fetch(datamuseUrl).then((res) => {
      if (!res.ok) throw new Error("No Datamuse result");
      return res.json();
    }),
  ]);

  const dictionaryEntry =
    dictionaryResult.status === "fulfilled" && Array.isArray(dictionaryResult.value)
      ? dictionaryResult.value[0]
      : null;
  const relatedWords = datamuseResult.status === "fulfilled" ? datamuseResult.value : [];

  return mergeWordData(base, dictionaryEntry, relatedWords);
}

function Stat({ label, value, icon }) {
  return (
    <div style={{ ...s.card, padding: "15px 16px", flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 12.5, marginBottom: 8 }}>
        {icon}
        {label}
      </div>
      <div style={{ color: "#0f172a", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function SearchableDropdown({ label, value, options, onChange, placeholder = "Search" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter((item) =>
    item.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const choose = (item) => {
    onChange(item);
    setQuery("");
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", maxWidth: 360 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        style={{
          ...s.btn,
          width: "100%",
          justifyContent: "space-between",
          background: "#fff",
          color: "#0f172a",
          border: "1px solid #dbe1ea",
          padding: "10px 12px",
          fontWeight: 800,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
        {open ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          zIndex: 30,
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #dbe1ea",
          borderRadius: 12,
          boxShadow: "0 18px 40px rgba(15,23,42,.12)",
          padding: 8,
        }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #e6e8ef",
              borderRadius: 9,
              padding: "9px 10px",
              fontSize: 13,
              outline: "none",
              marginBottom: 8,
            }}
          />
          <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => choose(item)}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    background: item === value ? "#ecfdf5" : "transparent",
                    color: item === value ? "#047857" : "#334155",
                    cursor: "pointer",
                    padding: "9px 10px",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: item === value ? 800 : 600,
                  }}
                >
                  {item}
                </button>
              ))
            ) : (
              <div style={{ padding: "12px 10px", color: "#94a3b8", fontSize: 13 }}>
                No matching topics
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleTopicPicker({ module, setModule, topic, setTopic, topics }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Module
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODULES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setModule(item)}
              style={{
                ...s.btn,
                padding: "8px 12px",
                background: module === item ? "#eef2ff" : "#fff",
                color: module === item ? "#4f46e5" : "#64748b",
                border: `1px solid ${module === item ? "#c7d2fe" : "#e6e8ef"}`,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SearchableDropdown
          label="Topic"
          value={topic}
          options={topics}
          onChange={setTopic}
          placeholder="Search topics"
        />
      </div>
    </div>
  );
}

function RememberTechnique({ word }) {
  return (
    <div style={{ ...s.card, padding: 18, background: "#fffbeb", borderColor: "#fde68a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#92400e", fontWeight: 800, marginBottom: 10 }}>
        <Lightbulb size={17} />
        Remember it in 3 steps
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
        {[
          ["Picture", word.mnemonic],
          ["Connect", `Use it with: ${word.collocations?.[0] || word.word}`],
          ["Produce", `Say one IELTS sentence with "${word.word}" before moving on.`],
        ].map(([title, body]) => (
          <div key={title} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#b45309", marginBottom: 5 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.55 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewButtons({ onRate }) {
  const items = [
    ["again", "Again", "#fee2e2", "#b91c1c"],
    ["hard", "Hard", "#ffedd5", "#c2410c"],
    ["good", "Good", "#dcfce7", "#15803d"],
    ["easy", "Easy", "#e0f2fe", "#0369a1"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
      {items.map(([rating, label, bg, color]) => (
        <button
          key={rating}
          type="button"
          onClick={() => onRate(rating)}
          style={{ ...s.btn, background: bg, color, padding: "11px 8px" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AiExerciseCard({ data, loading, error, onGenerate }) {
  return (
    <div style={{
      ...s.card,
      padding: 22,
      marginBottom: 18,
      border: "1px solid #c7d2fe",
      background: "linear-gradient(135deg,#eef2ff 0%,#ffffff 58%,#f0fdf4 100%)",
      boxShadow: "0 18px 44px rgba(79,70,229,.12)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ ...s.tag, background: "#4f46e5", color: "#fff", marginBottom: 10 }}>
            Recommended
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a", marginBottom: 5, fontSize: 18 }}>
            <Sparkles size={17} color="#6366f1" />
            Personalized AI set
          </div>
          <p style={{ ...s.muted, fontSize: 13.5, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
            Priority path: use backend vocabulary from your module, topic, and Writing/Speaking feedback to create a sharper practice set.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          style={{ ...s.btn, background: "#4f46e5", color: "#fff", opacity: loading ? 0.7 : 1, boxShadow: "0 8px 18px rgba(79,70,229,.22)" }}
        >
          <RefreshCw size={14} />
          Generate
        </button>
      </div>

      {loading && <PetLoader label="is building your exercises" size={88} />}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, color: "#b91c1c", fontSize: 13 }}>
          {error}
        </div>
      )}
      {data?.exercises?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.exercises.slice(0, 3).map((item) => (
            <div key={item.word} style={{ border: "1px solid #eef0f5", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{item.word}</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{item.definition}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VocabularyPractice({ showBack = true }) {
  const router = useRouter();
  const [module, setModuleState] = useState("All");
  const [topic, setTopic] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailsByWord, setDetailsByWord] = useState({});
  const [loadingWord, setLoadingWord] = useState(false);
  const [apiError, setApiError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [progress, setProgress] = useState(readProgress);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [wordBank, setWordBank] = useState(WORD_BANK);

  useEffect(() => {
    api.getVocabularyWords().then(setWordBank).catch(() => {});
  }, []);

  const topics = useMemo(() => {
    const scoped = wordBank.filter((item) => module === "All" || item.module === module);
    return ["All", ...Array.from(new Set(scoped.map((item) => item.topic)))];
  }, [module, wordBank]);

  const filteredWords = useMemo(
    () => wordBank.filter((item) => {
      const matchesModule = module === "All" || item.module === module;
      const matchesTopic = topic === "All" || item.topic === topic;
      return matchesModule && matchesTopic;
    }),
    [module, topic, wordBank],
  );

  const baseWord = filteredWords[activeIndex] || filteredWords[0] || wordBank[0];
  const word = detailsByWord[baseWord.word] || baseWord;
  const wordProgress = progress[baseWord.word] || { box: 0, seen: 0, correct: 0 };
  const mastered = Object.values(progress).filter((item) => item.box >= 3).length;
  const studied = Object.keys(progress).length;
  const gapSentence = buildGap(word.example, word.word);

  const resetPracticeState = () => {
    setActiveIndex(0);
    setRevealed(false);
    setAnswer("");
    setFeedback(null);
  };

  const selectModule = (nextModule) => {
    setModuleState(nextModule);
    setTopic("All");
    resetPracticeState();
  };

  const selectTopic = (nextTopic) => {
    setTopic(nextTopic);
    resetPracticeState();
  };

  const enrichCurrentWord = async () => {
    setLoadingWord(true);
    setApiError("");
    try {
      const details = await fetchWordDetails(baseWord);
      setDetailsByWord((prev) => ({ ...prev, [baseWord.word]: details }));
    } catch {
      setApiError("Open vocabulary APIs are unavailable right now, so the local IELTS word bank is being used.");
    } finally {
      setLoadingWord(false);
    }
  };

  const moveCard = (step) => {
    const next = (activeIndex + step + filteredWords.length) % filteredWords.length;
    setActiveIndex(next);
    setRevealed(false);
    setAnswer("");
    setFeedback(null);
  };

  const checkAnswer = () => {
    const ok = normalizeAnswer(answer) === normalizeAnswer(word.word);
    setFeedback(ok ? "correct" : "try-again");
    if (ok) setRevealed(true);
  };

  const rateCard = (rating) => {
    const delta = { again: -1, hard: 0, good: 1, easy: 2 }[rating] ?? 1;
    const nextProgress = {
      ...progress,
      [baseWord.word]: {
        box: Math.max(0, Math.min(5, (wordProgress.box || 0) + delta)),
        seen: (wordProgress.seen || 0) + 1,
        correct: (wordProgress.correct || 0) + (rating === "again" ? 0 : 1),
        lastRating: rating,
        reviewedAt: new Date().toISOString(),
      },
    };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    moveCard(1);
  };

  const generateAiSet = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const result = await api.getVocabularyExercises();
      setAiData(result);
    } catch (e) {
      setAiError(e.message?.includes("403") ? "Pro subscription required." : "Could not generate personalized exercises right now.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      {showBack && (
        <button
          type="button"
          onClick={() => router.back()}
          style={{ ...s.btn, background: "#fff", color: "#64748b", border: "1px solid #e6e8ef", marginBottom: 20 }}
        >
          <ArrowLeft size={15} />
          Back
        </button>
      )}

      <div style={{ marginBottom: 22 }}>
        <div>
          <div style={{ ...s.tag, background: "#eef2ff", color: "#4f46e5", marginBottom: 10 }}>
            <Brain size={13} />
            Open API vocabulary trainer
          </div>
          <h1 style={{ margin: "0 0 7px", color: "#0f172a", fontSize: 28, fontWeight: 850 }}>IELTS Vocabulary Practice</h1>
          <p style={{ ...s.muted, margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 620 }}>
            Practice high-value IELTS words with recall, mnemonics, collocations, pronunciation, and spaced review.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <Stat label="Words studied" value={studied} icon={<Target size={15} />} />
        <Stat label="Mastered" value={mastered} icon={<CheckCircle2 size={15} />} />
        <Stat label="Current box" value={wordProgress.box || 0} icon={<Brain size={15} />} />
      </div>

      <AiExerciseCard data={aiData} loading={aiLoading} error={aiError} onGenerate={generateAiSet} />

      <div style={{ ...s.card, padding: 18, marginBottom: 18 }}>
        <ModuleTopicPicker
          module={module}
          setModule={selectModule}
          topic={topic}
          setTopic={selectTopic}
          topics={topics}
        />
      </div>

      <div className="vocab-practice-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(280px,.8fr)", gap: 18, alignItems: "start" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section style={{ ...s.card, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{word.word}</span>
                  <span style={{ ...s.tag, background: "#e0f2fe", color: "#0369a1" }}>{word.partOfSpeech}</span>
                  <span style={{ ...s.tag, background: "#eef2ff", color: "#4f46e5" }}>{word.module}</span>
                  <span style={{ ...s.tag, background: "#f0fdf4", color: "#166534" }}>{word.topic}</span>
                  <span style={{ ...s.tag, background: "#faf5ff", color: "#7c3aed" }}>Band {word.band}</span>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12.5 }}>
                  Source: {word.source || "IELTS Anywhere word bank"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                <button
                  type="button"
                  onClick={enrichCurrentWord}
                  disabled={loadingWord}
                  style={{ ...s.btn, background: "#4f46e5", color: "#fff", minWidth: 160, opacity: loadingWord ? 0.75 : 1 }}
                >
                  {loadingWord ? <RefreshCw size={15} /> : <Search size={15} />}
                  {loadingWord ? "Loading" : "Enrich this word"}
                </button>
                {word.audio && (
                  <button
                    type="button"
                    onClick={() => new Audio(word.audio).play()}
                    style={{ ...s.btn, background: "#eff6ff", color: "#2563eb" }}
                  >
                    <Headphones size={15} />
                    Listen {word.phonetic || ""}
                  </button>
                )}
              </div>
            </div>

            {apiError && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 14 }}>
                {apiError}
              </div>
            )}

            <div style={{ background: "#f8fafc", border: "1px solid #eef0f5", borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Recall challenge
              </div>
              <p style={{ margin: "0 0 12px", color: "#334155", fontSize: 15, lineHeight: 1.6 }}>{gapSentence}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setFeedback(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") checkAnswer();
                  }}
                  placeholder="Type the missing word"
                  style={{
                    flex: 1,
                    minWidth: 180,
                    border: "1px solid #dbe1ea",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button type="button" onClick={checkAnswer} style={{ ...s.btn, background: "#0f172a", color: "#fff" }}>
                  Check
                </button>
                <button type="button" onClick={() => setRevealed(true)} style={{ ...s.btn, background: "#fff", color: "#64748b", border: "1px solid #e6e8ef" }}>
                  Reveal
                </button>
              </div>
              {feedback === "correct" && <div style={{ color: "#15803d", fontWeight: 700, fontSize: 13, marginTop: 10 }}>Correct. Now rate how well you remembered it.</div>}
              {feedback === "try-again" && <div style={{ color: "#b91c1c", fontWeight: 700, fontSize: 13, marginTop: 10 }}>Not quite. Check the clue, then try again.</div>}
            </div>

            {revealed && (
              <div className="vocab-reveal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ border: "1px solid #eef0f5", borderRadius: 14, padding: 15 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Meaning</div>
                  <p style={{ margin: 0, color: "#334155", fontSize: 14, lineHeight: 1.6 }}>{word.definition}</p>
                </div>
                <div style={{ border: "1px solid #eef0f5", borderRadius: 14, padding: 15 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>IELTS sentence</div>
                  <p style={{ margin: 0, color: "#334155", fontSize: 14, lineHeight: 1.6 }}>{word.example}</p>
                </div>
              </div>
            )}

            <RememberTechnique word={word} />

            <div style={{ marginTop: 16 }}>
              <ReviewButtons onRate={rateCard} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => moveCard(-1)} style={{ ...s.btn, background: "#fff", color: "#64748b", border: "1px solid #e6e8ef" }}>
                Previous
              </button>
              <button type="button" onClick={() => moveCard(1)} style={{ ...s.btn, background: "#fff", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                Next word
              </button>
            </div>
          </section>
        </main>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...s.card, padding: 18 }}>
            <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Collocation builder</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {word.collocations?.map((item) => (
                <span key={item} style={{ ...s.tag, background: "#f8fafc", color: "#475569", border: "1px solid #e6e8ef" }}>
                  {item}
                </span>
              ))}
            </div>
            {word.related?.length > 0 && (
              <>
                <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Related words</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {word.related.map((item) => (
                    <span key={item} style={{ ...s.tag, background: "#eef2ff", color: "#4f46e5" }}>{item}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ ...s.card, padding: 18 }}>
            <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Spaced review rule</div>
            <p style={{ ...s.muted, fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>
              Rate each card honestly. Again lowers the box; Good and Easy move it upward. Words in higher boxes are closer to mastered.
            </p>
            <div style={{ height: 9, background: "#eef0f5", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, ((wordProgress.box || 0) / 5) * 100)}%`, height: "100%", background: "#6366f1", borderRadius: 99 }} />
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .vocab-practice-grid,
          .vocab-reveal-grid,
          .vocab-topic-select-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <DashboardShell title="Vocabulary Practice">
      <VocabularyPractice showBack={false} />
    </DashboardShell>
  );
}
