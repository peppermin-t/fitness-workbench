import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { equipment, exercises } from "./domain/seed";
import type { AppData, Exercise, PlannedExercise, WorkoutSession } from "./domain/types";
import { buildTodayDashboard, isAvailable, sortedMetrics, substitutes, todayIso } from "./domain/rules";
import { loadAppData } from "./infrastructure/repository";
import { applyRevision, createGoal, createGym, dismissAdvice, finishWorkoutSession, generateTrainingPlan, importBackup, logExercise, resetData, saveMetric, saveNutrition, setCurrentGym, startWorkoutSession } from "./application/commands";
import "./styles.css";

type View = "today" | "plan" | "records" | "insights" | "data";

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<View>("today");
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadAppData().then(setData).catch((error) => setToast(String(error)));
  }, []);

  async function run(action: Promise<{ status: string; data?: AppData; message?: string }>, success: string) {
    const result = await action;
    if (result.status === "success" && result.data) {
      setData(result.data);
      setToast(success);
    } else {
      setToast(result.message ?? "操作失败");
    }
  }

  if (!data) return <main className="loading">加载本地训练数据...</main>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">F</div><div><strong>训练工作台</strong><span>SQLite 本地版</span></div></div>
        <nav>
          {[
            ["today", "今日"],
            ["plan", "计划"],
            ["records", "记录"],
            ["insights", "洞察"],
            ["data", "数据"]
          ].map(([id, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id as View)}>{label}</button>)}
        </nav>
      </aside>
      <main className="workspace">
        {view === "today" && <TodayPage data={data} run={run} />}
        {view === "plan" && <PlanPage data={data} run={run} />}
        {view === "records" && <RecordsPage data={data} run={run} />}
        {view === "insights" && <InsightsPage data={data} run={run} />}
        {view === "data" && <DataPage data={data} run={run} />}
      </main>
      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
    </div>
  );
}

function TodayPage({ data, run }: { data: AppData; run: (p: Promise<any>, s: string) => void }) {
  const dashboard = buildTodayDashboard(data);
  const [dayIndex, setDayIndex] = useState(0);
  const day = data.plan?.days[dayIndex] ?? dashboard.day;
  const session = dashboard.activeSession ?? data.sessions.find((item) => item.status === "in_progress" && item.dayIndex === dayIndex);
  const gym = dashboard.gym;
  const [goalText, setGoalText] = useState("");
  return (
    <section>
      <Header title="今日训练" subtitle="打开就能开始、记录每组、结束训练并生成建议。" />
      <div className="toolbar">
        <input placeholder="目标：例如 减脂到72kg，不掉力量，每周3次" value={goalText} onChange={(e) => setGoalText(e.target.value)} />
        <button onClick={() => run(createGoal(data, goalText), "目标已保存")}>保存目标</button>
        <label>场地<select value={data.currentGymId ?? ""} onChange={(e) => run(setCurrentGym(data, e.target.value), "已切换场地")}>{data.gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select></label>
        <button onClick={() => run(generateTrainingPlan(data), "已生成训练计划")}>生成/刷新计划</button>
        {data.plan && <label>训练日<select value={dayIndex} onChange={(e) => setDayIndex(Number(e.target.value))}>{data.plan.days.map((item, index) => <option key={item.id} value={index}>第 {index + 1} 天：{item.focus}</option>)}</select></label>}
        {day && !session && <button className="primary" onClick={() => run(startWorkoutSession(data, dayIndex), "已开始训练")}>开始训练</button>}
      </div>
      <div className="grid two">
        <Panel title="当前状态">
          <p><strong>{dashboard.goal?.parsed.primaryGoalLabel ?? "未设定目标"}</strong>{dashboard.goal?.parsed.secondaryGoalLabel ? ` + ${dashboard.goal.parsed.secondaryGoalLabel}` : ""}</p>
          <p>{gym ? `${gym.name}，可用器械 ${gym.equipment.length} 类` : "未选择场地"}</p>
          <p>{session ? `训练中：${session.focus}` : "当前没有进行中的训练"}</p>
        </Panel>
        <Panel title="高优先建议">
          {dashboard.highAdvice.length ? dashboard.highAdvice.map((item) => <article className="notice" key={item.id}><strong>{item.title}</strong><p>{item.detail}</p></article>) : <p className="muted">暂无高优先建议。</p>}
        </Panel>
      </div>
      {!day && <Panel title="今日训练"><p className="muted">先设置目标和场地，然后生成训练计划。</p></Panel>}
      {day && <div className="exercise-list">{day.exercises.map((row) => <ExerciseCard key={row.id} row={row} data={data} session={session ?? null} run={run} />)}</div>}
      {session && <FinishSessionPanel data={data} session={session} run={run} />}
    </section>
  );
}

function ExerciseCard({ row, data, session, run }: { row: PlannedExercise; data: AppData; session: WorkoutSession | null; run: (p: Promise<any>, s: string) => void }) {
  const exercise = exercises.find((item) => item.id === row.exerciseId);
  const gym = data.gyms.find((item) => item.id === data.currentGymId) ?? data.gyms[0];
  const last = data.exerciseLogs.find((log) => log.exerciseId === row.exerciseId);
  const [form, setForm] = useState({ load: last?.actualLoad ?? "", reps: last?.actualReps ?? "", sets: "", rpe: 7, issue: "target_muscle", pain: 0, note: "" });
  if (!exercise || !gym) return null;
  const available = isAvailable(exercise, gym);
  return (
    <article className="exercise-card">
      <div className="card-head">
        <div><h3>{exercise.name}</h3><p>{exercise.pattern} · {exercise.muscles.join(" / ")}</p></div>
        <span className={available ? "pill ok" : "pill warn"}>{available ? "当前可做" : "需替代"}</span>
      </div>
      <div className="plan-line">计划：{row.sets} 组 × {row.reps}，RPE {row.rpe}，休息 {row.rest}</div>
      <p className="muted">{row.notes || exercise.cue}</p>
      {last && <p className="last">上次：{last.actualLoad} × {last.actualReps} @ {last.rpe}，{last.analysis.tags.join(" / ") || "无异常"}</p>}
      {!available && <div className="chips">{substitutes(exercise, gym).slice(0, 3).map((item) => <span key={item.id}>{item.name}</span>)}</div>}
      {session && (
        <div className="quick-log">
          <input placeholder="重量 60kg" value={form.load} onChange={(e) => setForm({ ...form, load: e.target.value })} />
          <input placeholder="次数 8/8/7" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
          <input placeholder="每组 60kg x 8 @8" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
          <input type="number" min={1} max={10} step={0.5} value={form.rpe} onChange={(e) => setForm({ ...form, rpe: Number(e.target.value) })} />
          <select value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })}>
            <option value="target_muscle">目标肌肉</option><option value="grip">握力先酸</option><option value="joint_pain">关节不适</option><option value="core">核心不稳</option><option value="fatigue">整体疲劳</option>
          </select>
          <input type="number" min={0} max={5} value={form.pain} onChange={(e) => setForm({ ...form, pain: Number(e.target.value) })} />
          <button onClick={() => run(logExercise(data, { sessionId: session.id, exerciseId: exercise.id, actualLoad: form.load, actualReps: form.reps, setsText: form.sets, rpe: form.rpe, quality: "ok", rangeOfMotion: "full", targetMuscleFeel: "moderate", limitingFactor: form.issue, sideIssue: "none", painScore: form.pain, painArea: "", freeText: form.note }), "动作记录已保存")}>记录本动作</button>
        </div>
      )}
    </article>
  );
}

