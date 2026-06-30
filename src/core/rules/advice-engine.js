// @ts-nocheck
(function () {
    "use strict";
    function uniqueStrings(list) {
        return Array.from(new Set((list || []).filter(Boolean)));
    }
    function buildAdviceEntry(uid, nowLabel, title, items, tags, evidence = []) {
        const sorted = sortRecommendationItems(items);
        return {
            id: uid("advice"),
            createdAt: nowLabel(),
            title,
            body: sorted.map((item) => item.detail).join(" "),
            tags: uniqueStrings([...(tags || []), ...sorted.flatMap((item) => item.tags || [])]),
            priority: highestPriority(sorted),
            priorityLabel: priorityLabel(highestPriority(sorted)),
            evidence: uniqueStrings([...(evidence || []), ...sorted.flatMap((item) => item.evidence || [])]).slice(0, 8),
            recommendationItems: sorted
        };
    }
    function recommendationItem(type, priority, title, detail, evidence = [], tags = []) {
        return {
            type,
            priority,
            title,
            detail,
            evidence: uniqueStrings(evidence),
            tags: uniqueStrings(tags)
        };
    }
    function sortRecommendationItems(items) {
        return (items || []).slice().sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority) || String(a.title || "").localeCompare(String(b.title || "")));
    }
    function highestPriority(items) {
        return sortRecommendationItems(items)[0]?.priority || "low";
    }
    function priorityScore(priority) {
        return { high: 300, medium: 200, low: 100, info: 50 }[priority] || 0;
    }
    function priorityLabel(priority) {
        return { high: "高优先级", medium: "中优先级", low: "低优先级", info: "观察" }[priority] || "观察";
    }
    window.FitnessCore = window.FitnessCore || {};
    window.FitnessCore.AdviceEngine = {
        recommendationItem,
        buildAdviceEntry,
        sortRecommendationItems,
        highestPriority,
        priorityScore,
        priorityLabel,
        uniqueStrings
    };
})();
