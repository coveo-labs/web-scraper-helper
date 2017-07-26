(function () {

	var defaultTextEditorValue = 'Create/Load a file...';
	var autoValidateTimeout;
	var isTextEncoded = false;

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














	/*
	 * HELPER FUNCTIONS 
	 *
	 */


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
	 * Returns XPATH or CSS depending on the check
	 * 
	 * @param {boolean} checked - if checked
	 * @returns {string} The return string
	 */
	function getTypebyCheck(checked) {
		return checked ? "CSS" : "XPATH";
	}

	/**
	 * Sends the current JSON in the textarea to the parser
	 * 
	 */
	function fetch() {
		try {
			let valueToSend = document.getElementById('json-config').value;
			if (valueToSend === defaultTextEditorValue) {
				valueToSend = defaultJson;
			}
			chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, json: valueToSend });
		}
		catch (err) {
			document.getElementById('error').innerHTML = "Failed to parse JSON<br>" + err;
		}
	}


	/**
	 * Clears the webpage CSS and results table
	 * 
	 */
	function clearPage() {
		chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, json: defaultJson });
	}

	/**
	 * Validates the current JSON values by adding colors to the visual editor
	 * 
	 */
	function validateJson() {
		try {
			let valueToSend = document.getElementById('json-config').value;
			if (valueToSend === defaultTextEditorValue) {
				valueToSend = defaultJson;
			}
			chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, validate: valueToSend });
			fetch();
		}
		catch (err) {
			document.getElementById('error').innerHTML = "Failed to parse JSON<br>" + err;
		}
	}


	/**
	 * Launches the a timeout to validate the visual editor after 100ms
	 * 
	 */
	function autoValidate() {
		if (autoValidateTimeout) {
			clearTimeout(autoValidateTimeout);
		}
		autoValidateTimeout = setTimeout(validateJson, 100);
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
	 * Checks if the key exists in the metadata of the json
	 * 
	 * @param {string} key - The key
	 * @returns {boolean} True if the key exists
	 */
	function doesKeyExist(key) {
		let textAreaElement = document.getElementById('json-config');
		let currentValue = textAreaElement.value;
		let json = JSON.parse(currentValue);
		return json[0]['metadata'][key] !== undefined;
	}
















	/*
	 * STORAGE FUNCTIONS 
	 *
	 */


	/**
	 * Displays the string next to the storage in green
	 * 
	 * @param {string} value - The string to display
	 */
	function displayStorageSuccess(value) {
		let e = document.getElementById('storageSuccess');
		e.innerHTML = value;
		removeStorageSuccess();
	}


	/**
	 * Removes the success string after 2 seconds
	 * 
	 */
	function removeStorageSuccess() {
		setTimeout(function () {
			let e = document.getElementById('storageSuccess');
			e.innerHTML = '';
		}, 2000)
	}


	/**
	 * Creates the storage file select
	 * 
	 * @param {requestCallback} [callback] - After the select is created and ready to be used
	 */
	function initStorageSelect(callback) {
		try {
			let select = document.getElementById('storage');
			let optionsHtml = ['<option selected disabled>Select a file to work on</option><option disabled>------------------------------</option>'];
			getStorageValues(function (results) {
				results.forEach(function (element) {
					optionsHtml.push(`<option value="${element}">${element}</option>`);
				}, this);
				optionsHtml.push('<option value="__create">Create new file...</option>');
				select.innerHTML = optionsHtml.join('');
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
				let newJsonFileName = window.prompt('New json config file name');
				if (newJsonFileName) {
					if (!result.includes(newJsonFileName)) {
						if (newJsonFileName != '' && newJsonFileName != '__json' && newJsonFileName != '__create' && newJsonFileName != 'null') {

							result.push(newJsonFileName);
							let resultJson = {};
							resultJson['__jsons'] = result;
							chrome.storage.local.set(resultJson, function () {
								let newJson = {};
								newJson[newJsonFileName] = defaultJson;
								chrome.storage.local.set(newJson);
								initStorageSelect(function () {
									e.selectedIndex = e.options.length - 2;
									loadTextEditorWithStorageFile();
								});
							});

						}
						else {
							errorElement.innerHTML += 'Name is a keyword<br>';
							e.selectedIndex = 0;
						}
					}
					else {
						errorElement.innerHTML += 'Name already taken<br>';
						e.selectedIndex = 0;
					}
				}
				else {
					errorElement.innerHTML += 'No name entered<br>';
					e.selectedIndex = 0;
				}
			}
			else {
				loadTextEditorWithStorageFile();
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
	function loadTextEditorWithStorageFile() {
		let currentValue = getCurrentStorageValue();
		let textArea = document.getElementById('json-config');
		//If current value is present
		storageValueExists(currentValue, function (exists) {
			if (exists) {
				chrome.storage.local.get(currentValue, function (result) {
					textArea.value = result[currentValue];
					enableButtons();
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
				displayStorageSuccess("Save successful");
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
							loadTextEditorWithStorageFile();
						});
					});
				}
			}
		});
	}


	/**
	 * Changes the editor tab
	 * Visual or Text
	 * 
	 */
	function changeEditorTab() {
		try {

			let toShow = this.getAttribute('data-show');

			let liElements = this.parentNode.parentNode.childNodes;

			liElements.forEach(function (element) {

				if (element.tagName === 'LI') {
					element.removeAttribute('class');
				}
			}, this);

			this.parentNode.setAttribute('class', 'active');

			if (document.getElementById(toShow).style.display !== 'block') {
				//Tabs switching from text to visual editor
				if (toShow === 'editor') {
					if(isTextEncoded){
						changeEncodeOnClick();
					}
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

	function enableButtons() {
		document.getElementById('storageSave').removeAttribute('disabled');
		document.getElementById('storageDelete').removeAttribute('disabled');
	}















	/*
	 * VISUAL EDITOR FUNCTIONS 
	 *
	 */


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
			let ruleElement = row.insertCell(0);

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

			ruleElement.innerHTML = `
			<div class="rule">
				<input class="toggle" type="checkbox">
				<input type="text" placeholder="Query">
				<span class="glyphicon glyphicon-remove"></span>
   			</div>
			`;

			ruleElement.childNodes[1].childNodes[1].onchange = excludeTypeOnChange;
			ruleElement.childNodes[1].childNodes[1].checked = typeToAdd;
			ruleElement.childNodes[1].childNodes[3].oninput = excludeQueryOninput;
			ruleElement.childNodes[1].childNodes[3].value = queryToAdd;
			ruleElement.childNodes[1].childNodes[5].onclick = function () { removeJsonExclude(row.rowIndex); };

			ruleElement.childNodes[1].childNodes[3].focus();

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
	 * @param {number} index - The index, if true, push at the end
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
			autoValidate();
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

		//Checks if an empty field already exists
		//if it does, then dont create a new one
		let shouldAdd = true;

		for (var i = 0; i < tableElement.rows.length; i++) {
			if (tableElement.rows[i].childNodes[0].childNodes[1].getAttribute('data-field') === "") {
				shouldAdd = false;
			}
		}

		if (!shouldAdd) {
			return;
		}

		let row = tableElement.insertRow();
		let ruleElement = row.insertCell(0);

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

		ruleElement.innerHTML = `
			<div class="rule">
				<input class="toggle" type="checkbox">
				<input type="text" placeholder="Field" class="field-input">
				<input type="text" placeholder="Query">
				<span class="glyphicon glyphicon-remove"></span>
   			</div>
		`;

		ruleElement.childNodes[1].setAttribute('data-field', fieldToAdd);
		ruleElement.childNodes[1].childNodes[1].checked = typeToAdd;
		ruleElement.childNodes[1].childNodes[1].onchange = metadataTypeOnChange;
		ruleElement.childNodes[1].childNodes[3].value = fieldToAdd;
		ruleElement.childNodes[1].childNodes[3].oninput = metadataFieldOnInput;
		ruleElement.childNodes[1].childNodes[5].value = queryToAdd;
		ruleElement.childNodes[1].childNodes[5].oninput = metadataQueryOnInput;
		ruleElement.childNodes[1].childNodes[7].onclick = function () { removeTextMetadata(row.rowIndex); };

		ruleElement.childNodes[1].childNodes[3].focus();

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
	 */
	function removeTextMetadata(row) {
		let tableElement = document.getElementById('metadata-table');
		let textAreaElement = document.getElementById('json-config');
		let field = tableElement.rows[row].childNodes[0].childNodes[1].getAttribute('data-field');

		row = parseInt(row);

		if (typeof row === 'number') {
			tableElement.deleteRow(row);
			let currentValue = textAreaElement.value;
			let json = JSON.parse(currentValue);
			delete json[0]['metadata'][field];
			textAreaElement.value = JSON.stringify(json, null, 2);
			autoValidate();
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
				<div id="add-exclude" class="btn btn-sm btn-success"><span class="glyphicon glyphicon-plus"></span> </div>
			</div>
			<p>Metadata</p> 
			<table id="metadata-table"> 
			</table> 
			<div class="center-button">
				<div id="add-metadata" class="btn btn-sm btn-success"><span class="glyphicon glyphicon-plus"></span> </div>
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

		validateJson();
	}


	/**
	 * The onchange function for the <select> of the exclude type in the visual editor
	 * 
	 */
	function excludeTypeOnChange() {
		let row = this.parentNode.parentNode.parentNode.rowIndex;
		let jsonToMod = {
			type: getTypebyCheck(this.checked),
			path: getJsonExclude(row)['path']
		};
		modifyJsonExclude(row, jsonToMod);
		autoValidate();
	}


	/**
	 * The oninput function for the <input> of the exclude query in the visual editor
	 * 
	 */
	function excludeQueryOninput() {
		let query = this.value;
		let row = this.parentNode.parentNode.parentNode.rowIndex;
		let jsonToMod = {
			type: getJsonExclude(row)['type'],
			path: query
		};
		modifyJsonExclude(row, jsonToMod);
		autoValidate();
	}


	/**
	 * The onchange function for the <select> of the metadata type in the visual editor
	 * 
	 */
	function metadataTypeOnChange() {
		let currentField = this.parentNode.getAttribute('data-field');
		let jsonToMod = {
			type: getTypebyCheck(this.checked),
			path: getTextMetadata(currentField)['path']
		}
		modifyTextMetadata(currentField, currentField, jsonToMod);
		autoValidate();
	}


	/**
	 * The oninput function for the <input> of the metadata query in the visual editor
	 * 
	 */
	function metadataQueryOnInput() {
		let query = this.value;
		let currentField = this.parentNode.getAttribute('data-field');
		let jsonToMod = {
			type: getTextMetadata(currentField)['type'],
			path: query
		};
		modifyTextMetadata(currentField, currentField, jsonToMod);
		autoValidate();
	}


	/**
	 * The oninput function for the <input> of the metadata field in the visual editor
	 * 
	 */
	function metadataFieldOnInput() {
		try {
			let field = this.value;
			if (doesKeyExist(field)) {
				this.setAttribute("class", "field-input bg-danger");
			}
			else {
				this.setAttribute("class", "field-input");
				let currentField = this.parentNode.getAttribute('data-field');
				modifyTextMetadata(field, currentField, getTextMetadata(currentField));
				this.parentNode.setAttribute('data-field', field);
				autoValidate();
			}
		}
		catch (err) {
			alert(err);
		}
	}

	function changeEncodeOnClick(){
		let encodeButtonElement = document.getElementById('encode');
		let textArea = document.getElementById('json-config');

		if(isTextEncoded){
			try{
				textArea.value = JSON.parse(textArea.value)
				pretty();
			}
			catch(err){
				alert(err);
			}
			encodeButtonElement.innerHTML = "Encode";
		}
		else{
			textArea.value = JSON.stringify(textArea.value, null, 0)
			encodeButtonElement.innerHTML = "Decode";
		}

		isTextEncoded = !isTextEncoded;
	}
















	/*
	 * MAIN FUNCTION 
	 *
	 */


	/**
	 * The init function
	 * 
	 */
	function init() {
		try {

			//Adds the fetch function to the button
			document.getElementById('fetch').onclick = fetch;
			document.getElementById('pretty').onclick = pretty;
			//Disabled for now
			//document.getElementById('mouseAdd').onclick = mouseAdd;
			document.getElementById('storage').onchange = storageOnChange;
			document.getElementById('storage').onfocus = saveTextToStorage;
			document.getElementById('storageSave').onclick = saveTextToStorage;
			document.getElementById('storageDelete').onclick = deleteStorageFile;
			document.getElementById('editor-button').onclick = changeEditorTab;
			document.getElementById('text-editor-button').onclick = changeEditorTab;
			document.getElementById('clear').onclick = clearPage;
			document.getElementById('encode').onclick = changeEncodeOnClick;
			initStorageSelect();

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
									element['value'] = element['value'].join('<br>');
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

				if (message.validate) {
					let errorElement = document.getElementById('error');
					errorElement.innerHTML = "";
					message.validate.errors.forEach(function (element) {
						errorElement.innerHTML += element['value'] + "<br>";
					}, this);

					let excludeTable = document.getElementById("exclude-table");
					let metadataTable = document.getElementById("metadata-table");

					if (excludeTable && excludeTable.rows) {
						for (let i = 0; i < excludeTable.rows.length; i++) {
							//The toggle
							let element = excludeTable.rows[i].childNodes[0].childNodes[1].childNodes[1];
							element.removeAttribute("class");
							element.setAttribute("class", "toggle " + message.validate.exclude[i]);
						}
					}

					if (metadataTable && metadataTable.rows) {
						for (let i = 0; i < metadataTable.rows.length; i++) {
							//The toggle
							let element = metadataTable.rows[i].childNodes[0].childNodes[1].childNodes[1];
							let key = metadataTable.rows[i].childNodes[0].childNodes[1].getAttribute('data-field');
							element.removeAttribute("class");
							element.setAttribute("class", "toggle " + message.validate.metadata[key]);
						}
					}
				}

				if (message.reload) {
					autoValidate();
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

	setTimeout(init, 100);

})();