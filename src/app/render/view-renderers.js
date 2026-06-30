(function () {
    "use strict";
    function create({ formatters, rules }) {
        const { esc, equipmentLabel, tag, fmt, numUnit, deltaLabel, trendLabel, volumeLabel, qualityLabel, romLabel, targetFeelLabel, limiterLabel, sideIssueLabel, advicePriorityType, adviceSortScore, advicePriorityLabel, renderEvidenceList, renderRecommendationItems, equipmentEnglishLabel, equipmentDisplayText, exerciseEnglishName, bilingualNameMarkup, equipmentFamilyLabel } = formatters;
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
        function todayAdvice({ summary, linkedSignals }) {
            return `
      <div class="context-box">
        <div><strong>今日概况</strong></div>
        ${renderEvidenceList(summary)}
      </div>
      ${linkedSignals.length ? `<div class="context-box" style="margin-top:14px;"><div><strong>联动信号</strong></div>${renderRecommendationItems(linkedSignals)}</div>` : ""}
    `;
        }
        function trainingReminders({ hasPlan, reminders }) {
            if (!hasPlan) {
                return `<div class="context-box"><div><strong>训练前提醒</strong></div><div class="mini-text">生成计划后，这里会结合长期画像和联动判断给出训练前提醒。</div></div>`;
            }
            return `
      <div class="context-box">
        <div><strong>训练前提醒</strong></div>
        ${reminders.length ? renderRecommendationItems(reminders.slice(0, 4)) : `<div class="mini-text" style="margin-top:8px;">当前没有额外的训练前提醒，按计划执行并继续记录即可。</div>`}
      </div>
    `;
        }
        function todayPlanOptions(plan) {
            return plan?.days?.length
                ? plan.days.map((day, index) => `<option value="${index}">第 ${index + 1} 天：${esc(day.focus)}</option>`).join("")
                : `<option value="">暂无计划</option>`;
        }
        function todayWorkoutEmpty() {
            return `<div class="context-box empty">暂无计划。点击“生成/刷新计划”后，这里会显示今日训练。</div>`;
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
        function planRow({ row, dayIndex, rowIndex, exercise, available, substitutes }) {
            if (!exercise)
                return "";
            return `<tr><td><strong>${esc(exercise.name)}</strong><div class="mini-text dual-name-english">${esc(exerciseEnglishName(exercise.id))}</div><div class="mini-text">${esc(exercise.pattern)} · ${esc(exercise.muscles.join(" / "))}</div><div class="tag-row">${tag(available ? "当前场地可做" : "当前场地缺器械", available ? "success" : "warn")}${exercise.equipment.map((id) => tag(equipmentDisplayText(id))).join("")}</div></td><td>${esc(row.sets)}</td><td>${esc(row.reps)}</td><td>${esc(row.load || "-")}</td><td>${esc(row.rpe)}</td><td>${esc(row.rest || "-")}</td><td><div class="mini-text">${esc(row.notes || exercise.cue)}</div><div class="tag-row">${substitutes.map((item) => `<button class="button" data-action="replace-exercise" data-day="${dayIndex}" data-row="${rowIndex}" data-exercise-id="${esc(item.id)}">${esc(item.name)}</button>`).join("") || `<span class="mini-text">暂无适配替代</span>`}</div></td><td><div class="link-list">${exercise.links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`).join("")}</div></td></tr>`;
        }
        function exerciseList({ exercises, query, gym, allExercises }) {
            const q = String(query || "").trim().toLowerCase();
            const items = exercises.filter((exercise) => !q || [exercise.name, exerciseEnglishName(exercise.id), exercise.pattern, exercise.muscles.join(" "), exercise.equipment.map(equipmentDisplayText).join(" ")].join(" ").toLowerCase().includes(q));
            return items.length ? `<div class="item-list">${items.map((exercise) => {
                const available = rules.isAvailable(exercise, gym);
                const substitutes = rules.availableSubstitutes(exercise, gym, allExercises).slice(0, 5);
                return `<article class="list-item"><div class="exercise-card-layout exercise-card-layout-text"><div><div class="dual-name">${bilingualNameMarkup(exercise.name, exerciseEnglishName(exercise.id), true)}</div><p class="mini-text">${esc(exercise.cue)}</p><p class="mini-text">注意：${esc(exercise.risk)}</p><div class="tag-row">${tag(available ? "当前场地可做" : "当前场地缺器械", available ? "success" : "warn")}${tag(exercise.pattern)}${exercise.muscles.map((muscle) => tag(muscle)).join("")}</div><div class="equipment-inline" style="margin-top:10px;">${exercise.equipment.map((id) => `<span class="equipment-chip equipment-chip-text"><span>${esc(equipmentLabel(id))}</span><span class="dual-name-english">${esc(equipmentEnglishLabel(id))}</span></span>`).join("")}</div><div class="link-list" style="margin-top:10px;">${exercise.links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`).join("")}</div><p class="mini-text" style="margin-top:10px;">当前场地替代：${substitutes.map((item) => `${item.name} / ${exerciseEnglishName(item.id)}`).join("、") || "暂无"}</p></div></div></article>`;
            }).join("")}</div>` : `<p class="empty">没有匹配的动作。</p>`;
        }
        function exerciseLogList(logs) {
            const recent = (logs || []).slice(0, 6);
            if (!recent.length)
                return `<p class="empty">暂无动作级反馈。</p>`;
            return `<div class="item-list">${recent.map((log) => `
      <article class="list-item">
        <div class="list-item-header">
          <div>
            <div class="dual-name">${bilingualNameMarkup(log.exerciseName, exerciseEnglishName(log.exerciseId), true)}</div>
            <p class="mini-text">${esc(log.createdAt)} · ${esc(log.focus || "未记录训练日")} · 计划 ${esc(log.plannedSets || "-")} 组 / ${esc(log.plannedReps || "-")} · 实际 ${esc(log.actualLoad || "-")} / ${esc(log.actualReps || "-")} · RPE ${esc(log.rpe)}</p>
            <p style="margin-top:8px;">${esc(log.freeText || "无自由反馈")}</p>
            <div class="tag-row">${tag(advicePriorityLabel(log.analysis?.priority, log.analysis?.priorityLabel), advicePriorityType(log.analysis?.priority))}${(log.analysis?.tags || []).map((item) => tag(item.tag, "info")).join("")}</div>
            <p class="mini-text" style="margin-top:8px;">${esc((log.analysis?.recommendations || []).join(" "))}</p>
            ${trainingStatsLine(log)}
            ${log.analysis?.evidence?.length ? `<div class="context-box" style="margin-top:10px;"><div><strong>依据</strong></div>${renderEvidenceList(log.analysis.evidence.slice(0, 5))}</div>` : ""}
          </div>
          <button class="button danger" data-action="delete-exercise-log" data-id="${esc(log.id)}">删除</button>
        </div>
      </article>`).join("")}</div>`;
        }
        function exerciseHistoryFilterOptions({ logs, currentValue }) {
            const options = [];
            const seen = new Set();
            (logs || []).forEach((log) => {
                if (log.exerciseId && !seen.has(log.exerciseId)) {
                    seen.add(log.exerciseId);
                    options.push({ value: log.exerciseId, label: `${log.exerciseName || log.exerciseId} / ${exerciseEnglishName(log.exerciseId)}` });
                }
            });
            return {
                value: options.some((item) => item.value === currentValue) || currentValue === "all" ? currentValue : "all",
                html: [`<option value="all">全部动作</option>`, ...options.map((item) => `<option value="${esc(item.value)}">${esc(item.label)}</option>`)].join("")
            };
        }
        function exerciseHistory({ logs, summary }) {
            if (!(logs || []).length) {
                return {
                    summaryHtml: "",
                    listHtml: `<p class="empty">暂无动作反馈历史。</p>`
                };
            }
            return {
                summaryHtml: `
      <div class="metric-grid">
        <div class="metric-pill"><span>反馈次数</span><strong>${summary.count}</strong></div>
        <div class="metric-pill"><span>平均 RPE</span><strong>${summary.avgRpe}</strong></div>
        <div class="metric-pill"><span>动作质量差</span><strong>${summary.poorCount}</strong></div>
        <div class="metric-pill"><span>疼痛风险</span><strong>${summary.painCount}</strong></div>
      </div>
      <div class="context-box" style="margin-top: 14px;">
        <div><strong>阶段 1 结论：</strong>${esc(summary.stage1Conclusion)}</div>
        <div class="tag-row">${summary.topTags.map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
      </div>
    `,
                listHtml: `<div class="item-list">${logs.map((log) => `
      <article class="list-item">
        <div class="list-item-header">
          <div>
            <div class="dual-name">${bilingualNameMarkup(log.exerciseName, exerciseEnglishName(log.exerciseId), true)}</div>
            <p class="mini-text">${esc(log.createdAt)} · ${esc(log.focus || "未记录训练日")}</p>
            <p class="mini-text">计划：${esc(log.plannedSets || "-")} 组 · ${esc(log.plannedReps || "-")} · ${esc(log.plannedLoad || "-")} · 计划 RPE ${esc(log.plannedRpe || "-")}</p>
            <p class="mini-text">实际：${esc(log.actualLoad || "-")} · ${esc(log.actualReps || "-")} · RPE ${esc(log.rpe)} · 动作质量 ${qualityLabel(log.quality)} · 幅度 ${romLabel(log.rangeOfMotion)}</p>
            <div class="tag-row">
              ${tag(`目标感觉 ${targetFeelLabel(log.targetMuscleFeel)}`)}
              ${tag(`限制因素 ${limiterLabel(log.limitingFactor)}`)}
              ${tag(`左右差 ${sideIssueLabel(log.sideIssue)}`)}
              ${tag(`疼痛 ${log.painScore}/5`, Number(log.painScore) >= 3 ? "warn" : "")}
            </div>
            <p style="margin-top:8px;">${esc(log.freeText || "无自由反馈")}</p>
            <div class="tag-row">${(log.analysis?.tags || []).map((item) => tag(item.tag, "info")).join("")}</div>
            <p class="mini-text" style="margin-top:8px;">${esc((log.analysis?.recommendations || []).join(" "))}</p>
            ${trainingStatsLine(log)}
          </div>
          <button class="button danger" data-action="delete-exercise-log" data-id="${esc(log.id)}">删除</button>
        </div>
      </article>`).join("")}</div>`
            };
        }
        function nutritionList({ logs, profile }) {
            const mealLabel = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐", all_day: "全天" };
            const summaryHtml = !logs.length ? "" : `
          <div class="metric-grid">
            <div class="metric-pill"><span>近期待均热量</span><strong>${numUnit(profile.averages?.calories, "kcal")}</strong></div>
            <div class="metric-pill"><span>近期待均蛋白</span><strong>${numUnit(profile.averages?.protein, "g")}</strong></div>
            <div class="metric-pill"><span>蛋白缺口天数</span><strong>${profile.lowProteinDays || 0}/${profile.count || 0}</strong></div>
            <div class="metric-pill"><span>漏餐天数</span><strong>${profile.missedMealDays || 0}/${profile.count || 0}</strong></div>
          </div>
          <div class="context-box" style="margin-top:14px;">
            <div class="tag-row">${(profile.topTags || []).map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
            <div>${esc((profile.advice || []).join(" "))}</div>
          </div>
        `;
            if (!logs.length) {
                return {
                    summaryHtml,
                    listHtml: `<p class="empty">暂无饮食记录。输入自然语言饮食描述后，这里会显示解析结果、估算和趋势。</p>`
                };
            }
            const recentLogs = logs.slice(0, 12);
            return {
                summaryHtml,
                listHtml: `<div class="item-list">${recentLogs.map((log) => `
      <article class="list-item">
        <div class="list-item-header">
          <div>
            <h3>${esc(log.date)} 饮食记录</h3>
            <p class="mini-text">置信度：${esc(log.analysis.confidence)} · ${esc(log.rawText)}</p>
            <div class="metric-grid" style="margin-top:10px;">
              <div class="metric-pill"><span>热量估算</span><strong>${numUnit(log.analysis.estimates?.total?.calories, "kcal")}</strong></div>
              <div class="metric-pill"><span>蛋白估算</span><strong>${numUnit(log.analysis.estimates?.total?.protein, "g")}</strong></div>
              <div class="metric-pill"><span>碳水估算</span><strong>${numUnit(log.analysis.estimates?.total?.carbs, "g")}</strong></div>
              <div class="metric-pill"><span>脂肪估算</span><strong>${numUnit(log.analysis.estimates?.total?.fat, "g")}</strong></div>
            </div>
            <div class="tag-row">${tag(advicePriorityLabel(log.analysis.priority, log.analysis.priorityLabel), advicePriorityType(log.analysis.priority))}${(log.analysis.tags || []).map((item) => tag(item, "info")).join("")}</div>
            ${(log.analysis.missingInfo || []).length ? `<p class="mini-text" style="margin-top:8px;">补充信息：${esc(log.analysis.missingInfo.join(" "))}</p>` : ""}
            <div style="margin-top:10px;">
              ${(log.analysis.meals || []).map((meal) => `
                <div class="compact-list" style="margin-top:8px;">
                  <strong>${esc(mealLabel[meal.meal] || meal.meal)}</strong>
                  <div>${esc(meal.text)}</div>
                  ${(meal.items || []).length ? `<div class="mini-text">食物项：${esc(meal.items.map((item) => `${item.label}${item.quantity ? ` ${item.quantity}${item.unit}` : ""}`).join("、"))}</div>` : ""}
                  <div class="mini-text">估算：${numUnit(meal.estimates?.calories, "kcal")} · 蛋白 ${numUnit(meal.estimates?.protein, "g")} · 碳水 ${numUnit(meal.estimates?.carbs, "g")} · 脂肪 ${numUnit(meal.estimates?.fat, "g")}</div>
                  <div class="tag-row">${(meal.tags || []).map((item) => tag(item)).join("")}</div>
                </div>
              `).join("")}
            </div>
            <p class="mini-text" style="margin-top:10px;">${esc((log.analysis.recommendations || []).join(" "))}</p>
            ${log.analysis.evidence?.length ? `<div class="context-box" style="margin-top:10px;"><div><strong>依据</strong></div>${renderEvidenceList(log.analysis.evidence.slice(0, 6))}</div>` : ""}
          </div>
          <button class="button danger" data-action="delete-nutrition-log" data-id="${esc(log.id)}">删除</button>
        </div>
      </article>`).join("")}</div>`
            };
        }
        function profiles({ exerciseProfiles, nutritionProfile }) {
            const exerciseHtml = exerciseProfiles.length ? `<div class="item-list">${exerciseProfiles.map((profile) => `
        <article class="list-item">
          <div class="list-item-header">
            <div>
              <h3>${esc(profile.exerciseName)}</h3>
              <p class="mini-text">反馈 ${profile.count} 次 · 动作质量差 ${profile.poorQualityCount} 次 · 疼痛风险 ${profile.painCount} 次</p>
              <div class="tag-row">${profile.topTags.map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
              <p class="mini-text" style="margin-top:8px;">${esc(profile.advice.join(" "))}</p>
            </div>
          </div>
        </article>
      `).join("")}</div>` : `<p class="empty">动作级反馈还不够多，继续记录后这里会形成长期画像。</p>`;
            const nutritionHtml = nutritionProfile.count ? `
        <div class="item-list">
          <article class="list-item">
            <div class="list-item-header">
              <div>
                <h3>近期饮食模式</h3>
                <p class="mini-text">已记录 ${nutritionProfile.count} 天饮食 · 近期待均蛋白 ${numUnit(nutritionProfile.averages?.protein, "g")} · 近期待均热量 ${numUnit(nutritionProfile.averages?.calories, "kcal")}</p>
                <div class="tag-row">${nutritionProfile.topTags.map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
                <p class="mini-text" style="margin-top:8px;">${esc(nutritionProfile.advice.join(" "))}</p>
                ${nutritionProfile.trend ? `<p class="mini-text" style="margin-top:8px;">最近 4 次相比前 4 次：蛋白 ${deltaLabel(nutritionProfile.trend.proteinDelta, "g")} · 热量 ${deltaLabel(nutritionProfile.trend.caloriesDelta, "kcal")} · 纤维 ${deltaLabel(nutritionProfile.trend.fiberDelta, "g")}</p>` : ""}
              </div>
            </div>
          </article>
        </div>
      ` : `<p class="empty">饮食记录还不够多，继续记录后这里会形成长期画像。</p>`;
            return { exerciseHtml, nutritionHtml };
        }
        function coachAdvice(advice) {
            const sortedAdvice = (advice || []).slice().sort((a, b) => adviceSortScore(b.priority) - adviceSortScore(a.priority));
            return sortedAdvice.length ? `<div class="item-list">${sortedAdvice.map((item) => `<article class="list-item"><div class="list-item-header"><div><h3>${esc(item.title)}</h3><p class="mini-text">${esc(item.createdAt)} · ${esc(item.status === "applied" ? "已应用" : "已记录")}</p><div class="tag-row" style="margin-top:8px;">${tag(advicePriorityLabel(item.priority, item.priorityLabel), advicePriorityType(item.priority))}${(item.tags || []).map((entry) => tag(entry, "info")).join("")}</div><p style="margin-top:8px;">${esc(item.body)}</p>${item.evidence?.length ? `<div class="context-box" style="margin-top:10px;"><div><strong>依据</strong></div>${renderEvidenceList(item.evidence)}</div>` : ""}${renderRecommendationItems(item.recommendationItems)}</div><button class="button danger" data-action="delete-advice" data-id="${esc(item.id)}">删除</button></div></article>`).join("")}</div>` : `<p class="empty">暂无建议。完成训练或饮食记录后，这里会生成计划和恢复建议。</p>`;
        }
        function revisionsList(revisions) {
            return revisions.length ? `<div class="item-list">${revisions.map((item) => `<article class="list-item"><div class="list-item-header"><div><h3>${esc(item.summary)}</h3><p class="mini-text">${esc(item.createdAt)} · ${esc(item.status === "applied" ? "已应用" : "待确认")}</p><p style="margin-top:8px;">${esc(item.reason)}</p><div class="tag-row">${(item.tags || []).map((entry) => tag(entry)).join("")}</div></div><div class="item-actions">${item.status === "pending" ? `<button class="button primary" data-action="apply-revision" data-id="${esc(item.id)}">应用</button>` : tag("已应用", "success")}</div></div></article>`).join("")}</div>` : `<p class="empty">暂无计划调整记录。</p>`;
        }
        function weeklyReviewSummary(review) {
            const stats = review.stats || {};
            return `
      <div class="metric-grid">
        <div class="metric-pill"><span>训练次数</span><strong>${stats.sessionCount || 0}</strong></div>
        <div class="metric-pill"><span>平均完成度</span><strong>${Number.isFinite(stats.avgCompletion) ? `${stats.avgCompletion}%` : "-"}</strong></div>
        <div class="metric-pill"><span>平均 RPE</span><strong>${Number.isFinite(stats.avgRpe) ? stats.avgRpe : "-"}</strong></div>
        <div class="metric-pill"><span>平均疲劳</span><strong>${Number.isFinite(stats.avgFatigue) ? `${stats.avgFatigue}/5` : "-"}</strong></div>
        <div class="metric-pill"><span>蛋白缺口天数</span><strong>${stats.lowProteinDays || 0}</strong></div>
        <div class="metric-pill"><span>漏正餐天数</span><strong>${stats.missedMealDays || 0}</strong></div>
        <div class="metric-pill"><span>近 30 天体重</span><strong>${deltaLabel(stats.weightDelta30, "kg")}</strong></div>
      </div>
      <div class="context-box" style="margin-top:14px;">
        <div><strong>本周重点</strong></div>
        <ul class="plain-list">${(review.highlights || []).map((item) => `<li>${esc(item)}</li>`).join("") || "<li>最近 7 天的数据还不够，先继续记录。</li>"}</ul>
      </div>
      <div class="context-box" style="margin-top:14px;">
        <div><strong>下周优先动作</strong></div>
        <ul class="plain-list">${(review.nextActions || []).map((item) => `<li>${esc(item)}</li>`).join("") || "<li>当前没有额外的优先处理项。</li>"}</ul>
      </div>
    `;
        }
        function weeklyReviewCandidates({ candidates, findMatchingRevision }) {
            if (!candidates.length) {
                return `<p class="empty">当前还没有足够明确的周级计划调整候选。继续积累训练、饮食和身体指标后，这里会给出更稳的修改建议。</p>`;
            }
            return `
      <div class="section-heading" style="margin-bottom: 12px;">
        <div>
          <h3>调整候选</h3>
          <p>这些建议还不会静默改计划，需要你确认后才会写入。</p>
        </div>
      </div>
      <div class="item-list">${candidates.map((candidate, index) => {
                const matched = findMatchingRevision(candidate);
                return `
          <article class="list-item">
            <div class="list-item-header">
              <div>
                <h3>${esc(candidate.summary)}</h3>
                <p style="margin-top:8px;">${esc(candidate.reason)}</p>
                <div class="tag-row">${(candidate.tags || []).map((item) => tag(item)).join("")}</div>
              </div>
              <div class="item-actions">
                ${matched?.status === "applied"
                    ? tag("已应用", "success")
                    : matched?.status === "pending"
                        ? `<button class="button primary" data-action="apply-revision" data-id="${esc(matched.id)}">应用待确认项</button>`
                        : `<button class="button primary" data-action="apply-review-candidate" data-index="${index}">应用到计划</button>`}
              </div>
            </div>
          </article>
        `;
            }).join("")}</div>
    `;
        }
        function nutritionReminders(reminders) {
            return `
      <div class="context-box">
        <div><strong>饮食前提醒</strong></div>
        ${reminders.length ? renderRecommendationItems(reminders.slice(0, 4)) : `<div class="mini-text" style="margin-top:8px;">当前没有额外的饮食前提醒，按正常方式记录即可。</div>`}
      </div>
    `;
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
            trainingStatsLine,
            todayAdvice,
            trainingReminders,
            todayPlanOptions,
            todayWorkoutEmpty,
            planRow,
            exerciseList,
            exerciseLogList,
            exerciseHistoryFilterOptions,
            exerciseHistory,
            nutritionList,
            profiles,
            coachAdvice,
            revisionsList,
            weeklyReviewSummary,
            weeklyReviewCandidates,
            nutritionReminders
        };
    }
    window.FitnessApp = window.FitnessApp || {};
    window.FitnessApp.ViewRenderers = {
        create
    };
})();
