import { useState, useEffect } from "react";

const PPL = {
  push: {
    label: "Push", ja: "プッシュ", desc: "胸・肩・三頭筋",
    color: "#f06060", bg: "#2a0a0a",
    exercises: [
      "ベンチプレス", "インクラインプレス", "チェストフライ",
      "チェストプレス", "インクラインチェストプレス", "ペックフライ", "ナロープレス",
      "ショルダープレス", "サイドレイズ", "フロントレイズ",
      "トライセップスプレスダウン", "オーバーヘッドエクステンション", "ディップス",
    ],
  },
  pull: {
    label: "Pull", ja: "プル", desc: "背中・二頭筋",
    color: "#60a0f0", bg: "#0a1a2a",
    exercises: [
      "ラットプルダウン", "マシンラットプルダウン", "ナローラットプルダウン",
      "シーテッドロウ", "ベントオーバーロウ", "ワンハンドロウ",
      "フェイスプル", "リアデルトフライ",
      "バイセップカール", "ハンマーカール", "インクラインカール",
    ],
  },
  legs: {
    label: "Legs", ja: "レッグ", desc: "脚・前腕",
    color: "#c8f060", bg: "#1a2a0a",
    exercises: [
      "スクワット", "ハックスクワット", "ブルガリアンスクワット", "レッグプレス",
      "レッグエクステンション", "レッグカール", "ランジ",
      "カーフレイズ", "リストカール", "リバースリストカール",
    ],
  },
  core: {
    label: "Core", ja: "コア", desc: "腹筋・体幹",
    color: "#c060f0", bg: "#1a0a2a",
    exercises: [
      "アブクランチ", "プランク", "サイドベント",
      "レッグレイズ", "ロシアンツイスト", "ドラゴンフラッグ",
    ],
  },
};

// 種目→部位のマッピング
const MUSCLE_MAP = {
  "ベンチプレス": "胸", "インクラインプレス": "胸", "チェストフライ": "胸",
  "チェストプレス": "胸", "インクラインチェストプレス": "胸", "ペックフライ": "胸", "ナロープレス": "肩",
  "ショルダープレス": "肩", "サイドレイズ": "肩", "フロントレイズ": "肩",
  "トライセップスプレスダウン": "三頭", "オーバーヘッドエクステンション": "三頭", "ディップス": "三頭",
  "ラットプルダウン": "背中", "マシンラットプルダウン": "背中", "ナローラットプルダウン": "背中",
  "シーテッドロウ": "背中", "ベントオーバーロウ": "背中", "ワンハンドロウ": "背中",
  "フェイスプル": "背中", "リアデルトフライ": "背中",
  "バイセップカール": "二頭", "ハンマーカール": "二頭", "インクラインカール": "二頭",
  "スクワット": "脚", "ハックスクワット": "脚", "ブルガリアンスクワット": "脚", "レッグプレス": "脚",
  "レッグエクステンション": "脚", "レッグカール": "脚", "ランジ": "脚", "カーフレイズ": "脚",
  "アブクランチ": "腹筋・体幹", "プランク": "腹筋・体幹", "サイドベント": "腹筋・体幹",
  "レッグレイズ": "腹筋・体幹", "ロシアンツイスト": "腹筋・体幹", "ドラゴンフラッグ": "腹筋・体幹",
  "リストカール": "前腕", "リバースリストカール": "前腕",
};

// 部位の表示順・色
const MUSCLE_META = {
  "胸":       { color: "#f06060", ppl: "push" },
  "肩":       { color: "#f0a060", ppl: "push" },
  "三頭":     { color: "#f0d060", ppl: "push" },
  "背中":     { color: "#60a0f0", ppl: "pull" },
  "二頭":     { color: "#60d0f0", ppl: "pull" },
  "脚":       { color: "#c8f060", ppl: "legs" },
  "前腕":     { color: "#a0f0c0", ppl: "legs" },
  "腹筋・体幹": { color: "#c060f0", ppl: "core" },
};

const MUSCLE_ORDER = ["胸","肩","三頭","背中","二頭","脚","前腕","腹筋・体幹"];

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (d) => {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });
};

const shiftDate = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// 今週の月曜〜日曜を返す
const getWeekRange = (offset = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset * 7);
  const day = dt.getDay(); // 0=Sun
  const mon = new Date(dt);
  mon.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  return { start: fmt(mon), end: fmt(sun) };
};