function FinishSessionPanel({ data, session, run }: { data: AppData; session: WorkoutSession; run: (p: Promise<any>, s: string) => void }) {
  const [form, setForm] = useState({ completion: 100, rpe: 7, painScore: 0, painArea: "", sleep: 3, fatigue: 3, notes: "" });
  return <Panel title="结束训练">
    <div className="quick-log">
      <input type="number" value={form.completion} onChange={(e) => setForm({ ...form, completion: Number(e.target.value) })} />
      <input type="number" step={0.5} value={form.rpe} onChange={(e) => setForm({ ...form, rpe: Number(e.target.value) })} />
      <input type="number" value={form.painScore} onChange={(e) => setForm({ ...form, painScore: Number(e.target.value) })} />
      <input placeholder="疼痛部位" value={form.painArea} onChange={(e) => setForm({ ...form, painArea: e.target.value })} />
      <input type="number" value={form.sleep} onChange={(e) => setForm({ ...form, sleep: Number(e.target.value) })} />
      <input type="number" value={form.fatigue} onChange={(e) => setForm({ ...form, fatigue: Number(e.target.value) })} />
      <input placeholder="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className="primary" onClick={() => run(finishWorkoutSession(data, session.id, form), "训练已结束，建议已生成")}>结束并生成建议</button>
    </div>
  </Panel>;
}

function PlanPage({ data, run }: { data: AppData; run: (p: Promise<any>, s: string) => void }) {
  return <section><Header title="计划" subtitle="当前计划和待确认调整。" /><button onClick={() => run(generateTrainingPlan(data), "已生成训练计划")}>生成/刷新计划</button>{data.plan?.days.map((day) => <Panel key={day.id} title={day.focus}><p>{day.intent}</p>{day.exercises.map((row) => <p key={row.id}>{exName(row.exerciseId)}：{row.sets} × {row.reps} @ {row.rpe}</p>)}</Panel>)}{data.revisions.map((rev) => <Panel key={rev.id} title={rev.summary}><p>{rev.reason}</p><p>{rev.status}</p>{rev.status === "pending" && <button onClick={() => run(applyRevision(data, rev.id), "调整已应用")}>应用</button>}</Panel>)}</section>;
}

