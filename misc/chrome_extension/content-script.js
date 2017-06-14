'use strict';
window.onload = function () {
	// your code 

	setTimeout(function () {
		let jsonToSend = {};
		jsonToSend.reload = 1;
		chrome.runtime.sendMessage(jsonToSend);
	}, 1);

	var __port = chrome.runtime.connect();
	//global since it needs to persist beyond the function scope
	var __elementsToHide = [];
	var __previousSelectedElement;
	var __ableToMouseOver = false;
	var __ableToClick = true;
	document.body.onmouseover = mouseoverHandler;
	document.body.onclick = clickHandler;

	/**
	 * Parses the XPath
	 * sample return
	 * {type:'title', value:[element, element]}
	 * 
	 * @param {string} title - the name of the metadata field
	 * @param {string} xpathString - the xpath to use to find the element in the page
	 * @param {boolean} shouldReturnText - set to true if you want the text value of the element found with xpath. (optional)
	 * @returns {object} returns the title and the elements in an array
	 */
	var parseXPath = function (title, xpathString, shouldReturnText) {
		try {
			let nodes = document.evaluate(xpathString, document);
			let e, elements = [];

			if (nodes.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || nodes.resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
				while (e = nodes.iterateNext()) {
					let value = e;
					if (shouldReturnText) {
						value = e.nodeValue;
					}
					elements.push(value);
				}
			}
			else if (nodes.resultType === XPathResult.NUMBER_TYPE) {
				elements.push(nodes.numberValue);
			}
			else if (nodes.resultType === XPathResult.STRING_TYPE) {
				elements.push(nodes.stringValue);
			}
			else if (nodes.resultType === XPathResult.BOOLEAN_TYPE) {
				elements.push(nodes.booleanValue);
			}

			return { type: title, value: elements };
		}
		catch (err) {
			return { type: '__error', value: 'Failed to parse XPath "' + xpathString + '"<br>' + err };
		}
	}

	/**
	 * Parses the CSS selector
	 * sample return
	 * {type:'title', value:[element, element]}
	 * 
	 * @param {string} title - The string for the type
	 * @param {string} cssSelector - the css selector to parse
	 * @param {boolean} shouldReturnText - if the value return is the text instead of the element
	 * @returns {object} returns the title and the elements in an array
	 */
	var parseCss = function (title, cssSelector, shouldReturnText) {
		try {
			let nodes = document.body.querySelectorAll(cssSelector);
			let e, elements = [];
			nodes.forEach(function (e) {
				let value = e;
				if (shouldReturnText) {
					value = e.textContent;
				}
				elements.push(value);
			}, this);
			return { type: title, value: elements };
		}
		catch (err) {
			return { type: '__error', value: 'Failed to parse CSS "' + cssSelector + '"<br>' + err };
		}
	}


	/**
	 * Parses the jsonData
	 * Hides the elements on the webpage
	 * Sends back to the panel all the parses xpath and css selectors
	 * 
	 * @param {object} jsonData - The json to parse
	 */
	function parseJsonConfig(jsonData) {
		//Parses the current json from the request
		//This is the same json as the textarea
		let json = JSON.parse(jsonData);
		//Create the elements list to send back
		let elementsToReturn = [];
		//Get the metadata field and exclude field from the json
		let metadata = json[0]['metadata'];
		let exclude = json[0]['exclude'];

		//Show elements that were previously hidden from the elementsToHide global
		if (__elementsToHide.length > 0) {
			__elementsToHide.forEach(function (elementObject) {
				if (elementObject['type'] != '__error') {
					elementObject['value'].forEach(function (element) {
						element.style.opacity = 1;
					}, this);
				}
			}, this);
		}

		//Reset the elementsToHide after everything is back to normal
		__elementsToHide = []

		//Grab all the metadata specified in the json
		//Gets the nodeValue for XPATH
		//Gets the textContent for CSS
		for (let key in metadata) {
			let currentExcludeObject = metadata[key];
			if (currentExcludeObject['type'] === 'CSS') {
				elementsToReturn.push(parseCss(key, currentExcludeObject['path'], true));
			}
			else if (currentExcludeObject['type'] === 'XPATH') {
				elementsToReturn.push(parseXPath(key, currentExcludeObject['path'], true));
			}
		}

		//Adds the elements to exclude in the elementsToHide
		for (let key in exclude) {
			let currentMetadataObject = exclude[key];
			if (currentMetadataObject['type'] === 'CSS') {
				__elementsToHide.push(parseCss(key, currentMetadataObject['path'], false));
			}
			else if (currentMetadataObject['type'] === 'XPATH') {
				__elementsToHide.push(parseXPath(key, currentMetadataObject['path'], false));
			}
		}

		//Reduces opacity of elements in elementsToHide
		//If an error is found, adds it in elements to send back
		__elementsToHide.forEach(function (elementObject) {
			if (elementObject['type'] != '__error') {
				elementObject['value'].forEach(function (element) {
					element.style.opacity = 0.1;
				}, this);
			}
			else {
				elementsToReturn.push(elementObject);
			}
		}, this);

		//Send back the values found
		setTimeout(function () {
			chrome.runtime.sendMessage({
				return: JSON.stringify(elementsToReturn)
			});
		}, 1);
	}


	/**
	 * Adds the __highlight class to the object at the currently being moused over
	 * 
	 * @param {event} event 
	 * @returns nothing
	 */
	function mouseoverHandler(event) {

		if (!__ableToMouseOver) {
			return;
		}

		if (event.target === document.body ||
			(__previousSelectedElement && __previousSelectedElement === event.target)) {
			return;
		}

		//Removes the __highlight class from the last element
		try {
			if (__previousSelectedElement) {
				__previousSelectedElement.className = __previousSelectedElement.className.replace(/\b__highlight\b/, '');
			}
		} catch (err) { }
		__previousSelectedElement = null;

		//Adds the __highlight class to the new element
		try {
			if (event.target) {
				__previousSelectedElement = event.target;
				__previousSelectedElement.className += ' __highlight';
			}
		}
		catch (err) {
			__previousSelectedElement = null;
		}
	}


	/**
	 * Stops the mouse click and instead sends the element being moused over to the panel
	 * Then turns itself off
	 * 
	 * @param {event} e - The mouse click event
	 * @returns {boolean} false
	 */
	function clickHandler(e) {

		if (!__ableToClick) {
			e.stopPropagation();
			e.preventDefault();
			e.stopImmediatePropagation();
			__ableToClick = true;
			sendMouseElement();
			return false;
		}
		return true;
	}


	/**
	 * Sends the xpath of the element that was moused over to the panel
	 * 
	 */
	function sendMouseElement() {
		__ableToClick = true;
		__ableToMouseOver = false;

		let jsonToSend = {
			mouse: getXPath(__previousSelectedElement)
		};

		try {
			if (__previousSelectedElement) {
				__previousSelectedElement.className = __previousSelectedElement.className.replace(/\b__highlight\b/, '');
				__previousSelectedElement = null;
			}
		}
		catch (err) {
			__previousSelectedElement = null;
			jsonToSend['return']['__error'] = err;
		}

		setTimeout(function () {
			chrome.runtime.sendMessage(jsonToSend);
		}, 1);
	}

	/**
	 * Gets a xpath string from a node
	 * https://stackoverflow.com/questions/9197884/how-do-i-get-the-xpath-of-an-element-in-an-x-html-file
	 * 
	 * @param {element} node 
	 * @returns {string} the xpath string
	 */
	function getXPath(node) {
		var comp, comps = [];
		var parent = null;
		var xpath = '';
		var getPos = function (node) {
			var position = 1, curNode;
			if (node.nodeType == Node.ATTRIBUTE_NODE) {
				return null;
			}
			for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
				if (curNode.nodeName == node.nodeName) {
					++position;
				}
			}
			return position;
		}

		if (node instanceof Document) {
			return '/';
		}

		for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
			comp = comps[comps.length] = {};
			switch (node.nodeType) {
				case Node.TEXT_NODE:
					comp.name = 'text()';
					break;
				case Node.ATTRIBUTE_NODE:
					comp.name = '@' + node.nodeName;
					break;
				case Node.PROCESSING_INSTRUCTION_NODE:
					comp.name = 'processing-instruction()';
					break;
				case Node.COMMENT_NODE:
					comp.name = 'comment()';
					break;
				case Node.ELEMENT_NODE:
					comp.name = node.nodeName;
					break;
			}
			comp.position = getPos(node);
		}

		for (var i = comps.length - 1; i >= 0; i--) {
			comp = comps[i];
			xpath += '/' + comp.name;
			if (comp.position != null && comp.position > 1) {
				xpath += '[' + comp.position + ']';
			}
		}

		return xpath.toLowerCase();

	}

	function validateJson(jsonToValidate) {
		let jsonToSend = {
			validate:
			{
				metadata: {},
				exclude: [],
				errors: []
			}
		}

		jsonToValidate = JSON.parse(jsonToValidate);

		let exludeData = jsonToValidate[0]['exclude'];
		let metadataData = jsonToValidate[0]['metadata'];

		exludeData.forEach(function (element) {
			let type = element['type'];
			let value;
			if (type === 'CSS') {
				value = parseCss('exclude', element['path']);
			}
			else {
				value = parseXPath('exclude', element['path']);
			}

			if (value['type'] === '__error') {
				jsonToSend['validate']['exclude'].push('bg-danger');
				jsonToSend['validate']['errors'].push(value);
			}
			else {
				if (value['value'].length > 0) {
					jsonToSend['validate']['exclude'].push('bg-success');
				}
				else {
					jsonToSend['validate']['exclude'].push('bg-warning');
				}
			}

		}, this);

		for (let key in metadataData) {
			let element = metadataData[key];
			let type = element['type'];
			let value;
			if (type === 'CSS') {
				value = parseCss('metadata', element['path']);
			}
			else {
				value = parseXPath('metadata', element['path']);
			}

			if (value['type'] === '__error') {
				jsonToSend['validate']['metadata'][key] = 'bg-danger';
				jsonToSend['validate']['errors'].push(value);
			}
			else {
				if (value['value'].length > 0) {
					jsonToSend['validate']['metadata'][key] = 'bg-success';
				}
				else {
					jsonToSend['validate']['metadata'][key] = 'bg-warning';
				}
			}
		}

		setTimeout(function () {
			chrome.runtime.sendMessage(jsonToSend);
		}, 1);
	}

	/**
	 * Adds a listener to the received messages
	 * 
	 */
	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {

			if (request.json) {
				parseJsonConfig(request.json);
			}

			if (request.mouse) {
				__ableToClick = false;
				__ableToMouseOver = true;
			}

			if (request.log) {
				console.log(request.log);
			}

			if (request.validate) {
				validateJson(request.validate);
			}

		});

};