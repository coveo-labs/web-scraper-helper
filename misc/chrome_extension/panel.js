(function () {

	//TEST JSON VALUE
	var json = [{
		"for": {
			"urls": [
				".*"
			]
		},
		"exclude": [
		],
		"metadata": {
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

	//Formats the JSOn
	function pretty() {
		let textArea = document.getElementById("json-config");
		let uglyJson = JSON.parse(textArea.value);
		let prettyJson = JSON.stringify(uglyJson, null, 2);
		textArea.value = prettyJson;
	}

	//Adds the query to the JSON
	function addToJson() {
		//Get the vars from the page
		let e = document.getElementById("queryToAddMeta");
		let metaType = e.options[e.selectedIndex].value;
		e = document.getElementById("queryToAddType");
		let queryType = e.options[e.selectedIndex].value;
		let query = document.getElementById("queryToAdd").value;
		let field = document.getElementById("fieldToAdd").value;

		//Get the current json
		let textArea = document.getElementById("json-config");
		let currentJson = JSON.parse(textArea.value);

		//json to add
		let toAdd = {};
		toAdd['type'] = queryType;
		toAdd['path'] = query;

		//Add to current json
		if (metaType == "exclude") {
			currentJson[0]["exclude"].push(toAdd);
		}
		else if (metaType == "metadata") {
			currentJson[0]['metadata'][field] = toAdd;
		}

		//Add back to page
		currentJson = JSON.stringify(currentJson, null, 2);
		textArea.value = currentJson;
	}

	//Hides or shows the field option
	function toggleField() {
		let e = document.getElementById("queryToAddMeta");
		let fieldElement = document.getElementById('fieldToAdd');
		if (e.value == "metadata") {
			fieldElement.style.display = 'inline';
		}
		else {
			fieldElement.style.display = 'none';
		}
	}

	//Resets the value table back to default
	function resetValueTable() {
		document.getElementById('resultTable').innerHTML = "<tr><th>Field</th><th>Value(s)</th></tr>";
	}

	function mouseAdd() {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, mouse: "1" });
	}

	//The init function
	function init() {

		//Adds the fetch function to the button
		document.getElementById('fetch').onclick = fetch;
		document.getElementById('pretty').onclick = pretty;
		document.getElementById('queryToAddButton').onclick = addToJson;
		document.getElementById("queryToAddMeta").onchange = toggleField;
		document.getElementById('mouseAdd').onclick = mouseAdd;

		//Hides or shows the field by default
		toggleField();

		//Creates the value table
		resetValueTable();

		//Connects to the messeger
		var backgroundPageConnection = chrome.runtime.connect({
			name: 'panel'
		});

		//Sets the textarea to the default json
		document.getElementById('json-config').value = json;

		//The onMessage function
		backgroundPageConnection.onMessage.addListener(function (message, sender, sendResponse) {

			if (message.return) {

				//Clear the past errors, logs and resets the field table
				let errorElement = document.getElementById('error');
				errorElement.innerHTML = "";
				document.getElementById('log').innerText = "";
				resetValueTable();

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
							//Convert to list if greater than one
							if (element['value'].length > 1) {
								element['value'] = "<ol><li>" + element['value'].join('</li><li>') + "</li></ol>";
							}
							document.getElementById("resultTable").innerHTML += "<tr><td>" + element['type'] + "</td><td>" + element['value'] + "</td></tr>";
						}
					} catch (err) {
						//If an error occurs, it goes in the log
						log(err + "\n" + JSON.stringify(element, null, 2));
					}
				}, this);
			}

			if(message.mouse){
				document.getElementById('queryToAdd').value = message.mouse + ((document.getElementById("addText").checked) ? "/text()" : "");
				document.getElementById('queryToAddType').selectedIndex = 0;
			}

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