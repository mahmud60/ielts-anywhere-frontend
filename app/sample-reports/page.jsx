"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ── Palette ──────────────────────────────────────────────────────────────────
const PRIMARY  = "#0080ff";
const BORDER   = "#e2e8f0";
const TEXT     = "#0f172a";
const TEXT_SUB = "#475569";
const MUTED    = "#94a3b8";
const PAGE_BG  = "#f8fafc";
const GREEN    = "#059669";
const AMBER    = "#d97706";
const RED      = "#dc2626";

const CRIT_COLOR = {
  task:        "#ef4444",
  coherence:   "#f97316",
  vocabulary:  "#7c3aed",
  grammar:     "#0ea5e9",
  fluency:     "#ef4444",
  vocab:       "#7c3aed",
  grammar_sp:  "#0ea5e9",
  pronun:      "#10b981",
};

function bandColor(b) {
  if (!b) return MUTED;
  if (b >= 7.5) return PRIMARY;
  if (b >= 6.5) return GREEN;
  if (b >= 5)   return AMBER;
  return RED;
}
function bandBg(b) {
  if (!b) return "#f1f5f9";
  if (b >= 7.5) return "#eff6ff";
  if (b >= 6.5) return "#f0fdf4";
  if (b >= 5)   return "#fffbeb";
  return "#fef2f2";
}
function cefrLabel(b) {
  if (b >= 8.5) return "C2";
  if (b >= 7)   return "C1";
  if (b >= 5.5) return "B2";
  if (b >= 4)   return "B1";
  return "A2";
}

// ── Text segmenter ────────────────────────────────────────────────────────────
function segmentText(text, errors) {
  if (!errors?.length) return [{ text }];
  const sorted = errors
    .map(e => ({ ...e, pos: text.indexOf(e.originalText) }))
    .filter(e => e.pos >= 0)
    .sort((a, b) => a.pos - b.pos);
  const clean = [];
  let end = 0;
  for (const e of sorted) {
    if (e.pos >= end) { clean.push(e); end = e.pos + e.originalText.length; }
  }
  const segs = [];
  let pos = 0;
  for (const e of clean) {
    if (e.pos > pos) segs.push({ text: text.slice(pos, e.pos) });
    segs.push({ text: e.originalText, errId: e.id });
    pos = e.pos + e.originalText.length;
  }
  if (pos < text.length) segs.push({ text: text.slice(pos) });
  return segs;
}

// ── Static sample data ────────────────────────────────────────────────────────

const ACADEMIC_ESSAY = `The line graph shows how much milk people in the US drink per person from 1970 to 2014, comparing whole milk and low-fat milk. Overall it is clear that people prefer low fat milk more and more and whole milk go down a lot.

In 1970, Americans drank about 25 gallons of whole milk but only around 6 of low fat. By 1982 the figure for whole milk drops to roughly 20 while low fat increased to about 10 liters. Then, a very big increase, maybe fifty percent. In the 1990s they are almost the same, near 10 each, so the gap is closed. After that whole milk keeps decreasing to 10 in 2000 and about 8 in 2010, then close to 5 percent in 2016. On the other hand, low fat went up to around 18 and then it stayed almost stable for many years before a small fall at the end.

To conclude, people changed their habit and moved from full fat to low fat because of health reasons and advertisements etc. The total amount of milk together were taken about similar over time, but low fat already overtake the other one around 2005 which shows a strong preference of modern peoples. The chart is easy to understand as the trends are obvious.`;

const GENERAL_ESSAY = `Dear Sir or Madam,

I am writing to inform you about an unfortunate accident involving a library book I borrowed last week. I am very sorry to say that the book was damaged when I accidentally spilled coffee on it while reading at home.

I feel very embarrassed and guilty about this accident. I should have been more careful when handling library materials. The book now has several pages with stain and some of them sticked together.

I would like to take full responsibility for this damage. I am happy to pay for the replacement cost of the book or I can buy a new copy and bring it to the library directly. Please let me know what would be more convenient for you.

I sincerely apologise for any inconvenience caused. I look forward to hearing from you.

Yours faithfully,
Ahmed Hassan`;

