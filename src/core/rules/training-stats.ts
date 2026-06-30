(function () {
  "use strict";

  function calculateVolumeLoad(setLogs) {
    return (setLogs || []).reduce((total, set) => {
      const load = numberOrNull(set.loadKg);
      const reps = numberOrNull(set.reps);
      if (load == null || reps == null) return total;
      return total + load * reps;
    }, 0);
  }

  function calculateHardSets(setLogs) {
    return (setLogs || []).filter((set) => {
      const reps = numberOrNull(set.reps);
      const rpe = numberOrNull(set.rpe);
      return reps != null && reps > 0 && rpe != null && rpe >= 7;
    }).length;
  }

  function detectSimplePr(currentLog, previousLogs) {
    const current = summarizeLog(currentLog);
    const previous = (previousLogs || [])
      .filter((log) => log && log.exerciseId === currentLog?.exerciseId && log.id !== currentLog?.id)
      .map(summarizeLog);

    const bestVolume = Math.max(0, ...previous.map((item) => item.volumeLoad || 0));
    const bestLoad = Math.max(0, ...previous.map((item) => item.maxLoadKg || 0));
    const bestReps = Math.max(0, ...previous.map((item) => item.maxReps || 0));

    const records = [];
    if (!previous.length) {
      return {
        isPr: false,
        records,
        summary: current,
        previousBest: {
          volumeLoad: 0,
          maxLoadKg: 0,
          maxReps: 0
        }
      };
    }
    if (current.volumeLoad > 0 && current.volumeLoad > bestVolume) {
      records.push({ type: "volume_load", label: "容量 PR", current: round1(current.volumeLoad), previous: round1(bestVolume) });
    }
    if (current.maxLoadKg > 0 && current.maxLoadKg > bestLoad) {
      records.push({ type: "max_load", label: "重量 PR", current: round1(current.maxLoadKg), previous: round1(bestLoad) });
    }
    if (current.maxReps > 0 && current.maxReps > bestReps) {
      records.push({ type: "max_reps", label: "次数 PR", current: current.maxReps, previous: bestReps });
    }

    return {
      isPr: records.length > 0,
      records,
      summary: current,
      previousBest: {
        volumeLoad: round1(bestVolume),
        maxLoadKg: round1(bestLoad),
        maxReps: bestReps
      }
    };
  }

  function summarizeLog(log) {
    const sets = log?.sets || [];
    const loadValues = sets.map((set) => numberOrNull(set.loadKg)).filter((value) => value != null);
    const repValues = sets.map((set) => numberOrNull(set.reps)).filter((value) => value != null);
    return {
      volumeLoad: calculateVolumeLoad(sets),
      hardSets: calculateHardSets(sets),
      maxLoadKg: loadValues.length ? Math.max(...loadValues) : 0,
      maxReps: repValues.length ? Math.max(...repValues) : 0,
      setCount: sets.length
    };
  }

  function numberOrNull(value) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.TrainingStats = {
    calculateVolumeLoad,
    calculateHardSets,
    detectSimplePr
  };
})();
