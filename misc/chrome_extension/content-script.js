'use strict';

var port = chrome.runtime.connect();
//global since it needs to persist beyond the function scope
var elementsToHide = [];
var prev;
var ableToMouseOver = false;
var ableToClick = true;
document.body.onmouseover = mouseoverHandler;
document.body.onclick = clickHandler;

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

		if (nodes.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || nodes.resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
			while (e = nodes.iterateNext()) {
				if (getText) {
					elements.push(e.nodeValue);
				}
				else {
					elements.push(e);
				}
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
		return { type: "__error", value: "Failed to parse XPath \'" + xpathString + "\'<br>" + err };
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
		return { type: "__error", value: "Failed to parse CSS \'" + cssSelector + "\'<br>" + err };
	}
}

function parseJsonConfig(jsonData) {
	//Parses the current json from the request
	//This is the same json as the textarea
	let json = JSON.parse(jsonData);
	//Create the elements list to send back
	let elements = [];
	//Get the metadata field and exclude field from the json
	let metadata = json[0]['metadata'];
	let exclude = json[0]['exclude'];

	//Show elements that were previously hidden from the elementsToHide global
	if (elementsToHide.length > 0) {
		elementsToHide.forEach(function (elementArray) {
			if (elementArray['type'] != "__error") {
				elementArray['value'].forEach(function (element) {
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
		if (metadata[key]['type'] == "CSS") {
			elements.push(parseCss(key, metadata[key]['path'], true));
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
	//If an error is found, adds it in elements to send back
	elementsToHide.forEach(function (elementArray) {
		if (elementArray['type'] != "__error") {
			elementArray['value'].forEach(function (element) {
				element.style.opacity = 0.1;
			}, this);
		}
		else {
			elements.push(elementArray);
		}
	}, this);

	//Send back the values found
	setTimeout(function () {
		chrome.runtime.sendMessage({
			return: JSON.stringify(elements)
		});
	}, 1);
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {

		if (request.json) {
			parseJsonConfig(request.json);
		}

		if (request.mouse) {
			ableToClick = false;
			ableToMouseOver = true;
		}

	});

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
			prev.className = prev.className.replace(/\bhighlight\b/, '');
			prev = undefined;
		}
	}
	catch (err) {
		prev = undefined;
	}

	try {
		if (event.target) {
			prev = event.target;
			prev.className += " highlight";
		}
	}
	catch (err) {
		prev = undefined;
	}
}

function clickHandler(e) {

	if (!ableToClick) {
		e.stopPropagation();
		e.preventDefault();
		e.stopImmediatePropagation();

		sendMouseElement();

		return false;
	}

}

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

//https://stackoverflow.com/questions/9197884/how-do-i-get-the-xpath-of-an-element-in-an-x-html-file
function getXPath(node) {
    var comp, comps = [];
    var parent = null;
    var xpath = '';
    var getPos = function(node) {
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