const TASK2_ESSAY = `The internet has made possible for everybody to read anything online for free. This will make it unnecessary to pay for printed materials such as books or newspapers in the future.

To what extent I agree with this statement. Some people think that printed materials like books and newspapers will not be important in the future. I agree with this idea to some extent because online reading is more easier and faster, and it will reduce the need to pay for traditional materials. However, I also think that printed books still have some good things.

Firstly, the internet is convenient because people can read many more things using the internet. They can go online and find many news and books they want. For example, people can read news from website everyday for free, which is very useful. This is making life more convenient because they don't need to go to bookstore and buy the books or spend money because they can find PDF for their school study on the internet, which saved a lot of money.

But not all people like to read on a screen. Some people saying it's hurt their eyes and it is difficult to focus for long time. The books and newspapers give more good feeling and more natural. For example, many old people still read newspaper in paper because they don't know how to use phones good. Also, in some countries they still give printed book for studying even edition of books is also possible.

Also another thing is that some places still don't have good internet. There is people in country side or poor areas who don't have computer or smart phone. For them, printed materials are more better because it's more easier to access. In this case, printed is still important.

In conclusion, internet help people to read for free and more easy, but printed materials are not totally useless. I believe both ways are important and will continue in future.`;

const SAMPLES = {
  academic: {
    tabLabel: "Academic Writing Task 1",
    band: 6.5, words: 226,
    taskText: "The graph below shows the per capita consumption of whole milk and low-fat milk in the United States between 1970 and 2014. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    essay: ACADEMIC_ESSAY,
    criteria: [
      { key: "task", label: "Task Achievement", band: 6.0, color: CRIT_COLOR.task,
        sub: [{ label: "Overview", band: 6.0 }, { label: "Key features", band: 6.0 }, { label: "Data support", band: 6.0 }],
        summary: "The response gives a clear overall trend and some key comparisons, but it includes inaccurate details and unsupported interpretation such as reasons for the changes." },
      { key: "coherence", label: "Coherence", band: 7.0, color: CRIT_COLOR.coherence,
        summary: "Ideas are generally well-organised and progression is mostly clear. Some paragraphing is effective, but tense inconsistencies and minor linking issues remain." },
      { key: "vocabulary", label: "Lexical Resource", band: 6.0, color: CRIT_COLOR.vocabulary,
        summary: "A reasonable range of vocabulary is used, though there are informal or inaccurate word choices. Some less common items are attempted with mixed success." },
      { key: "grammar", label: "Grammatical Range and Accuracy", band: 7.0, color: CRIT_COLOR.grammar,
        summary: "A variety of structures is used with flexibility. Errors occur but do not significantly impede communication. Subject-verb agreement and tense consistency need improvement." },
    ],
    errors: {
      task: [
        { id: 1, label: "Missing Overview", originalText: "Overall it is clear that people prefer low fat milk more and more and whole milk go down a lot.", correctedText: "Overall, both types declined over the period, with low-fat overtaking whole milk around 2005.", note: "The overview should capture both trends and the crossover point — not just the preference shift." },
        { id: 2, label: "Wrong Unit", originalText: "to about 10 liters", correctedText: "to about 10 gallons", note: "The graph uses gallons per person, not liters. Always check the axis label unit." },
        { id: 3, label: "Unsupported Calculation", originalText: "maybe fifty percent", correctedText: "by approximately 5 gallons (from 25 to 20)", note: "Avoid speculative calculations. Use actual values from the graph instead." },
        { id: 4, label: "Wrong Unit", originalText: "close to 5 percent in 2016", correctedText: "close to 5 gallons per person in 2016", note: "The y-axis shows gallons, not percent. Double-check axis units throughout your response." },
        { id: 5, label: "Unsupported Claim", originalText: "because of health reasons and advertisements etc.", correctedText: "Remove — reasons are not shown in the graph", note: "Task 1 requires describing what is shown, not explaining causes. Remove unsupported interpretation." },
        { id: 6, label: "Vague Conclusion", originalText: "The chart is easy to understand as the trends are obvious.", correctedText: "Remove this sentence", note: "This adds no data and sounds personal. Summarise with data points instead." },
      ],
      coherence: [
        { id: 1, label: "Missing Comma", originalText: "Overall it is clear that", correctedText: "Overall, it is clear that", note: "A comma after 'Overall' is standard and improves the flow of the sentence." },
        { id: 2, label: "Tense Inconsistency", originalText: "drops to roughly 20", correctedText: "dropped to roughly 20", note: "The narrative is in the past tense. 'Drops' (present) breaks consistency — use 'dropped'." },
        { id: 3, label: "Missing Subject", originalText: "Then, a very big increase, maybe fifty percent.", correctedText: "Then, low-fat milk saw a notable increase.", note: "This sentence fragment has no grammatical subject. Add 'low-fat milk' to clarify the referent." },
        { id: 4, label: "Tense Shift", originalText: "they are almost the same", correctedText: "they were almost the same", note: "Use 'were' (past) to match the surrounding narrative about historical data." },
        { id: 5, label: "Awkward Construction", originalText: "The total amount of milk together were taken about similar", correctedText: "The total consumption of both types was roughly similar", note: "This phrase is structurally unclear. Restructure for precision: 'The combined consumption was roughly similar over time.'" },
      ],
      vocabulary: [
        { id: 1, label: "Informal Register", originalText: "go down a lot", correctedText: "declined significantly", note: "'Go down a lot' is too informal for academic writing. Use 'declined significantly' or 'fell sharply'." },
        { id: 2, label: "Vague Expression", originalText: "advertisements etc.", correctedText: "advertising campaigns", note: "'Etc.' is too informal and vague. Either specify the other causes or remove them entirely." },
        { id: 3, label: "Wrong Noun Form", originalText: "modern peoples", correctedText: "modern consumers / modern people", note: "'Peoples' (plural) refers to distinct ethnic groups. For general use, 'people' has no -s." },
        { id: 4, label: "Weak Word Choice", originalText: "very big increase", correctedText: "substantial increase / sharp rise", note: "'Very big' is vague and informal. Use more precise academic vocabulary like 'substantial' or 'sharp'." },
        { id: 5, label: "Informal Connective", originalText: "so the gap is closed", correctedText: "effectively closing the gap between them", note: "'So' at the start of an independent clause sounds informal. Rephrase as a participial phrase." },
      ],
      grammar: [
        { id: 1, label: "Verb Agreement", originalText: "whole milk go down a lot", correctedText: "whole milk goes down a lot", note: "'Whole milk' is a singular noun — the verb must be 'goes', not 'go'." },
        { id: 2, label: "Wrong Tense", originalText: "drops to roughly 20", correctedText: "dropped to roughly 20", note: "Use simple past ('dropped') consistently for historical figures." },
        { id: 3, label: "Wrong Tense", originalText: "they are almost the same", correctedText: "they were almost the same", note: "Maintain past tense when describing historical data ('were', not 'are')." },
        { id: 4, label: "Wrong Tense", originalText: "low fat already overtake the other one", correctedText: "low-fat milk had already overtaken whole milk", note: "Use past perfect ('had overtaken') for an action completed before another past event." },
        { id: 5, label: "Noun Form", originalText: "modern peoples", correctedText: "modern people", note: "'Peoples' is reserved for ethnic or national groups. Use 'people' here." },
        { id: 6, label: "Subject-Verb Agreement", originalText: "milk together were taken", correctedText: "The combined consumption was", note: "'Amount' is singular — use 'was'. Restructure the clause for grammatical accuracy." },
      ],
    },
  },

  general: {
    tabLabel: "General Writing Task 1",
    band: 6.5, words: 180,
    taskText: "You borrowed a book from a library and accidentally damaged it. Write a letter to the librarian. In your letter: describe how the damage happened, explain how you feel about it, and say what you would like to do about it.",
    essay: GENERAL_ESSAY,
    criteria: [
      { key: "task", label: "Task Response", band: 6.0, color: CRIT_COLOR.task,
        sub: [{ label: "Purpose & tone", band: 6.0 }, { label: "All bullet points", band: 6.0 }, { label: "Format", band: 5.5 }],
        summary: "The letter addresses all three bullet points, but the tone is overly formal in places and the format uses 'Dear Sir or Madam' without confirming the recipient. Some points are underdeveloped." },
      { key: "coherence", label: "Coherence & Cohesion", band: 7.0, color: CRIT_COLOR.coherence,
        summary: "The letter is logically organised with a clear opening, middle, and closing. Cohesive devices are used appropriately, though some are repetitive ('I am' at the start of multiple sentences)." },
      { key: "vocabulary", label: "Lexical Resource", band: 6.5, color: CRIT_COLOR.vocabulary,
        summary: "A satisfactory range of vocabulary is used. Some awkward collocations appear and a few words are used incorrectly. Overall the vocabulary is appropriate for the register." },
      { key: "grammar", label: "Grammatical Range and Accuracy", band: 6.5, color: CRIT_COLOR.grammar,
        summary: "A mix of simple and compound sentences is used. There are some errors with tense and participial phrases, but they do not significantly impede meaning." },
    ],
    errors: {
      task: [
        { id: 1, label: "Unclear Purpose", originalText: "an unfortunate accident involving a library book I borrowed last week", correctedText: "an incident involving a library book, 'The Great Gatsby', that I borrowed on 10 May", note: "Specify the book title and borrowing date for a more complete and credible letter." },
        { id: 2, label: "Underdeveloped Point", originalText: "I feel very embarrassed and guilty about this accident.", correctedText: "I feel very embarrassed and genuinely regret my carelessness.", note: "The 'how you feel' bullet point should be expanded with more specific emotion and personal reflection." },
        { id: 3, label: "Missing Option Detail", originalText: "I am happy to pay for the replacement cost of the book", correctedText: "I am happy to pay the replacement cost, which I understand is typically the cover price.", note: "Offering to pay is good, but mentioning you are aware of the process shows more responsibility." },
      ],
      coherence: [
        { id: 1, label: "Repetitive Opening", originalText: "I am writing to inform you", correctedText: "I am writing regarding", note: "'I am writing to inform you about' is wordy. 'I am writing regarding' or 'I wish to report' is more concise." },
        { id: 2, label: "Tense Shift", originalText: "I should have been more careful when handling library materials", correctedText: "I should have been more careful when handling the book", note: "Good use of 'should have', but 'library materials' is vague — specify 'the book' for cohesion." },
      ],
      vocabulary: [
        { id: 1, label: "Awkward Collocation", originalText: "pages with stain", correctedText: "stained pages", note: "'Pages with stain' is unnatural. The adjective form 'stained pages' is more idiomatic." },
        { id: 2, label: "Wrong Verb Form", originalText: "sticked together", correctedText: "stuck together", note: "'Sticked' is not a valid past tense. The correct irregular form is 'stuck'." },
        { id: 3, label: "Informal", originalText: "bring it to the library directly", correctedText: "return it to the library in person", note: "'Bring directly' sounds casual. 'Return in person' is more appropriate for a formal letter." },
      ],
      grammar: [
        { id: 1, label: "Missing Article", originalText: "involving a library book I borrowed", correctedText: "involving a library book that I borrowed", note: "A relative clause ('that I borrowed') makes the sentence grammatically complete." },
        { id: 2, label: "Wrong Verb Form", originalText: "sticked together", correctedText: "stuck together", note: "'Sticked' is an incorrect form. The past tense of 'stick' is 'stuck' (irregular)." },
        { id: 3, label: "Missing Comma", originalText: "I feel very embarrassed and guilty about this accident. I should have", correctedText: "I feel very embarrassed and guilty about this. I should have", note: "Each sentence should be complete. 'Accident' is repeated — use 'this' to avoid repetition." },
      ],
    },
  },

  task2: {
    tabLabel: "Writing Task 2",
    band: 6.0, words: 281,
    taskText: "The internet has made it possible for everybody to read anything online for free. This will make it unnecessary to pay for printed materials such as books or newspapers in the future. To what extent do you agree or disagree with this statement?",
    essay: TASK2_ESSAY,
    criteria: [
      { key: "task", label: "Task Response", band: 6.0, color: CRIT_COLOR.task,
        sub: [{ label: "Position", band: 6.0 }, { label: "Main ideas", band: 6.0 }, { label: "Supporting points", band: 5.5 }, { label: "Format", band: 7.0 }],
        summary: "The essay addresses the topic and presents a position, but ideas are inconsistently developed and the overall argument is not always well-connected to the stated position." },
      { key: "coherence", label: "Coherence & Cohesion", band: 6.0, color: CRIT_COLOR.coherence,
        summary: "Some paragraphing structure is present and ideas are broadly organised. However, cohesive devices are mechanical and some sentences lack clear logical connection." },
      { key: "vocabulary", label: "Lexical Resource", band: 6.0, color: CRIT_COLOR.vocabulary,
        summary: "A basic range of vocabulary is used with some variety. Several word choice errors and collocations reduce overall accuracy. More precise academic vocabulary would improve the score." },
      { key: "grammar", label: "Grammatical Range and Accuracy", band: 6.0, color: CRIT_COLOR.grammar,
        summary: "Simple and compound sentences are used, and there are attempts at complex structures. Frequent grammatical errors affect overall accuracy and some errors obscure meaning." },
    ],
    errors: {
      task: [
        { id: 1, label: "Unclear Position", originalText: "To what extent I agree with this statement.", correctedText: "I partially agree with this view.", note: "This is not a sentence — it echoes the question instead of stating your position. Begin with a clear thesis." },
        { id: 2, label: "Circular Reasoning", originalText: "I agree with this idea to some extent because online reading is more easier", correctedText: "I partly agree because online content is more accessible and often free", note: "The reason given simply repeats the idea. Add a specific reason — e.g. accessibility, cost." },
        { id: 3, label: "Irrelevant Detail", originalText: "they can find PDF for their school study on the internet, which saved a lot of money.", correctedText: "they can access study materials online at no cost, reducing reliance on printed textbooks.", note: "The idea is relevant but too informal ('PDF', 'saved') — rephrase for academic register and precision." },
      ],
      coherence: [
        { id: 1, label: "Tense Inconsistency", originalText: "which saved a lot of money", correctedText: "which saves a great deal of money", note: "The rest of the paragraph uses present tense for a general claim. Use 'saves' here for consistency." },
        { id: 2, label: "Weak Connector", originalText: "Also another thing is that", correctedText: "A further consideration is that", note: "'Also another thing' is redundant and informal. Use a single, more formal connector." },
        { id: 3, label: "Abrupt Conclusion", originalText: "I believe both ways are important and will continue in future.", correctedText: "In conclusion, while digital platforms have reduced the cost of information access, printed materials retain value in many contexts and will likely coexist with digital media for the foreseeable future.", note: "The conclusion is too brief and does not summarise the key arguments or restate the position fully." },
      ],
      vocabulary: [
        { id: 1, label: "Comparative Error", originalText: "more easier", correctedText: "easier", note: "'More easier' is a double comparative. 'Easier' alone is the correct comparative form." },
        { id: 2, label: "Informal Register", originalText: "saying it's hurt their eyes", correctedText: "reporting that extended screen time can strain their eyes", note: "For academic writing, use more formal phrasing and be precise about the cause-effect relationship." },
        { id: 3, label: "Informal Word", originalText: "more better", correctedText: "preferable / more convenient", note: "'More better' is non-standard. Use a precise adjective like 'preferable' or 'more convenient'." },
        { id: 4, label: "Collocation Error", originalText: "use phones good", correctedText: "use smartphones proficiently", note: "'Use ... good' is non-standard. Use an adverb: 'use smartphones proficiently' or 'navigate digital devices easily'." },
      ],
      grammar: [
        { id: 1, label: "Missing Subject", originalText: "The internet has made possible for everybody", correctedText: "The internet has made it possible for everybody", note: "After 'make' with an adjective complement, 'it' is needed as a placeholder subject: 'made it possible'." },
        { id: 2, label: "Comparative Error", originalText: "more easier", correctedText: "easier", note: "Double comparatives are grammatically incorrect in English. Use only one comparative marker." },
        { id: 3, label: "Wrong Participle", originalText: "Some people saying", correctedText: "Some people say", note: "'Saying' without an auxiliary is a participle, not a finite verb. Use the simple present 'say'." },
        { id: 4, label: "Comparative Error", originalText: "more better", correctedText: "better / more convenient", note: "'More better' is a double comparative. Use 'better' alone or choose a more precise adjective." },
        { id: 5, label: "Missing Preposition", originalText: "will continue in future", correctedText: "will continue in the future", note: "The phrase 'in the future' requires the definite article 'the'." },
      ],
    },
  },
};

