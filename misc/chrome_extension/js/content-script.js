'use strict';
// jshint -W110, -W003
/*global chrome*/

class RulePath {
	constructor(spec, title, subItemName, container) {
		this.path = spec.path;
		this.isBoolean = spec.isBoolean ? true : false;
		if (title !== undefined) {
			this.title = title;
		}
		else if (spec.name) {
			this.title = spec.name;
		}
		this.id = spec.id;

		this.container = container || null;

		if (subItemName) {
			this.subItemName = subItemName;
		}
		return this;
	}

	getElements () {
		return null;
	}

	exludeFromPage () {
		let elements = this.getElements(true);
		(elements || []).forEach(e => {
			if (e && e.classList) {
				e.classList.add('web-scraper-helper-exclude');
			}
		});
	}

	formatError (err) {
		return `[${this.title}] Failed to parse ${this.type} "${this.path}"\n${err}`;
	}

	toJson () {
		let o = { type: this.type, path: this.path };
		if (this.subItemName) {
			o.subItemName = this.subItemName;
		}
		if (this.isBoolean) {
			o.isBoolean = true;
		}
		if (this.title !== undefined) {
			o.title = this.title;
		}
		let elements = this.getElements();
		if (elements) {
			o.value = elements;
		}
		if (this._error) {
			o.error = this.error;
		}
		return o;
	}

	toString () {
		return JSON.stringify(this.toJson());
	}

	isError () {
		return this._error ? true : false;
	}

	/**
	 * isValid means some element in the page matches this rule.
	 */
	isValid () {
		if (this._isValid === undefined) {
			this._elements = this.getElements();
			this._isValid = (this._elements && this._elements.length ? true : false);
		}
		return this._isValid;
	}
}

class CssRule extends RulePath {
	constructor(spec, title, subItemKey, container) {
		super(spec, title, subItemKey, container);
		this.type = 'CSS';
		this.isValid();
	}

	getElements () {
		try {
			let reTextSub = /::text\b/;
			let reAttrSub = /::attr\b/;
			let shouldReturnAttr = false;
			let attrToGet = "";
			let shouldReturnText = false;

			let cssSelector = this.path || '';
			if (reTextSub.test(cssSelector)) {
				shouldReturnText = true;
				cssSelector = cssSelector.split(reTextSub)[0];
			}

			if (reAttrSub.test(cssSelector)) {
				shouldReturnAttr = true;
				attrToGet = cssSelector.split(reAttrSub)[1].slice(1, -1);
				cssSelector = cssSelector.split(reAttrSub)[0];
			}

			let container = this.container || document;
			let nodes = [],
				elements = [];

			let n = container.querySelectorAll(cssSelector);
			n.forEach(e => {
				nodes.push(e);
			});

			if (this.isBoolean) {
				return [(nodes && nodes.length ? true : false)];
			}

			(nodes || []).forEach(e => {
				let value = e;
				if (shouldReturnText) {
					value = e.textContent;
				}

				if (shouldReturnAttr) {
					value = e.getAttribute(attrToGet);
				}

				elements.push(value);
			});
			return elements;
		}
		catch (err) {
			// console.error(err);
			this._error = this.formatError(err);
			return null;
		}
	}
}

class XPathRule extends RulePath {
	constructor(spec, title, subItemKey, container) {
		super(spec, title, subItemKey, container);
		this.type = 'XPATH';
		this.isValid();
	}

	/**
	 *
	 * @param {*} asIs if true, return the element as is, not as text.
	 */
	getElements (asIs) {
		try {
			let nodes = document.evaluate(this.path, this.container || document);
			let e, elements = [];

			switch (nodes.resultType) {
				case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
				case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
					while ((e = nodes.iterateNext())) {
						let value = e.nodeValue;
						if (asIs) {
							value = e;
						}
						else if (value === null) {
							value = e.outerHTML;
						}
						elements.push(value);
					}
					break;
				case XPathResult.NUMBER_TYPE:
					elements.push(nodes.numberValue);
					break;
				case XPathResult.STRING_TYPE:
					elements.push(nodes.stringValue);
					break;
				case XPathResult.BOOLEAN_TYPE:
					elements.push(nodes.booleanValue);
					break;
			}

			if (this.isBoolean) {
				return [(elements && elements.length ? true : false)];
			}

			return elements;
		}
		catch (err) {
			// console.error(err);
			this._error = this.formatError(err);
			return null;
		}
	}
}

class ErrorRule extends RulePath {
	constructor(spec, title) {
		super(spec, title);
		this.type = 'ERROR';
		this._error = 'Unknown type: ' + JSON.stringify(spec);
	}
}

let createRule = (obj, title, subItemKey, container) => {
	if (obj.type === 'CSS') {
		return new CssRule(obj, title, subItemKey, container);
	}
	if (obj.type === 'XPATH') {
		return new XPathRule(obj, title, subItemKey, container);
	}
	return new ErrorRule(obj, title);
};

