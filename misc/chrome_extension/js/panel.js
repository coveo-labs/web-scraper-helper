// jshint -W110, -W003
/*global chrome*/

(function () {

	let _WS_ = null;
	let defaultTextEditorValue = 'Create/Load a file...';
	let autoValidateTimeout;


	//TEST JSON VALUE
	let defaultJson = JSON.stringify([{
			"for": {
				"urls": [
					".*"
				]
			},
			"exclude": [
			],
			"metadata": {
			}
		}],null,2);

	let getCurrentSpec = ()=>{
		return document.getElementById('json-config').value;
	};


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
			if (_WS_) {
				chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, json: _WS_._global.toString() });
			}
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
			if (_WS_) {
				chrome.runtime.sendMessage({ tabId: chrome.devtools.inspectedWindow.tabId, validate: _WS_.toString() });
				fetch();
			}
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
		let uglyJson = JSON.parse(getCurrentSpec());
		document.getElementById('json-config').value = JSON.stringify(uglyJson, null, 2);
	}

	/**
	 * Resets the value table back to default
	 *
	 */
	function resetResultTable() {
		document.getElementById('resultTable').innerHTML = '<tr><th>Field</th><th>Value(s)</th></tr>';
	}

	/**
	 * Checks if the key exists in the metadata of the json
	 *
	 * @param {string} key - The key
	 * @returns {boolean} True if the key exists
	 */
	function doesKeyExist(key) {
		let json = JSON.parse(getCurrentSpec());
		return json[0]['metadata'][key] !== undefined;
	}

	/**
	 * Copies the text content to the clipboard
	 *
	 */
	function copyToClipboard(bEncode){
		document.getElementById('text-editor-button').click();
		let textAreaElement = document.getElementById('json-config');
		let originalValue = getCurrentSpec();

		if (bEncode===true) { // may receive an event as parameter
			let val = JSON.stringify(JSON.parse(originalValue)); // will strip out lines
			val = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); // escape backslash and quotes
			textAreaElement.value = `"${val}"`;
		}

		textAreaElement.focus();
		textAreaElement.select();
		try {
			let successful = document.execCommand('copy');
			textAreaElement.value = originalValue;
			if (successful) {
				displayStorageSuccess('Copied!');
			}
		} catch (err) {
			alert('Failed to copy');
		}
	}

	function copyToClipboardEscaped() {
		copyToClipboard(true);
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
		}, 2000);
	}

	/**
	 * Creates the storage file select
	 *
	 * @param {requestCallback} [callback] - After the select is created and ready to be used
	 */
	function initStorageSelect(callback) {
		try {
			let select = document.getElementById('storage');
			let optionsHtml = [
				'<option selected disabled>Select a file to work on</option>',
				'<option disabled>------------------------------</option>'
			];
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
		chrome.storage.local.get('__jsons', (result) => {
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


	let createNewSpec = (result) => {
		let e = document.getElementById('storage'),
			errorElement = document.getElementById('storageError');

		let newJsonFileName = window.prompt('New json config file name');
		if (newJsonFileName) {
			if (!result.includes(newJsonFileName)) {
				if (newJsonFileName !== '' && newJsonFileName !== '__json' && newJsonFileName !== '__create' && newJsonFileName !== 'null') {

					result.push(newJsonFileName);
					let resultJson = {__jsons: result};
					chrome.storage.local.set(resultJson, ()=>{
						let newJson = {};
						newJson[newJsonFileName] = defaultJson;
						chrome.storage.local.set(newJson);
						initStorageSelect(() => {
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
	};

	/**
	 * Called onchange of the storage select
	 * Creates a new file when the create option is selected
	 *
	 */
	function storageOnChange() {
		let e = document.getElementById('storage'),
			value = e.options[e.selectedIndex].value,
			errorElement = document.getElementById('storageError');

		errorElement.innerHTML = '';

		getStorageValues( result => {

			if (value === '__create') {
				createNewSpec(result);
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
		storageValueExists(currentValue, (exists) => {
			if (exists) {
				let jsonToAdd = {};
				jsonToAdd[currentValue] = getCurrentSpec();
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
		storageValueExists(currentValue, (exists) => {
			if (exists) {
				if (window.confirm('Are you sure you want to delete: ' + currentValue)) {
					getStorageValues(jsons => {
						let index = jsons.indexOf(currentValue);
						if (index > -1) {
							jsons.splice(index, 1);
						}
						let jsonToAdd = {__jsons: jsons};
						chrome.storage.local.set(jsonToAdd, initStorageSelect);
						chrome.storage.local.remove(currentValue, loadTextEditorWithStorageFile);
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

			liElements.forEach(element => {
				if (element.tagName === 'LI') {
					element.removeAttribute('class');
				}
			});

			this.parentNode.setAttribute('class', 'active');

			if (document.getElementById(toShow).style.display === 'none') {
				//Tabs switching from text to visual editor
				if (toShow === 'editor') {
					buildVisualFromText();
				}
			}

			let tabs = [].slice.call(document.getElementsByClassName('tab'));
			tabs.forEach(element=>{
				element.style.display = 'none';
			});
			document.getElementById(toShow).style.display = 'inherit';
		}
		catch (err) {
			alert(err);
		}
	}

	/**
	 * Enables the save and delete button once the user has selected a file
	 *
	 */
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
	function addExcludeVisual(path, type, addToTextEditor) {
		try {
			let rulesContainer = document.getElementById('exclude-rules');
			let id = guid();

			rulesContainer.innerHTML += `
			<div id="${id}" class="rule">
				<input type="checkbox" class="wsh-rule-type" ${type === 'CSS' ? 'checked' : ''}>
				<input type="text" class="wsh-rule-path" placeholder="Selector (XPath or CSS)" value="${path}">
				<span class="glyphicon glyphicon-remove"></span>
			</div>
			`;

			rulesContainer.querySelector(`#${id} .wsh-rule-path`).focus();
			rulesContainer.querySelector(`#${id} .wsh-rule-type`).onchange = excludeTypeOnChange;

			// let ruleDivElement = ruleElement.childNodes[1];
			// ruleDivElement.childNodes[1].onchange = excludeTypeOnChange;
			// ruleDivElement.childNodes[1].checked = typeToAdd;
			// ruleDivElement.childNodes[3].oninput = excludeQueryOninput;
			// ruleDivElement.childNodes[3].value = queryToAdd;
			// ruleDivElement.childNodes[5].onclick = () => { removeJsonExclude(row.rowIndex); };

			// ruleElement.childNodes[1].childNodes[3].focus();

			if (addToTextEditor === undefined || addToTextEditor === true) {
				let jsonToAdd = {
					type, path
				};
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
		let json = JSON.parse(getCurrentSpec());
		if (index === true) {
			json[0]['exclude'].push(data);
		}
		else {
			json[0]['exclude'][index] = data;
		}
		let textAreaElement = document.getElementById('json-config');
		textAreaElement.value = JSON.stringify(json, null, 2);
	}

	/**
	 * Removes the index from the json exclude
	 *
	 * @param {any} index
	 */
	function removeJsonExclude(index) {
		let tableElement = document.getElementById('exclude-rules');
		let textAreaElement = document.getElementById('json-config');

		index = parseInt(index);

		if (typeof index === 'number') {
			tableElement.deleteRow(index);
			let json = JSON.parse(getCurrentSpec());
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
		let json = JSON.parse(getCurrentSpec());
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
	function addMetadataVisual(name, path, type, addToTextEditor) {
		let newMeta = _WS_.addMeta(), $rc = $('#metadata-rules');

		$rc.append( $(newMeta.render()) );
		$('.glyphicon-remove', $rc).on('click', removeItem);

		let focusEl = document.querySelector(`#${newMeta.id} .wsh-rule-name`);
		if (focusEl) {
			focusEl.focus();
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
		let json = JSON.parse(getCurrentSpec());
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
		let tableElement = document.getElementById('metadata-rules');
		let textAreaElement = document.getElementById('json-config');
		let field = tableElement.rows[row].childNodes[0].childNodes[1].getAttribute('data-field');

		row = parseInt(row);

		if (typeof row === 'number') {
			tableElement.deleteRow(row);
			let json = JSON.parse(getCurrentSpec());
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
		if (!field) {
			field = '';
		}
		let json = JSON.parse(getCurrentSpec());
		return json[0]['metadata'][field];
	}

	let removeItem = (e)=>{
		let item = $(e.target).closest('.rule');
		_WS_.removeById(item.id);
		item.remove();
	};

	/**
	 * Builds the visual editor from the text editor data
	 *
	 */
	function buildVisualFromText() {
		try {
			let ws = WebScraperSpec.create(getCurrentSpec());
			if (ws) {
				let editorElement = document.getElementById('editor');
				editorElement.innerHTML = ws.render();

				// document.getElementById('add-exclude').onclick = addExcludeVisual;
				// document.getElementById('add-metadata').onclick = addMetadataVisual;
				$('#add-exclude').on('click', addExcludeVisual);
				$('#add-metadata').on('click', addMetadataVisual);

				$('.glyphicon-remove', $('#editor')).on('click', removeItem);

				_WS_ = ws;
			}

		// try {
		// 	let json = JSON.parse(currentValue);
		// 	let {metadata, exclude} = json[0];

		// 	for (let key in metadata) {
		// 		addMetadataVisual(key, metadata[key]['path'], metadata[key]['type'], false);
		// 	}

		// 	exclude.forEach( ({path, type}) => {
		// 		addExcludeVisual(path, type, false);
		// 	} );

		}
		catch(e) {
			console.error(e);
		}

		validateJson();
	}

	/**
	 * The onchange function for the <select> of the exclude type in the visual editor
	 *
	 */
	function excludeTypeOnChange(id) {
		console.log('ID : ', id, this.checked);
		// let jsonToMod = {
		// 	type: getTypebyCheck(this.checked),
		// 	path: getJsonExclude(row)['path']
		// };
		// modifyJsonExclude(row, jsonToMod);
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
		};
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
				this.setAttribute("class", "wsh-rule-name bg-danger");
			}
			else {
				this.setAttribute("class", "wsh-rule-name");
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
			console.log($('.btn'));
			//Adds the fetch function to the button
			document.getElementById('fetch').onclick = fetch;
			document.getElementById('pretty').onclick = pretty;
			document.getElementById('storage').onchange = storageOnChange;
			document.getElementById('storage').onfocus = saveTextToStorage;
			document.getElementById('storageSave').onclick = saveTextToStorage;
			document.getElementById('storageDelete').onclick = deleteStorageFile;
			document.getElementById('editor-button').onclick = changeEditorTab;
			document.getElementById('text-editor-button').onclick = changeEditorTab;
			document.getElementById('clear').onclick = clearPage;
			document.getElementById('copy').onclick = copyToClipboard;
			document.getElementById('copyEscaped').onclick = copyToClipboardEscaped;

			initStorageSelect();

			//Creates the value table
			resetResultTable();

			//Connects to the messeger
			let backgroundPageConnection = chrome.runtime.connect({
				name: 'panel'
			});

			//Sets the textarea to the default json
			document.getElementById('json-config').value = defaultTextEditorValue;
			buildVisualFromText();

			//The onMessage function
			backgroundPageConnection.onMessage.addListener(function (message/*, sender, sendResponse*/) {

				if (message.return) {

					//Clear the past errors, logs and resets the field table
					let errorElement = document.getElementById('error');
					errorElement.innerHTML = "";
					document.getElementById('log').innerText = "";
					resetResultTable();

					//Turns the message into readable JSON
					message['return'] = JSON.parse(message['return']);

					let encodeHtml = str => {
						return (''+str).replace(/</g,'&lt;');
					};

					let rowsHtml = [];
					//Parses through all the received messages
					message['return'].forEach( ({title, value, error}) => {
						try {
							//If the message received was an error
							if (error) {
								errorElement.innerHTML += encodeHtml(error) + "<br>";
							}
							//Else it adds it to the field table
							else {
								//Convert to list if greater than one
								if (value && value.length > 1) {
									value = value.map(encodeHtml).join('<br>');
								}
								else {
									value = encodeHtml(value);
								}
								rowsHtml.push(`<tr><td>${title}</td><td>${value}</td></tr>`);
							}
						} catch (err) {
							//If an error occurs, it goes in the log
							log(err + "\n" + JSON.stringify({title, value, error}, null, 2));
						}
					});
					document.getElementById("resultTable").innerHTML += rowsHtml.join('\n');
				}

				console.log(message.validate);
				if (message.validate) {
					let errorElement = document.getElementById('error');
					let errorMessages = message.validate.errors.join('<br>');
					console.log(errorMessages);
					errorElement.innerHTML = errorMessages;

					let $exclude = $("#exclude-rules");
					let $metadata = $("#metadata-rules");

					// let updateClass = (el, cls) => {
					// 	el.removeAttribute("class");
					// 	el.setAttribute("class", "wsh-rule-type " + cls);
					// };

					// if (excludeTable && excludeTable.rows) {
					// 	for (let i = 0; i < excludeTable.rows.length; i++) {
					// 		let element = excludeTable.rows[i].childNodes[0].childNodes[1].childNodes[1];
					// 		updateClass(element, message.validate.exclude[i]);
					// 	}
					// }

					// reset all to invalid
					$('.rule .wsh-rule-type').removeClass('bg-success bg-warning').addClass('bg-danger');

					$('.rule', $exclude).each((i,el)=>{
						console.log(i,el);
						$('.wsh-rule-type', el).removeClass('bg-success bg-warning bg-danger').addClass(message.validate.exclude[i]);
					});

					let msgMeta = message.validate.metadata;
					for (let k in msgMeta) {
						let v = msgMeta[k];
						console.log(k,v,$(`.rule[data-field="${k}"] .wsh-rule-type`, $metadata));
						$(`.rule[data-field="${k}"] .wsh-rule-type`, $metadata)
							.removeClass('bg-success bg-warning bg-danger')
							.addClass(v);
					}
					// if (metadataTable && metadataTable.rows) {
					// 	for (let i = 0; i < metadataTable.rows.length; i++) {
					// 		let c = metadataTable.rows[i].childNodes[0].childNodes[1],
					// 			key = c.getAttribute('data-field');
					// 		updateClass(c.childNodes[1], message.validate.metadata[key]);
					// 	}
					// }

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
			console.error(err);
			alert(err);
		}
	}

	setTimeout(init, 100);

})();
