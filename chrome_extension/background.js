// background.js

let openCount = 0;
const connections = {};

chrome.runtime.onConnect.addListener(function (port) {

  if (openCount == 0) {
    console.log("DevTools window opening.");
  }
  openCount++;

  const extensionListener = function (message, sender, sendResponse) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (message.name == "init") {
      connections[message.tabId] = port;
      return;
    }

    const tabId = message.tabId;
    console.log('b: ', tabId, message);
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

    var tabs = Object.keys(connections);
    for (var i = 0, len = tabs.length; i < len; i++) {
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
chrome.runtime.onMessage.addListener(function (request, sender) {
  // Messages from content scripts should have sender.tab set
  if (sender?.tab) {
    const tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    }
  }
  return true;
});
