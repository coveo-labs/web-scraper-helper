// background.js
/* global chrome */

let openCount = 0;
const connections = {};

chrome.runtime.onConnect.addListener(function (port) {

  if (openCount == 0) {
    console.log("DevTools window opening.");
  }
  openCount++;

  const extensionListener = function (message/*, sender, sendResponse*/) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (message.name == "init") {
      connections[message.tabId] = port;
      return;
    }

    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message, null, function (response) {
        console.log('RESPONSE: ', response);
      });
    }
    // other message handling
  };

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function (port) {
    port.onMessage.removeListener(extensionListener);

    const tabs = Object.keys(connections);
    for (let i = 0, len = tabs.length; i < len; i++) {
      if (connections[tabs[i]] == port) {
        delete connections[tabs[i]];
        break;
      }
    }

    openCount--;
    if (openCount === 0) {
      console.log("Last DevTools window closing.");
    }
  });
});

// Receive message from content script and relay to the devTools page for the current tab
chrome.runtime.onMessage.addListener(function (request, sender/*, sendResponse*/) {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    const tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    }
  }
  return true;
});

// for "Error: Could not establish connection. Receiving end does not exist."
// https://stackoverflow.com/questions/10994324/chrome-extension-content-script-re-injection-after-upgrade-or-install
chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});