const SPEAKING_SAMPLE = {
  band: 7.5, wpm: 107,
  taskText: "Describe an ideal place where you would like to live or stay. You should say: where this place would be, what it would look like, what activities you could do there, and explain why it would be ideal for you.",
  transcript: [
    { ts: "0:01–0:12", text: "My ideal place to stay would be a small haven of peace, quiet and nature, close to the mountains." },
    { ts: "0:12–0:17", text: "I think a quiet place in the nature would be absolutely perfect for me." },
    { ts: "0:17–0:26", text: "The house would be simple, but comfortable. It would have a small kitchen and a living area." },
    { ts: "0:26–0:46", text: "I can imagine a garden outside where I can grow flowers and vegetables, and I would like to live there with my dog. It would be smaller on my trips, because I have a very active dog." },
    { ts: "0:46–0:52", text: "I think this place would be perfect because I really enjoy calm and natural places." },
    { ts: "0:52–1:01", text: "It would help me relax, have strong hobbies, and have a better life balance." },
    { ts: "1:01–1:05", text: "Good food, good living in nature, and activities can make people feel happier and healthier." },
    { ts: "1:05–1:08", text: "So yeah, that would be my ideal place to stay." },
  ],
  criteria: [
    { key: "fluency", label: "Fluency and Coherence", band: 8.0, color: CRIT_COLOR.fluency,
      sub: [{ label: "Fluency", band: 8.0 }, { label: "Coherence structure", band: 8.0 }, { label: "Topic development", band: 8.0 }],
      summary: "The candidate demonstrates very good fluency with minimal self-correction and hesitation. Speech is well-paced and mostly coherent, though some transitions between ideas could be smoother." },
    { key: "vocab", label: "Lexical Resource", band: 7.0, color: CRIT_COLOR.vocab,
      summary: "A good range of vocabulary is used with some flexibility. Attempts at less common items occur, though occasional awkward collocations reduce precision." },
    { key: "grammar_sp", label: "Grammatical Range and Accuracy", band: 8.0, color: CRIT_COLOR.grammar_sp,
      summary: "A wide range of structures is used accurately. Errors are rare and do not impede communication. Good use of conditionals and complex sentences throughout." },
    { key: "pronun", label: "Pronunciation", band: 8.0, color: CRIT_COLOR.pronun,
      summary: "Clear and natural pronunciation throughout. Features of connected speech are used effectively. Very few instances of mispronunciation or unnatural word stress." },
  ],
  errors: {
    fluency: [
      { id: 1, label: "Filler Repetition", originalText: "I think", correctedText: "In my view / Personally", note: "'I think' opens two consecutive utterances. Vary openers to maintain a higher fluency band score." },
      { id: 2, label: "Abrupt Ending", originalText: "So yeah, that would be my ideal place to stay.", correctedText: "All in all, that would be my ideal place to live.", note: "'So yeah' is too conversational for IELTS. Use a more formal rounding-off phrase." },
    ],
    vocab: [
      { id: 1, label: "Unnatural Collocation", originalText: "have strong hobbies", correctedText: "pursue fulfilling hobbies", note: "We 'pursue' or 'enjoy' hobbies — 'have strong hobbies' is an unnatural collocation." },
      { id: 2, label: "Informal Phrase", originalText: "So yeah, that would be", correctedText: "All in all, that would be", note: "'So yeah' is informal. In a formal assessment context, use a more neutral closing phrase." },
      { id: 3, label: "Vague Expression", originalText: "smaller on my trips", correctedText: "more manageable on our trips", note: "The meaning is unclear — specify what 'smaller' refers to. A clearer phrasing is 'more manageable'." },
    ],
    grammar_sp: [
      { id: 1, label: "Article Error", originalText: "in the nature", correctedText: "in nature", note: "'Nature' in this general sense is uncountable and takes no article. Say 'in nature', not 'in the nature'." },
      { id: 2, label: "Pronoun Ambiguity", originalText: "It would be smaller on my trips", correctedText: "He would be more manageable on trips", note: "The pronoun 'it' has an unclear referent. If referring to the dog, use 'he/she' to be clear." },
    ],
    pronun: [
      { id: 1, label: "Word Stress", originalText: "comfortable", correctedText: "COM-fort-able (3 syllables)", note: "Often pronounced as 4 syllables (com-for-ta-ble). The standard pronunciation is 3 syllables: COM-fort-able." },
      { id: 2, label: "Linking Sound", originalText: "very active", correctedText: "very_active (linked)", note: "In natural speech, the final 'y' of 'very' links to 'active' — practice this connected speech feature." },
    ],
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CriterionCard({ crit, expanded, onToggle }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 12,
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: crit.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: TEXT }}>{crit.label}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: bandColor(crit.band), minWidth: 36, textAlign: "right" }}>
          {crit.band.toFixed(1)}
        </span>
        <span style={{ color: MUTED, fontSize: 16, marginLeft: 4 }}>{expanded ? "∧" : "∨"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 18px 14px 18px", borderTop: `1px solid ${BORDER}` }}>
          {crit.sub?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 0 10px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                What examiners look for
              </div>
              {crit.sub.map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: crit.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: TEXT_SUB }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: bandColor(s.band) }}>{s.band.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ margin: crit.sub?.length ? "10px 0 0" : "12px 0 0", fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>
            {crit.summary}
          </p>
        </div>
      )}
    </div>
  );
}

