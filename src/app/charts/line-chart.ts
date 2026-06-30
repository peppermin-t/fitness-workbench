// @ts-nocheck
(function () {
  "use strict";

  function draw(canvas, { data, emptyText, emptyY = 150, gridStep = 50, series = [] }) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx, width, gridStep);

    ctx.fillStyle = "#66736b";
    ctx.font = "14px sans-serif";
    if ((data || []).length < 2) {
      ctx.fillText(emptyText, 48, emptyY);
      return;
    }

    series.forEach((item) => drawSeries(ctx, data, item));
  }

  function drawGrid(ctx, width, step) {
    ctx.strokeStyle = "#d8ded6";
    for (let index = 0; index < 5; index += 1) {
      const y = 38 + index * step;
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(width - 22, y);
      ctx.stroke();
    }
  }

  function drawSeries(ctx, data, { field, color, label, legendX }) {
    const points = (data || []).filter((item) => typeof item[field] === "number");
    if (points.length < 2) return;
    const values = points.map((item) => item[field]);
    const min = Math.min(...values);
    const range = Math.max(...values) - min || 1;
    const left = 58;
    const right = ctx.canvas.width - 32;
    const top = 42;
    const bottom = ctx.canvas.height - 48;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = left + (index / (points.length - 1)) * (right - left);
      const y = bottom - ((point[field] - min) / range) * (bottom - top);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "13px sans-serif";
    ctx.fillText(label, legendX, 22);
  }

  window.FitnessApp = window.FitnessApp || {};
  window.FitnessApp.LineChart = {
    draw
  };
})();
