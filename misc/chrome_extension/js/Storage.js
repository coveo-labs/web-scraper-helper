// jshint -W110, -W003
/*global chrome*/

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

	setTimeout( ()=>{ e.innerHTML = ''; }, 2000 );
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
	let e = document.getElementById('storage'), errorMsg = null;

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
				errorMsg = 'Name is a keyword';
			}
		}
		else {
			errorMsg = 'Name already taken';
		}
	}
	else {
		errorMsg = 'No name entered';
	}

	if (errorMsg) {
		document.getElementById('storageError').innerHTML += errorMsg + '<br>';
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
			textArea.value = '';
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

