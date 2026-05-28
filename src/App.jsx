import { useState, useEffect } from "react";

const PPL = {
  push: { label: "Push", ja: "プッシュ", desc: "胸・肩・三頭筋", color: "#f06060", bg: "#2a0a0a",
    exercises: ["ベンチプレス","インクラインプレス","チェストフライ","チェストプレス","インクラインチェストプレス","ペックフライ","ナロープレス","ショルダープレス","サイドレイズ","フロントレイズ","トライセップスプレスダウン","オーバーヘッドエクステンション","ディップス"] },
  pull: { label: "Pull", ja: "プル", desc: "背中・二頭筋", color: "#60a0f0", bg: "#0a1a2a",
    exercises: ["ラットプルダウン","マシンラットプルダウン","ナローラットプルダウン","シーテッドロウ","ベントオーバーロウ","ワンハンドロウ","フェイスプル","リアデルトフライ","バイセップカール","ハンマーカール","インクラインカール"] },
  legs: { label: "Legs", ja: "レッグ", desc: "脚・前腕", color: "#c8f060", bg: "#1a2a0a",
    exercises: ["スクワット","ハックスクワット","ブルガリアンスクワット","レッグプレス","レッグエクステンション","レッグカール","ランジ","カーフレイズ","リストカール","リバースリストカール"] },
  core: { label: "Core", ja: "コア", desc: "腹筋・体幹", color: "#c060f0", bg: "#1a0a2a",
    exercises: ["アブクランチ","プランク","サイドベント","レッグレイズ","ロシアンツイスト","ドラゴンフラッグ"] },
};

const MUSCLE_MAP = {
  "ベンチプレス":"胸","インクラインプレス":"胸","チェストフライ":"胸","チェストプレス":"胸","インクラインチェストプレス":"胸","ペックフライ":"胸","ナロープレス":"肩",
  "ショルダープレス":"肩","サイドレイズ":"肩","フロントレイズ":"肩",
  "トライセップスプレスダウン":"三頭","オーバーヘッドエクステンション":"三頭","ディップス":"三頭",
  "ラットプルダウン":"背中","マシンラットプルダウン":"背中","ナローラットプルダウン":"背中","シーテッドロウ":"背中","ベントオーバーロウ":"背中","ワンハンドロウ":"背中","フェイスプル":"背中","リアデルトフライ":"背中",
  "バイセップカール":"二頭","ハンマーカール":"二頭","インクラインカール":"二頭",
  "スクワット":"脚","ハックスクワット":"脚","ブルガリアンスクワット":"脚","レッグプレス":"脚","レッグエクステンション":"脚","レッグカール":"脚","ランジ":"脚","カーフレイズ":"脚",
  "アブクランチ":"腹筋・体幹","プランク":"腹筋・体幹","サイドベント":"腹筋・体幹","レッグレイズ":"腹筋・体幹","ロシアンツイスト":"腹筋・体幹","ドラゴンフラッグ":"腹筋・体幹",
  "リストカール":"前腕","リバースリストカール":"前腕",
};
const MUSCLE_META = {
  "胸":{ color:"#f06060", ppl:"push" },"肩":{ color:"#f0a060", ppl:"push" },"三頭":{ color:"#f0d060", ppl:"push" },
  "背中":{ color:"#60a0f0", ppl:"pull" },"二頭":{ color:"#60d0f0", ppl:"pull" },
  "脚":{ color:"#c8f060", ppl:"legs" },"前腕":{ color:"#a0f0c0", ppl:"legs" },
  "腹筋・体幹":{ color:"#c060f0", ppl:"core" },
};
const MUSCLE_ORDER = ["胸","肩","三頭","背中","二頭","脚","前腕","腹筋・体幹"];

