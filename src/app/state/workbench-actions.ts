(function () {
  "use strict";

  function create({ rules, uid, nowLabel, todayIso }) {
    function setCurrentGym({ state, gymId }) {
      state.currentGymId = gymId;
    }

    function setCurrentGoal({ state, goalId }) {
      state.currentGoalId = goalId;
    }

    function deleteAdvice({ state, adviceId }) {
      state.advice = state.advice.filter((item) => item.id !== adviceId);
    }

    function saveGoal({ state, text, parsed }) {
      const goal = { id: uid("goal"), text, parsed, createdAt: nowLabel() };
      state.goals.unshift(goal);
      state.currentGoalId = goal.id;
      return goal;
    }

    function deleteGoal({ state, goalId }) {
      state.goals = state.goals.filter((item) => item.id !== goalId);
      if (state.currentGoalId === goalId) state.currentGoalId = state.goals[0]?.id || null;
    }

    function saveGym({ state, name, location, equipment }) {
      const gym = { id: uid("gym"), name, location, equipment };
      state.gyms.unshift(gym);
      state.currentGymId = gym.id;
      return gym;
    }

    function deleteGym({ state, gymId }) {
      if ((state.gyms || []).length <= 1) return false;
      state.gyms = state.gyms.filter((item) => item.id !== gymId);
      if (state.currentGymId === gymId) state.currentGymId = state.gyms[0]?.id || null;
      return true;
    }

    function saveMetric({ state, metric }) {
      const entry = {
        id: uid("metric"),
        ...metric,
        createdAt: nowLabel()
      };
      state.metrics.push(entry);
      state.metrics = rules.sortedMetrics(state.metrics);
      return entry;
    }

    function deleteMetric({ state, metricId }) {
      state.metrics = state.metrics.filter((item) => item.id !== metricId);
    }

    function generatePlan({ state, gym, goal }) {
      state.plan = rules.generatePlan({ gym, goal, metrics: state.metrics, exercises: state.exercises, nowLabel, uid });
      const advice = {
        id: uid("advice"),
        createdAt: nowLabel(),
        title: "已生成训练计划",
        body: `计划已按“${state.plan.context.goalLabel}”、当前健身房“${state.plan.context.gymName}”和最近身体指标生成。替代动作会优先在当前器械范围内选择。`,
        tags: ["计划生成", state.plan.context.gymName, state.plan.context.goalLabel]
      };
      state.advice.unshift(advice);
      return { plan: state.plan, advice };
    }

    function importPlanCsv({ state, days, gym, goal }) {
      const contextPlan = rules.generatePlan({ gym, goal, metrics: state.metrics, exercises: state.exercises, nowLabel, uid });
      state.plan = {
        id: uid("plan"),
        generatedAt: nowLabel(),
        context: contextPlan.context,
        days
      };
      return state.plan;
    }

    function findOrCreateExercise({ state, name }) {
      const found = state.exercises.find((item) => item.name === name);
      if (found) return found.id;
      const id = uid("custom_exercise");
      state.exercises.push({
        id,
        name,
        pattern: "自定义",
        muscles: ["待补充"],
        equipment: [],
        substitutes: [],
        cue: "从 CSV 导入的自定义动作，请后续补充器械依赖。",
        risk: "尚未录入注意事项。",
        links: [{ label: "YouTube 搜索", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}` }]
      });
      return id;
    }

    function saveSessionFeedback({ state, dayIndex, day, currentGym, input }) {
      const session = getOrCreateWorkoutSession(state, dayIndex, day, currentGym);
      Object.assign(session, {
        completedAt: nowLabel(),
        status: "completed",
        completion: input.completion,
        rpe: input.rpe,
        painScore: input.painScore,
        painArea: input.painArea,
        sleep: input.sleep,
        fatigue: input.fatigue,
        notes: input.notes
      });
      moveSessionToFront(state, session.id);
      state.feedback.unshift({ ...session, type: "post_workout" });
      const result = rules.createAdviceFromSession({ session, day, nowLabel, uid });
      state.advice.unshift(...result.advice);
      state.revisions.unshift(...result.revisions);
      return { session, advice: result.advice, revisions: result.revisions };
    }

    function saveExerciseLog({ state, dayIndex, day, exercise, plannedRow, input }) {
      const session = getOrCreateWorkoutSession(state, dayIndex, day, input.currentGym);
      const log: any = {
        id: uid("exercise_log"),
        date: todayIso(),
        createdAt: nowLabel(),
        sessionId: session.id,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        dayIndex,
        focus: day?.focus || "",
        plannedSets: plannedRow?.sets || "",
        plannedReps: plannedRow?.reps || "",
        plannedLoad: plannedRow?.load || "",
        plannedRpe: plannedRow?.rpe || "",
        actualLoad: input.actualLoad,
        actualReps: input.actualReps,
        rpe: input.rpe,
        quality: input.quality,
        rangeOfMotion: input.rangeOfMotion,
        targetMuscleFeel: input.targetMuscleFeel,
        limitingFactor: input.limitingFactor,
        sideIssue: input.sideIssue,
        painScore: input.painScore,
        painArea: input.painArea,
        freeText: input.freeText
      };
      log.sets = parseSetLogs(input.setsText, log.actualLoad, log.actualReps, log.rpe, uid);
      Object.assign(log, buildTrainingStatsForLog(log, state.exerciseLogs || []));
      log.analysis = rules.analyzeExerciseFeedback(log, exercise);
      state.exerciseLogs = state.exerciseLogs || [];
      state.exerciseLogs.unshift(log);
      session.exerciseLogIds = Array.isArray(session.exerciseLogIds) ? session.exerciseLogIds : [];
      if (!session.exerciseLogIds.includes(log.id)) session.exerciseLogIds.push(log.id);
      moveSessionToFront(state, session.id);
      const advice = {
        id: uid("advice"),
        createdAt: nowLabel(),
        title: `${exercise.name} 动作反馈建议`,
        body: log.analysis.recommendations.join(" "),
        tags: log.analysis.tags.map((item) => item.tag),
        priority: log.analysis.priority,
        priorityLabel: log.analysis.priorityLabel,
        evidence: log.analysis.evidence || [],
        recommendationItems: log.analysis.recommendationItems || []
      };
      state.advice.unshift(advice);
      return { log, session, advice };
    }

    function saveNutritionLog({ state, rawText, date, goal, latestMetric }) {
      const analysis = rules.parseNutritionLog(rawText, goal, latestMetric);
      const log = {
        id: uid("nutrition"),
        date,
        createdAt: nowLabel(),
        rawText,
        goalId: goal?.id || null,
        analysis
      };
      state.nutritionLogs = state.nutritionLogs || [];
      state.nutritionLogs.unshift(log);
      const advice = {
        id: uid("advice"),
        createdAt: nowLabel(),
        title: `${log.date} 饮食建议`,
        body: analysis.recommendations.join(" "),
        tags: ["饮食", analysis.confidence, ...(analysis.tags || []).slice(0, 4)],
        priority: analysis.priority,
        priorityLabel: analysis.priorityLabel,
        evidence: analysis.evidence || [],
        recommendationItems: analysis.recommendationItems || []
      };
      state.advice.unshift(advice);
      return { log, advice };
    }

    function deleteExerciseLog({ state, logId }) {
      state.exerciseLogs = (state.exerciseLogs || []).filter((item) => item.id !== logId);
    }

    function deleteNutritionLog({ state, logId }) {
      state.nutritionLogs = (state.nutritionLogs || []).filter((item) => item.id !== logId);
    }

    function replaceExercise({ state, dayIndex, rowIndex, nextExercise, oldExercise, currentGymName }) {
      const row = state.plan?.days?.[dayIndex]?.exercises?.[rowIndex];
      if (!row || !nextExercise) return false;
      row.exerciseId = nextExercise.id;
      row.notes = `已从 ${oldExercise?.name || "原动作"} 替换为 ${nextExercise.name}，以适配当前健身房器械。`;
      state.revisions.unshift({
        id: uid("rev"),
        createdAt: nowLabel(),
        status: "applied",
        summary: `替换动作：${oldExercise?.name || "原动作"} -> ${nextExercise.name}`,
        reason: `当前健身房器械条件更适合执行 ${nextExercise.name}。`,
        tags: ["动作替代", currentGymName || "当前场地"],
        patch: { type: "manual_replace", dayIndex, rowIndex, exerciseId: nextExercise.id }
      });
      return true;
    }

    function applyReviewCandidate({ state, candidate, getExercise }) {
      if (!candidate) return { status: "missing" };
      const matched = findMatchingRevision(state, candidate);
      if (matched?.status === "applied") return { status: "already_applied", revision: matched };

      const revision = matched?.status === "pending"
        ? matched
        : {
            id: uid("rev"),
            createdAt: nowLabel(),
            status: "pending",
            summary: candidate.summary,
            reason: candidate.reason,
            tags: candidate.tags || [],
            patch: clone(candidate.patch)
          };

      if (!matched) state.revisions.unshift(revision);
      const applied = applyRevision({ state, revisionId: revision.id, getExercise });
      return { status: applied ? "applied" : "not_applicable", revision };
    }

    function applyRevision({ state, revisionId, getExercise }) {
      const rev = state.revisions.find((item) => item.id === revisionId);
      const day = state.plan?.days?.[rev?.patch?.dayIndex];
      if (!rev || !day) return false;

      if (rev.patch.type === "reduce_day_volume") {
        day.exercises.forEach((row) => {
          if (Number(row.sets) > 1) row.sets = Math.max(2, Math.round(Number(row.sets) * rev.patch.factor));
          row.notes = appendNote(row.notes, "已根据疼痛反馈降量。");
        });
      }

      if (rev.patch.type === "trim_accessory" && day.exercises.length > 4) {
        day.exercises = day.exercises.slice(0, Math.max(4, day.exercises.length - 2));
        day.intent = `${day.intent} 已根据完成度反馈简化。`;
      }

      if (rev.patch.type === "add_progression_note") {
        day.exercises.slice(0, 3).forEach((row) => {
          row.notes = appendNote(row.notes, "下次可尝试加重 2.5%-5% 或增加 1-2 次。");
        });
      }

      if (rev.patch.type === "increase_cardio_time") {
        const minutes = Number(rev.patch.minutes || 10);
        let targetRow = day.exercises.find((row) => /分钟|min/i.test(String(row.reps || "")));
        if (!targetRow) {
          targetRow = day.exercises.find((row) => /有氧/.test(String(getExercise(row.exerciseId)?.pattern || "")));
        }
        if (targetRow) {
          targetRow.reps = bumpDurationText(String(targetRow.reps || ""), minutes);
          targetRow.notes = appendNote(targetRow.notes, `已根据周复盘增加有氧 ${minutes} 分钟。`);
        } else {
          day.intent = appendNote(day.intent, `已根据周复盘增加有氧 ${minutes} 分钟。`);
        }
      }

      rev.status = "applied";
      rev.appliedAt = nowLabel();
      return true;
    }

    function findMatchingRevision(state, candidate) {
      const signature = candidatePatchSignature(candidate?.patch);
      return state.revisions.find((item) => candidatePatchSignature(item.patch) === signature) || null;
    }

    function getOrCreateWorkoutSession(state, dayIndex, day, currentGym) {
      state.sessions = state.sessions || [];
      const date = todayIso();
      const existing = state.sessions.find((session) =>
        session.date === date
        && Number(session.dayIndex) === Number(dayIndex)
        && (!state.plan?.id || session.planId === state.plan.id)
        && session.status !== "cancelled"
      );
      if (existing) {
        existing.status = existing.status || "in_progress";
        existing.exerciseLogIds = Array.isArray(existing.exerciseLogIds) ? existing.exerciseLogIds : [];
        return existing;
      }
      const session = {
        id: uid("session"),
        date,
        createdAt: nowLabel(),
        startedAt: nowLabel(),
        completedAt: null,
        status: "in_progress",
        gymId: state.currentGymId,
        gymName: currentGym?.name || "",
        planId: state.plan?.id || null,
        dayIndex,
        focus: day?.focus || "",
        completion: null,
        rpe: null,
        painScore: null,
        painArea: "",
        sleep: null,
        fatigue: null,
        notes: "",
        exerciseLogIds: []
      };
      state.sessions.unshift(session);
      return session;
    }

    return {
      setCurrentGym,
      setCurrentGoal,
      deleteAdvice,
      saveGoal,
      deleteGoal,
      saveGym,
      deleteGym,
      saveMetric,
      deleteMetric,
      generatePlan,
      importPlanCsv,
      findOrCreateExercise,
      saveSessionFeedback,
      saveExerciseLog,
      saveNutritionLog,
      deleteExerciseLog,
      deleteNutritionLog,
      replaceExercise,
      applyReviewCandidate,
      applyRevision,
      findMatchingRevision
    };
  }

  function moveSessionToFront(state, sessionId) {
    const index = (state.sessions || []).findIndex((session) => session.id === sessionId);
    if (index <= 0) return;
    const [session] = state.sessions.splice(index, 1);
    state.sessions.unshift(session);
  }

  function parseSetLogs(rawText, actualLoadText, actualRepsText, defaultRpe, uid) {
    const explicitLines = String(rawText || "")
      .split(/[\n;；]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (explicitLines.length) {
      return explicitLines.map((line, index) => parseSetLine(line, index, defaultRpe, uid));
    }

    const loadKg = parseLoadKg(actualLoadText);
    const reps = String(actualRepsText || "")
      .split(/[\/,，\s]+/)
      .map((item) => parseNumber(item))
      .filter((value) => value != null && value > 0);
    if (loadKg == null || !reps.length) return [];
    return reps.map((rep, index) => ({
      id: uid("set"),
      setIndex: index + 1,
      loadKg,
      reps: rep,
      rpe: Number.isFinite(defaultRpe) && defaultRpe > 0 ? defaultRpe : null,
      completed: true,
      note: "由实际重量和实际次数自动推导"
    }));
  }

  function parseSetLine(line, index, defaultRpe, uid) {
    const loadMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:kg|公斤)?/i);
    const repsMatch = line.match(/[x×]\s*(\d+(?:\.\d+)?)/i) || line.match(/(\d+(?:\.\d+)?)\s*(?:次|reps?)/i);
    const rpeMatch = line.match(/(?:@|rpe\s*)(\d+(?:\.\d+)?)/i);
    return {
      id: uid("set"),
      setIndex: index + 1,
      loadKg: loadMatch ? Number(loadMatch[1]) : null,
      reps: repsMatch ? Number(repsMatch[1]) : null,
      rpe: rpeMatch ? Number(rpeMatch[1]) : (Number.isFinite(defaultRpe) && defaultRpe > 0 ? defaultRpe : null),
      completed: true,
      note: line
    };
  }

  function buildTrainingStatsForLog(log, previousLogs) {
    const stats = window.FitnessCore.TrainingStats;
    const volumeLoad = stats.calculateVolumeLoad(log.sets || []);
    const hardSets = stats.calculateHardSets(log.sets || []);
    const simplePr = stats.detectSimplePr({ ...log, volumeLoad, hardSets }, previousLogs || []);
    return { volumeLoad, hardSets, simplePr };
  }

  function parseLoadKg(text) {
    if (/自重|bodyweight/i.test(String(text || ""))) return null;
    return parseNumber(text);
  }

  function parseNumber(text) {
    const match = String(text || "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function candidatePatchSignature(patch) {
    if (!patch) return "";
    return JSON.stringify({
      type: patch.type || "",
      dayIndex: Number.isFinite(Number(patch.dayIndex)) ? Number(patch.dayIndex) : null,
      rowIndex: Number.isFinite(Number(patch.rowIndex)) ? Number(patch.rowIndex) : null,
      exerciseId: patch.exerciseId || null,
      minutes: Number.isFinite(Number(patch.minutes)) ? Number(patch.minutes) : null,
      factor: Number.isFinite(Number(patch.factor)) ? Number(patch.factor) : null
    });
  }

  function bumpDurationText(text, minutes) {
    const source = String(text || "");
    const rangeMatch = source.match(/(\d+)\s*-\s*(\d+)\s*(分钟|min)/i);
    if (rangeMatch) {
      const nextMin = Number(rangeMatch[1]) + minutes;
      const nextMax = Number(rangeMatch[2]) + minutes;
      return `${nextMin}-${nextMax} ${rangeMatch[3]}`;
    }
    const singleMatch = source.match(/(\d+)\s*(分钟|min)/i);
    if (singleMatch) return `${Number(singleMatch[1]) + minutes} ${singleMatch[2]}`;
    return `${source || "有氧"} +${minutes} 分钟`;
  }

  function appendNote(a, b) {
    return a ? `${a} ${b}` : b;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.FitnessApp = window.FitnessApp || {};
  window.FitnessApp.WorkbenchActions = {
    create
  };
})();
