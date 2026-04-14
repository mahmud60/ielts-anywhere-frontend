/**
 * QuestionsTab — drop-in replacement for the existing QuestionsTab in admin/page.js
 *
 * Covers all 4 modules with separate sub-tabs:
 *   Listening  — Tests → Sections → Questions + audio upload
 *   Reading    — Tests → Passages → Groups → Questions
 *   Writing    — Tests → Task 1 + Task 2 editors
 *   Speaking   — Tests → Part 1 / Part 2 / Part 3 editors
 *
 * Usage: paste this file's content into admin/page.js, replacing
 * the existing QuestionsTab function and QuestionEditor function.
 */
import { useState, useEffect, useRef } from "react";
// ─── Shared style helpers (scoped — no global side effects) ──────────────────
const s = {
  label: { fontSize: 12, color: "#64748b", marginBottom: 4, display: "block" },
  input: {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 13,
    fontFamily: "system-ui", color: "#0f172a",
    background: "#fff", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 13,
    fontFamily: "system-ui", color: "#0f172a",
    background: "#fff", resize: "vertical", boxSizing: "border-box",
  },
  select: {
    padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
    fontSize: 13, fontFamily: "system-ui", background: "#fff",
    color: "#0f172a", cursor: "pointer",
  },
  row: { marginBottom: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  sidebarItem: (active) => ({
    padding: "7px 12px", borderRadius: 7, cursor: "pointer",
    fontSize: 13, marginBottom: 2, transition: "all .1s",
    background: active ? "#eef2ff" : "transparent",
    color: active ? "#6366f1" : "#64748b",
    border: `1px solid ${active ? "#6366f144" : "transparent"}`,
    fontWeight: active ? 500 : 400,
  }),
  sidebarChild: (active) => ({
    padding: "5px 12px 5px 28px", borderRadius: 6,
    fontSize: 12, cursor: "pointer", marginBottom: 1,
    background: active ? "#6366f112" : "transparent",
    color: active ? "#6366f1" : "#94a3b8",
  }),
  card: {
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "16px 18px",
  },
  questionRow: {
    padding: "10px 14px", background: "#f8fafc",
    borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 8,
  },
  tip: {
    padding: "10px 14px", background: "#fef3c7",
    borderRadius: 8, fontSize: 12.5, color: "#78350f",
    border: "1px solid #fbbf2444", marginTop: 6,
  },
};

function FInput({ label, value, onChange, placeholder, type = "text", rows }) {
  return (
    <div style={s.row}>
      {label && <label style={s.label}>{label}</label>}
      {rows ? (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={s.textarea} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={s.input} />
      )}
    </div>
  );
}

function FSelect({ label, value, onChange, options }) {
  return (
    <div style={s.row}>
      {label && <label style={s.label}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s.select, width: "100%" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SBtn({ children, onClick, variant = "primary", disabled }) {
  const variants = {
    primary: { background: "#6366f1", color: "#fff", border: "none" },
    outline: { background: "transparent", color: "#6366f1", border: "1px solid #6366f144" },
    danger: { background: "#fee2e2", color: "#dc2626", border: "1px solid #dc262633" },
    ghost: { background: "transparent", color: "#94a3b8", border: "none" },
    success: { background: "#d1fae5", color: "#059669", border: "1px solid #05996933" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], fontFamily: "system-ui", padding: "6px 14px",
      borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "all .15s",
    }}>{children}</button>
  );
}

function SBadge({ children, color = "#6366f1" }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}33`,
      borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "2px 9px",
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LISTENING TAB
// ════════════════════════════════════════════════════════════════════════════
function ListeningQTab({ api }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQ, setEditingQ] = useState(null);
  const [newQ, setNewQ] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [newTest, setNewTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { api.admin.getListeningTests().then(setTests).catch(console.error); }, []);
  useEffect(() => {
    if (!selectedSection) { setQuestions([]); setAudioUrl(null); return; }
    api.admin.getQuestions(selectedSection.id).then(setQuestions).catch(console.error);
    setAudioUrl(selectedSection.audio_url);
  }, [selectedSection]);

  const handleCreateTest = async () => {
    if (!newTestTitle.trim()) return;
    setSaving(true);
    try {
      await api.admin.createListeningTest({ title: newTestTitle, is_active: false });
      const updated = await api.admin.getListeningTests();
      setTests(updated);
      setNewTest(false);
      setNewTestTitle("");
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.admin.uploadAudio(selectedSection.id, file);
      setAudioUrl(result.audio_url);
    } catch (e) { alert("Upload failed: " + e.message); }
    setUploading(false);
  };

  const handleSaveQ = async (qData) => {
    setSaving(true);
    try {
      if (qData.id) {
        await api.admin.updateQuestion(qData.id, qData);
      } else {
        await api.admin.createQuestion(selectedSection.id, qData);
      }
      const updated = await api.admin.getQuestions(selectedSection.id);
      setQuestions(updated);
      setEditingQ(null);
      setNewQ(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDeleteQ = async (qId) => {
    if (!confirm("Delete this question?")) return;
    await api.admin.deleteQuestion(qId);
    setQuestions(qs => qs.filter(q => q.id !== qId));
  };

  const blankQ = { question_type: "mcq", question_text: "", options: ["", "", "", ""], answer_key: 0, wrong_answer_tip: "" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
      {/* Sidebar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Tests</span>
          <SBtn variant="ghost" onClick={() => setNewTest(t => !t)}>+ New</SBtn>
        </div>
        {newTest && (
          <div style={{ marginBottom: 8 }}>
            <input value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)}
              placeholder="Test title" style={{ ...s.input, marginBottom: 6 }} />
            <SBtn disabled={saving} onClick={handleCreateTest}>Create</SBtn>
          </div>
        )}
        {tests.map(t => (
          <div key={t.id}>
            <div style={s.sidebarItem(selectedTest?.id === t.id)}
              onClick={() => { setSelectedTest(t); setSelectedSection(null); }}>
              {t.title}
            </div>
            {selectedTest?.id === t.id && t.sections?.map(sec => (
              <div key={sec.id} style={s.sidebarChild(selectedSection?.id === sec.id)}
                onClick={() => setSelectedSection(sec)}>
                S{sec.section_number}: {sec.title || "Untitled"}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main */}
      {!selectedSection ? (
        <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#94a3b8" }}>
          {selectedTest ? "Select a section from the sidebar" : "Select a test to get started"}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500 }}>
              Section {selectedSection.section_number} — {selectedSection.title}
            </h3>
          </div>

          {/* Audio */}
          <div style={{ ...s.card, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Audio file</div>
            {audioUrl ? (
              <audio controls src={audioUrl} style={{ width: "100%", height: 36, marginBottom: 8 }} />
            ) : (
              <div style={s.tip}>No audio uploaded yet for this section.</div>
            )}
            <input ref={fileRef} type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} />
            <SBtn variant="outline" disabled={uploading} onClick={() => fileRef.current.click()}>
              {uploading ? "Uploading…" : audioUrl ? "Replace audio" : "Upload audio"}
            </SBtn>
          </div>

          {/* Questions */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{questions.length} questions</span>
              <SBtn onClick={() => setNewQ({ ...blankQ })}>+ Add question</SBtn>
            </div>

            {newQ && (
              <ListeningQEditor q={newQ} saving={saving}
                onSave={handleSaveQ} onCancel={() => setNewQ(null)} />
            )}

            {questions.map((q, i) => (
              editingQ?.id === q.id ? (
                <ListeningQEditor key={q.id} q={editingQ} saving={saving}
                  onSave={handleSaveQ} onCancel={() => setEditingQ(null)} />
              ) : (
                <div key={q.id} style={s.questionRow}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>Q{i + 1}</span>
                        <SBadge>{q.question_type}</SBadge>
                      </div>
                      <div style={{ fontSize: 13, marginBottom: 4 }}>{q.question_text}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Answer: <code style={{ color: "#059669" }}>{JSON.stringify(q.answer_key)}</code>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <SBtn variant="outline" onClick={() => setEditingQ({ ...q })}>Edit</SBtn>
                      <SBtn variant="danger" onClick={() => handleDeleteQ(q.id)}>Delete</SBtn>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListeningQEditor({ q, onSave, onCancel, saving }) {
  const [f, setF] = useState({ ...q, options: q.options || ["", "", "", ""] });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div style={{ padding: "14px 16px", background: "#eef2ff", borderRadius: 10, border: "1px solid #6366f133", marginBottom: 12 }}>
      <div style={s.grid2}>
        <FSelect label="Question type" value={f.question_type} onChange={v => set("question_type", v)}
          options={[
            { value: "mcq", label: "Multiple choice" },
            { value: "fill", label: "Fill in the blank" },
            { value: "tfng", label: "True / False / Not Given" },
            { value: "matching", label: "Matching" },
          ]} />
        <FInput label="Order index" type="number" value={f.order_index || 1}
          onChange={v => set("order_index", parseInt(v) || 1)} />
      </div>
      <FInput label="Question text" value={f.question_text} onChange={v => set("question_text", v)}
        placeholder="Enter the question text" rows={2} />

      {(f.question_type === "mcq") && (
        <div style={s.row}>
          <label style={s.label}>Options (select correct answer)</label>
          {(f.options || ["", "", "", ""]).map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input type="radio" name={`ans-${f.id || "new"}`} checked={f.answer_key === i}
                onChange={() => set("answer_key", i)} />
              <input value={opt} onChange={e => {
                const opts = [...f.options]; opts[i] = e.target.value; set("options", opts);
              }} placeholder={`Option ${i}`} style={{ ...s.input, flex: 1 }} />
            </div>
          ))}
        </div>
      )}

      {f.question_type === "tfng" && (
        <div style={s.row}>
          <label style={s.label}>Correct answer</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["True", "False", "Not Given"].map((opt, i) => (
              <label key={i} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
                <input type="radio" name={`tfng-${f.id || "new"}`} checked={f.answer_key === i}
                  onChange={() => set("answer_key", i)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      )}

      {f.question_type === "fill" && (
        <FInput label="Correct answer (stored lowercase)" value={f.answer_key || ""}
          onChange={v => set("answer_key", v.toLowerCase())} placeholder="e.g. thompson" />
      )}

      {f.question_type === "matching" && (
        <>
          <FInput label="Items to match (comma-separated)" value={(f.options || []).join(", ")}
            onChange={v => set("options", v.split(",").map(x => x.trim()).filter(Boolean))}
            placeholder="Conducting surveys, Reviewing literature, Lab experiments" />
          <FInput label="Match pool (comma-separated)" value={(f.matching_pool || []).join(", ")}
            onChange={v => set("matching_pool", v.split(",").map(x => x.trim()).filter(Boolean))}
            placeholder="Student A, Student B, Supervisor" />
          <FInput label='Answer key (JSON: {"0":"Student A","1":"Supervisor"})'
            value={typeof f.answer_key === "object" ? JSON.stringify(f.answer_key) : f.answer_key || "{}"}
            onChange={v => { try { set("answer_key", JSON.parse(v)); } catch {} }}
            placeholder='{"0":"Student A","1":"Supervisor","2":"Student B"}' />
        </>
      )}

      <FInput label="Wrong answer tip (shown to student if incorrect)"
        value={f.wrong_answer_tip || ""} onChange={v => set("wrong_answer_tip", v)}
        placeholder="Tip to help the student understand their mistake" />

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <SBtn disabled={saving} onClick={() => onSave(f)}>
          {saving ? "Saving…" : "Save question"}
        </SBtn>
        <SBtn variant="ghost" onClick={onCancel}>Cancel</SBtn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// READING TAB
// ════════════════════════════════════════════════════════════════════════════
function ReadingQTab({ api }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQ, setEditingQ] = useState(null);
  const [newQ, setNewQ] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [showNewTest, setShowNewTest] = useState(false);
  const [showNewPassage, setShowNewPassage] = useState(false);
  const [newPassage, setNewPassage] = useState({ title: "", passage_number: 1 });
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ question_type: "mcq", instruction: "" });
  const [editingPassage, setEditingPassage] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => { api.admin.getReadingTests().then(setTests).catch(console.error); }, []);
  useEffect(() => {
    if (!selectedGroup) { setQuestions([]); return; }
    api.admin.getReadingQuestions(selectedGroup.id).then(setQuestions).catch(console.error);
  }, [selectedGroup]);

  const reload = () => api.admin.getReadingTests().then(setTests);

  const handleCreateTest = async () => {
    if (!newTestTitle.trim()) return;
    setSaving(true);
    try {
      await api.admin.createReadingTest({ title: newTestTitle, is_active: false });
      await reload(); setShowNewTest(false); setNewTestTitle("");
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleCreatePassage = async () => {
    setSaving(true);
    try {
      await api.admin.createReadingPassage(selectedTest.id, { ...newPassage, body: "" });
      await reload(); setShowNewPassage(false);
      setNewPassage({ title: "", passage_number: 1 });
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSavePassage = async () => {
    setSaving(true);
    try {
      await api.admin.updateReadingPassage(editingPassage.id, editingPassage);
      await reload(); setEditingPassage(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleCreateGroup = async () => {
    setSaving(true);
    try {
      await api.admin.createReadingGroup(selectedPassage.id, newGroup);
      await reload(); setShowNewGroup(false);
      setNewGroup({ question_type: "mcq", instruction: "" });
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSaveGroup = async () => {
    setSaving(true);
    try {
      await api.admin.updateReadingGroup(editingGroup.id, editingGroup);
      await reload(); setEditingGroup(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSaveQ = async (qData) => {
    setSaving(true);
    try {
      if (qData.id) {
        await api.admin.updateReadingQuestion(qData.id, qData);
      } else {
        await api.admin.createReadingQuestion(selectedGroup.id, qData);
      }
      const updated = await api.admin.getReadingQuestions(selectedGroup.id);
      setQuestions(updated); setEditingQ(null); setNewQ(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDeleteQ = async (qId) => {
    if (!confirm("Delete this question?")) return;
    await api.admin.deleteReadingQuestion(qId);
    setQuestions(qs => qs.filter(q => q.id !== qId));
  };

  // Sync passage/group selections when tests reload
  useEffect(() => {
    if (!selectedTest || !tests.length) return;
    const t = tests.find(x => x.id === selectedTest.id);
    if (t) {
      setSelectedTest(t);
      if (selectedPassage) {
        const p = t.passages?.find(x => x.id === selectedPassage.id);
        if (p) {
          setSelectedPassage(p);
          if (selectedGroup) {
            const g = p.question_groups?.find(x => x.id === selectedGroup.id);
            if (g) setSelectedGroup(g);
          }
        }
      }
    }
  }, [tests]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      {/* Sidebar: Test → Passage → Group */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Tests</span>
          <SBtn variant="ghost" onClick={() => setShowNewTest(t => !t)}>+ New</SBtn>
        </div>
        {showNewTest && (
          <div style={{ marginBottom: 8 }}>
            <input value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)}
              placeholder="Test title" style={{ ...s.input, marginBottom: 6 }} />
            <SBtn disabled={saving} onClick={handleCreateTest}>Create</SBtn>
          </div>
        )}
        {tests.map(t => (
          <div key={t.id}>
            <div style={s.sidebarItem(selectedTest?.id === t.id)}
              onClick={() => { setSelectedTest(t); setSelectedPassage(null); setSelectedGroup(null); }}>
              {t.title}
            </div>
            {selectedTest?.id === t.id && t.passages?.map(p => (
              <div key={p.id}>
                <div style={s.sidebarChild(selectedPassage?.id === p.id)}
                  onClick={() => { setSelectedPassage(p); setSelectedGroup(null); }}>
                  P{p.passage_number}: {p.title}
                </div>
                {selectedPassage?.id === p.id && p.question_groups?.map(g => (
                  <div key={g.id}
                    style={{ ...s.sidebarChild(selectedGroup?.id === g.id), paddingLeft: 40 }}
                    onClick={() => setSelectedGroup(g)}>
                    G{g.order_index}: {g.question_type}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div>
        {!selectedTest ? (
          <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#94a3b8" }}>Select a test</div>
        ) : !selectedPassage ? (
          /* Test selected — show passage list + add passage */
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 500 }}>{selectedTest.title} — Passages</h3>
              <SBtn onClick={() => setShowNewPassage(t => !t)}>+ Add passage</SBtn>
            </div>
            {showNewPassage && (
              <div style={{ padding: "12px 14px", background: "#eef2ff", borderRadius: 8, marginBottom: 12, border: "1px solid #6366f133" }}>
                <div style={s.grid2}>
                  <FInput label="Title" value={newPassage.title} onChange={v => setNewPassage(p => ({ ...p, title: v }))} />
                  <FInput label="Passage number" type="number" value={newPassage.passage_number}
                    onChange={v => setNewPassage(p => ({ ...p, passage_number: parseInt(v) || 1 }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <SBtn disabled={saving} onClick={handleCreatePassage}>Create passage</SBtn>
                  <SBtn variant="ghost" onClick={() => setShowNewPassage(false)}>Cancel</SBtn>
                </div>
              </div>
            )}
            {selectedTest.passages?.map(p => (
              <div key={p.id} style={s.questionRow}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Passage {p.passage_number}: {p.title}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.question_groups?.length || 0} question groups</div>
                  </div>
                  <SBtn variant="outline" onClick={() => setSelectedPassage(p)}>Manage →</SBtn>
                </div>
              </div>
            ))}
          </div>
        ) : !selectedGroup ? (
          /* Passage selected — show text editor + group list */
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <SBtn variant="ghost" onClick={() => setSelectedPassage(null)}>← Passages</SBtn>
              <h3 style={{ fontSize: 15, fontWeight: 500 }}>Passage {selectedPassage.passage_number}: {selectedPassage.title}</h3>
            </div>

            {/* Passage text editor */}
            <div style={{ ...s.card, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Passage text</div>
              {editingPassage ? (
                <>
                  <textarea rows={12} value={editingPassage.body}
                    onChange={e => setEditingPassage(p => ({ ...p, body: e.target.value }))}
                    placeholder="Paste the full passage text here" style={s.textarea} />
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <SBtn disabled={saving} onClick={handleSavePassage}>Save passage text</SBtn>
                    <SBtn variant="ghost" onClick={() => setEditingPassage(null)}>Cancel</SBtn>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, maxHeight: 120, overflow: "hidden", marginBottom: 10 }}>                    
                    {selectedPassage.body ? selectedPassage.body.slice(0, 300) + "…" : "No passage text yet."}
                  </div>
                  <SBtn variant="outline" onClick={() => setEditingPassage({ ...selectedPassage })}>
                    Edit passage text
                  </SBtn>
                </>
              )}
            </div>

            {/* Question groups */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>Question groups</div>
                <SBtn onClick={() => setShowNewGroup(t => !t)}>+ Add group</SBtn>
              </div>
              {showNewGroup && (
                <div style={{ padding: "12px 14px", background: "#eef2ff", borderRadius: 8, marginBottom: 12, border: "1px solid #6366f133" }}>
                  <FSelect label="Question type" value={newGroup.question_type}
                    onChange={v => setNewGroup(g => ({ ...g, question_type: v }))}
                    options={[
                      { value: "mcq", label: "Multiple choice" },
                      { value: "tfng", label: "True / False / Not Given" },
                      { value: "fill", label: "Fill in the blank" },
                      { value: "matching_headings", label: "Matching headings" },
                      { value: "matching_info", label: "Matching information" },
                      { value: "short_answer", label: "Short answer" },
                    ]} />
                  <FInput label="Instruction" value={newGroup.instruction}
                    onChange={v => setNewGroup(g => ({ ...g, instruction: v }))}
                    placeholder="e.g. Choose the correct letter A, B, C, or D" rows={2} />
                  {newGroup.question_type === "fill" || newGroup.question_type === "short_answer" ? (
                    <FInput label="Word limit" value={newGroup.word_limit || ""}
                      onChange={v => setNewGroup(g => ({ ...g, word_limit: v }))}
                      placeholder="e.g. NO MORE THAN TWO WORDS" />
                  ) : null}
                  {newGroup.question_type === "matching_headings" && (
                    <FInput label="Heading options (one per line)"
                      value={(newGroup.heading_options || []).join("\n")}
                      onChange={v => setNewGroup(g => ({ ...g, heading_options: v.split("\n").filter(Boolean) }))}
                      rows={5} placeholder={"i   The history of...\nii  Causes of..."} />
                  )}
                  {newGroup.question_type === "matching_info" && (
                    <FInput label="Paragraph labels (comma-separated)"
                      value={(newGroup.paragraph_labels || []).join(", ")}
                      onChange={v => setNewGroup(g => ({ ...g, paragraph_labels: v.split(",").map(x => x.trim()).filter(Boolean) }))}
                      placeholder="A, B, C, D, E" />
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <SBtn disabled={saving} onClick={handleCreateGroup}>Create group</SBtn>
                    <SBtn variant="ghost" onClick={() => setShowNewGroup(false)}>Cancel</SBtn>
                  </div>
                </div>
              )}
              {selectedPassage.question_groups?.map(g => (
                <div key={g.id} style={s.questionRow}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <SBadge>{g.question_type}</SBadge>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{g.instruction?.slice(0, 80)}…</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{g.question_count} questions</div>
                    </div>
                    <SBtn variant="outline" onClick={() => setSelectedGroup(g)}>Manage questions →</SBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Group selected — question list */
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <SBtn variant="ghost" onClick={() => setSelectedGroup(null)}>← Groups</SBtn>
              <div>
                <SBadge>{selectedGroup.question_type}</SBadge>
                <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>
                  {selectedGroup.instruction?.slice(0, 60)}
                </span>
              </div>
            </div>

            {/* Group settings editor */}
            {editingGroup && (
              <div style={{ ...s.card, marginBottom: 14 }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Edit group settings</div>
                <FInput label="Instruction" value={editingGroup.instruction}
                  onChange={v => setEditingGroup(g => ({ ...g, instruction: v }))} rows={2} />
                {(editingGroup.question_type === "fill" || editingGroup.question_type === "short_answer") && (
                  <FInput label="Word limit" value={editingGroup.word_limit || ""}
                    onChange={v => setEditingGroup(g => ({ ...g, word_limit: v }))} />
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <SBtn disabled={saving} onClick={handleSaveGroup}>Save</SBtn>
                  <SBtn variant="ghost" onClick={() => setEditingGroup(null)}>Cancel</SBtn>
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{questions.length} questions</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <SBtn variant="outline" onClick={() => setEditingGroup({ ...selectedGroup })}>Edit group</SBtn>
                  <SBtn onClick={() => setNewQ({ question_text: "", options: null, answer_key: "", wrong_answer_tip: "" })}>
                    + Add question
                  </SBtn>
                </div>
              </div>

              {newQ && (
                <ReadingQEditor q={newQ} groupType={selectedGroup.question_type} saving={saving}
                  onSave={handleSaveQ} onCancel={() => setNewQ(null)} />
              )}

              {questions.map((q, i) => (
                editingQ?.id === q.id ? (
                  <ReadingQEditor key={q.id} q={editingQ} groupType={selectedGroup.question_type} saving={saving}
                    onSave={handleSaveQ} onCancel={() => setEditingQ(null)} />
                ) : (
                  <div key={q.id} style={s.questionRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Q{i + 1}</div>
                        <div style={{ fontSize: 13, marginBottom: 4 }}>{q.question_text}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          Answer: <code style={{ color: "#059669" }}>
                            {Array.isArray(q.answer_key) ? q.answer_key.join(", ") : JSON.stringify(q.answer_key)}
                          </code>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <SBtn variant="outline" onClick={() => setEditingQ({ ...q })}>Edit</SBtn>
                        <SBtn variant="danger" onClick={() => handleDeleteQ(q.id)}>Delete</SBtn>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReadingQEditor({ q, groupType, onSave, onCancel, saving }) {
  const [f, setF] = useState({ ...q });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const needsOptions = groupType === "mcq";
  const needsCorrectIndex = groupType === "mcq" || groupType === "tfng";
  const needsStringAnswer = groupType === "fill" || groupType === "matching_headings" || groupType === "matching_info";
  const needsListAnswer = groupType === "short_answer";

  return (
    <div style={{ padding: "14px 16px", background: "#eef2ff", borderRadius: 10, border: "1px solid #6366f133", marginBottom: 12 }}>
      <FInput label="Question text" value={f.question_text}
        onChange={v => set("question_text", v)} rows={2}
        placeholder="Enter the question or statement" />

      {needsOptions && (
        <div style={s.row}>
          <label style={s.label}>Options (select correct)</label>
          {(f.options || ["", "", "", ""]).map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input type="radio" name={`r-ans-${f.id || "new"}`} checked={f.answer_key === i}
                onChange={() => set("answer_key", i)} />
              <input value={opt} onChange={e => {
                const opts = [...(f.options || ["", "", "", ""])]; opts[i] = e.target.value; set("options", opts);
              }} placeholder={`Option ${i}`} style={{ ...s.input, flex: 1 }} />
            </div>
          ))}
        </div>
      )}

      {groupType === "tfng" && (
        <div style={s.row}>
          <label style={s.label}>Correct answer</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["True", "False", "Not Given"].map((opt, i) => (
              <label key={i} style={{ display: "flex", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="radio" name={`tfng-r-${f.id || "new"}`} checked={f.answer_key === i}
                  onChange={() => set("answer_key", i)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      )}

      {needsStringAnswer && (
        <FInput label={
          groupType === "fill" ? "Correct answer (lowercase)" :
          groupType === "matching_headings" ? "Correct heading (e.g. iii)" :
          "Correct paragraph (e.g. B)"
        } value={f.answer_key || ""} onChange={v => set("answer_key",
          groupType === "fill" ? v.toLowerCase() : v
        )} />
      )}

      {needsListAnswer && (
        <div style={s.row}>
          <label style={s.label}>Accepted answers (one per line)</label>
          <textarea rows={4} value={Array.isArray(f.answer_key) ? f.answer_key.join("\n") : ""}
            onChange={e => set("answer_key", e.target.value.split("\n").map(x => x.trim().toLowerCase()).filter(Boolean))}
            placeholder={"overgrazing\nenvironmental degradation\necosystem alteration"}
            style={s.textarea} />
        </div>
      )}

      <FInput label="Wrong answer tip (optional)" value={f.wrong_answer_tip || ""}
        onChange={v => set("wrong_answer_tip", v)}
        placeholder="Hint shown to student if they get this wrong" />

      <div style={{ display: "flex", gap: 8 }}>
        <SBtn disabled={saving} onClick={() => onSave(f)}>
          {saving ? "Saving…" : "Save"}
        </SBtn>
        <SBtn variant="ghost" onClick={onCancel}>Cancel</SBtn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WRITING TAB
// ════════════════════════════════════════════════════════════════════════════
function WritingQTab({ api }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [saving, setSaving] = useState(null);  // task id being saved
  const [newTestTitle, setNewTestTitle] = useState("");
  const [showNewTest, setShowNewTest] = useState(false);
  const [editingTask, setEditingTask] = useState({});  // {taskId: taskData}

  useEffect(() => { api.admin.getWritingTests().then(setTests).catch(console.error); }, []);

  const reload = () => api.admin.getWritingTests().then(t => {
    setTests(t);
    if (selectedTest) setSelectedTest(t.find(x => x.id === selectedTest.id) || null);
  });

  const handleCreateTest = async () => {
    if (!newTestTitle.trim()) return;
    setSaving("new");
    try {
      const test = await api.admin.createWritingTest({ title: newTestTitle, is_active: false });
      // Auto-create Task 1 and Task 2
      await api.admin.createWritingTask(test.id, {
        task_number: 1, task_type: "task1_academic", prompt: "", min_words: 150,
      });
      await api.admin.createWritingTask(test.id, {
        task_number: 2, task_type: "task2", prompt: "", min_words: 250,
      });
      await reload(); setShowNewTest(false); setNewTestTitle("");
    } catch (e) { alert(e.message); }
    setSaving(null);
  };

  const handleSaveTask = async (taskId, data) => {
    setSaving(taskId);
    try {
      await api.admin.updateWritingTask(taskId, data);
      await reload(); setEditingTask(e => { const n = { ...e }; delete n[taskId]; return n; });
    } catch (e) { alert(e.message); }
    setSaving(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Tests</span>
          <SBtn variant="ghost" onClick={() => setShowNewTest(t => !t)}>+ New</SBtn>
        </div>
        {showNewTest && (
          <div style={{ marginBottom: 8 }}>
            <input value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)}
              placeholder="Test title" style={{ ...s.input, marginBottom: 6 }} />
            <SBtn disabled={saving === "new"} onClick={handleCreateTest}>Create</SBtn>
          </div>
        )}
        {tests.map(t => (
          <div key={t.id} style={s.sidebarItem(selectedTest?.id === t.id)}
            onClick={() => setSelectedTest(t)}>
            {t.title}
          </div>
        ))}
      </div>

      {!selectedTest ? (
        <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#94a3b8" }}>Select a writing test</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedTest.tasks?.map(task => {
            const isEditing = !!editingTask[task.id];
            const ef = editingTask[task.id] || task;
            const setEF = (k, v) => setEditingTask(e => ({ ...e, [task.id]: { ...(e[task.id] || task), [k]: v } }));

            return (
              <div key={task.id} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SBadge color={task.task_number === 1 ? "#0ea5e9" : "#7c3aed"}>
                      Task {task.task_number}
                    </SBadge>
                    <SBadge color="#64748b">{task.task_type}</SBadge>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>min {task.min_words} words</span>
                  </div>
                  {!isEditing && (
                    <SBtn variant="outline"
                      onClick={() => setEditingTask(e => ({ ...e, [task.id]: { ...task } }))}>
                      Edit
                    </SBtn>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <div style={s.grid2}>
                      <FSelect label="Task type" value={ef.task_type}
                        onChange={v => setEF("task_type", v)}
                        options={[
                          { value: "task1_academic", label: "Task 1 — Academic (graph/chart)" },
                          { value: "task1_general", label: "Task 1 — General (letter)" },
                          { value: "task2", label: "Task 2 — Essay" },
                        ]} />
                      <FInput label="Minimum words" type="number" value={ef.min_words}
                        onChange={v => setEF("min_words", parseInt(v) || 150)} />
                    </div>
                    <FInput label="Task prompt" value={ef.prompt} onChange={v => setEF("prompt", v)}
                      rows={5} placeholder="The graph/chart below shows… Summarise the information by…" />
                    <FInput label="Stimulus (graph data / description — shown below the prompt)"
                      value={ef.stimulus || ""} onChange={v => setEF("stimulus", v)}
                      rows={4} placeholder="Bar chart data: Low income: 12% → 58%..." />
                    <div style={{ display: "flex", gap: 8 }}>
                      <SBtn disabled={saving === task.id} onClick={() => handleSaveTask(task.id, editingTask[task.id])}>
                        {saving === task.id ? "Saving…" : "Save task"}
                      </SBtn>
                      <SBtn variant="ghost"
                        onClick={() => setEditingTask(e => { const n = { ...e }; delete n[task.id]; return n; })}>
                        Cancel
                      </SBtn>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 8, whiteSpace: "pre-line" }}>
                      {task.prompt || <span style={{ color: "#94a3b8" }}>No prompt yet</span>}
                    </div>
                    {task.stimulus && (
                      <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 7, fontSize: 12, color: "#64748b", fontFamily: "monospace", whiteSpace: "pre-line" }}>
                        {task.stimulus}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SPEAKING TAB
// ════════════════════════════════════════════════════════════════════════════
function SpeakingQTab({ api }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [saving, setSaving] = useState(null);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [showNewTest, setShowNewTest] = useState(false);
  const [editingPart, setEditingPart] = useState({});

  useEffect(() => { api.admin.getSpeakingTests().then(setTests).catch(console.error); }, []);

  const reload = () => api.admin.getSpeakingTests().then(t => {
    setTests(t);
    if (selectedTest) setSelectedTest(t.find(x => x.id === selectedTest.id) || null);
  });

  const handleCreateTest = async () => {
    if (!newTestTitle.trim()) return;
    setSaving("new");
    try {
      const test = await api.admin.createSpeakingTest({ title: newTestTitle, is_active: false });
      // Auto-create all 3 parts
      await api.admin.createSpeakingPart(test.id, {
        part_number: 1, part_type: "part1",
        instructions: "The examiner will ask you questions about yourself and familiar topics.",
        questions: [], prep_time_seconds: 0, response_time_seconds: 240,
      });
      await api.admin.createSpeakingPart(test.id, {
        part_number: 2, part_type: "part2",
        instructions: "You will be given a topic card. Prepare for 1 minute, then speak for 1–2 minutes.",
        questions: ["Please speak about the topic on the card for 1–2 minutes."],
        cue_card: "", prep_time_seconds: 60, response_time_seconds: 150,
      });
      await api.admin.createSpeakingPart(test.id, {
        part_number: 3, part_type: "part3",
        instructions: "The examiner will ask more abstract questions related to the Part 2 topic.",
        questions: [], prep_time_seconds: 0, response_time_seconds: 300,
      });
      await reload(); setShowNewTest(false); setNewTestTitle("");
    } catch (e) { alert(e.message); }
    setSaving(null);
  };

  const handleSavePart = async (partId, data) => {
    setSaving(partId);
    try {
      await api.admin.updateSpeakingPart(partId, data);
      await reload();
      setEditingPart(e => { const n = { ...e }; delete n[partId]; return n; });
    } catch (e) { alert(e.message); }
    setSaving(null);
  };

  const PART_COLORS = { 1: "#6366f1", 2: "#06b6d4", 3: "#8b5cf6" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Tests</span>
          <SBtn variant="ghost" onClick={() => setShowNewTest(t => !t)}>+ New</SBtn>
        </div>
        {showNewTest && (
          <div style={{ marginBottom: 8 }}>
            <input value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)}
              placeholder="Test title" style={{ ...s.input, marginBottom: 6 }} />
            <SBtn disabled={saving === "new"} onClick={handleCreateTest}>Create</SBtn>
          </div>
        )}
        {tests.map(t => (
          <div key={t.id} style={s.sidebarItem(selectedTest?.id === t.id)}
            onClick={() => setSelectedTest(t)}>
            {t.title}
          </div>
        ))}
      </div>

      {!selectedTest ? (
        <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#94a3b8" }}>Select a speaking test</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedTest.parts?.map(part => {
            const isEditing = !!editingPart[part.id];
            const ef = editingPart[part.id] || part;
            const setEF = (k, v) => setEditingPart(e => ({ ...e, [part.id]: { ...(e[part.id] || part), [k]: v } }));
            const color = PART_COLORS[part.part_number] || "#6366f1";

            return (
              <div key={part.id} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SBadge color={color}>Part {part.part_number}</SBadge>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{part.part_type}</span>
                    {part.prep_time_seconds > 0 && (
                      <span style={{ fontSize: 12, color: "#d97706" }}>{part.prep_time_seconds}s prep</span>
                    )}
                  </div>
                  {!isEditing && (
                    <SBtn variant="outline"
                      onClick={() => setEditingPart(e => ({ ...e, [part.id]: { ...part, questions: [...(part.questions || [])] } }))}>
                      Edit
                    </SBtn>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <FInput label="Instructions (shown to student)" value={ef.instructions}
                      onChange={v => setEF("instructions", v)} rows={2} />

                    {part.part_number === 2 && (
                      <FInput label="Cue card text" value={ef.cue_card || ""}
                        onChange={v => setEF("cue_card", v)} rows={5}
                        placeholder={"Describe a book or film...\n\nYou should say:\n  • what it was\n  • when you encountered it"} />
                    )}

                    <div style={s.row}>
                      <label style={s.label}>
                        Questions (one per line
                        {part.part_number === 2 ? " — first question is the main prompt" : ""})
                      </label>
                      <textarea rows={6}
                        value={(ef.questions || []).join("\n")}
                        onChange={e => setEF("questions", e.target.value.split("\n").filter(Boolean))}
                        style={s.textarea}
                        placeholder={
                          part.part_number === 1
                            ? "Can you tell me about where you grew up?\nWhat do you enjoy doing in your free time?"
                            : part.part_number === 2
                            ? "Please speak about the topic on the card for 1–2 minutes.\nDo you think reading is more beneficial than watching films?"
                            : "How has technology changed the way people read today?\nShould governments invest more in public libraries?"
                        }
                      />
                    </div>

                    {part.part_number === 2 && (
                      <FInput label="Preparation time (seconds)" type="number"
                        value={ef.prep_time_seconds} onChange={v => setEF("prep_time_seconds", parseInt(v) || 60)} />
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <SBtn disabled={saving === part.id} onClick={() => handleSavePart(part.id, editingPart[part.id])}>
                        {saving === part.id ? "Saving…" : "Save part"}
                      </SBtn>
                      <SBtn variant="ghost"
                        onClick={() => setEditingPart(e => { const n = { ...e }; delete n[part.id]; return n; })}>
                        Cancel
                      </SBtn>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{part.instructions}</div>
                    {part.cue_card && (
                      <div style={{ padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 13, marginBottom: 10, whiteSpace: "pre-line", color: "#374151", border: "1px solid #fbbf2433" }}>
                        {part.cue_card}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {(part.questions || []).map((q, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#374151", padding: "5px 10px", background: "#f8fafc", borderRadius: 6 }}>
                          {i + 1}. {q}
                        </div>
                      ))}
                      {!part.questions?.length && (
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>No questions yet — click Edit to add them</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN QuestionsTab — module selector + sub-tabs
// ════════════════════════════════════════════════════════════════════════════
export function QuestionsTab({ api }) {
  const [module, setModule] = useState("listening");
  const modules = [
    { id: "listening", label: "Listening", color: "#0ea5e9" },
    { id: "reading",   label: "Reading",   color: "#f59e0b" },
    { id: "writing",   label: "Writing",   color: "#10b981" },
    { id: "speaking",  label: "Speaking",  color: "#8b5cf6" },
  ];

  return (
    <div>
      {/* Module selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {modules.map(m => (
          <button key={m.id} onClick={() => setModule(m.id)} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "all .15s", fontFamily: "system-ui",
            background: module === m.id ? m.color + "18" : "transparent",
            color: module === m.id ? m.color : "#64748b",
            border: `1px solid ${module === m.id ? m.color + "55" : "#e2e8f0"}`,
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {module === "listening" && <ListeningQTab api={api} />}
      {module === "reading"   && <ReadingQTab   api={api} />}
      {module === "writing"   && <WritingQTab   api={api} />}
      {module === "speaking"  && <SpeakingQTab  api={api} />}
    </div>
  );
}