function ErrorItem({ num, error, color }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", background: color,
          color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{num}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: TEXT }}>{error.label}</span>
      </div>
      {error.originalText && (
        <div style={{ marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
          <span style={{
            background: "#fef2f2", color: RED, padding: "1px 7px", borderRadius: 4,
            textDecoration: "line-through", display: "inline",
          }}>{error.originalText.length > 60 ? error.originalText.slice(0, 60) + "…" : error.originalText}</span>
          {error.correctedText && (
            <>
              <span style={{ color: MUTED, margin: "0 6px" }}>→</span>
              <span style={{
                background: "#f0fdf4", color: GREEN, padding: "1px 7px", borderRadius: 4, display: "inline",
              }}>{error.correctedText.length > 70 ? error.correctedText.slice(0, 70) + "…" : error.correctedText}</span>
            </>
          )}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 12, color: TEXT_SUB, lineHeight: 1.55 }}>{error.note}</p>
    </div>
  );
}

function AnnotatedEssay({ essay, errors, critKey, showFeedback, color }) {
  if (!showFeedback) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.85, color: TEXT_SUB, whiteSpace: "pre-wrap" }}>
        {essay}
      </div>
    );
  }
  const segs = segmentText(essay, errors);
  return (
    <div style={{ fontSize: 13, lineHeight: 1.85, color: TEXT_SUB, whiteSpace: "pre-wrap" }}>
      {segs.map((s, i) =>
        s.errId ? (
          <span key={i} style={{ borderBottom: `2.5px solid ${color}`, paddingBottom: 1 }}>
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </div>
  );
}

function SpeedMeter({ wpm }) {
  const MIN = 80, MAX = 180, NORMAL_LOW = 110, NORMAL_HIGH = 160;
  const pct = Math.min(Math.max((wpm - MIN) / (MAX - MIN), 0), 1);
  const label = wpm < NORMAL_LOW ? "Too Slow" : wpm > NORMAL_HIGH ? "Too Fast" : "Normal";
  const markerColor = label === "Normal" ? GREEN : AMBER;
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: "#f0fdf4",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 18 }}>🎤</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Speaking Speed</div>
          <div style={{ fontSize: 11, color: MUTED }}>words per minute</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: markerColor, lineHeight: 1 }}>{wpm}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: markerColor }}>{label}</div>
        </div>
      </div>
      {/* Gradient bar */}
      <div style={{ position: "relative", height: 10, borderRadius: 6, background: "linear-gradient(to right, #93c5fd, #6ee7b7, #6ee7b7, #fde68a)", marginBottom: 6 }}>
        <div style={{
          position: "absolute", top: "50%", left: `${pct * 100}%`,
          transform: "translate(-50%, -50%)",
          width: 18, height: 18, borderRadius: "50%",
          background: markerColor, border: "3px solid #fff",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: MUTED, fontWeight: 600 }}>
        <span>Too Slow</span><span>Normal</span><span>Too Fast</span>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 12, color: TEXT_SUB, lineHeight: 1.55 }}>
        Examiners will most likely enjoy your speaking if you speak around 120 to 160 words per minute.
      </p>
    </div>
  );
}

