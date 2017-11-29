'use strict';
// jshint -W110, -W003
/*global chrome*/

class RulePath  {
	constructor(spec, title) {
		this.path = spec.path;
		this.isBoolean = spec.isBoolean ? true : false;
		if (title !== undefined) {
			this.title = title;
		}

		return this;
	}

	getElements() {
		return null;
	}

	exludeFromPage() {
		let elements = this.getElements();
		(elements || []).forEach(e=> {
			e.classList.add('web-scraper-helper-exclude');
		});
	}

	formatError(err) {
		return `[${this.title}] Failed to parse ${this.type} "${this.path}"\n${err}`;
	}

	toJson() {
		let o = {type:this.type, path: this.path};
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
		if (this._error ) {
			o.error = this.error;
		}
		return o;
	}

	toString() {
		return JSON.stringify(this.toJson());
	}

	isError() {
		return this._error ? true : false;
	}

	/**
	 * isValid means some element in the page matches this rule.
	 */
	isValid() {
		if (this._isValid === undefined) {
			this._elements = this.getElements();
			this._isValid = (this._elements && this._elements.length? true: false);
		}
		return this._isValid;
	}
}

class CssRule extends RulePath {
	constructor(spec, title) {
		super(spec, title);
		this.type = 'CSS';
		this.isValid();
	}
	getElements() {
		try {
			let reTextSub = /::text\b/;
			let reAttrSub = /::attr\b/;
			let shouldReturnAttr = false;
			let attrToGet = "";
			let shouldReturnText = false;

			let cssSelector = this.path || '';
			if( reTextSub.test(cssSelector) ){
				shouldReturnText = true;
				cssSelector = cssSelector.split(reTextSub)[0];
			}

			if( reAttrSub.test(cssSelector) ){
				shouldReturnAttr = true;
				attrToGet = cssSelector.split(reAttrSub)[1].slice(1,-1);
				cssSelector = cssSelector.split(reAttrSub)[0];
			}

			let nodes = document.querySelectorAll(cssSelector),
				elements = [];

			(nodes||[]).forEach(e => {
				let value = e;
				if (shouldReturnText) {
					value = e.textContent;
				}

				if(shouldReturnAttr){
					value = e.getAttribute(attrToGet);
				}

				elements.push(value);
			});
			return elements;
		}
		catch (err) {
			this._error = this.formatError(err);
			return null;
		}
	}
}

class XPathRule extends RulePath {
	constructor(spec, title) {
		super(spec, title);
		this.type = 'XPATH';
		this.isValid();
	}
	getElements() {
		try {
			let nodes = document.evaluate(this.path, document);
			let e, elements = [];

			switch(nodes.resultType) {
				case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
				case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
					while ( (e = nodes.iterateNext()) ) {
						let value = e.nodeValue;
						if (value === null) {
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
				case XPathResult.NUMBEBOOLEAN_TYPER_TYPE:
					elements.push(nodes.booleanValue);
					break;
			}

			return elements;
		}
		catch (err) {
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

let createRule = (obj, title) => {
	if (obj.type === 'CSS') {
		return new CssRule(obj, title);
	}
	if (obj.type === 'XPATH') {
		return new XPathRule(obj, title);
	}
	return new ErrorRule(obj, title);
};

window.onload = ()=>{
	// your code
	setTimeout(()=>{
		chrome.runtime.sendMessage({reload:1});
	}, 1);

	let clearPreviousExcludedElements = ()=> {
		document.querySelectorAll('.web-scraper-helper-exclude').forEach(e=>{
			e.classList.remove('web-scraper-helper-exclude');
		});
	};

	chrome.runtime.connect();

	/**
	 * Parses the jsonData
	 * Hides the elements on the webpage
	 * Sends back to the panel all the parses xpath and css selectors
	 *
	 * @param {object} jsonData - The json to parse
	 */
	let parseJsonConfig = (sJson) => {
		clearPreviousExcludedElements();

		let wsSpecs = JSON.parse(sJson);
		let globalSpec = wsSpecs[0]; // TODO: update when adding support for subItems

		//Get the metadata field and exclude field from the json
		let metadata = globalSpec.metadata;
		let exclude = globalSpec.exclude;

		//Grab all the metadata specified in the json
		//Gets the nodeValue for XPATH
		//Gets the textContent for CSS
		let rules = [];
		for (let key in metadata) {
			let rule = createRule(metadata[key], key);
			rules.push( rule.toJson() );
		}

		//Adds the elements to exclude in the elementsToHide
		(exclude||[]).forEach(r=> {
			let rule = createRule(r);
			rule.exludeFromPage();
		});

		//Send back the values found
		setTimeout(()=>{
			chrome.runtime.sendMessage({return: JSON.stringify(rules)});
		}, 1);
	};

	let validateJson = (sJson) => {
		clearPreviousExcludedElements();

		let validationResults = {
			metadata: {},
			exclude: [],
			errors: []
		};

		let wsSpecs = JSON.parse(sJson);
		let globalSpec = wsSpecs[0];

		(globalSpec.exclude||[]).forEach(element => {
			let rule = createRule(element);
			if (rule.isError()) {
				validationResults.exclude.push('bg-danger');
				validationResults.errors.push(rule._error);
			}
			else {
				validationResults.exclude.push(rule.isValid() ? 'bg-success' : 'bg-warning');
			}
		});

		for (let key in globalSpec.metadata) {
			let element = globalSpec.metadata[key];
			let rule = createRule(element, key);

			if (rule.isError()) {
				validationResults.metadata[key] = 'bg-danger';
				validationResults.errors.push(rule._error);
			}
			else {
				validationResults.metadata[key] = (rule.isValid() ? 'bg-success' : 'bg-warning');
			}
		}

		setTimeout(()=>{
			let payload = {validate: validationResults};
			chrome.runtime.sendMessage(payload);
		}, 1);
	};

	/**
	 * Adds a listener to the received messages
	 *
	 */
	chrome.runtime.onMessage.addListener(
		(request/*, sender, sendResponse*/) => {

			if (request.json) {
				parseJsonConfig(request.json);
			}

			if (request.log) {
				console.log('request.log:\n', request.log);
			}

			if (request.validate) {
				validateJson(request.validate);
			}

		});

};