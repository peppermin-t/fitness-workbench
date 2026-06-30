(function () {
    "use strict";
    function downloadText(name, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
    }
    function readInputFileText(event, encoding = "utf-8") {
        const file = event?.target?.files?.[0];
        if (!file)
            return Promise.resolve(null);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("File read failed."));
            reader.readAsText(file, encoding);
        });
    }
    function clearInput(event) {
        if (event?.target)
            event.target.value = "";
    }
    function confirmResetData() {
        return confirm("确认恢复初始数据？当前本地记录会被覆盖。");
    }
    window.FitnessApp = window.FitnessApp || {};
    window.FitnessApp.BrowserFileIO = {
        downloadText,
        readInputFileText,
        clearInput,
        confirmResetData
    };
})();