const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const formatDate = (d) => new Date(d+"T00:00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric",weekday:"short"});
const shiftDate = (d,n) => { const dt=new Date(d+"T00:00:00"); dt.setDate(dt.getDate()+n); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`; };
const getWeekRange = (offset=0) => {
  const dt=new Date(); dt.setDate(dt.getDate()+offset*7);
  const day=dt.getDay(); const mon=new Date(dt); mon.setDate(dt.getDate()-(day===0?6:day-1));
  const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  const fmt=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  return {start:fmt(mon),end:fmt(sun)};
};
const groupByExercise = (sets) => {
  const order=[],map={};
  sets.forEach(s=>{ if(!map[s.exercise]){map[s.exercise]=[];order.push(s.exercise);} map[s.exercise].push(s); });
  return order.map(ex=>({exercise:ex,sets:map[ex]}));
};
const migrateLogs = (raw) => {
  const result = {};
  Object.entries(raw).forEach(([date, val]) => {
    if (val.entries) { result[date] = val; }
    else if (val.type && val.sets) {
      result[date] = { entries: [{ type: val.type, startTime: val.startTime || "", sets: val.sets }], memo: "" };
    }
  });
  return result;
};

// カレンダー用：その月の日付配列を生成
const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // 月曜始まり
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

export default function WorkoutTracker() {
  const [logs, setLogs] = useState({});
  const [storageReady, setStorageReady] = useState(false);
  const [view, setView] = useState("log");
  const [selectedDate, setSelectedDate] = useState(today());
  const [dayType, setDayType] = useState(null);
  const [exerciseGroups, setExerciseGroups] = useState([]);
  const [step, setStep] = useState("menu");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingKey, setEditingKey] = useState(null);
  const [editGroups, setEditGroups] = useState([]);
  // カレンダー用
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calSelectedDate, setCalSelectedDate] = useState(null);
  const [graphExercise, setGraphExercise] = useState("");

  // 全種目リスト（記録済みのもの）
  const allRecordedExercises = [...new Set(
    Object.values(logs).flatMap(d => (d.entries||[]).flatMap(e => e.sets.map(s => s.exercise)))
  )].sort();

  // 過去1ヶ月の重量推移データ
  const getGraphData = (exercise) => {
    if (!exercise) return [];
    const oneMonthAgo = shiftDate(today(), -30);
    const points = [];
    Object.entries(logs)
      .filter(([date]) => date >= oneMonthAgo)
      .sort(([a],[b]) => a.localeCompare(b))
      .forEach(([date, day]) => {
        (day.entries||[]).forEach(entry => {
          const sets = entry.sets.filter(s => s.exercise === exercise && s.weight);
          if (sets.length) {
            const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight)));
            points.push({ date, weight: maxWeight });
          }
        });
      });
    return points;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("workout_logs");
      if (saved) setLogs(migrateLogs(JSON.parse(saved)));
    } catch {}
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem("workout_logs", JSON.stringify(logs)); } catch {}
  }, [logs, storageReady]);

  useEffect(() => {
    setDayType(null); setExerciseGroups([]); setStep("menu"); setSelectedExercises([]); setStartTime("");
    // 日付変更時にメモも読み込む
    setMemo(logs[selectedDate]?.memo || "");
  }, [selectedDate, storageReady]);

  const getLastEntry = (type) => {
    const dates = Object.keys(logs).filter(d => d < selectedDate && logs[d].entries?.some(e => e.type === type)).sort((a,b)=>b.localeCompare(a));
    if (!dates.length) return null;
    return logs[dates[0]].entries.find(e => e.type === type) || null;
  };

  const handleDayTypeChange = (key) => {
    setDayType(key);
    const todayEntry = logs[selectedDate]?.entries?.find(e => e.type === key);
    if (todayEntry) {
      const groups = groupByExercise(todayEntry.sets).map(g => ({ exercise: g.exercise, sets: g.sets.map(s => ({ weight: s.weight, reps: s.reps })) }));
      setExerciseGroups(groups); setSelectedExercises(groups.map(g => g.exercise)); setStep("input");
    } else {
      const last = getLastEntry(key);
      if (last) {
        const groups = groupByExercise(last.sets).map(g => ({ exercise: g.exercise, sets: g.sets.map(s => ({ weight: s.weight, reps: s.reps })) }));
        setExerciseGroups(groups); setSelectedExercises(groups.map(g => g.exercise)); setStep("input");
      } else {
        setExerciseGroups([]); setSelectedExercises([]); setStep("select");
      }
    }
  };

  const toggleExercise = (ex) => setSelectedExercises(prev => prev.includes(ex) ? prev.filter(e=>e!==ex) : [...prev,ex]);
  const confirmExercises = () => {
    const existing = {}; exerciseGroups.forEach(g => { existing[g.exercise] = g; });
    setExerciseGroups(selectedExercises.map(ex => existing[ex] || { exercise: ex, sets: [{ weight:"", reps:"" }] }));
    setStep("input");
  };
  const updateSetField = (gIdx,sIdx,field,val) => setExerciseGroups(prev => prev.map((g,gi) => gi!==gIdx ? g : { ...g, sets: g.sets.map((s,si) => si!==sIdx ? s : { ...s,[field]:val }) }));
  const addSetToGroup = (gIdx) => setExerciseGroups(prev => prev.map((g,gi) => { if(gi!==gIdx) return g; const lw=g.sets[g.sets.length-1]?.weight||""; return {...g,sets:[...g.sets,{weight:lw,reps:""}]}; }));
  const removeSetFromGroup = (gIdx,sIdx) => setExerciseGroups(prev => prev.map((g,gi) => { if(gi!==gIdx) return g; const sets=g.sets.filter((_,si)=>si!==sIdx); return sets.length?{...g,sets}:null; }).filter(Boolean));
  const moveGroup = (gIdx, dir) => {
    setExerciseGroups(prev => { const next=[...prev]; const t=gIdx+dir; if(t<0||t>=next.length) return prev; [next[gIdx],next[t]]=[next[t],next[gIdx]]; return next; });
  };

  const saveLog = () => {
    const allSets = exerciseGroups.flatMap(g => g.sets.filter(s=>s.weight&&s.reps).map(s=>({exercise:g.exercise,...s})));
    if (!allSets.length || !dayType) return;
    setLogs(prev => {
      const prevEntries = prev[selectedDate]?.entries || [];
      const existingIdx = prevEntries.findIndex(e => e.type === dayType);
      let newEntries;
      if (existingIdx >= 0) {
        newEntries = prevEntries.map((e,i) => i===existingIdx ? { ...e, startTime: startTime||e.startTime||"", sets: allSets } : e);
      } else {
        newEntries = [...prevEntries, { type: dayType, startTime: startTime||"", sets: allSets }];
      }
      return { ...prev, [selectedDate]: { entries: newEntries, memo: memo || prev[selectedDate]?.memo || "" } };
    });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };

  const saveMemo = () => {
    setLogs(prev => ({
      ...prev,
      [selectedDate]: { entries: prev[selectedDate]?.entries || [], memo }
    }));
  };

  // 履歴編集
  const startEdit = (date, entryIdx) => {
    const entry = logs[date].entries[entryIdx];
    setEditGroups(groupByExercise(entry.sets).map(g => ({ exercise: g.exercise, sets: g.sets.map(s=>({weight:s.weight,reps:s.reps})) })));
    setEditingKey(`${date}:${entryIdx}`);
  };
  const updateEditField = (gIdx,sIdx,field,val) => setEditGroups(prev => prev.map((g,gi) => gi!==gIdx?g:{...g,sets:g.sets.map((s,si)=>si!==sIdx?s:{...s,[field]:val})}));
  const addEditSet = (gIdx) => setEditGroups(prev => prev.map((g,gi) => { if(gi!==gIdx) return g; const lw=g.sets[g.sets.length-1]?.weight||""; return {...g,sets:[...g.sets,{weight:lw,reps:""}]}; }));
  const removeEditSet = (gIdx,sIdx) => setEditGroups(prev => prev.map((g,gi) => { if(gi!==gIdx) return g; const sets=g.sets.filter((_,si)=>si!==sIdx); return sets.length?{...g,sets}:null; }).filter(Boolean));
  const changeEditExercise = (gIdx,newEx) => setEditGroups(prev => prev.map((g,gi) => gi!==gIdx?g:{...g,exercise:newEx}));
  const addEditGroup = () => setEditGroups(prev => [...prev,{exercise:"",sets:[{weight:"",reps:""}]}]);
  const removeEditGroup = (gIdx) => setEditGroups(prev => prev.filter((_,gi)=>gi!==gIdx));
  const moveEditGroup = (gIdx, dir) => {
    setEditGroups(prev => { const next=[...prev]; const t=gIdx+dir; if(t<0||t>=next.length) return prev; [next[gIdx],next[t]]=[next[t],next[gIdx]]; return next; });
  };
  const saveEdit = (date, entryIdx) => {
    const allSets = editGroups.flatMap(g => g.sets.filter(s=>s.weight&&s.reps).map(s=>({exercise:g.exercise,...s})));
    if (!allSets.length) return;
    setLogs(prev => {
      const newEntries = prev[date].entries.map((e,i) => i===entryIdx ? {...e, sets:allSets} : e);
      return { ...prev, [date]: { ...prev[date], entries: newEntries } };
    });
    setEditingKey(null);
  };
  const deleteEntry = (date, entryIdx) => {
    setLogs(prev => {
      const newEntries = prev[date].entries.filter((_,i) => i !== entryIdx);
      const next = { ...prev };
      if (!newEntries.length && !prev[date].memo) delete next[date];
      else next[date] = { ...prev[date], entries: newEntries };
      return next;
    });
  };

  const calcWeekVolume = (offset) => {
    const { start, end } = getWeekRange(offset);
    const muscleSets = {};
    Object.entries(logs).forEach(([date, day]) => {
      if (date < start || date > end) return;
      (day.entries||[]).forEach(entry => {
        entry.sets.forEach(s => {
          const muscle = MUSCLE_MAP[s.exercise] || "その他";
          muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
        });
      });
    });
    return muscleSets;
  };

  const isToday = selectedDate === today();
  const activePPL = dayType ? PPL[dayType] : null;
  const todayEntries = logs[selectedDate]?.entries || [];
  const weekVolume = calcWeekVolume(weekOffset);
  const { start: wStart, end: wEnd } = getWeekRange(weekOffset);
  const maxSets = Math.max(...Object.values(weekVolume), 1);

  // カレンダー
  const calDays = getCalendarDays(calYear, calMonth);
  const calMonthStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}`;
  const todayStr = today();

  if (!storageReady) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#5a5a7a", fontSize:14 }}>読み込み中...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#e8e4dc", fontFamily:"'Noto Sans JP', sans-serif", maxWidth:480, margin:"0 auto", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ padding:"28px 20px 16px", borderBottom:"1px solid #1e1e2e", display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:3, color:"#5a5a7a", fontWeight:600, marginBottom:4 }}>PPL TRACKER</div>
          <div style={{ fontSize:26, fontWeight:800, letterSpacing:-1 }}>TRAINING LOG</div>
        </div>
        <div style={{ fontSize:13, color:"#5a5a7a", paddingBottom:4 }}>{new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric"})}</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #1e1e2e" }}>
        {[["log","記録する"],["history","履歴"],["volume","Stats"]].map(([key,label]) => (
          <button key={key} onClick={() => setView(key)} style={{ flex:1, padding:"14px 0", background:"none", border:"none", color:view===key?"#c8f060":"#5a5a7a", fontWeight:view===key?700:400, fontSize:14, cursor:"pointer", borderBottom:view===key?"2px solid #c8f060":"2px solid transparent", transition:"all 0.2s", fontFamily:"inherit" }}>{label}</button>
        ))}
      </div>

      {/* ===== 記録する ===== */}
      {view === "log" && (
        <div style={{ padding:"20px 16px" }}>

          {/* 日付 */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a", marginBottom:8 }}>日付</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#12121c", borderRadius:12, padding:"10px 14px", border:"1px solid #1e1e2e" }}>
              <button onClick={() => setSelectedDate(d=>shiftDate(d,-1))} style={{ background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:700 }}>{formatDate(selectedDate)}</div>
                {isToday && <div style={{ fontSize:10, color:"#c8f060", letterSpacing:1, marginTop:2 }}>TODAY</div>}
              </div>
              <button onClick={() => setSelectedDate(d=>shiftDate(d,1))} disabled={isToday} style={{ background:"none", border:"1px solid #2a2a3e", color:isToday?"#2a2a3e":"#5a5a7a", borderRadius:8, width:32, height:32, cursor:isToday?"default":"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
            </div>
          </div>

          {/* メモ */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a", marginBottom:8 }}>メモ</div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} onBlur={saveMemo} placeholder="体調・気づきなど..." rows={2}
              style={{ width:"100%", background:"#12121c", color:"#e8e4dc", border:"1px solid #1e1e2e", borderRadius:12, padding:"10px 14px", fontSize:13, fontFamily:"inherit", resize:"none", outline:"none", boxSizing:"border-box" }} />
          </div>

          {/* この日の既存記録サマリー */}
          {todayEntries.length > 0 && (
            <div style={{ marginBottom:16 }}>
              {todayEntries.map((entry, idx) => {
                const p = PPL[entry.type];
                return (
                  <div key={idx} style={{ background:p.bg, borderRadius:10, padding:"10px 14px", marginBottom:8, border:`1px solid ${p.color}55` }}>
                    <div style={{ fontSize:11, color:p.color, fontWeight:700, letterSpacing:1 }}>
                      {p.label} — {entry.sets.length}セット完了
                      {entry.startTime && <span style={{ marginLeft:8, fontWeight:400 }}>🕐 {entry.startTime}</span>}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:5 }}>
                      {[...new Set(entry.sets.map(s=>s.exercise))].map(ex => (
                        <span key={ex} style={{ background:"#ffffff10", color:p.color, fontSize:11, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>{ex}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 開始時刻 */}
          {step !== "menu" && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a", marginBottom:8 }}>開始時刻</div>
              <div style={{ background:"#12121c", borderRadius:12, padding:"10px 14px", border:"1px solid #1e1e2e", display:"flex", alignItems:"center", gap:10 }}>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}
                  style={{ flex:1, background:"none", border:"none", color:"#e8e4dc", fontSize:16, fontWeight:700, fontFamily:"inherit", outline:"none", colorScheme:"dark" }} />
                {startTime && <button onClick={()=>setStartTime("")} style={{ background:"none", border:"none", color:"#3a3a5a", fontSize:16, cursor:"pointer", padding:"0 4px" }}>×</button>}
              </div>
            </div>
          )}

          {/* STEP 1: メニュー選択 */}
          {step === "menu" && (
            <div>
              <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a", marginBottom:8 }}>追加するメニュー</div>
              <div style={{ display:"flex", gap:8 }}>
                {Object.entries(PPL).map(([key,p]) => (
                  <button key={key} onClick={() => handleDayTypeChange(key)} style={{ flex:1, padding:"12px 4px", background:"#12121c", border:"1px solid #2a2a3e", borderRadius:12, cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:"#5a5a7a", letterSpacing:1 }}>{p.label}</span>
                    <span style={{ fontSize:10, color:"#3a3a5a" }}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: 種目選択 */}
          {step === "select" && activePPL && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a" }}>{activePPL.label} — 種目を選択</div>
                <button onClick={() => setStep("menu")} style={{ background:"none", border:"none", color:"#5a5a7a", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← 戻る</button>
              </div>
              <div style={{ background:"#12121c", borderRadius:12, border:`1px solid ${activePPL.color}33`, overflow:"hidden", marginBottom:12 }}>
                {activePPL.exercises.map((ex,i) => {
                  const selected = selectedExercises.includes(ex);
                  return (
                    <button key={ex} onClick={() => toggleExercise(ex)} style={{ width:"100%", background:selected?activePPL.bg:"none", border:"none", borderTop:i>0?"1px solid #1e1e2e":"none", padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", fontFamily:"inherit", color:selected?activePPL.color:"#e8e4dc", fontSize:14, fontWeight:selected?700:400, transition:"all 0.15s" }}>
                      <span>{ex}</span>{selected && <span style={{ fontSize:16 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={confirmExercises} disabled={!selectedExercises.length} style={{ width:"100%", padding:"13px 0", background:selectedExercises.length?activePPL.color:"#2a2a3e", border:"none", borderRadius:10, fontSize:15, fontWeight:800, color:selectedExercises.length?"#0a0a0f":"#5a5a7a", cursor:selectedExercises.length?"pointer":"default", fontFamily:"inherit" }}>
                {selectedExercises.length}種目で入力へ →
              </button>
            </div>
          )}

          {/* STEP 3: セット入力 */}
          {step === "input" && activePPL && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a" }}>{activePPL.label} — セット入力</div>
                <button onClick={() => setStep("select")} style={{ background:"none", border:"none", color:"#5a5a7a", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← 種目変更</button>
              </div>
              {exerciseGroups.map((group,gIdx) => (
                <div key={group.exercise} style={{ background:"#12121c", borderRadius:12, marginBottom:12, border:`1px solid ${activePPL.color}33`, overflow:"hidden" }}>
                  <div style={{ background:activePPL.bg, padding:"10px 14px", borderBottom:`1px solid ${activePPL.color}22`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:14, fontWeight:800, color:activePPL.color }}>{group.exercise}</span>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => moveGroup(gIdx,-1)} disabled={gIdx===0} style={{ background:"none", border:"none", color:gIdx===0?"#3a3a3a":activePPL.color, fontSize:14, cursor:gIdx===0?"default":"pointer", padding:"0 4px" }}>↑</button>
                      <button onClick={() => moveGroup(gIdx,1)} disabled={gIdx===exerciseGroups.length-1} style={{ background:"none", border:"none", color:gIdx===exerciseGroups.length-1?"#3a3a3a":activePPL.color, fontSize:14, cursor:gIdx===exerciseGroups.length-1?"default":"pointer", padding:"0 4px" }}>↓</button>
                    </div>
                  </div>
                  <div style={{ padding:"10px 14px" }}>
                    {group.sets.map((s,sIdx) => (
                      <div key={sIdx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:11, color:"#3a3a5a", fontWeight:700, width:36, flexShrink:0 }}>SET {sIdx+1}</span>
                        {[["weight","kg"],["reps","回"]].map(([field,unit]) => (
                          <div key={field} style={{ flex:1, position:"relative" }}>
                            <input type="number" inputMode="decimal" value={s[field]} onChange={e=>updateSetField(gIdx,sIdx,field,e.target.value)} placeholder="0"
                              style={{ width:"100%", background:"#0a0a14", color:"#e8e4dc", border:"1px solid #2a2a3e", borderRadius:8, padding:"9px 28px 9px 10px", fontSize:15, fontFamily:"inherit", boxSizing:"border-box", WebkitAppearance:"none" }} />
                            <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#3a3a5a" }}>{unit}</span>
                          </div>
                        ))}
                        {sIdx>0 && group.sets[0]?.weight && (
                          <button onClick={() => updateSetField(gIdx,sIdx,"weight",group.sets[0].weight)} style={{ background:activePPL.bg, border:`1px solid ${activePPL.color}55`, color:activePPL.color, borderRadius:6, fontSize:11, cursor:"pointer", padding:"4px 6px", flexShrink:0, fontFamily:"inherit", fontWeight:700 }}>↑</button>
                        )}
                        {group.sets.length > 1 && (
                          <button onClick={() => removeSetFromGroup(gIdx,sIdx)} style={{ background:"none", border:"none", color:"#3a3a5a", fontSize:16, cursor:"pointer", padding:"0 2px", flexShrink:0 }}>×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addSetToGroup(gIdx)} style={{ background:"none", border:"1px dashed #2a2a3e", color:"#5a5a7a", borderRadius:8, padding:"7px 0", width:"100%", fontSize:12, cursor:"pointer", fontFamily:"inherit", marginTop:2 }}>+ セット追加</button>
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => { setStep("menu"); setDayType(null); }} style={{ flex:1, padding:"13px 0", background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>← メニューへ</button>
                <button onClick={saveLog} style={{ flex:2, padding:"14px 0", background:saved?activePPL.bg:activePPL.color, border:`1px solid ${activePPL.color}`, color:saved?activePPL.color:"#0a0a0f", borderRadius:10, fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit", transition:"all 0.3s" }}>{saved?"✓ 保存しました":"保存する"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 履歴（カレンダー） ===== */}
      {view === "history" && (
        <div style={{ padding:"20px 16px" }}>
          {/* 月ナビ */}
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#12121c", borderRadius:12, padding:"10px 14px", border:"1px solid #1e1e2e", marginBottom:16 }}>
            <button onClick={() => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }} style={{ background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <div style={{ flex:1, textAlign:"center", fontSize:15, fontWeight:700 }}>{calYear}年{calMonth+1}月</div>
            <button onClick={() => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }} style={{ background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>

          {/* 曜日ヘッダー */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
            {["月","火","水","木","金","土","日"].map((d,i) => (
              <div key={d} style={{ textAlign:"center", fontSize:11, color:i===5?"#60a0f0":i===6?"#f06060":"#5a5a7a", padding:"4px 0", fontWeight:600 }}>{d}</div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:16 }}>
            {calDays.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayLog = logs[dateStr];
              const isT = dateStr === todayStr;
              const isSelected = dateStr === calSelectedDate;
              const types = dayLog?.entries?.map(e=>e.type) || [];
              const hasMemo = !!dayLog?.memo;
              const dow = (idx) % 7;
              return (
                <button key={idx} onClick={() => setCalSelectedDate(isSelected ? null : dateStr)} style={{
                  background: isSelected ? "#2a2a3e" : "none",
                  border: isT ? "1px solid #c8f060" : "1px solid transparent",
                  borderRadius:10, padding:"6px 2px", cursor:"pointer", fontFamily:"inherit",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  transition:"all 0.15s",
                }}>
                  <span style={{ fontSize:13, fontWeight:isT?800:400, color:isT?"#c8f060": dow===5?"#60a0f0": dow===6?"#f06060":"#e8e4dc" }}>{day}</span>
                  <div style={{ display:"flex", gap:2, flexWrap:"wrap", justifyContent:"center", minHeight:8 }}>
                    {types.map(t => <div key={t} style={{ width:6, height:6, borderRadius:"50%", background:PPL[t]?.color }} />)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 凡例 */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16, padding:"10px 14px", background:"#12121c", borderRadius:10, border:"1px solid #1e1e2e" }}>
            {Object.entries(PPL).map(([key,p]) => (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }} />
                <span style={{ fontSize:11, color:"#5a5a7a" }}>{p.label}</span>
              </div>
            ))}
          </div>

          {/* 選択した日の詳細 */}
          {calSelectedDate && (() => {
            const dayLog = logs[calSelectedDate];
            const entries = dayLog?.entries || [];
            const memo = dayLog?.memo || "";
            return (
              <div style={{ background:"#12121c", borderRadius:12, padding:"14px 16px", border:"1px solid #2a2a3e" }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:"#e8e4dc" }}>{formatDate(calSelectedDate)}</div>
                {memo && (
                  <div style={{ background:"#1a1a2e", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:13, color:"#a0a0c0" }}>
                    📝 {memo}
                  </div>
                )}
                {entries.length === 0 && !memo && (
                  <div style={{ color:"#3a3a5a", fontSize:13 }}>記録なし</div>
                )}
                {entries.map((entry, entryIdx) => {
                  const ppl = PPL[entry.type];
                  const key = `${calSelectedDate}:${entryIdx}`;
                  const isOpen = expandedKey === key;
                  const exercises = [...new Set(entry.sets.map(s=>s.exercise))];
                  return (
                    <div key={entryIdx} style={{ marginBottom:8, border:`1px solid ${ppl.color}33`, borderRadius:10, overflow:"hidden" }}>
                      <button onClick={() => setExpandedKey(isOpen?null:key)} style={{ width:"100%", background:ppl.bg, border:"none", padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", fontFamily:"inherit", color:ppl.color }}>
                        <div style={{ textAlign:"left" }}>
                          <span style={{ fontSize:13, fontWeight:800 }}>{ppl.label}</span>
                          {entry.startTime && <span style={{ fontSize:11, marginLeft:8, fontWeight:400 }}>🕐 {entry.startTime}</span>}
                          <div style={{ fontSize:11, marginTop:2, color:ppl.color+"aa" }}>{entry.sets.length}セット · {exercises.slice(0,2).join("・")}{exercises.length>2?` 他${exercises.length-2}種目`:""}</div>
                        </div>
                        <span style={{ fontSize:16, transform:isOpen?"rotate(90deg)":"none", transition:"0.2s" }}>›</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding:"10px 14px", borderTop:`1px solid ${ppl.color}22` }}>
                          {editingKey === key ? (
                            <div>
                              {editGroups.map((group,gIdx) => (
                                <div key={gIdx} style={{ marginBottom:12, background:"#0a0a14", borderRadius:10, padding:"10px 12px", border:`1px solid ${ppl.color}33` }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                                    <select value={group.exercise} onChange={e=>changeEditExercise(gIdx,e.target.value)} style={{ flex:1, background:"#12121c", color:group.exercise?ppl.color:"#3a3a5a", border:`1px solid ${ppl.color}55`, borderRadius:8, padding:"7px 10px", fontSize:13, fontFamily:"inherit", fontWeight:700, appearance:"none" }}>
                                      <option value="">種目を選択</option>
                                      {ppl.exercises.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                                    </select>
                                    <button onClick={()=>moveEditGroup(gIdx,-1)} disabled={gIdx===0} style={{ background:"none", border:"none", color:gIdx===0?"#3a3a3a":ppl.color, fontSize:14, cursor:gIdx===0?"default":"pointer", padding:"0 2px" }}>↑</button>
                                    <button onClick={()=>moveEditGroup(gIdx,1)} disabled={gIdx===editGroups.length-1} style={{ background:"none", border:"none", color:gIdx===editGroups.length-1?"#3a3a3a":ppl.color, fontSize:14, cursor:gIdx===editGroups.length-1?"default":"pointer", padding:"0 2px" }}>↓</button>
                                    <button onClick={()=>removeEditGroup(gIdx)} style={{ background:"none", border:"none", color:"#3a3a5a", fontSize:18, cursor:"pointer", padding:"0 4px" }}>×</button>
                                  </div>
                                  {group.sets.map((s,sIdx) => (
                                    <div key={sIdx} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                                      <span style={{ fontSize:10, color:"#3a3a5a", width:32, flexShrink:0 }}>SET {sIdx+1}</span>
                                      {[["weight","kg"],["reps","回"]].map(([field,unit]) => (
                                        <div key={field} style={{ flex:1, position:"relative" }}>
                                          <input type="number" inputMode="decimal" value={s[field]} onChange={e=>updateEditField(gIdx,sIdx,field,e.target.value)} placeholder="0"
                                            style={{ width:"100%", background:"#12121c", color:"#e8e4dc", border:"1px solid #2a2a3e", borderRadius:7, padding:"7px 24px 7px 8px", fontSize:14, fontFamily:"inherit", boxSizing:"border-box", WebkitAppearance:"none" }} />
                                          <span style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#3a3a5a" }}>{unit}</span>
                                        </div>
                                      ))}
                                      {sIdx>0&&group.sets[0]?.weight&&<button onClick={()=>updateEditField(gIdx,sIdx,"weight",group.sets[0].weight)} style={{ background:ppl.bg, border:`1px solid ${ppl.color}55`, color:ppl.color, borderRadius:6, fontSize:11, cursor:"pointer", padding:"4px 6px", flexShrink:0, fontFamily:"inherit", fontWeight:700 }}>↑</button>}
                                      {group.sets.length>1&&<button onClick={()=>removeEditSet(gIdx,sIdx)} style={{ background:"none", border:"none", color:"#3a3a5a", fontSize:16, cursor:"pointer", padding:"0 2px", flexShrink:0 }}>×</button>}
                                    </div>
                                  ))}
                                  <button onClick={()=>addEditSet(gIdx)} style={{ background:"none", border:"1px dashed #2a2a3e", color:"#5a5a7a", borderRadius:7, padding:"5px 0", width:"100%", fontSize:11, cursor:"pointer", fontFamily:"inherit", marginTop:2 }}>+ セット追加</button>
                                </div>
                              ))}
                              <button onClick={addEditGroup} style={{ width:"100%", padding:"8px 0", background:"none", border:"1px dashed #2a2a3e", color:"#5a5a7a", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", marginBottom:10 }}>+ 種目追加</button>
                              <div style={{ display:"flex", gap:8 }}>
                                <button onClick={()=>setEditingKey(null)} style={{ flex:1, padding:"10px 0", background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>キャンセル</button>
                                <button onClick={()=>saveEdit(calSelectedDate,entryIdx)} style={{ flex:2, padding:"10px 0", background:ppl.color, border:"none", color:"#0a0a0f", borderRadius:8, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>保存する</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {groupByExercise(entry.sets).map(group => (
                                <div key={group.exercise} style={{ marginBottom:10 }}>
                                  <div style={{ fontSize:12, color:ppl.color, fontWeight:800, marginBottom:4 }}>{group.exercise}</div>
                                  {group.sets.map((s,idx) => (
                                    <div key={idx} style={{ display:"flex", gap:8, marginBottom:3, borderTop:"1px solid #1e1e2e", paddingTop:3 }}>
                                      <span style={{ fontSize:11, color:"#3a3a5a", width:36 }}>SET {idx+1}</span>
                                      <span style={{ flex:1, fontSize:13 }}>{s.weight}<span style={{ fontSize:10, color:"#5a5a7a" }}>kg</span></span>
                                      <span style={{ flex:1, fontSize:13 }}>{s.reps}<span style={{ fontSize:10, color:"#5a5a7a" }}>回</span></span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button onClick={()=>startEdit(calSelectedDate,entryIdx)} style={{ flex:2, padding:"9px 0", background:"none", border:`1px solid ${ppl.color}55`, color:ppl.color, borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>編集する</button>
                                <button onClick={()=>deleteEntry(calSelectedDate,entryIdx)} style={{ flex:1, padding:"9px 0", background:"none", border:"1px solid #3a3a5a", color:"#5a5a7a", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>削除</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== Stats ===== */}
      {view === "volume" && (
        <div style={{ padding:"20px 16px" }}>

          {/* 重量推移グラフ */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a", marginBottom:10 }}>重量推移（過去1ヶ月）</div>
            <select value={graphExercise} onChange={e=>setGraphExercise(e.target.value)} style={{ width:"100%", background:"#12121c", color:graphExercise?"#e8e4dc":"#5a5a7a", border:"1px solid #2a2a3e", borderRadius:10, padding:"11px 14px", fontSize:14, fontFamily:"inherit", appearance:"none", marginBottom:12, cursor:"pointer" }}>
              <option value="">種目を選択してください</option>
              {Object.entries(PPL).map(([pplKey, p]) => (
                <optgroup key={pplKey} label={p.label}>
                  {p.exercises.filter(ex => allRecordedExercises.includes(ex)).map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {graphExercise && (() => {
              const data = getGraphData(graphExercise);
              if (!data.length) return <div style={{ textAlign:"center", color:"#3a3a5a", fontSize:13, padding:"20px 0" }}>データがありません</div>;
              const weights = data.map(d=>d.weight);
              const minW = Math.min(...weights);
              const maxW = Math.max(...weights);
              const range = maxW - minW || 1;
              const W = 100, H = 120, PAD = 20;
              const points = data.map((d,i) => {
                const x = PAD + (i / Math.max(data.length-1,1)) * (W - PAD*2);
                const y = PAD + (1 - (d.weight - minW) / range) * (H - PAD*2);
                return { x, y, ...d };
              });
              const pathD = points.map((p,i) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
              // 色をPPLから取得
              const exColor = (() => {
                for (const [,p] of Object.entries(PPL)) {
                  if (p.exercises.includes(graphExercise)) return p.color;
                }
                return "#c8f060";
              })();
              return (
                <div style={{ background:"#12121c", borderRadius:12, padding:"14px", border:"1px solid #1e1e2e" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:11, color:"#5a5a7a" }}>最小 {minW}kg</span>
                    <span style={{ fontSize:12, color:exColor, fontWeight:700 }}>最大 {maxW}kg</span>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:120 }}>
                    {/* グリッド横線 */}
                    {[0,0.25,0.5,0.75,1].map(t => (
                      <line key={t} x1={PAD} x2={W-PAD} y1={PAD+(1-t)*(H-PAD*2)} y2={PAD+(1-t)*(H-PAD*2)} stroke="#1e1e2e" strokeWidth="0.5" />
                    ))}
                    {/* 折れ線 */}
                    <path d={pathD} fill="none" stroke={exColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* 塗りつぶし */}
                    <path d={`${pathD} L${points[points.length-1].x},${H-PAD} L${points[0].x},${H-PAD} Z`} fill={exColor} fillOpacity="0.08" />
                    {/* データ点 */}
                    {points.map((p,i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={exColor} />
                    ))}
                  </svg>
                  {/* 日付ラベル */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontSize:10, color:"#5a5a7a" }}>{new Date(data[0].date+"T00:00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric"})}</span>
                    <span style={{ fontSize:10, color:"#5a5a7a" }}>{new Date(data[data.length-1].date+"T00:00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric"})}</span>
                  </div>
                  {/* データ一覧 */}
                  <div style={{ marginTop:12, borderTop:"1px solid #1e1e2e", paddingTop:10 }}>
                    {[...data].reverse().map((d,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:"#5a5a7a" }}>{new Date(d.date+"T00:00:00").toLocaleDateString("ja-JP",{month:"short",day:"numeric"})}</span>
                        <span style={{ fontSize:12, color:exColor, fontWeight:700 }}>{d.weight}kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 週間ボリューム */}
          <div style={{ fontSize:11, letterSpacing:2, color:"#5a5a7a", marginBottom:10 }}>週間ボリューム</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#12121c", borderRadius:12, padding:"10px 14px", border:"1px solid #1e1e2e", marginBottom:16 }}>
            <button onClick={()=>setWeekOffset(o=>o-1)} style={{ background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:700 }}>{formatDate(wStart)} 〜 {formatDate(wEnd)}</div>
              {weekOffset===0&&<div style={{ fontSize:10, color:"#c8f060", letterSpacing:1, marginTop:2 }}>今週</div>}
            </div>
            <button onClick={()=>setWeekOffset(o=>o+1)} disabled={weekOffset===0} style={{ background:"none", border:"1px solid #2a2a3e", color:weekOffset===0?"#2a2a3e":"#5a5a7a", borderRadius:8, width:32, height:32, cursor:weekOffset===0?"default":"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          {Object.keys(weekVolume).length===0 ? (
            <div style={{ textAlign:"center", color:"#3a3a5a", fontSize:14 }}>この週の記録がありません</div>
          ) : ["push","pull","legs","core"].map(pplKey => {
            const ppl = PPL[pplKey];
            const muscles = MUSCLE_ORDER.filter(m=>MUSCLE_META[m]?.ppl===pplKey&&weekVolume[m]);
            if (!muscles.length) return null;
            const total = muscles.reduce((s,m)=>s+(weekVolume[m]||0),0);
            return (
              <div key={pplKey} style={{ background:"#12121c", borderRadius:12, marginBottom:14, border:`1px solid ${ppl.color}33`, overflow:"hidden" }}>
                <div style={{ background:ppl.bg, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${ppl.color}33` }}>
                  <span style={{ fontSize:13, fontWeight:800, color:ppl.color, letterSpacing:1 }}>{ppl.label}</span>
                  <span style={{ fontSize:12, color:ppl.color }}>計 {total} セット</span>
                </div>
                <div style={{ padding:"12px 16px" }}>
                  {muscles.map(muscle => {
                    const count=weekVolume[muscle]||0, meta=MUSCLE_META[muscle], pct=Math.round((count/maxSets)*100);
                    return (
                      <div key={muscle} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, color:"#e8e4dc", fontWeight:600 }}>{muscle}</span>
                          <span style={{ fontSize:12, color:meta.color, fontWeight:700 }}>{count} セット</span>
                        </div>
                        <div style={{ background:"#1e1e2e", borderRadius:4, height:6, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:meta.color, borderRadius:4, transition:"width 0.4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}input[type=number]{-moz-appearance:textfield;}*{box-sizing:border-box;}textarea{outline:none;}`}</style>
    </div>
  );
}