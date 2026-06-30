(function () {
  "use strict";

function sortedMetrics(metrics) {
    return (metrics || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  }



function metricTrend(metrics, field, days) {
    const data = sortedMetrics(metrics).filter((item) => typeof item[field] === "number");
    if (data.length < 2) return null;
    const last = data[data.length - 1];
    const cutoff = new Date(last.date);
    cutoff.setDate(cutoff.getDate() - days);
    const first = data.find((item) => new Date(item.date) >= cutoff) || data[0];
    return { first: first[field], last: last[field], delta: last[field] - first[field] };
  }



function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }



function signed(value, unit) {
    if (!Number.isFinite(value)) return "-";
    return `${value > 0 ? "+" : ""}${value}${unit}`;
  }



function fmtNum(value, unit) {
    return Number.isFinite(value) ? `${round1(value)}${unit}` : "-";
  }



  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.MetricAnalyzer = {
    sortedMetrics,
    metricTrend
  };
})();
