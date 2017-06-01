'use strict';

var port = chrome.runtime.connect();
//global since it needs to persist beyond the function scope
var elementsToHide = [];

//Parses the XPath
//
//sample return
//{type:"title", value:[element, element]}
//
//title: The string for the type
//xpathString: the xpath to parse
//getTrue: BOOL, if the value return is the text instead of the element
var parseXPath = function (title, xpathString, getText) {
	try {
		let nodes = document.evaluate(xpathString, document);
		let e, elements = [];
		while (e = nodes.iterateNext()) {
			if (getText) {
				elements.push(e.nodeValue);
			}
			else {
				elements.push(e);
			}
		}
		return { type: title, value: elements };
	}
	catch (err) {
		return { type: "__error", value: "Failed to parse XPath \'" + xpathString + "\'\nError: " + err };
	}
}

//Parses the CSS selector
//
//sample return
//{type:"title", value:[element, element]}
//
//title: The string for the type
//xpathString: the css selector to parse
//getTrue: BOOL, if the value return is the text instead of the element
var parseCss = function (title, cssSelector, getText) {
	try {
		let nodes = document.body.querySelectorAll(cssSelector);
		let e, elements = [];
		nodes.forEach(function (e) {
			if (getText) {
				elements.push(e.textContent);
			}
			else {
				elements.push(e);
			}
		}, this);
		return { type: title, value: elements };
	}
	catch (err) {
		return { type: "__error", value: "Failed to parse CSS \'" + cssSelector + "\'\nError: " + err };
	}
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {

		//Parses the current json from the request
		//This is the same json as the textarea
		let json = JSON.parse(request.json);
		//Create the elements list to send back
		let elements = [];
		//Get the metadata field and exclude field from the json
		let metadata = json[0]['metadata'];
		let exclude = json[0]['exclude'];

		//Show elements that were previously hidden from the elementsToHide global
		if (elementsToHide.length > 0) {
			elementsToHide.forEach(function (elementArray) {
				elementArray['value'].forEach(function (element) {
					element.style.opacity = 1;
				}, this);
			}, this);
		}

		//Reset the elementsToHide after everything is back to normal
		elementsToHide = []

		//Grab all the metadata specified in the json
		//Gets the nodeValue for XPATH
		//Gets the textContent for CSS
		for (let key in metadata) {
			if (metadata[key]['type'] == "CSS") {
				elements.push(parsetrueCss(key, metadata[key]['path'], true));
			}
			else if (metadata[key]['type'] == "XPATH") {
				elements.push(parseXPath(key, metadata[key]['path'], true));
			}
		}

		//Adds the elements to exclude in the elementsToHide
		for (let key in exclude) {
			if (exclude[key]['type'] == "CSS") {
				elementsToHide.push(parseCss(key, exclude[key]['path'], false));
			}
			else if (exclude[key]['type'] == "XPATH") {
				elementsToHide.push(parseXPath(key, exclude[key]['path'], false));
			}
		}

		//Reduces opacity of elements in elementsToHide
		elementsToHide.forEach(function (elementArray) {
			elementArray['value'].forEach(function (element) {
				element.style.opacity = 0.1;
			}, this);
		}, this);

		//Send back the values found
		setTimeout(function () {
			chrome.runtime.sendMessage({
				return: JSON.stringify(elements)
			});
		}, 1);

	});

