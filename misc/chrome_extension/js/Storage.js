// jshint -W110, -W003
/*global chrome*/

let MOCK = {
	'__jsons': ['blog.coveo.com', 'bell.ca'],
	'blog.coveo.com': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"header,aside,footer"}],"metadata":{"tags":{"type":"CSS","path":".topics li::text"}}}]),
	'bell.ca': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"footer, #inqC2CImgContainer_AnchoredB,iframe, .rsx-icon-links, .icon-links"},{"type":"CSS","path":"header > *:not(.rsx-federal-bar), .rsx-federal-bar *:not(option)"},{"type":"CSS","path":".rsx-modal-group-wrap, #write-review-modal-lightbox, .rsx-availability-bar, .availability-bar, .rsx-offer-details, .fui-box-footer"},{"type":"CSS","path":"ul.mte-page-header__options"},{"type":"CSS","path":".mte-category-header, .mte-category-nav, .mte-back"},{"type":"CSS","path":".fui-topbar, .fui-topnav, .fui-page-footer, .fui-page-aside"},{"type":"CSS","path":".rsx-connector-login-modal-pane,  .rsx-modal-group-wrap"},{"type":"CSS","path":".mte-article-footer, .mte-multi-column, .mte-back-to-top, .modal, figure.figure, .mte-contact-us"}],"metadata":{"errorpage":{"type":"CSS","isBoolean":true,"path":"main.error-page"},"howtotopic":{"type":"CSS","path":".mte-article-header h1::text"},"howtosteps":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item::text"},"howtosteps2":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item a::text"},"prov":{"type":"CSS","path":"footer .js-current-language-native option:not([disabled])::attr(value)"}}}]),
};

class Storage {
	static get(attr, callback) {
		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.get(attr, callback);
		}

		console.log(`GET - Need mock for:`, attr);
		let val = MOCK[attr], spec = {};

		if (val) {
			spec[attr] = val;
		}
		if (callback) {
			callback(spec);
		}
		return spec;
	}

	static getDefault() {
		return JSON.stringify( [{"for":{"urls":[".*"]},"exclude":[],"metadata":{}}] );
	}

	static remove(attr, callback) {
		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.remove(attr, callback);
		}

		console.log(`REMOVE - Need mock for`, attr, callback);
	}

	static set(json, callback) {
		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.set(json, callback);
		}

		console.log(`SET - Need mock for`, json, callback);
		Object.keys(json).forEach(k=>{
			MOCK[k] = json[k];
		});

		if (callback) {
			callback();
		}
	}
}

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
		getSavedSpecNames(specNames => {
			console.log(2, specNames);
			specNames.forEach(name => {
				optionsHtml.push(`<option value="${name}">${name}</option>`);
			});
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
 * @param {requestCallback} callback - Passes the Object list (array of names) to the callback
 * @returns {Object} An empty object if the callback isn't there
 */
function getSavedSpecNames(callback) {
	Storage.get('__jsons', (result) => {
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
		getSavedSpecNames(existingSpecNames => {
			callback( existingSpecNames.includes(value) );
		});
	}
}

/**
 * Create a new Spec.
 * @param {string[]} specNames - results from getSavedSpecNames()
 */
let createNewSpec = (existingSpecNames) => {
	let e = document.getElementById('storage'), errorMsg = null;

	let newJsonFileName = window.prompt('New json config file name');
	if (newJsonFileName) {
		if (!existingSpecNames.includes(newJsonFileName)) {
			if ( !(['', '__json', '__create', 'null'].includes(newJsonFileName)) ) {

				// Save the new name in local storage.
				existingSpecNames.push(newJsonFileName);
				Storage.set({__jsons: existingSpecNames}, ()=>{
					// Then save the new spec
					let newJson = {};
					newJson[newJsonFileName] = Storage.getDefault();
					Storage.set(newJson);
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

	getSavedSpecNames( specNames => {
		if (value === '__create') {
			createNewSpec(specNames);
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
			Storage.get(currentValue, function (result) {
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
			Storage.set(jsonToAdd);
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
				getSavedSpecNames(specNames => {
					let index = specNames.indexOf(currentValue);
					if (index > -1) {
						specNames.splice(index, 1);
					}
					let jsonToAdd = {__jsons: specNames};
					Storage.set(jsonToAdd, initStorageSelect);
					Storage.remove(currentValue, loadTextEditorWithStorageFile);
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

