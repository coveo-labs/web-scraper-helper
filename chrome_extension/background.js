
// Receive message from content script and relay to the devTools page for the current tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages from content scripts should have sender.tab set
  if (sender?.tab) {
    sendResponse(request);
    return true;
  }
});

// for "Error: Could not establish connection. Receiving end does not exist."
// https://stackoverflow.com/questions/10994324/chrome-extension-content-script-re-injection-after-upgrade-or-install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    for (const cs of chrome.runtime.getManifest().content_scripts) {
      for (const tab of await chrome.tabs.query({ url: cs.matches })) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: cs.js,
        });
      }
    }
  } catch (e) {
    console.error('onInstalled.addListener', e);
  }
});

