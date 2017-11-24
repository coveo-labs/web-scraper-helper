// jshint -W110, -W003
/*global chrome*/

// (function () {
	let DEBUG_LOCAL = 1;
	let TAB_ID = '';
	let _WS_ = null;
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

	let getCurrentSpec = (asJson)=>{
		let s = document.getElementById('json-config').value || defaultJson;
		if (asJson) {
			return JSON.parse(s)[0];
		}
		return s;
	};

	let CHROME_RUNTIME = chrome.runtime;


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
				chrome.runtime.sendMessage({ tabId: TAB_ID, json: _WS_._global.toString() });
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
		chrome.runtime.sendMessage({ tabId: TAB_ID, json: defaultJson });
	}

	/**
	 * Validates the current JSON values by adding colors to the visual editor
	 *
	 */
	function validateJson() {
		try {
			if (_WS_) {
				chrome.runtime.sendMessage({ tabId: TAB_ID, validate: _WS_.toString() });
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
		let json = getCurrentSpec(true);
		return json.metadata[key] !== undefined;
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

	/*
	 * VISUAL EDITOR FUNCTIONS
	 *
	 */

	/**
	 * Adds an exclude query to the visual editor
	 *
	 * @param {string} path - The selector
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
		let json = getCurrentSpec(true);
		if (index === true) {
			json.exclude.push(data);
		}
		else {
			json.exclude[index] = data;
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
			let json = getCurrentSpec(true);
			json.exclude.splice(index, 1);
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
		let json = getCurrentSpec(true);
		return json.exclude[index];
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
		let json = getCurrentSpec(true);
		delete json.metadata[oldField];
		json.metadata[newField] = data;
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
			let json = getCurrentSpec(true);
			delete json.metadata[field];
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
		let json = getCurrentSpec(true);
		return json.metadata[field];
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
			let ws = _WS_ || WebScraperSpec.create(getCurrentSpec());
			if (ws) {
				ws.render( document.getElementById('editor') );

				// $('#add-exclude', editorElement).on('click', ()=>{
				// 	ws.addExclude();
				// 	buildVisualFromText();
				// });
				// $('#add-metadata', editorElement).on('click', addMetadataVisual);
				// $('.wsh-rule-type', editorElement).on('click', metadataTypeOnChange);


				// $('.glyphicon-remove', $('#editor')).on('click', removeItem);

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
	function metadataTypeOnChange(e) {
		let t = $(e.target), id = t.closest('.rule').attr('id');
		console.log('CHANGE TYPE: ', id, t.closest('.rule'), t, t.checked, t.prop('checked'));
		_WS_.changeType(id, t.prop('checked'));
		// let currentField = this.parentNode.getAttribute('data-field');
		// let jsonToMod = {
		// 	type: getTypebyCheck(this.checked),
		// 	path: getTextMetadata(currentField)['path']
		// };
		// modifyTextMetadata(currentField, currentField, jsonToMod);
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
			TAB_ID = chrome.devtools && chrome.devtools.inspectedWindow.tabId;

			console.log($('.btn'));
			//Adds the fetch function to the button
			document.getElementById('fetch').onclick = fetch;
			document.getElementById('pretty').onclick = pretty;
			document.getElementById('storage').onchange = storageOnChange;
			document.getElementById('storage').onfocus = saveTextToStorage;
			document.getElementById('storageSave').onclick = saveTextToStorage;
			document.getElementById('storageDelete').onclick = deleteStorageFile;
			// document.getElementById('editor-button').onclick = changeEditorTab;
			// document.getElementById('text-editor-button').onclick = changeEditorTab;
			document.getElementById('clear').onclick = clearPage;
			document.getElementById('copy').onclick = copyToClipboard;

			initStorageSelect();

			//Creates the value table
			resetResultTable();

			//Connects to the messenger
			let backgroundPageConnection = null;
			if (!DEBUG_LOCAL) {
				backgroundPageConnection = chrome.runtime.connect({
					name: 'panel'
				});
			}
			else {
				CHROME_RUNTIME = {sendMessage: (m)=>{console.log('SendMsg:', m);}};

				// running local, for testing - use a Mock for chrome.runtime.connect
				backgroundPageConnection = {
					onMessage: { addListener: ()=>{} }, // empty function for now
					postMessage: ()=>{}, // empty function for now
				};
			}

			//Sets the textarea to the default json
			document.getElementById('json-config').value = '';
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
						// console.log(k,v,$(`.rule[data-field="${k}"] .wsh-rule-type`, $metadata));
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
				tabId: TAB_ID
			});
		} catch (err) {
			console.error(err);
			alert(err);
		}
	}

	setTimeout(init, 100);

// })();