let clearPreviousExcludedElements = () => {
	document.querySelectorAll('.web-scraper-helper-exclude').forEach(e => {
		if (e && e.classList) {
			e.classList.remove('web-scraper-helper-exclude');
		}
	});
};

let processGlobal = (globalSpec) => {
	//Get the metadata field and exclude field from the json
	let metadata = globalSpec.metadata;
	let exclude = globalSpec.exclude;

	//Grab all the metadata specified in the json
	//Gets the nodeValue for XPATH
	//Gets the textContent for CSS
	let rules = [];
	for (let key in metadata) {
		let rule = createRule(metadata[key], key);
		rules.push(rule.toJson());
	}

	//Adds the elements to exclude in the elementsToHide
	(exclude || []).forEach(r => {
		let rule = createRule(r);
		rule.exludeFromPage();
	});

	return rules;
};

let findType = (specs, subItemKey) => {
	let spec = specs.filter(s => {
		return (s && s.for && s.for.types && s.for.types.includes(subItemKey)) ? true : false;
	});

	return spec.length ? spec[0] : null;
};

let processSubItems = (specs, subItemKey) => {
	let subItems = [];

	let spec = findType(specs, subItemKey);
	if (!spec) {
		return subItems;
	}

	let path = specs[0].subItems[subItemKey];
	let metadata = spec.metadata;
	let containers = createRule(path).getElements(true);

	(containers || []).forEach(c => {
		let subItemsResults = [];
		for (let key in metadata) {
			let rule = createRule(metadata[key], key, subItemKey, c);
			subItemsResults.push(rule.toJson());
		}
		if (subItemsResults.length) {
			let { subItemName } = subItemsResults[0];
			subItems.push({
				subItemName,
				values: subItemsResults
			});
		}
	});

	return subItems;
};

/**
 * Parses the jsonData
 * Hides the elements on the webpage
 * Sends back to the panel all the parses xpath and css selectors
 *
 * @param {object} jsonData - The json to parse
 */
let parseJsonConfig = (sJson, port) => {
	clearPreviousExcludedElements();

	let wsSpecs = JSON.parse(sJson);

	let globalSpec = wsSpecs[0]; // TODO: update when adding support for subItems
	let rules = processGlobal(globalSpec);

	if (globalSpec.subItems) {
		Object.keys(globalSpec.subItems).forEach(subItemKey => {
			let subItems = processSubItems(wsSpecs, subItemKey);
			rules = rules.concat(subItems);
		});
	}

	port.postMessage({ return: JSON.stringify(rules) });
};


let validateJson = (sJson, port) => {
	clearPreviousExcludedElements();

	let validationResults = { rules: {}, errors: [] },
		wsSpecs = JSON.parse(sJson),
		globalRules = [],
		subItemsRules = [];

	(wsSpecs || []).forEach(spec => {
		// add exclude rules
		globalRules = globalRules.concat(spec.exclude || []);
		for (let m in spec.metadata) {
			globalRules.push(spec.metadata[m]);
		}
		for (let m in spec.subItems) {
			let subItem = spec.subItems[m];
			globalRules.push(subItem);

			let s = findType(wsSpecs, m);
			if (s) {
				subItemsRules.push({
					spec: s,
					container: subItem
				});
			}
		}
	});

	let validate = (element, container) => {
		let rule = createRule(element, null, null, container);
		if (rule.isError()) {
			validationResults.rules[rule.id] = 'bg-danger';
			validationResults.errors.push(rule._error);
		}
		// if rule was found and successful previously, do not update its state to warning.
		else if (validationResults.rules[rule.id] !== 'bg-success') {
			validationResults.rules[rule.id] = (rule.isValid() ? 'bg-success' : 'bg-warning');
		}
	};

	(globalRules || []).forEach(rule => validate(rule));

	(subItemsRules || []).forEach(element => {
		// find eachcontainers.forEach(c=> {
		let containers = createRule(element.container).getElements(true);
		(containers || []).forEach(c => {
			// for each container found, validate the metadata
			let meta = element.spec && element.spec.metadata;
			if (meta) {
				Object.keys(meta).forEach(key => validate(meta[key], c));
			}
		});
	});

	port.postMessage({ validate: validationResults });
};

window.onload = () => {
	try {
		let conn = chrome.runtime.connect({ name: "wshpanel" });
		chrome.runtime.onConnect.addListener((port) => {
			console.assert(port.name === 'wshpanel');

			port.onMessage.addListener((request, port) => {
				if (request.json) {
					parseJsonConfig(request.json, port);
				}

				if (request.log) {
					console.log('request.log:\n', request.log);
				}

				if (request.validate) {
					validateJson(request.validate, port);
				}
			});
		});

		conn.postMessage({ reload: 1 });
	}
	catch (e) {
		// console.error(e);
	}

};