export default function WorkoutTracker() {
  const [logs, setLogs] = useState({});
  const [storageReady, setStorageReady] = useState(false);
  const [view, setView] = useState("log");
  const [selectedDate, setSelectedDate] = useState(today());
  const [dayType, setDayType] = useState(null);
  const [sets, setSets] = useState([{ exercise: "", weight: "", reps: "" }]);
  const [startTime, setStartTime] = useState("");
  const [saved, setSaved] = useState(false);
  const [expandedDate, setExpandedDate] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("workout_logs");
        if (result && result.value) setLogs(JSON.parse(result.value));
      } catch {}
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try { await window.storage.set("workout_logs", JSON.stringify(logs)); } catch {}
    })();
  }, [logs, storageReady]);

  // 同じメニュータイプの直近の記録を取得
  const getLastSets = (type) => {
    const dates = Object.keys(logs)
      .filter(d => logs[d].type === type && d < selectedDate)
      .sort((a, b) => b.localeCompare(a));
    if (!dates.length) return null;
    return logs[dates[0]].sets;
  };

  useEffect(() => {
    const existing = logs[selectedDate];
    if (existing) {
      setDayType(existing.type);
    } else {
      setDayType(null);
    }
    setSets([{ exercise: "", weight: "", reps: "" }]);
  }, [selectedDate, storageReady]);

  // メニュー選択時に前回記録をプリフィル
  const handleDayTypeChange = (key) => {
    if (dayType === key) {
      setDayType(null);
      setSets([{ exercise: "", weight: "", reps: "" }]);
      return;
    }
    setDayType(key);
    // 今日の日付にすでに記録がある場合はプリフィルしない
    if (logs[selectedDate]?.type === key) {
      setSets([{ exercise: "", weight: "", reps: "" }]);
      return;
    }
    const last = getLastSets(key);
    if (last && last.length > 0) {
      setSets(last.map(s => ({ exercise: s.exercise, weight: s.weight, reps: s.reps })));
    } else {
      setSets([{ exercise: "", weight: "", reps: "" }]);
    }
  };

  const updateSet = (i, field, val) =>
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const addSet = () => setSets(prev => [...prev, { exercise: "", weight: "", reps: "" }]);
  const removeSet = (i) => setSets(prev => prev.filter((_, idx) => idx !== i));

  const saveLog = () => {
    const valid = sets.filter(s => s.exercise && s.weight && s.reps);
    if (!valid.length || !dayType) return;
    setLogs(prev => ({
      ...prev,
      [selectedDate]: {
        type: dayType,
        startTime: startTime || prev[selectedDate]?.startTime || "",
        sets: [...(prev[selectedDate]?.sets || []), ...valid],
      },
    }));
    setSets([{ exercise: "", weight: "", reps: "" }]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const deleteLog = (date, idx) => {
    setLogs(prev => {
      const entry = prev[date];
      if (!entry) return prev;
      const updated = [...entry.sets];
      updated.splice(idx, 1);
      const next = { ...prev };
      if (updated.length === 0) delete next[date];
      else next[date] = { ...entry, sets: updated };
      return next;
    });
  };

  // 週間ボリューム集計
  const calcWeekVolume = (offset) => {
    const { start, end } = getWeekRange(offset);
    const muscleSets = {};
    Object.entries(logs).forEach(([date, entry]) => {
      if (date < start || date > end) return;
      entry.sets.forEach(s => {
        const muscle = MUSCLE_MAP[s.exercise] || "その他";
        muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
      });
    });
    return muscleSets;
  };

  const isToday = selectedDate === today();
  const sortedDates = Object.keys(logs).sort((a, b) => b.localeCompare(a));
  const selectedLog = logs[selectedDate];
  const activePPL = dayType ? PPL[dayType] : null;
  const weekVolume = calcWeekVolume(weekOffset);
  const { start: wStart, end: wEnd } = getWeekRange(weekOffset);
  const maxSets = Math.max(...Object.values(weekVolume), 1);

  if (!storageReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#5a5a7a", fontSize: 14 }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", color: "#e8e4dc",
      fontFamily: "'Noto Sans JP', sans-serif", maxWidth: 480,
      margin: "0 auto", paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: "28px 20px 16px", borderBottom: "1px solid #1e1e2e",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#5a5a7a", fontWeight: 600, marginBottom: 4 }}>PPL TRACKER</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>TRAINING LOG</div>
        </div>
        <div style={{ fontSize: 13, color: "#5a5a7a", paddingBottom: 4 }}>
          {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e1e2e" }}>
        {[["log", "記録する"], ["history", "履歴"], ["volume", "週間"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={{
            flex: 1, padding: "14px 0", background: "none", border: "none",
            color: view === key ? "#c8f060" : "#5a5a7a",
            fontWeight: view === key ? 700 : 400,
            fontSize: 14, cursor: "pointer",
            borderBottom: view === key ? "2px solid #c8f060" : "2px solid transparent",
            transition: "all 0.2s", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      {/* 記録する */}
      {view === "log" && (
        <div style={{ padding: "20px 16px" }}>
          {/* Date picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#5a5a7a", marginBottom: 10 }}>日付</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#12121c", borderRadius: 12, padding: "10px 14px", border: "1px solid #1e1e2e",
            }}>
              <button onClick={() => setSelectedDate(d => shiftDate(d, -1))} style={{
                background: "none", border: "1px solid #2a2a3e", color: "#5a5a7a",
                borderRadius: 8, width: 32, height: 32, cursor: "pointer",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{formatDate(selectedDate)}</div>
                {isToday && <div style={{ fontSize: 10, color: "#c8f060", letterSpacing: 1, marginTop: 2 }}>TODAY</div>}
              </div>
              <button onClick={() => setSelectedDate(d => shiftDate(d, 1))} disabled={isToday} style={{
                background: "none", border: "1px solid #2a2a3e",
                color: isToday ? "#2a2a3e" : "#5a5a7a",
                borderRadius: 8, width: 32, height: 32, cursor: isToday ? "default" : "pointer",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            </div>
          </div>

          {/* Start time */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#5a5a7a", marginBottom: 10 }}>開始時刻</div>
            <div style={{
              background: "#12121c", borderRadius: 12, padding: "10px 14px",
              border: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: 10,
            }}>
              <input type="time" value={startTime || logs[selectedDate]?.startTime || ""}
                onChange={e => setStartTime(e.target.value)}
                style={{
                  flex: 1, background: "none", border: "none", color: "#e8e4dc",
                  fontSize: 16, fontWeight: 700, fontFamily: "inherit", outline: "none",
                  colorScheme: "dark",
                }} />
              {(startTime || logs[selectedDate]?.startTime) && (
                <button onClick={() => setStartTime("")} style={{
                  background: "none", border: "none", color: "#3a3a5a",
                  fontSize: 16, cursor: "pointer", padding: "0 4px",
                }}>×</button>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#5a5a7a", marginBottom: 10 }}>メニュー</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(PPL).map(([key, p]) => {
                const active = dayType === key;
                return (
                  <button key={key} onClick={() => handleDayTypeChange(key)} style={{
                    flex: 1, padding: "12px 4px",
                    background: active ? p.bg : "#12121c",
                    border: `1px solid ${active ? p.color : "#2a2a3e"}`,
                    borderRadius: 12, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: active ? p.color : "#5a5a7a", letterSpacing: 1 }}>{p.label}</span>
                    <span style={{ fontSize: 10, color: active ? p.color : "#3a3a5a" }}>{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date summary */}
          {selectedLog && (
            <div style={{
              background: PPL[selectedLog.type]?.bg || "#12121c",
              borderRadius: 12, padding: "12px 14px", marginBottom: 20,
              border: `1px solid ${PPL[selectedLog.type]?.color || "#1e1e2e"}`,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: PPL[selectedLog.type]?.color || "#5a5a7a", marginBottom: 6 }}>
                {isToday ? "TODAY" : formatDate(selectedDate)} · {PPL[selectedLog.type]?.label} — {selectedLog.sets.length}セット完了
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[...new Set(selectedLog.sets.map(s => s.exercise))].map(ex => (
                  <span key={ex} style={{
                    background: "#ffffff10", color: PPL[selectedLog.type]?.color || "#e8e4dc",
                    fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                  }}>{ex}</span>
                ))}
              </div>
            </div>
          )}

          {/* Set input */}
          {dayType ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#5a5a7a", marginBottom: 12 }}>NEW SETS</div>
                {sets.map((s, i) => (
                  <div key={i} style={{
                    background: "#12121c", borderRadius: 12, padding: "14px 12px",
                    marginBottom: 10, border: `1px solid ${activePPL.color}22`, position: "relative",
                  }}>
                    <div style={{ fontSize: 11, color: "#3a3a5a", marginBottom: 8, fontWeight: 600 }}>SET {i + 1}</div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "#5a5a7a", marginBottom: 5 }}>種目</div>
                      <select value={s.exercise} onChange={e => updateSet(i, "exercise", e.target.value)} style={{
                        width: "100%", background: "#0a0a14", color: s.exercise ? "#e8e4dc" : "#3a3a5a",
                        border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 12px",
                        fontSize: 14, fontFamily: "inherit", appearance: "none", cursor: "pointer",
                      }}>
                        <option value="">選択してください</option>
                        {activePPL.exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[["weight", "重量", "kg"], ["reps", "回数", "回"]].map(([field, label, unit]) => (
                        <div key={field} style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: "#5a5a7a", marginBottom: 5 }}>{label}</div>
                          <div style={{ position: "relative" }}>
                            <input type="number" inputMode="decimal" value={s[field]}
                              onChange={e => updateSet(i, field, e.target.value)} placeholder="0"
                              style={{
                                width: "100%", background: "#0a0a14", color: "#e8e4dc",
                                border: "1px solid #2a2a3e", borderRadius: 8,
                                padding: "10px 32px 10px 12px", fontSize: 16,
                                fontFamily: "inherit", boxSizing: "border-box", WebkitAppearance: "none",
                              }} />
                            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#3a3a5a" }}>{unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {sets.length > 1 && (
                      <button onClick={() => removeSet(i)} style={{
                        position: "absolute", top: 10, right: 10, background: "none",
                        border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", padding: "0 4px",
                      }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={addSet} style={{
                  flex: 1, padding: "13px 0", background: "none", border: "1px solid #2a2a3e",
                  color: "#5a5a7a", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                }}>+ セット追加</button>
                <button onClick={saveLog} style={{
                  flex: 2, padding: "13px 0",
                  background: saved ? activePPL.bg : activePPL.color,
                  border: `1px solid ${activePPL.color}`,
                  color: saved ? activePPL.color : "#0a0a0f",
                  borderRadius: 10, fontSize: 15, fontWeight: 800,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.3s",
                }}>{saved ? "✓ 保存しました" : "保存する"}</button>
              </div>
            </>
          ) : (
            <div style={{
              textAlign: "center", color: "#3a3a5a", padding: "40px 0", fontSize: 14,
              border: "1px dashed #2a2a3e", borderRadius: 12,
            }}>
              上のボタンでメニューを選んでください
            </div>
          )}
        </div>
      )}

      {/* 履歴 */}
      {view === "history" && (
        <div style={{ padding: "20px 16px" }}>
          {sortedDates.length === 0 ? (
            <div style={{ textAlign: "center", color: "#3a3a5a", marginTop: 60, fontSize: 14 }}>まだ記録がありません</div>
          ) : sortedDates.map(date => {
            const entry = logs[date];
            const ppl = PPL[entry.type];
            const isOpen = expandedDate === date;
            const exercises = [...new Set(entry.sets.map(s => s.exercise))];
            return (
              <div key={date} style={{
                background: "#12121c", borderRadius: 12, marginBottom: 10,
                border: `1px solid ${isOpen ? ppl.color + "55" : "#1e1e2e"}`, overflow: "hidden",
                transition: "border-color 0.2s",
              }}>
                <button onClick={() => setExpandedDate(isOpen ? null : date)} style={{
                  width: "100%", background: "none", border: "none",
                  padding: "14px 16px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", cursor: "pointer", color: "#e8e4dc", fontFamily: "inherit",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      background: ppl.bg, color: ppl.color, fontSize: 11, fontWeight: 800,
                      padding: "3px 8px", borderRadius: 6, letterSpacing: 1, border: `1px solid ${ppl.color}55`,
                    }}>{ppl.label}</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{formatDate(date)}</div>
                      <div style={{ fontSize: 11, color: "#5a5a7a", marginTop: 2 }}>
                        {entry.startTime && <span style={{ marginRight: 6 }}>🕐 {entry.startTime}</span>}
                        {entry.sets.length}セット · {exercises.slice(0, 2).join("・")}{exercises.length > 2 ? ` 他${exercises.length - 2}種目` : ""}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: "#3a3a5a", fontSize: 18, transform: isOpen ? "rotate(90deg)" : "none", transition: "0.2s" }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop: "1px solid #1e1e2e", padding: "12px 16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["種目", "重量", "回数", ""].map(h => (
                            <th key={h} style={{ color: "#3a3a5a", fontWeight: 600, textAlign: h === "種目" ? "left" : "center", paddingBottom: 8, fontSize: 11, letterSpacing: 1 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entry.sets.map((s, idx) => (
                          <tr key={idx} style={{ borderTop: "1px solid #1e1e2e" }}>
                            <td style={{ padding: "9px 0", color: ppl.color, fontWeight: 600, fontSize: 13 }}>{s.exercise}</td>
                            <td style={{ textAlign: "center" }}>{s.weight}<span style={{ fontSize: 10, color: "#5a5a7a" }}>kg</span></td>
                            <td style={{ textAlign: "center" }}>{s.reps}<span style={{ fontSize: 10, color: "#5a5a7a" }}>回</span></td>
                            <td style={{ textAlign: "center" }}>
                              <button onClick={() => deleteLog(date, idx)} style={{
                                background: "none", border: "none", color: "#3a3a5a",
                                fontSize: 16, cursor: "pointer", padding: "0 4px",
                              }}>×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 週間ボリューム */}
      {view === "volume" && (
        <div style={{ padding: "20px 16px" }}>
          {/* 週ナビ */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#12121c", borderRadius: 12, padding: "10px 14px",
            border: "1px solid #1e1e2e", marginBottom: 20,
          }}>
            <button onClick={() => setWeekOffset(o => o - 1)} style={{
              background: "none", border: "1px solid #2a2a3e", color: "#5a5a7a",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>‹</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {formatDate(wStart)} 〜 {formatDate(wEnd)}
              </div>
              {weekOffset === 0 && <div style={{ fontSize: 10, color: "#c8f060", letterSpacing: 1, marginTop: 2 }}>今週</div>}
            </div>
            <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset === 0} style={{
              background: "none", border: "1px solid #2a2a3e",
              color: weekOffset === 0 ? "#2a2a3e" : "#5a5a7a",
              borderRadius: 8, width: 32, height: 32, cursor: weekOffset === 0 ? "default" : "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>›</button>
          </div>

          {Object.keys(weekVolume).length === 0 ? (
            <div style={{ textAlign: "center", color: "#3a3a5a", marginTop: 60, fontSize: 14 }}>
              この週の記録がありません
            </div>
          ) : (
            <>
              {/* PPLごとにグループ表示 */}
              {["push", "pull", "legs", "core"].map(pplKey => {
                const ppl = PPL[pplKey];
                const muscles = MUSCLE_ORDER.filter(m =>
                  MUSCLE_META[m]?.ppl === pplKey && weekVolume[m]
                );
                if (!muscles.length) return null;
                const total = muscles.reduce((s, m) => s + (weekVolume[m] || 0), 0);
                return (
                  <div key={pplKey} style={{
                    background: "#12121c", borderRadius: 12, marginBottom: 14,
                    border: `1px solid ${ppl.color}33`, overflow: "hidden",
                  }}>
                    {/* PPLヘッダー */}
                    <div style={{
                      background: ppl.bg, padding: "10px 16px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: `1px solid ${ppl.color}33`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: ppl.color, letterSpacing: 1 }}>{ppl.label}</span>
                      <span style={{ fontSize: 12, color: ppl.color }}>計 {total} セット</span>
                    </div>
                    {/* 部位ごとのバー */}
                    <div style={{ padding: "12px 16px" }}>
                      {muscles.map(muscle => {
                        const count = weekVolume[muscle] || 0;
                        const meta = MUSCLE_META[muscle];
                        const pct = Math.round((count / maxSets) * 100);
                        return (
                          <div key={muscle} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: "#e8e4dc", fontWeight: 600 }}>{muscle}</span>
                              <span style={{ fontSize: 12, color: meta.color, fontWeight: 700 }}>{count} セット</span>
                            </div>
                            <div style={{ background: "#1e1e2e", borderRadius: 4, height: 6, overflow: "hidden" }}>
                              <div style={{
                                width: `${pct}%`, height: "100%",
                                background: meta.color,
                                borderRadius: 4, transition: "width 0.4s ease",
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}