import { useState, useEffect, useRef } from "react";

export function TestsTab({ api }) {
  const [ieltsTests, setIeltsTests] = useState([]);
  const [moduleLists, setModuleLists] = useState({
    listening: [], reading: [], writing: [], speaking: [],
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // IeltsTest being edited
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load everything on mount
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [ielts, listening, reading, writing, speaking] = await Promise.all([
        api.admin.getIeltsTests(),
        api.admin.getListeningTests(),
        api.admin.getReadingTests(),
        api.admin.getWritingTests(),
        api.admin.getSpeakingTests(),
      ]);
      setIeltsTests(ielts);
      setModuleLists({ listening, reading, writing, speaking });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await api.admin.createIeltsTest({
        title: newTitle,
        test_type: "academic",
        is_active: false,
        is_demo: false,
      });
      setNewTitle("");
      setCreating(false);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.admin.updateIeltsTest(editing.id, {
        title: editing.title,
        is_active: editing.is_active,
        is_demo: editing.is_demo,
        listening_test_id: editing.listening_test_id || null,
        reading_test_id: editing.reading_test_id || null,
        writing_test_id: editing.writing_test_id || null,
        speaking_test_id: editing.speaking_test_id || null,
      });
      setEditing(null);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  async function handleDelete(testId) {
    setSaving(true);
    try {
      await api.admin.deleteIeltsTest(testId);
      setDeleteConfirm(null);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  // Helpers
  const moduleColor = {
    listening: "#0ea5e9",
    reading:   "#f59e0b",
    writing:   "#10b981",
    speaking:  "#8b5cf6",
  };

  const completeness = (test) => {
    const modules = ["listening", "reading", "writing", "speaking"];
    const linked = modules.filter(m => test[`${m}_test_id`]).length;
    return { linked, total: 4, pct: (linked / 4) * 100 };
  };

  if (loading) {
    return <p style={{ padding: 32, color: "#64748b", fontFamily: "system-ui" }}>Loading…</p>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>IELTS Tests</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Each test links one module test per section. Students see only active tests.
          </p>
        </div>
        <button
          onClick={() => setCreating(c => !c)}
          style={{
            padding: "8px 18px", borderRadius: 8, background: "#6366f1",
            color: "#fff", border: "none", fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "system-ui",
          }}>
          + New IELTS test
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{
          padding: "16px 18px", background: "#eef2ff", borderRadius: 10,
          border: "1px solid #6366f133", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>New IELTS test</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Academic Full Test 2"
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: "1px solid #e2e8f0", fontSize: 13,
                fontFamily: "system-ui",
              }}
            />
            <button onClick={handleCreate} disabled={saving || !newTitle.trim()}
              style={{
                padding: "8px 18px", borderRadius: 8, background: "#6366f1",
                color: "#fff", border: "none", fontSize: 13, cursor: "pointer",
                fontFamily: "system-ui", opacity: saving ? 0.5 : 1,
              }}>
              {saving ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setCreating(false)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "system-ui", color: "#64748b" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Test cards */}
      {ieltsTests.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          No IELTS tests yet. Create one above, then link module tests to it.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ieltsTests.map(test => {
            const comp = completeness(test);
            const isEditing = editing?.id === test.id;

            return (
              <div key={test.id} style={{
                background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: 12, overflow: "hidden",
              }}>
                {/* Card header */}
                <div style={{ padding: "16px 20px", borderBottom: isEditing ? "1px solid #e2e8f0" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{test.title}</span>
                        {test.is_active && (
                          <span style={{ background: "#d1fae5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "1px 8px" }}>
                            Active
                          </span>
                        )}
                        {test.is_demo && (
                          <span style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "1px 8px" }}>
                            Demo
                          </span>
                        )}
                      </div>

                      {/* Completeness bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 4 }}>
                          <div style={{
                            width: `${comp.pct}%`, height: "100%", borderRadius: 4,
                            background: comp.linked === 4 ? "#059669" : "#6366f1",
                            transition: "width .3s",
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          {comp.linked}/4 modules linked
                        </span>
                      </div>

                      {/* Module chips — show linked status */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["listening", "reading", "writing", "speaking"].map(m => {
                          const title = test[`${m}_test_title`];
                          const color = moduleColor[m];
                          return (
                            <div key={m} style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "3px 10px", borderRadius: 99,
                              background: title ? color + "12" : "#f8fafc",
                              border: `1px solid ${title ? color + "44" : "#e2e8f0"}`,
                              fontSize: 12,
                            }}>
                              <span style={{ color: title ? color : "#94a3b8", fontWeight: 500, textTransform: "capitalize" }}>
                                {m}
                              </span>
                              {title ? (
                                <span style={{ color: title ? "#374151" : "#94a3b8" }}>
                                  — {title}
                                </span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>— not linked</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, marginLeft: 16 }}>
                      {!isEditing ? (
                        <>
                          <button onClick={() => setEditing({ ...test })}
                            style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #6366f144", background: "transparent", color: "#6366f1", fontSize: 12, cursor: "pointer", fontFamily: "system-ui" }}>
                            Edit & Link
                          </button>
                          {deleteConfirm === test.id ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => handleDelete(test.id)} disabled={saving}
                                style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "system-ui" }}>
                                Confirm delete
                              </button>
                              <button onClick={() => setDeleteConfirm(null)}
                                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "system-ui" }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(test.id)}
                              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "system-ui" }}>
                              Delete
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button onClick={handleSaveEdit} disabled={saving}
                            style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "system-ui", opacity: saving ? 0.5 : 1 }}>
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "system-ui" }}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit panel — expanded when editing */}
                {isEditing && (
                  <div style={{ padding: "20px 20px", background: "#fafafa" }}>
                    {/* Metadata */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 120px", gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Test title</label>
                        <input value={editing.title}
                          onChange={e => setEditing(ed => ({ ...ed, title: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "system-ui", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Test type</label>
                        <select value={editing.test_type}
                          onChange={e => setEditing(ed => ({ ...ed, test_type: e.target.value }))}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "system-ui" }}>
                          <option value="academic">Academic</option>
                          <option value="general">General Training</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Active</label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                          <input type="checkbox" checked={editing.is_active}
                            onChange={e => setEditing(ed => ({ ...ed, is_active: e.target.checked }))} />
                          <span style={{ fontSize: 13, color: "#374151" }}>Visible to students</span>
                        </label>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Demo</label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                          <input type="checkbox" checked={editing.is_demo}
                            onChange={e => setEditing(ed => ({ ...ed, is_demo: e.target.checked }))} />
                          <span style={{ fontSize: 13, color: "#374151" }}>Free access</span>
                        </label>
                      </div>
                    </div>

                    {/* Module linking — the main feature */}
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                      Link module tests
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {["listening", "reading", "writing", "speaking"].map(m => {
                        const color = moduleColor[m];
                        const fk = `${m}_test_id`;
                        const options = moduleLists[m] || [];
                        return (
                          <div key={m} style={{
                            padding: "14px 16px", borderRadius: 10,
                            border: `1px solid ${editing[fk] ? color + "44" : "#e2e8f0"}`,
                            background: editing[fk] ? color + "06" : "#fff",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color, textTransform: "capitalize" }}>
                                {m}
                              </span>
                              {editing[fk] && (
                                <button
                                  onClick={() => setEditing(ed => ({ ...ed, [fk]: null }))}
                                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
                                  ✕ Unlink
                                </button>
                              )}
                            </div>
                            <select
                              value={editing[fk] || ""}
                              onChange={e => setEditing(ed => ({ ...ed, [fk]: e.target.value || null }))}
                              style={{
                                width: "100%", padding: "7px 10px", borderRadius: 8,
                                border: `1px solid ${editing[fk] ? color + "55" : "#e2e8f0"}`,
                                fontSize: 13, fontFamily: "system-ui",
                                background: "#fff", cursor: "pointer",
                              }}>
                              <option value="">— Not linked —</option>
                              {options.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.title}</option>
                              ))}
                            </select>
                            {options.length === 0 && (
                              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                                No {m} tests yet. Create one in Questions & Audio.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Completeness warning */}
                    {["listening", "reading", "writing", "speaking"].some(m => !editing[`${m}_test_id`]) && (
                      <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 12.5, color: "#78350f", border: "1px solid #fbbf2444" }}>
                        ⚠ Modules without a linked test will show a "coming soon" stub to students.
                        Link all four before marking this test as Active.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}