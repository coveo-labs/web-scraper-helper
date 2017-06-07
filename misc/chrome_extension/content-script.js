'use strict';
window.onload = function () {
	// your code 

	var port = chrome.runtime.connect();
	//global since it needs to persist beyond the function scope
	var elementsToHide = [];
	var prev;
	var ableToMouseOver = false;
	var ableToClick = true;
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
			return { type: '__error', value: 'Failed to parse XPath \'' + xpathString + '\'<br>' + err };
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
					value  = e.textContent;
				}
				elements.push(value);
			}, this);
			return { type: title, value: elements };
		}
		catch (err) {
			return { type: '__error', value: 'Failed to parse CSS \'' + cssSelector + '\'<br>' + err };
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
		if (elementsToHide.length > 0) {
			elementsToHide.forEach(function (elementObject) {
				if (elementObject['type'] != '__error') {
					elementObject['value'].forEach(function (element) {
						element.style.opacity = 1;
					}, this);
				}
			}, this);
		}

		//Reset the elementsToHide after everything is back to normal
		elementsToHide = []

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
				elementsToHide.push(parseCss(key, currentMetadataObject['path'], false));
			}
			else if (currentMetadataObject['type'] === 'XPATH') {
				elementsToHide.push(parseXPath(key, currentMetadataObject['path'], false));
			}
		}

		//Reduces opacity of elements in elementsToHide
		//If an error is found, adds it in elements to send back
		elementsToHide.forEach(function (elementObject) {
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

		if (!ableToMouseOver) {
			return;
		}

		if (event.target === document.body ||
			(prev && prev === event.target)) {
			return;
		}

		try {
			if (prev) {
				prev.className = prev.className.replace(/\b__highlight\b/, '');
				prev = undefined;
			}
		}
		catch (err) {
			prev = undefined;
		}

		try {
			if (event.target) {
				prev = event.target;
				prev.className += ' highlight';
			}
		}
		catch (err) {
			prev = undefined;
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

		if (!ableToClick) {
			e.stopPropagation();
			e.preventDefault();
			e.stopImmediatePropagation();

		}
		sendMouseElement();

		return false;
	}


	/**
	 * Sends the xpath of the element that was moused over to the panel
	 * 
	 */
	function sendMouseElement() {
		ableToClick = true;
		ableToMouseOver = false;

		let jsonToSend = {}
		jsonToSend['mouse'] = getXPath(prev);

		try {
			if (prev) {
				prev.className = prev.className.replace(/\bhighlight\b/, '');
				prev = undefined;
			}
		}
		catch (err) {
			prev = undefined;
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
				ableToClick = false;
				ableToMouseOver = true;
			}

			if (request.log) {
				console.log(request.log);
			}

		});

};