// ── Writing report ────────────────────────────────────────────────────────────

function WritingReport({ data }) {
  const critKeys = data.criteria.map(c => c.key);
  const [expanded, setExpanded] = useState({ [critKeys[0]]: true });
  const [activeCrit, setActiveCrit] = useState(critKeys[0]);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showTask, setShowTask] = useState(false);

  const crit = data.criteria.find(c => c.key === activeCrit);
  const errors = data.errors[activeCrit] || [];

  return (
    <>
      {/* Score hero */}
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: "24px 24px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, color: bandColor(data.band), lineHeight: 1 }}>
            {data.band.toFixed(1)}<span style={{ fontSize: 24, fontWeight: 600, color: MUTED }}>/9.0</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{cefrLabel(data.band)}</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>CEFR</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{data.words}</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Words</div>
          </div>
        </div>
      </div>

      {/* Criterion accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {data.criteria.map(c => (
          <CriterionCard
            key={c.key}
            crit={c}
            expanded={!!expanded[c.key]}
            onToggle={() => setExpanded(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
          />
        ))}
      </div>

      {/* Detailed feedback */}
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 20px 24px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 16 }}>Detailed Feedback</div>

        {/* Task text toggle */}
        <div style={{
          background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: TEXT_SUB, lineHeight: 1.6,
        }}>
          {data.taskText}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_SUB, marginBottom: 16, cursor: "pointer", userSelect: "none" }}>
          <span style={{
            width: 34, height: 18, borderRadius: 9,
            background: showTask ? PRIMARY : BORDER,
            position: "relative", display: "inline-block", transition: "background .2s",
          }}>
            <span style={{
              position: "absolute", top: 2, left: showTask ? 18 : 2,
              width: 14, height: 14, borderRadius: "50%", background: "#fff",
              transition: "left .2s",
            }} />
          </span>
          <input type="checkbox" checked={showTask} onChange={() => setShowTask(v => !v)} style={{ display: "none" }} />
          Show the task visual
        </label>

        {/* Criterion tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {data.criteria.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCrit(c.key)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: "none", cursor: "pointer",
                background: activeCrit === c.key ? c.color : "#f1f5f9",
                color: activeCrit === c.key ? "#fff" : TEXT_SUB,
                transition: "background .15s",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Two-column: essay + errors */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Left: essay */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginRight: 4 }}>Your Writing</span>
              {["Original", "Feedback"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setShowFeedback(mode === "Feedback")}
                  style={{
                    padding: "3px 12px", borderRadius: 14, fontSize: 11, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: (showFeedback ? "Feedback" : "Original") === mode ? TEXT : "#f1f5f9",
                    color: (showFeedback ? "Feedback" : "Original") === mode ? "#fff" : MUTED,
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div style={{
              background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
              maxHeight: 440, overflowY: "auto",
            }}>
              <AnnotatedEssay
                essay={data.essay}
                errors={errors}
                critKey={activeCrit}
                showFeedback={showFeedback}
                color={crit?.color || PRIMARY}
              />
            </div>
          </div>

          {/* Right: errors */}
          <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>
              {crit?.label} Errors
            </div>
            {errors.map((e, i) => (
              <ErrorItem key={e.id} num={i + 1} error={e} color={crit?.color || PRIMARY} />
            ))}
            {errors.length === 0 && (
              <p style={{ fontSize: 13, color: MUTED }}>No errors detected for this criterion.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Speaking report ───────────────────────────────────────────────────────────

function SpeakingReport({ data }) {
  const critKeys = data.criteria.map(c => c.key);
  const [expanded, setExpanded] = useState({ [critKeys[0]]: true });
  const [activeCrit, setActiveCrit] = useState(critKeys[0]);

  const crit = data.criteria.find(c => c.key === activeCrit);
  const errors = data.errors[activeCrit] || [];

  return (
    <>
      {/* Score hero */}
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: "24px 24px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, color: bandColor(data.band), lineHeight: 1 }}>
            {data.band.toFixed(1)}<span style={{ fontSize: 24, fontWeight: 600, color: MUTED }}>/9.0</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{cefrLabel(data.band)}</div>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>CEFR</div>
        </div>
      </div>

      {/* Criterion accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {data.criteria.map(c => (
          <CriterionCard
            key={c.key}
            crit={c}
            expanded={!!expanded[c.key]}
            onToggle={() => setExpanded(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
          />
        ))}
      </div>

      {/* Detailed feedback */}
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 20px 24px", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 14 }}>Detailed Feedback</div>

        <div style={{
          background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: TEXT_SUB, lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 600, fontSize: 12, color: PRIMARY, marginRight: 8 }}>Speaking Task</span>
          {data.taskText}
        </div>

        {/* Criterion tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {data.criteria.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCrit(c.key)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: "none", cursor: "pointer",
                background: activeCrit === c.key ? c.color : "#f1f5f9",
                color: activeCrit === c.key ? "#fff" : TEXT_SUB,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Left: transcript */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Transcript</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
              {data.transcript.map((seg, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "8px 12px",
                  background: "#f8fafc", borderRadius: 8, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>{seg.ts}</span>
                  <span style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.55 }}>{seg.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: errors */}
          <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>
              {crit?.label} Notes
            </div>
            {errors.map((e, i) => (
              <ErrorItem key={e.id} num={i + 1} error={e} color={crit?.color || PRIMARY} />
            ))}
            {errors.length === 0 && (
              <p style={{ fontSize: 13, color: MUTED }}>No errors for this criterion.</p>
            )}
          </div>
        </div>
      </div>

      {/* Speed meter */}
      <div style={{ maxWidth: 360 }}>
        <SpeedMeter wpm={data.wpm} />
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "academic",  label: "Academic Writing Task 1" },
  { key: "general",   label: "General Writing Task 1" },
  { key: "task2",     label: "Writing Task 2" },
  { key: "speaking",  label: "IELTS Speaking" },
];

export default function SampleReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("academic");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.key === tab)) setActiveTab(tab);
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "system-ui" }}>

      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: "4px 8px" }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Sample Reports</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: TEXT_SUB }}>
          See what expert feedback looks like before you start
        </span>
      </div>

      {/* Tab bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px",
        display: "flex", gap: 0, overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "14px 18px", fontSize: 13, fontWeight: 600,
              border: "none", background: "none", cursor: "pointer",
              color: activeTab === t.key ? PRIMARY : TEXT_SUB,
              borderBottom: activeTab === t.key ? `2px solid ${PRIMARY}` : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 64px" }}>
        {activeTab === "speaking" ? (
          <SpeakingReport data={SPEAKING_SAMPLE} />
        ) : (
          <WritingReport data={SAMPLES[activeTab]} />
        )}
      </div>
    </div>
  );
}