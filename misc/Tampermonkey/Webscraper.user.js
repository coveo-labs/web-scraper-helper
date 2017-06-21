// ==UserScript==
// @name         Web Scraper Helper
// @namespace    http://coveo.github.io/
// @version      0.2
// @description  Web scraper helper tool for Coveo
// @author       Jerome Devost (jdevost@coveo.com)
// @grant        GM_addStyle
//
// @match        http://blog.coveo.com/*
//
// ==/UserScript==

/* jslint -W109 */
/* globals GM_addStyle */

//
// TO DO:
// 1. Edit the @match above  (be mindful of http: vs https:). You can have multiple @match.
// 2. Edit your Web Scraper Rules here
//
let jsonRules = [{
  "for": {
    "urls":[".*"]
  },
  "exclude": [{
    "type": "CSS", "path": "body > header, iframe"
    }, {
    "type": "CSS", "path": ".main .wrapper .container aside, .main-content .featured-post .addthis_toolbox, div#disqus_thread"
    }, {
    "type": "XPATH", "path": "/html/body/footer"
    }, {
    "type": "XPATH", "path": "/html/body/div[3]"
    }, {
    "type": "CSS", "path": "div#posts div#placement-bottom, div#posts div#no-posts, div#posts div#form, div#posts div#footer, div#disqus_thread #dsq-comments .pingback"
  }],
  "metadata": {
    "author": {
      "type": "XPATH", "path": "/html/body//article//div[@class='meta-info']//div[@class='author-container']/span[@class='author']/a/text()"
    },
    "authorloginname": {
      "type": "XPATH", "path": "substring-before(substring-after(/html/body//article//div[@class='meta-info']//div[@class='author-container']/span[@class='author']/a/@href,'/author/'),'/')"
    },
    "date": {
      "type": "XPATH", "path": "/html/body//article//div[@class='meta-info']//div[@class='time-container']/time//@datetime"
    },
    "tags": {
      "type": "XPATH", "path": "/html/body//article//div[@class='topics']/ul/li/a/text()"
    },
    "title": {
      "type": "XPATH", "path": "/html/body//div[@class='title-container']/h2/a/text()"
    }
  }
}];



//
// That's it, Reload the page you want to scrape. Rinse and Repeat.
// Don't need to edit the code below this line.
// Enjoy!
// -----------------------------------------------------------------
//





