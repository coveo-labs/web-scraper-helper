(function () {

	var successTimeout;

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

	function logBackground(object) {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, log: object });
	}

	//Sends the current JSON in the textarea to the parser
	function fetch() {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, json: document.getElementById('json-config').value });
	}

	//Formats the JSON
	function pretty() {
		let textArea = document.getElementById('json-config');
		let uglyJson = JSON.parse(textArea.value);
		let prettyJson = JSON.stringify(uglyJson, null, 2);
		textArea.value = prettyJson;
	}

	//Adds the query to the JSON
	function addToJson() {
		//Get the vars from the page
		let e = document.getElementById('queryToAddMeta');
		let metaType = e.options[e.selectedIndex].value;
		e = document.getElementById('queryToAddType');
		let queryType = e.options[e.selectedIndex].value;
		let query = document.getElementById('queryToAdd').value;
		let field = document.getElementById('fieldToAdd').value;

		//Get the current json
		let textArea = document.getElementById('json-config');
		let currentJson = JSON.parse(textArea.value);

		//json to add
		let toAdd = {};
		toAdd['type'] = queryType;
		toAdd['path'] = query;

		//Add to current json
		if (metaType == 'exclude') {
			currentJson[0]['exclude'].push(toAdd);
		}
		else if (metaType == 'metadata') {
			currentJson[0]['metadata'][field] = toAdd;
		}

		//Add back to page
		currentJson = JSON.stringify(currentJson, null, 2);
		textArea.value = currentJson;
		buildVisualFromText();
	}

	//Hides or shows the field option
	function toggleField() {
		let e = document.getElementById('queryToAddMeta');
		let fieldElement = document.getElementById('fieldToAdd');
		if (e.value == 'metadata') {
			fieldElement.style.display = 'inline';
		}
		else {
			fieldElement.style.display = 'none';
		}
	}

	//Resets the value table back to default
	function resetValueTable() {
		document.getElementById('resultTable').innerHTML = '<tr><th>Field</th><th>Value(s)</th></tr>';
	}

	//Turn on the mouseover on the webpage
	//When the user will click on something, it will return a xPath
	function mouseAdd() {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, mouse: '1' });
	}

	//Inits the storage menu
	function initStorageSelect(callback) {
		try {
			let select = document.getElementById('storage');
			select.innerHTML = '<option selected disabled>Select a file to work on</option><option disabled>------------------------------</option>';
			storageValues(function (results) {
				results.forEach(function (element) {

					select.innerHTML += '<option value="' + element + '">' + element + '</option>"';
				}, this);
				select.innerHTML += '<option value="__create">Create new file...</option>';
				if (callback) {
					callback();
				}
			});

		}
		catch (err) {
			alert(err);
		}
	}

	function storageValues(callback) {
		chrome.storage.local.get('__jsons', function (result) {
			if (!result.__jsons) {
				result.__jsons = [];
			}

			callback(result.__jsons);

		});

		return [];
	}

	function storageValueExists(value, callback) {
		if (value) {
			storageValues(function (results) {
				callback(results.includes(value));
			});
		}
	}

	function updateStorage() {
		let e = document.getElementById('storage');
		let errorElement = document.getElementById('storageError');
		let value = e.options[e.selectedIndex].value;
		errorElement.innerHTML = '';

		storageValues(function (result) {

			if (value == '__create') {
				let newJsonName = window.prompt('New json name');
				if (newJsonName && !result.includes(newJsonName) && (newJsonName != '' && newJsonName != '__json' && newJsonName != '__create' && newJsonName != 'null')) {
					result.push(newJsonName);
					let resultJson = {};
					resultJson['__jsons'] = result;
					chrome.storage.local.set(resultJson, function () {
						let newJson = {};
						newJson[newJsonName] = json;
						chrome.storage.local.set(newJson);
						initStorageSelect(function () {
							e.selectedIndex = e.options.length - 2;
							storageLoad();
						});
					});
				}
				else {
					errorElement.innerHTML += 'Naming error<br>';
					e.selectedIndex = 0;
				}
			}
			else {
				storageLoad();
			}
		});
	}

	function storageSelectedValue() {
		let e = document.getElementById('storage');
		return e.options[e.selectedIndex].value;
	}

	function storageLoad() {
		let currentValue = storageSelectedValue();
		let textArea = document.getElementById('json-config');
		//If current value is present
		storageValueExists(currentValue, function (exists) {
			if (exists) {
				chrome.storage.local.get(currentValue, function (result) {
					textArea.value = result[currentValue];
					buildVisualFromText();
				});
			}
			else {
				textArea.value = 'Create/Load a file...';
				buildVisualFromText();
			}
		});
	}

	function storageSave() {
		let currentValue = storageSelectedValue();
		//If current value is present
		storageValueExists(currentValue, function (exists) {
			if (exists) {

				let textArea = document.getElementById('json-config');
				let jsonToAdd = {};
				jsonToAdd[currentValue] = textArea.value;
				chrome.storage.local.set(jsonToAdd);
				displaySuccess("Save successful");
			}
		});
	}

	function storageDelete() {
		let currentValue = storageSelectedValue();
		//If current value is present
		storageValueExists(currentValue, function (exists) {
			if (exists) {
				if (confirm('Are you sure you want to delete: ' + currentValue)) {
					storageValues(function (jsons) {
						var index = jsons.indexOf(currentValue);
						if (index > -1) {
							jsons.splice(index, 1);
						}
						jsonToAdd = {}
						jsonToAdd['__jsons'] = jsons;
						chrome.storage.local.set(jsonToAdd, function () {
							initStorageSelect();
						});
						chrome.storage.local.remove(currentValue, function () {
							storageLoad();
						});
					});
				}
			}
		});
	}

	function storageReset() {
		chrome.storage.local.clear(function () {
			initStorageSelect();
		});
	}

	function displaySuccess(value) {
		let e = document.getElementById('storageSuccess');
		e.innerHTML = value;
		removeSuccess();
	}

	function removeSuccess() {
		setTimeout(function () {
			let e = document.getElementById('storageSuccess');
			e.innerHTML = '';
		}, 2000)
	}

	function changeTab() {
		try {

			let toShow = this.getAttribute('data-show');

			if (document.getElementById(toShow).style.display != 'block') {
				//Tabs switching from text to visual editor
				if (toShow == 'editor') {
					buildVisualFromText();
				}
			}

			let tabs = [].slice.call(document.getElementsByClassName('tab'));
			tabs.forEach(function (element) {
				element.style.display = 'none';
			}, this);
			document.getElementById(toShow).style.display = 'block';
		}
		catch (err) {
			alert(err);
		}
	}

	function addExclude(query, type, textToAdd) {
		try {


			let tableElement = document.getElementById('exclude-table');
			let row = tableElement.insertRow();
			let queryElement = row.insertCell(0);
			let selectElement = row.insertCell(1);
			let deleteElement = row.insertCell(2);

			let queryToAdd = '';
			if (query && typeof query === 'string') {
				queryToAdd = query;
			}

			let typeToAdd = 0;

			if (typeof type == 'string') {
				if (type == 'CSS') {
					typeToAdd = 1;
				}
			}

			queryElement.innerHTML = '<span><input type="text" placeholder="Query" value="' + queryToAdd + '" data-row="' + row.rowIndex + '"></span>';
			queryElement.classList.add('exclude-query');
			queryElement.childNodes[0].childNodes[0].oninput = excludeQueryOninput;
			selectElement.innerHTML = '<select data-row="' + row.rowIndex + '"> <option value="XPATH">XPATH</option> <option value="CSS">CSS</option> </select>';
			selectElement.childNodes[0].selectedIndex = typeToAdd;
			selectElement.childNodes[0].onchange = excludeTypeOnChange;
			deleteElement.innerHTML = '<button>-</button>';
			deleteElement.onclick = function () { removeExclude(row.rowIndex); };

			if (textToAdd == undefined) {
				let jsonToAdd = {}
				jsonToAdd['type'] = (typeToAdd == 1) ? 'CSS' : 'XPATH';
				jsonToAdd['path'] = (typeof query === 'string') ? query : '';
				modifyExclude(true, jsonToAdd);
			}

		}
		catch (err) {
			alert(err);
		}
	}

	function modifyExclude(row, data) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		if (row === true) {
			json[0]['exclude'].push(data);
		}
		else {
			json[0]['exclude'][row] = data;
		}
		textAreaElement.value = JSON.stringify(json, null, 2);
	}

	function removeExclude(row) {
		let tableElement = document.getElementById('exclude-table');
		let textAreaElement = document.getElementById('json-config');

		if (typeof row === 'string') {
			row = parseInt(row);
		}

		if (typeof row === 'number') {
			tableElement.deleteRow(row);
			let currentValue = textAreaElement.value;
			let json = JSON.parse(currentValue);
			json[0]['exclude'].splice(row, 1);
			textAreaElement.value = JSON.stringify(json, null, 2);
		}

	}

	function getExclude(row) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		return json[0]['exclude'][row];
	}

	function addMetadata(field, query, type, addToText) {
		let tableElement = document.getElementById('metadata-table');
		let row = tableElement.insertRow();
		let fieldElement = row.insertCell(0);
		let queryElement = row.insertCell(1);
		let selectElement = row.insertCell(2);
		let deleteElement = row.insertCell(3);

		let queryToAdd = '';
		if (query && typeof query === 'string') {
			queryToAdd = query;
		}

		let fieldToAdd = '';
		if (field && typeof field === 'string') {
			fieldToAdd = field;
		}

		let typeToAdd = 0;

		if (typeof type == 'string') {
			if (type == 'CSS') {
				typeToAdd = 1;
			}
		}

		row.setAttribute("data-field", fieldToAdd);
		fieldElement.innerHTML = '<span><input type="text" placeholder="Field" value="' + fieldToAdd + '"></span>';
		fieldElement.classList.add("metadata-query");
		fieldElement.childNodes[0].childNodes[0].oninput = metadataFieldOnInput;
		queryElement.innerHTML = '<span><input type="text" placeholder="Query" value="' + queryToAdd + '"></span>';
		queryElement.classList.add("metadata-query");
		queryElement.childNodes[0].childNodes[0].oninput = metadataQueryOnInput;
		selectElement.innerHTML = '<select data-field="' + fieldToAdd + '"> <option value="XPATH">XPATH</option> <option value="CSS">CSS</option> </select>';
		selectElement.childNodes[0].selectedIndex = typeToAdd;
		selectElement.childNodes[0].onchange = metadataTypeOnChange;
		deleteElement.innerHTML = '<button>-</button>';
		deleteElement.onclick = function () { removeMetadata(row.rowIndex, fieldToAdd); };

		if (addToText == undefined) {
			let data = {
				type: (typeToAdd == 1) ? 'CSS' : 'XPATH',
				path: (typeof query === 'string') ? query : ''
			};
			modifyMetaData(fieldToAdd, fieldToAdd, data);
		}
	}

	function modifyMetaData(field, oldField, data) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		delete json[0]['metadata'][oldField];
		json[0]['metadata'][field] = data;
		logBackground(field + " | " + oldField);
		textAreaElement.value = JSON.stringify(json, null, 2);
	}

	function removeMetadata(row, field) {
		let tableElement = document.getElementById('metadata-table');
		let textAreaElement = document.getElementById('json-config');

		row = parseInt(row);

		if (typeof row === 'number') {
			tableElement.deleteRow(row);
			let currentValue = textAreaElement.value;
			let json = JSON.parse(currentValue);
			delete json[0]['metadata'][field];
			textAreaElement.value = JSON.stringify(json, null, 2);
		}

	}

	function getMetadata(field) {
		if(field == null){
			field = '';
		}
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		return json[0]['metadata'][field];
	}

	function buildVisualFromText() {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let editorElement = document.getElementById('editor');

		if (currentValue == 'Create/Load a file...') {
			editorElement.innerHTML = 'Create/Load a file...';
		}
		else {
			editorElement.innerHTML = '<p>Exclude</p> <table id="exclude-table"> </table> <button id="add-exclude">+</button> <p>Metadata</p> <table id="metadata-table"> </table> <button id="add-metadata">+</button>';
			document.getElementById('add-exclude').onclick = addExclude;
			document.getElementById('add-metadata').onclick = addMetadata;

			let json = JSON.parse(currentValue);

			let metadata = json[0]['metadata'];
			let exclude = json[0]['exclude'];

			for (let key in metadata) {
				addMetadata(key, metadata[key]['path'], metadata[key]['type'], false);
			}

			exclude.forEach(function (element) {
				addExclude(element['path'], element['type'], false);
			}, this);
		}
	}

	function excludeTypeOnChange() {
		let row = this.getAttribute('data-row');
		let jsonToMod = {
			type: this.options[this.selectedIndex].value,
			path: getExclude(row)['path']
		};
		modifyExclude(row, jsonToMod);
	}

	function excludeQueryOninput() {
		let query = this.value;
		let row = this.getAttribute('data-row');
		let jsonToMod = {
			type: getExclude(row)['type'],
			path: query
		};
		modifyExclude(row, jsonToMod);
	}

	function metadataTypeOnChange() {
		let currentField = this.parentNode.parentNode.getAttribute('data-field');
		let jsonToMod = {
			type: this.options[this.selectedIndex].value,
			path: getMetadata(currentField)['path']
		}
		modifyMetaData(currentField, currentField, jsonToMod);
	}

	function metadataQueryOnInput() {
		let query = this.value;
		let currentField = this.parentNode.parentNode.parentNode.getAttribute('data-field');
		let jsonToMod = {
			type: getMetadata(currentField)['type'],
			path: query
		};
		modifyMetaData(currentField, currentField, jsonToMod);
	}

	function metadataFieldOnInput() {
		try {
			let field = this.value;
			let currentField = this.parentNode.parentNode.parentNode.getAttribute('data-field');
			logBackground(currentField);
			modifyMetaData(field, currentField, getMetadata(currentField));
			this.parentNode.parentNode.parentNode.setAttribute('data-field', field);
		}
		catch (err) {
			alert(err);
		}
	}

	//The init function
	function init() {
		try {

			//Adds the fetch function to the button
			document.getElementById('fetch').onclick = fetch;
			document.getElementById('pretty').onclick = pretty;
			document.getElementById('queryToAddButton').onclick = addToJson;
			document.getElementById('queryToAddMeta').onchange = toggleField;
			//document.getElementById('mouseAdd').onclick = mouseAdd;
			document.getElementById('storage').onchange = updateStorage;
			document.getElementById('storage').onfocus = storageSave;
			document.getElementById('storageSave').onclick = storageSave;
			document.getElementById('storageDelete').onclick = storageDelete;
			document.getElementById('storageReset').onclick = storageReset;
			document.getElementById('editor-button').onclick = changeTab;
			document.getElementById('text-editor-button').onclick = changeTab;
			initStorageSelect();

			//Hides or shows the field by default
			toggleField();

			//Creates the value table
			resetValueTable();

			//Connects to the messeger
			var backgroundPageConnection = chrome.runtime.connect({
				name: 'panel'
			});

			//Sets the textarea to the default json
			document.getElementById('json-config').value = "Create/Load a file...";
			buildVisualFromText();

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

				if (message.mouse) {
					document.getElementById('queryToAdd').value = message.mouse + ((document.getElementById("addText").checked) ? "/text()" : "");
					document.getElementById('queryToAddType').selectedIndex = 0;
				}

			});

			// Send a message to background page so that the background page can associate panel to the current host page
			backgroundPageConnection.postMessage({
				name: 'panel-init',
				tabId: chrome.devtools.inspectedWindow.tabId
			});
		} catch (err) {
			alert(err);
		}
	}

	//Run the init function
	setTimeout(init, 1);

})();