function RecordsPage({ data, run }: { data: AppData; run: (p: Promise<any>, s: string) => void }) {
  const [metric, setMetric] = useState({ date: todayIso(), weight: "", bodyFat: "", skeletalMuscle: "", waist: "", notes: "" });
  const [nutrition, setNutrition] = useState({ date: todayIso(), text: "" });
  return <section><Header title="记录" subtitle="身体指标、动作历史和饮食记录。" />
    <Panel title="身体指标"><div className="quick-log"><input type="date" value={metric.date} onChange={(e) => setMetric({ ...metric, date: e.target.value })} /><input placeholder="体重" value={metric.weight} onChange={(e) => setMetric({ ...metric, weight: e.target.value })} /><input placeholder="体脂" value={metric.bodyFat} onChange={(e) => setMetric({ ...metric, bodyFat: e.target.value })} /><button onClick={() => run(saveMetric(data, { date: metric.date, weight: num(metric.weight), bodyFat: num(metric.bodyFat), skeletalMuscle: num(metric.skeletalMuscle), waist: num(metric.waist), notes: metric.notes }), "指标已保存")}>保存</button></div></Panel>
    <Panel title="饮食"><div className="quick-log"><input type="date" value={nutrition.date} onChange={(e) => setNutrition({ ...nutrition, date: e.target.value })} /><input placeholder="自然语言饮食记录" value={nutrition.text} onChange={(e) => setNutrition({ ...nutrition, text: e.target.value })} /><button onClick={() => run(saveNutrition(data, nutrition.text, nutrition.date), "饮食已保存")}>保存</button></div></Panel>
    <Panel title="动作历史">{data.exerciseLogs.slice(0, 12).map((log) => <p key={log.id}>{log.date} {log.exerciseName}: {log.actualLoad} × {log.actualReps}, 容量 {log.volumeLoad}</p>)}</Panel>
  </section>;
}

function InsightsPage({ data, run }: { data: AppData; run: (p: Promise<any>, s: string) => void }) {
  const metrics = useMemo(() => sortedMetrics(data.metrics), [data.metrics]);
  return <section><Header title="洞察" subtitle="建议、revision、趋势和画像。" /><Panel title="建议收件箱">{data.advice.map((item) => <article className="notice" key={item.id}><strong>{item.title}</strong><p>{item.detail}</p><p>{item.evidence.join(" · ")}</p>{item.status === "active" && <button onClick={() => run(dismissAdvice(data, item.id), "建议已忽略")}>忽略</button>}</article>)}</Panel><Panel title="身体趋势">{metrics.map((item) => <p key={item.id}>{item.date}: {item.weight ?? "-"}kg / {item.bodyFat ?? "-"}%</p>)}</Panel></section>;
}

function DataPage({ data, run }: { data: AppData; run: (p: Promise<any>, s: string) => void }) {
  async function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fitness-workbench-backup-${todayIso()}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  async function importJson(file: File | null) {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as AppData;
    await run(importBackup(data, parsed), "JSON 已导入，导入前状态已备份");
  }
  return <section><Header title="数据" subtitle="SQLite 本地存储，JSON 只作为备份/迁移。" /><Panel title="备份恢复"><button onClick={exportJson}>导出 JSON</button><label className="file">导入 JSON<input type="file" accept=".json,application/json" onChange={(e) => importJson(e.target.files?.[0] ?? null)} /></label><button className="danger" onClick={() => run(resetData(data), "已恢复初始数据，恢复前状态已备份")}>恢复初始数据</button><p>自动备份：{data.backupSnapshots.length} 条</p></Panel><GymEditor data={data} run={run} /></section>;
}

function GymEditor({ data, run }: { data: AppData; run: (p: Promise<any>, s: string) => void }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(["dumbbell", "bench", "mat"]);
  return <Panel title="新增场地"><input placeholder="场地名称" value={name} onChange={(e) => setName(e.target.value)} /><div className="chips">{equipment.map((item) => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} />{item.label}</label>)}</div><button onClick={() => run(createGym(data, { name, location: "", equipment: selected }), "场地已保存")}>保存场地</button></Panel>;
}

function Header({ title, subtitle }: { title: string; subtitle: string }) { return <header className="page-head"><h1>{title}</h1><p>{subtitle}</p></header>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="panel"><h2>{title}</h2>{children}</section>; }
function exName(id: string) { return exercises.find((item) => item.id === id)?.name ?? id; }
function num(value: string) { const n = Number(value); return Number.isFinite(n) ? n : null; }

createRoot(document.getElementById("root")!).render(<App />);
