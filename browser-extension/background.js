chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(tab.url || "")) return;
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["overlay.js"] });
});
