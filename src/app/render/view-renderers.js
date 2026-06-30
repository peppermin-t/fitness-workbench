(function () {
    "use strict";
    function create({ formatters, rules }) {
        const { esc, equipmentLabel, tag, fmt, trendLabel, volumeLabel, equipmentEnglishLabel, equipmentDisplayText, bilingualNameMarkup, equipmentFamilyLabel } = formatters;
        function statusGymText(gym) {
            return `健身房：${gym ? gym.name : "未选择"}`;
        }
        function statusGoalText(goal) {
            return `目标：${goal ? goal.parsed.primaryGoalLabel : "未设定"}`;
        }
        function gymSelectOptions(gyms, currentGymId) {
            return gyms.map((gym) => `<option value="${esc(gym.id)}"${gym.id === currentGymId ? " selected" : ""}>${esc(gym.name)}</option>`).join("");
        }
        function currentGymSummary(gym) {
            return gym ? `
      <div><strong>${esc(gym.name)}</strong></div>
      <div class="mini-text">${esc(gym.location || "无地点备注")}</div>
      <div class="tag-row">${gym.equipment.map((id) => tag(equipmentLabel(id))).join("")}</div>
    ` : `<p class="empty">还没有健身房，请先添加。</p>`;
        }
        function goalsList(goals, currentGoalId) {
            return goals.length ? `<div class="item-list">${goals.map((goal) => `
      <article class="list-item"><div class="list-item-header"><div>
        <h3>${esc(goal.parsed.primaryGoalLabel)}</h3><p class="mini-text">${esc(goal.text)}</p>
        <div class="tag-row">
          ${goal.id === currentGoalId ? tag("当前目标", "success") : ""}
          ${goal.parsed.secondaryGoalLabel ? tag(goal.parsed.secondaryGoalLabel, "info") : ""}
          ${tag(`每周 ${goal.parsed.trainingDaysPerWeek || 3} 次`)}
          ${tag(`每次 ${goal.parsed.sessionDurationMinutes || 60} 分钟`)}
          ${goal.parsed.frequentTravel ? tag("出差较多", "warn") : ""}
          ${goal.parsed.targetWeight ? tag(`目标体重 ${goal.parsed.targetWeight}kg`) : ""}
        </div>
      </div><div class="item-actions">
        <button class="button" data-action="set-goal" data-id="${esc(goal.id)}">设为当前</button>
        <button class="button danger" data-action="delete-goal" data-id="${esc(goal.id)}">删除</button>
      </div></div></article>`).join("")}</div>` : `<p class="empty">暂无保存目标。</p>`;
        }
        function metricsList(metrics) {
            const sorted = rules.sortedMetrics(metrics);
            if (!sorted.length) {
                return {
                    hasData: false,
                    html: `<p class="empty">暂无身体指标。先录入一次体重/体脂/骨骼肌。</p>`
                };
            }
            const latest = sorted[sorted.length - 1];
            return {
                hasData: true,
                html: `
      <div class="metric-grid">
        <div class="metric-pill"><span>最近体重</span><strong>${fmt(latest.weight, "kg")}</strong></div>
        <div class="metric-pill"><span>近30天体重</span><strong>${trendLabel(rules.metricTrend(metrics, "weight", 30), "kg")}</strong></div>
        <div class="metric-pill"><span>近30天体脂</span><strong>${trendLabel(rules.metricTrend(metrics, "bodyFat", 30), "%")}</strong></div>
        <div class="metric-pill"><span>近30天骨骼肌</span><strong>${trendLabel(rules.metricTrend(metrics, "skeletalMuscle", 30), "kg")}</strong></div>
      </div>
      <div class="table-wrap" style="margin-top:14px;"><table><thead><tr><th>日期</th><th>体重</th><th>体脂</th><th>骨骼肌</th><th>腰围</th><th>备注</th><th>操作</th></tr></thead><tbody>
      ${sorted.slice().reverse().map((metric) => `<tr><td>${esc(metric.date)}</td><td>${fmt(metric.weight, "kg")}</td><td>${fmt(metric.bodyFat, "%")}</td><td>${fmt(metric.skeletalMuscle, "kg")}</td><td>${fmt(metric.waist, "cm")}</td><td>${esc(metric.notes || "")}</td><td><button class="button danger" data-action="delete-metric" data-id="${esc(metric.id)}">删除</button></td></tr>`).join("")}
      </tbody></table></div>`
            };
        }
        function planContext(plan) {
            if (!plan) {
                return {
                    hasPlan: false,
                    contextHtml: `<p class="empty">暂无计划。点击“生成计划”会按当前目标、身体指标和健身房器械生成。</p>`,
                    tableHtml: ""
                };
            }
            return {
                hasPlan: true,
                contextHtml: `<div><strong>生成时间：</strong>${esc(plan.generatedAt)}</div><div><strong>目标：</strong>${esc(plan.context.goalLabel)}</div><div><strong>健身房：</strong>${esc(plan.context.gymName)}</div><div><strong>身体指标：</strong>${esc(plan.context.metricSummary)}</div><div class="tag-row">${plan.context.notes.map((note) => tag(note, "info")).join("")}</div>`
            };
        }
        function workoutDay(day, dayIndex, renderPlanRow) {
            return `<div class="day-block"><div class="day-header"><div><h3>第 ${dayIndex + 1} 天：${esc(day.focus)}</h3><p class="mini-text">${esc(day.intent)}</p></div>${tag(`${day.exercises.length} 个动作`)}</div><div class="table-wrap"><table><thead><tr><th>动作</th><th>组数</th><th>次数/时长</th><th>重量</th><th>RPE</th><th>休息</th><th>备注/替代</th><th>示例</th></tr></thead><tbody>${day.exercises.map((row, rowIndex) => renderPlanRow(row, dayIndex, rowIndex)).join("")}</tbody></table></div></div>`;
        }
        function dataSummary(state) {
            return `<div>健身房：${state.gyms.length} 个</div><div>动作：${state.exercises.length} 个</div><div>目标：${state.goals.length} 条</div><div>身体指标：${state.metrics.length} 条</div><div>训练记录：${state.sessions.length} 条</div><div>动作级反馈：${(state.exerciseLogs || []).length} 条</div><div>饮食记录：${(state.nutritionLogs || []).length} 条</div><div>智能建议：${state.advice.length} 条</div>`;
        }
        function equipmentChecklist(equipment) {
            return equipment.map((item) => `
      <label class="check-item check-item-text">
        <input type="checkbox" value="${esc(item.id)}" />
        <div class="dual-name">${bilingualNameMarkup(item.label, equipmentEnglishLabel(item.id))}</div>
      </label>
    `).join("");
        }
        function equipmentLibrary(equipment) {
            return `<div class="visual-grid">${equipment.map((item) => `
      <article class="visual-card">
        <div class="dual-name">${bilingualNameMarkup(item.label, equipmentEnglishLabel(item.id), true)}</div>
        <p class="mini-text">${esc(equipmentFamilyLabel(item.id))}</p>
      </article>
      `).join("")}</div>`;
        }
        function gymList(gyms, currentGymId) {
            return gyms.length ? `<div class="item-list">${gyms.map((gym) => `
      <article class="list-item"><div class="list-item-header"><div>
        <h3>${esc(gym.name)}</h3><p class="mini-text">${esc(gym.location || "无地点备注")}</p>
        <div class="tag-row">${gym.equipment.map((id) => tag(equipmentDisplayText(id))).join("")}</div>
      </div><div class="item-actions">
        ${gym.id === currentGymId ? tag("当前", "success") : `<button class="button" data-action="set-current-gym" data-id="${esc(gym.id)}">设为当前</button>`}
        <button class="button danger" data-action="delete-gym" data-id="${esc(gym.id)}">删除</button>
      </div></div></article>`).join("")}</div>` : `<p class="empty">暂无健身房。</p>`;
        }
        function exerciseLogSelectOptions(day, getExercise, exerciseEnglishName) {
            if (!day)
                return `<option value="">暂无计划动作</option>`;
            return day.exercises.map((row) => {
                const exercise = getExercise(row.exerciseId);
                return `<option value="${esc(row.exerciseId)}">${esc(exercise?.name || row.exerciseId)} / ${esc(exerciseEnglishName(row.exerciseId))}</option>`;
            }).join("");
        }
        function trainingStatsLine(log) {
            const setCount = (log.sets || []).length;
            if (!setCount)
                return "";
            const prText = log.simplePr?.isPr ? ` · ${log.simplePr.records.map((record) => record.label).join(" / ")}` : "";
            return `<p class="mini-text">每组 ${setCount} 组 · 容量 ${volumeLabel(log.volumeLoad)} · 有效组 ${Number(log.hardSets || 0)}${esc(prText)}</p>`;
        }
        return {
            statusGymText,
            statusGoalText,
            gymSelectOptions,
            currentGymSummary,
            goalsList,
            metricsList,
            planContext,
            workoutDay,
            dataSummary,
            equipmentChecklist,
            equipmentLibrary,
            gymList,
            exerciseLogSelectOptions,
            trainingStatsLine
        };
    }
    window.FitnessApp = window.FitnessApp || {};
    window.FitnessApp.ViewRenderers = {
        create
    };
})();
