(function () {

	var defaultTextEditorValue = 'Create/Load a file...';

	//TEST JSON VALUE
	var defaultJson = [{
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

	defaultJson = JSON.stringify(defaultJson, null, 2);


	/**
	 * Add the string to the log
	 * 
	 * @param {string} s - The string to add to the log
	 */
	function log(s) {
		document.getElementById('log').innerText += (s + '\n' + new Date() + '\n\n');
	}

	function logBackground(object) {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, log: object });
	}


	/**
	 * Sends the current JSON in the textarea to the parser
	 * 
	 */
	function fetch() {
		let valueToSend = document.getElementById('json-config').value;
		if (valueToSend === defaultTextEditorValue) {
			valueToSend = defaultJson;
		}
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, json: valueToSend });
	}

	/**
	 * Formats the JSON
	 * 
	 */
	function pretty() {
		let textAreaElement = document.getElementById('json-config');
		let uglyJson = JSON.parse(textAreaElement.value);
		let prettyJson = JSON.stringify(uglyJson, null, 2);
		textAreaElement.value = prettyJson;
	}


	/**
	 * Adds the query to the JSON
	 * 
	 */
	function addToJson() {
		//Get the vars from the page
		let e = document.getElementById('queryToAddMeta');
		let metaType = e.options[e.selectedIndex].value;
		e = document.getElementById('queryToAddType');
		let queryType = e.options[e.selectedIndex].value;
		let query = document.getElementById('queryToAdd').value;
		let field = document.getElementById('fieldToAdd').value;

		//Get the current json
		let textAreaElement = document.getElementById('json-config');
		let currentJson = JSON.parse(textAreaElement.value);

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
		textAreaElement.value = currentJson;
		buildVisualFromText();
	}


	/**
	 * Hides or shows the field input
	 * 
	 */
	function toggleQuickAddFieldInput() {
		let queryTypeElement = document.getElementById('queryToAddMeta');
		let fieldInputElement = document.getElementById('fieldToAdd');
		if (queryTypeElement.value == 'metadata') {
			fieldInputElement.style.display = 'inline';
		}
		else {
			fieldInputElement.style.display = 'none';
		}
	}


	/**
	 * Resets the value table back to default
	 * 
	 */
	function resetResultTable() {
		document.getElementById('resultTable').innerHTML = '<tr><th>Field</th><th>Value(s)</th></tr>';
	}

	/**
	 * Turn on the mouseover on the webpage
	 * Deactivated for now
	 * 
	 */
	function mouseAdd() {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, mouse: '1' });
	}


	/**
	 * Creates the storage file select
	 * 
	 * @param {requestCallback} [callback] - After the select is created and ready to be used
	 */
	function initStorageSelect(callback) {
		try {
			let select = document.getElementById('storage');
			select.innerHTML = '<option selected disabled>Select a file to work on</option><option disabled>------------------------------</option>';
			getStorageValues(function (results) {
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


	/**
	 * Gets all the name of the files stored in the storage
	 * 
	 * @param {requestCallback} callback - Passes the Object list to the callback
	 * @returns {Object} An empty object if the callback isn't there
	 */
	function getStorageValues(callback) {
		chrome.storage.local.get('__jsons', function (result) {
			if (!result.__jsons) {
				result.__jsons = [];
			}

			callback(result.__jsons);

		});

		return [];
	}


	/**
	 * Determines wheter a file exists in storage
	 * 
	 * @param {string} value - The file to check 
	 * @param {requestCallback} callback - Calls this with a {boolean}
	 */
	function storageValueExists(value, callback) {
		if (value) {
			getStorageValues(function (results) {
				callback(results.includes(value));
			});
		}
	}


	/**
	 * Called onchange of the storage select
	 * Creates a new file when the create option is selected
	 * 
	 */
	function storageOnChange() {
		let e = document.getElementById('storage');
		let errorElement = document.getElementById('storageError');
		let value = e.options[e.selectedIndex].value;
		errorElement.innerHTML = '';

		getStorageValues(function (result) {

			if (value == '__create') {
				let newJsonName = window.prompt('New json name');
				if (newJsonName && !result.includes(newJsonName) && (newJsonName != '' && newJsonName != '__json' && newJsonName != '__create' && newJsonName != 'null')) {
					result.push(newJsonName);
					let resultJson = {};
					resultJson['__jsons'] = result;
					chrome.storage.local.set(resultJson, function () {
						let newJson = {};
						newJson[newJsonName] = defaultJson;
						chrome.storage.local.set(newJson);
						initStorageSelect(function () {
							e.selectedIndex = e.options.length - 2;
							loadTextEditor();
						});
					});
				}
				else {
					errorElement.innerHTML += 'Naming error<br>';
					e.selectedIndex = 0;
				}
			}
			else {
				loadTextEditor();
			}
		});
	}


	/**
	 * Gets the currently selected value of the storage
	 * 
	 * @returns {string} the value
	 */
	function getCurrentStorageValue() {
		let e = document.getElementById('storage');
		return e.options[e.selectedIndex].value;
	}


	/**
	 * Loads the text editor with the selected file
	 * Also updates the visual editor
	 * 
	 */
	function loadTextEditor() {
		let currentValue = getCurrentStorageValue();
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
				textArea.value = defaultTextEditorValue;
				buildVisualFromText();
			}
		});
	}

	/**
	 * Saves the current text in the text-editor to storage
	 * 
	 */
	function saveTextToStorage() {
		let currentValue = getCurrentStorageValue();
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


	/**
	 * Deletes the currently selected storage file
	 * 
	 */
	function deleteStorageFile() {
		let currentValue = getCurrentStorageValue();
		//If current value is present
		storageValueExists(currentValue, function (exists) {
			if (exists) {
				if (confirm('Are you sure you want to delete: ' + currentValue)) {
					getStorageValues(function (jsons) {
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
							loadTextEditor();
						});
					});
				}
			}
		});
	}


	/**
	 * Clears all storage
	 * Debug feature 
	 * 
	 */
	function resetStorage() {
		chrome.storage.local.clear(function () {
			initStorageSelect();
		});
	}


	/**
	 * Displays the string next to the storage in green
	 * 
	 * @param {string} value - The string to display
	 */
	function displaySuccess(value) {
		let e = document.getElementById('storageSuccess');
		e.innerHTML = value;
		removeSuccess();
	}


	/**
	 * Removes the success string after 2 seconds
	 * 
	 */
	function removeSuccess() {
		setTimeout(function () {
			let e = document.getElementById('storageSuccess');
			e.innerHTML = '';
		}, 2000)
	}


	/**
	 * Changes the editor tab
	 * Visual or Text
	 * 
	 */
	function changeEditorTab() {
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


	/**
	 * Adds an exclude query to the visual editor
	 * 
	 * @param {string} query - The query
	 * @param {string|number} type - 0 for XPATH, 1 for CSS
	 * @param {boolean} addToTextEditor - if undefined or true, adds the value to the text editor
	 */
	function addExcludeVisual(query, type, addToTextEditor) {
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
			deleteElement.innerHTML = '<button class="sub-button">-</button>';
			deleteElement.onclick = function () { removeJsonExclude(row.rowIndex); };

			if (addToTextEditor == undefined || addToTextEditor == true) {
				let jsonToAdd = {}
				jsonToAdd['type'] = (typeToAdd == 1) ? 'CSS' : 'XPATH';
				jsonToAdd['path'] = (typeof query === 'string') ? query : '';
				modifyJsonExclude(true, jsonToAdd);
			}

		}
		catch (err) {
			alert(err);
		}
	}


	/**
	 * Modifies the index of the exclude
	 * 
	 * @param {number} index - The index
	 * @param {object} data - The data {type:"", path:""}
	 */
	function modifyJsonExclude(index, data) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		if (index === true) {
			json[0]['exclude'].push(data);
		}
		else {
			json[0]['exclude'][index] = data;
		}
		textAreaElement.value = JSON.stringify(json, null, 2);
	}

	/**
	 * Removes the index from the json exclude
	 * 
	 * @param {any} index 
	 */
	function removeJsonExclude(index) {
		let tableElement = document.getElementById('exclude-table');
		let textAreaElement = document.getElementById('json-config');

		index = parseInt(index);

		if (typeof index === 'number') {
			tableElement.deleteRow(index);
			let currentValue = textAreaElement.value;
			let json = JSON.parse(currentValue);
			json[0]['exclude'].splice(index, 1);
			textAreaElement.value = JSON.stringify(json, null, 2);
		}

	}


	/**
	 * Gets the current value of the exclude
	 * 
	 * @param {number} index 
	 * @returns {object} The current values
	 */
	function getJsonExclude(index) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		return json[0]['exclude'][index];
	}


	/**
	 * Adds a metadata field to the visual editor
	 * 
	 * @param {string} field - The field to pass
	 * @param {string} query - The query to pass
	 * @param {string|number} type - The type to pass: 0 for XPATH, 1 for CSS
	 * @param {boolean} addToTextEditor - if undefined or true, adds the value to the text editor
	 */
	function addMetadataVisual(field, query, type, addToTextEditor) {
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
		deleteElement.innerHTML = '<button class="sub-button">-</button>';
		deleteElement.onclick = function () { removeTextMetadata(row.rowIndex, fieldToAdd); };

		if (addToTextEditor == undefined || addToTextEditor == true) {
			let data = {
				type: (typeToAdd == 1) ? 'CSS' : 'XPATH',
				path: (typeof query === 'string') ? query : ''
			};
			modifyTextMetadata(fieldToAdd, fieldToAdd, data);
		}
	}


	/**
	 * Modifies the metadata of the text editor
	 * 
	 * @param {string} newField - The new field
	 * @param {string} oldField - the old field
	 * @param {object} data - The data {type:"XPATH", path:""}
	 */
	function modifyTextMetadata(newField, oldField, data) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		delete json[0]['metadata'][oldField];
		json[0]['metadata'][newField] = data;
		textAreaElement.value = JSON.stringify(json, null, 2);
	}


	/**
	 * Removes the row from the visual editor and the field of the text editor
	 * 
	 * @param {number} row - The row of the visual editor to remove
	 * @param {string} field - The field to remove in the text editor
	 */
	function removeTextMetadata(row, field) {
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


	/**
	 * Gets the metadata for a specific field
	 * 
	 * @param {string} field - The field
	 * @returns {object} The field data
	 */
	function getTextMetadata(field) {
		if (field == null) {
			field = '';
		}
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		return json[0]['metadata'][field];
	}


	/**
	 * Builds the visual editor from the text editor data
	 * 
	 */
	function buildVisualFromText() {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let editorElement = document.getElementById('editor');

		if (currentValue == defaultTextEditorValue) {
			editorElement.innerHTML = defaultTextEditorValue;
		}
		else {
			editorElement.innerHTML = `
			<p>Exclude</p> 
			<table id="exclude-table"> 
			</table> 
			<div class="center-button">
				<button id="add-exclude" class="add-button">Add +</button> 
			</div>
			<p>Metadata</p> 
			<table id="metadata-table"> 
			</table> 
			<div class="center-button">
				<button id="add-metadata" class="add-button">Add +</button>
			</div>
			`;
			document.getElementById('add-exclude').onclick = addExcludeVisual;
			document.getElementById('add-metadata').onclick = addMetadataVisual;

			let json = JSON.parse(currentValue);

			let metadata = json[0]['metadata'];
			let exclude = json[0]['exclude'];

			for (let key in metadata) {
				addMetadataVisual(key, metadata[key]['path'], metadata[key]['type'], false);
			}

			exclude.forEach(function (element) {
				addExcludeVisual(element['path'], element['type'], false);
			}, this);
		}
	}


	/**
	 * The onchange function for the <select> of the exclude type in the visual editor
	 * 
	 */
	function excludeTypeOnChange() {
		let row = this.getAttribute('data-row');
		let jsonToMod = {
			type: this.options[this.selectedIndex].value,
			path: getJsonExclude(row)['path']
		};
		modifyJsonExclude(row, jsonToMod);
	}


	/**
	 * The oninput function for the <input> of the exclude query in the visual editor
	 * 
	 */
	function excludeQueryOninput() {
		let query = this.value;
		let row = this.getAttribute('data-row');
		let jsonToMod = {
			type: getJsonExclude(row)['type'],
			path: query
		};
		modifyJsonExclude(row, jsonToMod);
	}


	/**
	 * The onchange function for the <select> of the metadata type in the visual editor
	 * 
	 */
	function metadataTypeOnChange() {
		let currentField = this.parentNode.parentNode.getAttribute('data-field');
		let jsonToMod = {
			type: this.options[this.selectedIndex].value,
			path: getTextMetadata(currentField)['path']
		}
		modifyTextMetadata(currentField, currentField, jsonToMod);
	}


	/**
	 * The oninput function for the <input> of the metadata query in the visual editor
	 * 
	 */
	function metadataQueryOnInput() {
		let query = this.value;
		let currentField = this.parentNode.parentNode.parentNode.getAttribute('data-field');
		let jsonToMod = {
			type: getTextMetadata(currentField)['type'],
			path: query
		};
		modifyTextMetadata(currentField, currentField, jsonToMod);
	}


	/**
	 * The oninput function for the <input> of the metadata field in the visual editor
	 * 
	 */
	function metadataFieldOnInput() {
		try {
			let field = this.value;
			let currentField = this.parentNode.parentNode.parentNode.getAttribute('data-field');
			modifyTextMetadata(field, currentField, getTextMetadata(currentField));
			this.parentNode.parentNode.parentNode.setAttribute('data-field', field);
		}
		catch (err) {
			alert(err);
		}
	}


	/**
	 * The init function
	 * 
	 */
	function init() {
		try {

			//Adds the fetch function to the button
			document.getElementById('fetch').onclick = fetch;
			document.getElementById('pretty').onclick = pretty;
			document.getElementById('queryToAddButton').onclick = addToJson;
			document.getElementById('queryToAddMeta').onchange = toggleQuickAddFieldInput;
			//Disabled for now
			//document.getElementById('mouseAdd').onclick = mouseAdd;
			document.getElementById('storage').onchange = storageOnChange;
			document.getElementById('storage').onfocus = saveTextToStorage;
			document.getElementById('storageSave').onclick = saveTextToStorage;
			document.getElementById('storageDelete').onclick = deleteStorageFile;
			document.getElementById('storageReset').onclick = resetStorage;
			document.getElementById('editor-button').onclick = changeEditorTab;
			document.getElementById('text-editor-button').onclick = changeEditorTab;
			initStorageSelect();

			//Hides or shows the field by default
			toggleQuickAddFieldInput();

			//Creates the value table
			resetResultTable();

			//Connects to the messeger
			var backgroundPageConnection = chrome.runtime.connect({
				name: 'panel'
			});

			//Sets the textarea to the default json
			document.getElementById('json-config').value = defaultTextEditorValue;
			buildVisualFromText();

			//The onMessage function
			backgroundPageConnection.onMessage.addListener(function (message, sender, sendResponse) {

				if (message.return) {

					//Clear the past errors, logs and resets the field table
					let errorElement = document.getElementById('error');
					errorElement.innerHTML = "";
					document.getElementById('log').innerText = "";
					resetResultTable();

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

				//Disabled for now
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