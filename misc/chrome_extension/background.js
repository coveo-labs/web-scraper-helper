// background.js
(function () {

	var connections = {}, theport = null;
	chrome.runtime.onConnect.addListener(function (port) {
		console.log('add listener');
		var extensionListener = function (message, sender, sendResponse) {
			console.log('message: ', message);
			// The original connection event doesn't include the tab ID of the
			// DevTools page, so we need to send it explicitly.
			if (message.name === "panel-init") {
				theport = port;
				return;
			}
		};

		// Listen to messages sent from the DevTools page
		port.onMessage.addListener(extensionListener);
	});


	// All the communication
	chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

		if (message && message.tabId) {
			console.log("Message sent to " + message.tabId + "\nContent: ");
			console.log(message);
			chrome.tabs.sendMessage(message.tabId, message);
		}
		else {
			console.log("Content: ");
			console.log(message);
			theport.postMessage(message);
		}
	});

	console.log('background-init');
})();