(function() {
	'use strict';
	// Add CSS for the side panel
	GM_addStyle(`
		#webscraping-container { position: absolute; font-family: sans-serif; right: 0; width: 300px; top: 0; bottom: 0; background-color: #F1F1E1; overflow: auto; font-size: 14px; display: flex; flex-direction: column; }
		#webscraping-container i { color: #F58020; margin: 5px; }
		#webscraping-container input { -webkit-appearance: checkbox !important; height: auto; width: auto; }
		#webscraping-container button { margin: 3px 5px; }
		#webscraping-config { margin: 5px; flex: 4; }
		#webscraping-fields { color: #313A45; overflow: auto; padding: 5px; flex: 6; }
		#webscraping-fields b { color: #004990; }
		.webscraping-metadata-field { margin: 5px 0 0 3px; }
		html { overflow: hidden; }
		body { position: absolute; right: 300px; left: 300px; top: 0; bottom: 0; }
	`);

	jsonRules = JSON.stringify(jsonRules, null, 2);

	let sidebarContainer = document.createElement('div');
	sidebarContainer.id = 'webscraping-container';
	sidebarContainer.innerHTML = `<i>Web scraper options:</i><textarea id="webscraping-config" placeholder="JSON goes here." style="display:none;">${jsonRules}</textarea>
		<div style="padding: 5px;">
			<label><input type="checkbox" id="webscraping-hide-cb"> Hide/Remove</label>
			<button id="webscraping-encode-button" title="Useful when using Sitemap sources">Encode</button>
			<button id="webscraping-copy-button">Copy Rules to Clipboard</button>
		</div>
		<i>Fields:</i>
		<div id="webscraping-fields"></div>`;

	document.documentElement.appendChild(sidebarContainer);

	/**
	 * Helper function to update CSS style on a node using a object (hashmap).
	 */
	let setStyle = (domNode, styleMap)=>{
		for (let styleName in styleMap) {
			domNode.style[styleName] = styleMap[styleName];
		}
	};

	// Update document body so it plays nicely with a new sidebar.
	setStyle(document.documentElement, { overflow: 'hidden' });
	setStyle(document.body, { position: 'absolute', left: 0, right: '300px', top: 0, bottom: 0, overflow: 'auto' });

	/**
	 * Use document.querySelectorAll() and CSS rule to find nodes in the page.
	 */
	let getNodesCSS = rule => {
		let cssPath = rule.path, wantText = false;
		// support for ::text in the CSS path, to return only the text part of the element found.
		if (/::text/g.test(cssPath)) {
			wantText = true;
			// ::text isn't supported by document.querySelectorAll(), so we remove it from the path and will retrieve the .textContent after.
			cssPath = cssPath.replace(/::text/g, '');
		}

		let nodes = document.querySelectorAll(cssPath);
		if (wantText) {
			// need to get the text part only.
			nodes = nodes.length ? nodes[0].textContent : '';
		}
		return rule.isBoolean ? (nodes && nodes.length ? true : false) : nodes;
	};

	/**
	 * Use document.evaluate() and XPATH rule to find nodes in the page.
	 */
	let getNodesXPath = rule => {
		let nodes = document.evaluate(rule.path, document);
		if (nodes.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || nodes.resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
			// found many dom elements, return them all in a simple array.
			let elements = [], node;
			while ((node = nodes.iterateNext())) {
				elements.push(node);
			}
			return elements;
		}
		else if (nodes.resultType === XPathResult.NUMBER_TYPE) {
			return [nodes.numberValue];
		}
		else if (nodes.resultType === XPathResult.STRING_TYPE) {
			return [nodes.stringValue];
		}
		else if (nodes.resultType === XPathResult.BOOLEAN_TYPE) {
			return [nodes.booleanValue];
		}
		return [];
	};

	/**
	 * Returns an array of DOM nodes based on a Web Scraper rule.
	 */
	let getNodes = rule => {
		if (rule.type === 'CSS') {
			return getNodesCSS(rule);
		}
		else if (rule.type === 'XPATH') {
			return getNodesXPath(rule);
		}
		return [];
	};

	/**
	 * Hide DOM nodes from the page based on Web Scraper rules passed in.
	 */
	let exclude = (rules) => {
		rules.forEach(rule => {
			let nodes = getNodes(rule);
			nodes.forEach(n => {
				n.style.opacity = 0.1;
				if (localStorage.getItem('hideWhenExclude') === 'true') {
					n.parentNode.removeChild(n);
				}
			});
		});
	};

	/**
	 * Get the fields matching the metadata in the Web Scraper rules and show them in the sidebar.
	 */
	let getFields = meta => {
			let aFields = [];
			for (var field in meta) {
					let v = getNodes(meta[field]);
					if (v && v.map) {
							v = v.map(v => ((v && v.outerHTML) || (v && v.textContent) || v));
					}
					if (v || /boolean|number|string/g.test(typeof v)) {
							aFields.push({
									f: field,
									v: (v && v.textContent) || v
							});
					}
			}
			// generate html code for all metadata fields.
			let html = aFields.map(obj => {
					let v = obj.v;
					if (obj.v && obj.v.map) {
							obj.v = obj.v.map( v=>{
									// encode html characters to highlight when we get DOM nodes instead of text.
									return v.replace(/</g, '&lt;');
							});
					}
					// encode html characters to highlight when we get DOM nodes instead of text.
					v = (''+v).replace(/</g, '&lt;');

					if (obj.v && obj.v.join && obj.v.length > 1) {
							v = `<ol><li>${obj.v.join('</li><li>')}</li></ol>`;
					}
					return `<div class="webscraping-metadata-field">${obj.f}: <b>${v}</b></div>`;
			});
			document.getElementById('webscraping-fields').innerHTML = `${html.join('\n')}`;
	};

	/**
	 * Process the page using the `jsonRules`.
	 */
	let scrapePage = () => {
		try {
			let config = JSON.parse(document.getElementById('webscraping-config').value);
			config = (config && config.length && config[0]) || {};

			exclude(config.exclude);
			getFields(config.metadata);
		} catch (e) {
			console.log(e);
		}
	};

	/**
	 * Copy JSON to clipboard.
	 */
	let copyJson = (bLeaveOpen, bEncode) => {
		let configTextarea = document.getElementById('webscraping-config');
		let json = JSON.parse(configTextarea.value);
		configTextarea.value = JSON.stringify(json,null,2);
		if (bEncode) {
			// encode the JSON as a string. Useful for Sitemap sources.
			configTextarea.value = '"' + JSON.stringify(json).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
		}
		configTextarea.style.display = 'block';
		configTextarea.focus();

		document.execCommand('SelectAll');
		document.execCommand("Copy", false, null);

		if (bLeaveOpen!==true) {
			configTextarea.style.display = 'none';
		}
	};
	/**
	 * Quick util function to encode the JSON as a string. Useful for Sitemap sources.
	 */
	let encodeJson = () => {
		copyJson(true, true);
	};
	/**
	 * Toggle Hide/Remove for the exclude rules. The setting is saved in the localStorage and read again on page reload.
	 */
	let toggleHide = () => {
		localStorage.setItem('hideWhenExclude', '' + (localStorage.getItem('hideWhenExclude') !== 'true'));
		document.location = document.location.href;
	};

	// set up onclick events for the Hide/Remove toggle and Encode button.
	document.getElementById('webscraping-encode-button').onclick = encodeJson;
	document.getElementById('webscraping-copy-button').onclick = copyJson;
	document.getElementById('webscraping-hide-cb').onclick = toggleHide;
	if ((localStorage.getItem('hideWhenExclude') === 'true')) {
		document.getElementById('webscraping-hide-cb').checked = 'checked';
	}

	setTimeout(scrapePage, 200); // old school trick to execute in a new 'thread' (not really, but you know what I mean).

})();
