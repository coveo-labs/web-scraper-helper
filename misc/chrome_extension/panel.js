(function () {

	//TEST JSON VALUE
	var json = [{
		"for": {
			"urls": [
				".*"
			]
		},
		"exclude": [
			{
				"type": "CSS",
				"path": "div.headerandfooter, div.product-bloc-recherche, div.product-espot-712, div.bloc-notice"
			},
			{
				"type": "CSS",
				"path": "div.product-page-right"
			},
			{
				"type": "CSS",
				"path": "div#header-usability"
			}
		],
		"metadata": {
			"format": {
				"type": "XPATH",
				"path": "//div[@id='details']/ul/li/div[@class='left']/span[contains(text(), 'Format')]/../../div[@class='right']/text()[normalize-space()]"
			},
			"pictureuri": {
				"type": "XPATH",
				"path": "//div[@class='product-description-image']//span[@class='image']/img/@src"
			},
			"producteur": {
				"type": "XPATH",
				"path": "//div[@id='details']/ul/li/div[@class='left']/span[contains(text(), 'Producteur')]/../../div[@class='right']/text()[normalize-space()]"
			},
			"appellation": {
				"type": "XPATH",
				"path": "//div[@id='details']/ul/li/div[@class='left']/span[contains(text(), 'Appellation')]/../../div[@class='right']/text()[normalize-space()]"
			},
			"degrealcool": {
				"type": "XPATH",
				"path": "//div[@id='details']/ul/li/div[@class='left']/span[contains(text(), 'alcool')]/../../div[@class='right']/text()[normalize-space()]"
			},
			"pays": {
				"type": "XPATH",
				"path": "//div[@id='details']/ul/li/div[@class='left']/span[contains(text(), 'Pays')]/../../div[@class='right']/text()[normalize-space()]"
			}
		}
	}]

	json = JSON.stringify(json, null, 2);

	//Add the string to the log
	function log(s) {
		document.getElementById('log').innerText += (s + '\n' + new Date() + '\n\n');
	}

	//Sends the current JSON in the textarea to the parser
	function fetch() {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, json: document.getElementById("json-config").value });
	}

	function pretty(){
		let textArea = document.getElementById("json-config");
		let uglyJson = JSON.parse(textArea.value);
		let prettyJson = JSON.stringify(uglyJson, null, 2);
		textArea.value = prettyJson;
	}

	//The init function
	function init() {

		//Adds the fetch function to the button
		document.getElementById('fetch').onclick = fetch;
		document.getElementById('pretty').onclick = pretty;

		//Connects to the messeger
		var backgroundPageConnection = chrome.runtime.connect({
			name: 'panel'
		});

		//Sets the textarea to the default json
		document.getElementById('json-config').value = json;

		//The onMessage function
		backgroundPageConnection.onMessage.addListener(function (message, sender, sendResponse) {

			//Clear the past errors, logs and resets the field table
			let errorElement = document.getElementById('error');
			errorElement.innerHTML = "";
			document.getElementById('log').innerText = "";
			document.getElementById('resultTable').innerHTML = "<tr><th>Field</th><th>Value(s)</th></tr>";

			//Turns the message into readable JSON
			message['return'] = JSON.parse(message['return']);

			//Parses through all the received messages
			message['return'].forEach(function (element) {
				try {
					console.log(element);
					//If the message received was an error
					if (element['type'] == "__error") {
						errorElement.innerHTML += element['value'] + "<br>";
					}
					//Else it adds it to the field table
					else if (element['type'] != "__error") {
						element['value'] = element['value'].join("<br>");
						document.getElementById("resultTable").innerHTML += "<tr><td>" + element['type'] + "</td><td>" + element['value'] + "</td></tr>";
					}
				} catch (err) {
					//If an error occurs, it goes in the log
					log(err + "\n" + JSON.stringify(element, null, 2));
				}
			}, this);
		});

		// Send a message to background page so that the background page can associate panel to the current host page
		backgroundPageConnection.postMessage({
			name: 'panel-init',
			tabId: chrome.devtools.inspectedWindow.tabId
		});
	}

	//Run the init function
	setTimeout(init, 1);

})();