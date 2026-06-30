// @ts-nocheck
(function () {
    "use strict";
    function buildPlanCsv(plan, getExerciseName) {
        const rows = [["day", "focus", "exercise", "sets", "reps", "load", "rpe", "rest", "notes"]];
        (plan?.days || []).forEach((day, dayIndex) => {
            (day.exercises || []).forEach((row) => {
                rows.push([
                    dayIndex + 1,
                    day.focus,
                    getExerciseName(row.exerciseId) || row.exerciseId,
                    row.sets,
                    row.reps,
                    row.load,
                    row.rpe,
                    row.rest,
                    row.notes
                ]);
            });
        });
        return "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
    }
    function parsePlanCsv(text, resolveExerciseId) {
        const rows = String(text || "")
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
        const head = rows.shift()?.map((item) => item.toLowerCase()) || [];
        const idx = (name) => head.indexOf(name);
        const byDay = new Map();
        rows.forEach((row) => {
            const key = row[idx("day")] || "1";
            const focus = row[idx("focus")] || `训练日 ${key}`;
            if (!byDay.has(key)) {
                byDay.set(key, { focus, intent: "从教练 CSV 导入。", exercises: [] });
            }
            byDay.get(key).exercises.push({
                exerciseId: resolveExerciseId(row[idx("exercise")] || "自定义动作"),
                sets: row[idx("sets")] || 3,
                reps: row[idx("reps")] || "8-12",
                load: row[idx("load")] || "按记录",
                rpe: row[idx("rpe")] || "7",
                rest: row[idx("rest")] || "90 秒",
                notes: row[idx("notes")] || ""
            });
        });
        return Array.from(byDay.values());
    }
    function buildBackupJson(state) {
        return JSON.stringify(state, null, 2);
    }
    function parseBackupJson(text) {
        return JSON.parse(String(text || "{}"));
    }
    function csvCell(value) {
        const text = String(value ?? "");
        return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }
    window.FitnessApp = window.FitnessApp || {};
    window.FitnessApp.DataPortability = {
        buildPlanCsv,
        parsePlanCsv,
        buildBackupJson,
        parseBackupJson
    };
})();
