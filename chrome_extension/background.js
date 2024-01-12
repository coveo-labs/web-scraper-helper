
// Receive message from content script and relay to the devTools page for the current tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages from content scripts should have sender.tab set
  if (sender?.tab) {
    sendResponse({ tabId: sender.tab.id, ...request });
    return true;
  }
});
