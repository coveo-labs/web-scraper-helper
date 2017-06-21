// background.js
(function () {

	var connections = {}, theport = null;
	chrome.runtime.onConnect.addListener(function (port) {
		// Listen to messages sent from the DevTools page
		port.onMessage.addListener(function (message, sender, sendResponse) {
			// The original connection event doesn't include the tab ID of the
			// DevTools page, so we need to send it explicitly.
			if (message.name === "panel-init") {
				theport = port;
				return;
			}
		});
	});


	// All the communication
	chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

		if (message && message.tabId && theport != null) {
			chrome.tabs.sendMessage(message.tabId, message);
		}
		else {
			try{
				theport.postMessage(message);
			}
			catch(err){
				//I don't know why it keeps giving an error
				//Error in event handler for runtime.onMessage: TypeError: Cannot read property 'postMessage' of null
			}
		}
	});
})();
