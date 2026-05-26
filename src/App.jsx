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

// 旧形式（{type,sets}）を新形式（{entries:[]}）に変換
const migrateLogs = (raw) => {
  const result = {};
  Object.entries(raw).forEach(([date, val]) => {
    if (val.entries) { result[date] = val; }
    else if (val.type && val.sets) {
      result[date] = { entries: [{ type: val.type, startTime: val.startTime || "", sets: val.sets }] };
    }
  });
  return result;
};

export default function WorkoutTracker() {
  // logs[date] = { entries: [{ type, startTime, sets }] }
  const [logs, setLogs] = useState({});
  const [storageReady, setStorageReady] = useState(false);
  const [view, setView] = useState("log");
  const [selectedDate, setSelectedDate] = useState(today());
  const [dayType, setDayType] = useState(null);
  const [exerciseGroups, setExerciseGroups] = useState([]);
  const [step, setStep] = useState("menu"); // menu | select | input
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [saved, setSaved] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null); // "date:entryIdx"
  const [weekOffset, setWeekOffset] = useState(0);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [editingKey, setEditingKey] = useState(null); // "date:entryIdx"
  const [editGroups, setEditGroups] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("workout_logs");
        if (result && result.value) setLogs(migrateLogs(JSON.parse(result.value)));
      } catch {}
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    (async () => { try { await window.storage.set("workout_logs", JSON.stringify(logs)); } catch {} })();
  }, [logs, storageReady]);

  useEffect(() => {
    setDayType(null); setExerciseGroups([]); setStep("menu"); setSelectedExercises([]); setStartTime("");
  }, [selectedDate, storageReady]);

  const getLastEntry = (type) => {
    const dates = Object.keys(logs).filter(d => d < selectedDate && logs[d].entries.some(e => e.type === type)).sort((a,b)=>b.localeCompare(a));
    if (!dates.length) return null;
    return logs[dates[0]].entries.find(e => e.type === type) || null;
  };

  const handleDayTypeChange = (key) => {
    setDayType(key);
    // すでに今日この type の記録があれば editing state に
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
      return { ...prev, [selectedDate]: { entries: newEntries } };
    });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
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
  const saveEdit = (date, entryIdx) => {
    const allSets = editGroups.flatMap(g => g.sets.filter(s=>s.weight&&s.reps).map(s=>({exercise:g.exercise,...s})));
    if (!allSets.length) return;
    setLogs(prev => {
      const newEntries = prev[date].entries.map((e,i) => i===entryIdx ? {...e, sets:allSets} : e);
      return { ...prev, [date]: { entries: newEntries } };
    });
    setEditingKey(null);
  };
  const deleteEntry = (date, entryIdx) => {
    setLogs(prev => {
      const newEntries = prev[date].entries.filter((_,i) => i !== entryIdx);
      const next = { ...prev };
      if (!newEntries.length) delete next[date];
      else next[date] = { entries: newEntries };
      return next;
    });
  };

  const calcWeekVolume = (offset) => {
    const { start, end } = getWeekRange(offset);
    const muscleSets = {};
    Object.entries(logs).forEach(([date, day]) => {
      if (date < start || date > end) return;
      day.entries.forEach(entry => {
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

  // 履歴: 日付×エントリーの flat list
  const allEntries = Object.keys(logs).sort((a,b)=>b.localeCompare(a)).flatMap(date =>
    logs[date].entries.map((entry, entryIdx) => ({ date, entryIdx, entry }))
  ).filter(({ entry }) => historyFilter === "all" || entry.type === historyFilter);

  const weekVolume = calcWeekVolume(weekOffset);
  const { start: wStart, end: wEnd } = getWeekRange(weekOffset);
  const maxSets = Math.max(...Object.values(weekVolume), 1);

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
        {[["log","記録する"],["history","履歴"],["volume","週間"]].map(([key,label]) => (
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
                  <button key={key} onClick={() => handleDayTypeChange(key)} style={{
                    flex:1, padding:"12px 4px", background:"#12121c", border:"1px solid #2a2a3e",
                    borderRadius:12, cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                  }}>
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
                  <div style={{ background:activePPL.bg, padding:"10px 14px", borderBottom:`1px solid ${activePPL.color}22` }}>
                    <span style={{ fontSize:14, fontWeight:800, color:activePPL.color }}>{group.exercise}</span>
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
                        {sIdx > 0 && group.sets[0]?.weight && (
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

      {/* ===== 履歴 ===== */}
      {view === "history" && (
        <div style={{ padding:"20px 16px" }}>
          <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
            {[["all","すべて","#5a5a7a","#1e1e2e"],...Object.entries(PPL).map(([k,p])=>[k,p.label,p.color,p.bg])].map(([key,label,color,bg]) => (
              <button key={key} onClick={() => setHistoryFilter(key)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${historyFilter===key?color:"#2a2a3e"}`, background:historyFilter===key?bg:"none", color:historyFilter===key?color:"#5a5a7a", fontSize:12, fontWeight:historyFilter===key?700:400, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>{label}</button>
            ))}
          </div>

          {allEntries.length === 0 ? (
            <div style={{ textAlign:"center", color:"#3a3a5a", marginTop:60, fontSize:14 }}>まだ記録がありません</div>
          ) : allEntries.map(({ date, entryIdx, entry }) => {
            const ppl = PPL[entry.type];
            if (!ppl) return null;
            const key = `${date}:${entryIdx}`;
            const isOpen = expandedKey === key;
            const exercises = [...new Set(entry.sets.map(s=>s.exercise))];
            return (
              <div key={key} style={{ background:"#12121c", borderRadius:12, marginBottom:10, border:`1px solid ${isOpen?ppl.color+"55":"#1e1e2e"}`, overflow:"hidden", transition:"border-color 0.2s" }}>
                <button onClick={() => setExpandedKey(isOpen?null:key)} style={{ width:"100%", background:"none", border:"none", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", color:"#e8e4dc", fontFamily:"inherit" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ background:ppl.bg, color:ppl.color, fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:6, letterSpacing:1, border:`1px solid ${ppl.color}55` }}>{ppl.label}</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>{formatDate(date)}</div>
                      <div style={{ fontSize:11, color:"#5a5a7a", marginTop:2 }}>
                        {entry.startTime && <span style={{ marginRight:6 }}>🕐 {entry.startTime}</span>}
                        {entry.sets.length}セット · {exercises.slice(0,2).join("・")}{exercises.length>2?` 他${exercises.length-2}種目`:""}
                      </div>
                    </div>
                  </div>
                  <span style={{ color:"#3a3a5a", fontSize:18, transform:isOpen?"rotate(90deg)":"none", transition:"0.2s" }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop:"1px solid #1e1e2e", padding:"12px 16px" }}>
                    {editingKey === key ? (
                      <div>
                        {editGroups.map((group,gIdx) => (
                          <div key={gIdx} style={{ marginBottom:12, background:"#0a0a14", borderRadius:10, padding:"10px 12px", border:`1px solid ${ppl.color}33` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                              <select value={group.exercise} onChange={e=>changeEditExercise(gIdx,e.target.value)} style={{ flex:1, background:"#12121c", color:group.exercise?ppl.color:"#3a3a5a", border:`1px solid ${ppl.color}55`, borderRadius:8, padding:"7px 10px", fontSize:13, fontFamily:"inherit", fontWeight:700, appearance:"none" }}>
                                <option value="">種目を選択</option>
                                {ppl.exercises.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                              </select>
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
                                {sIdx>0&&group.sets[0]?.weight&&(
                                  <button onClick={()=>updateEditField(gIdx,sIdx,"weight",group.sets[0].weight)} style={{ background:ppl.bg, border:`1px solid ${ppl.color}55`, color:ppl.color, borderRadius:6, fontSize:11, cursor:"pointer", padding:"4px 6px", flexShrink:0, fontFamily:"inherit", fontWeight:700 }}>↑</button>
                                )}
                                {group.sets.length>1&&<button onClick={()=>removeEditSet(gIdx,sIdx)} style={{ background:"none", border:"none", color:"#3a3a5a", fontSize:16, cursor:"pointer", padding:"0 2px", flexShrink:0 }}>×</button>}
                              </div>
                            ))}
                            <button onClick={()=>addEditSet(gIdx)} style={{ background:"none", border:"1px dashed #2a2a3e", color:"#5a5a7a", borderRadius:7, padding:"5px 0", width:"100%", fontSize:11, cursor:"pointer", fontFamily:"inherit", marginTop:2 }}>+ セット追加</button>
                          </div>
                        ))}
                        <button onClick={addEditGroup} style={{ width:"100%", padding:"8px 0", background:"none", border:"1px dashed #2a2a3e", color:"#5a5a7a", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", marginBottom:10 }}>+ 種目追加</button>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>setEditingKey(null)} style={{ flex:1, padding:"10px 0", background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>キャンセル</button>
                          <button onClick={()=>saveEdit(date,entryIdx)} style={{ flex:2, padding:"10px 0", background:ppl.color, border:"none", color:"#0a0a0f", borderRadius:8, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>保存する</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {groupByExercise(entry.sets).map(group => (
                          <div key={group.exercise} style={{ marginBottom:12 }}>
                            <div style={{ fontSize:12, color:ppl.color, fontWeight:800, marginBottom:6 }}>{group.exercise}</div>
                            {group.sets.map((s,idx) => (
                              <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, borderTop:"1px solid #1e1e2e", paddingTop:4 }}>
                                <span style={{ fontSize:11, color:"#3a3a5a", width:36 }}>SET {idx+1}</span>
                                <span style={{ flex:1, fontSize:13 }}>{s.weight}<span style={{ fontSize:10, color:"#5a5a7a" }}>kg</span></span>
                                <span style={{ flex:1, fontSize:13 }}>{s.reps}<span style={{ fontSize:10, color:"#5a5a7a" }}>回</span></span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div style={{ display:"flex", gap:8, marginTop:8 }}>
                          <button onClick={()=>startEdit(date,entryIdx)} style={{ flex:2, padding:"9px 0", background:"none", border:`1px solid ${ppl.color}55`, color:ppl.color, borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>編集する</button>
                          <button onClick={()=>deleteEntry(date,entryIdx)} style={{ flex:1, padding:"9px 0", background:"none", border:"1px solid #3a3a5a", color:"#5a5a7a", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>削除</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== 週間ボリューム ===== */}
      {view === "volume" && (
        <div style={{ padding:"20px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#12121c", borderRadius:12, padding:"10px 14px", border:"1px solid #1e1e2e", marginBottom:20 }}>
            <button onClick={()=>setWeekOffset(o=>o-1)} style={{ background:"none", border:"1px solid #2a2a3e", color:"#5a5a7a", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:700 }}>{formatDate(wStart)} 〜 {formatDate(wEnd)}</div>
              {weekOffset===0&&<div style={{ fontSize:10, color:"#c8f060", letterSpacing:1, marginTop:2 }}>今週</div>}
            </div>
            <button onClick={()=>setWeekOffset(o=>o+1)} disabled={weekOffset===0} style={{ background:"none", border:"1px solid #2a2a3e", color:weekOffset===0?"#2a2a3e":"#5a5a7a", borderRadius:8, width:32, height:32, cursor:weekOffset===0?"default":"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          {Object.keys(weekVolume).length===0 ? (
            <div style={{ textAlign:"center", color:"#3a3a5a", marginTop:60, fontSize:14 }}>この週の記録がありません</div>
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

      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}input[type=number]{-moz-appearance:textfield;}*{box-sizing:border-box;}`}</style>
    </div>
  );
}