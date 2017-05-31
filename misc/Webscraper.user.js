// ==UserScript==
// @name         Web Scraper Helper
// @namespace    http://coveo.github.io/
// @version      0.2
// @description  Web scraper helper tool for Coveo
// @author       Jerome Devost
// @grant        GM_addStyle
//
// @match        http://source.coveo.com/*
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
    "type": "CSS", "path": "body > header"
    }, {
    "type": "CSS", "path": ".main .wrapper .container aside, .main-content .featured-post .addthis_toolbox"
    }, {
    "type": "XPATH", "path": "/html/body/footer"
    }, {
    "type": "XPATH", "path": "/html/body/div[3]"
    }, {
    "type": "CSS", "path": "div#posts div#placement-bottom, div#posts div#no-posts, div#posts div#form, div#posts div#footer, div#disqus_thread #dsq-comments .pingback"
  }],
  "metadata": {
    "date": {
      "type": "XPATH",
      "path": "substring-before(//meta[@property='article:published_time']/@content,'T')"
    },
    "tags": {
      "type": "XPATH",
      "path": "//meta[@property='article:tag']/@content"
    },
    "title": {
      "type": "XPATH",
      "path": "/html/body//h1[@class='title']/text()"
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
#webscraping-container button { margin: 3px 5px; }
#webscraping-config { margin: 5px; flex: 4; }
#webscraping-fields { color: #313A45; overflow: auto; padding: 5px; flex: 6; }
#webscraping-fields b { color: #004990; }
.webscraping-metadata-field { margin: 5px 0 0 3px; }
html { overflow: hidden; }
body { position: absolute; right: 300px; left: 300px; top: 0; bottom: 0; }
`);

// Helper function to update CSS style on a nodem (n) using a json object (s).
let setStyle = (n,s)=>{
  for (let k in s) {
    n.style[k] = s[k];
  }
};

jsonRules = JSON.stringify(jsonRules, null, 2);

let n = document.createElement('div');
n.id = 'webscraping-container';
n.innerHTML = `<i>Web scraper options:</i><textarea id="webscraping-config" placeholder="JSON goes here." style="display:none;">${jsonRules}</textarea>
  <div style="padding: 5px;">
    <label><input type="checkbox" id="webscraping-hide-cb"> Hide/Remove</label>
    <button id="webscraping-encode-button" title="Useful when using Sitemap sources">Encode</button>
  </div>
  <i>Fields:</i>
  <div id="webscraping-fields"></div>`;
// <button id="webscraping-again-button">Run Again.</button>
document.documentElement.appendChild(n);

setStyle(document.documentElement, { overflow: 'hidden' });
setStyle(document.body, { position: 'absolute', left: 0, right: '300px', top: 0, bottom: 0, overflow: 'auto' });

let getNodes = rule => {
	if (rule.type === 'CSS') {
		let p = rule.path, wantText = false;
		if (/::text/g.test(p)) {
			wantText = true;
			p = p.replace(/::text/g, '');
		}
		let nodes = document.querySelectorAll(p);
		if (wantText) {
			nodes = nodes.length ? nodes[0].textContent : '';
		}
		return rule.isBoolean ? (nodes && nodes.length ? true : false) : nodes;
	}
	else if (rule.type === 'XPATH') {
		let a = [], o, nodes = document.evaluate(rule.path, document);
		if (nodes.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || nodes.resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
			while ((o = nodes.iterateNext())) {
				a.push(o);
			}
			return a;
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
	}
	return [];
};

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

let getFields = meta => {
	let a = [];
	for (var field in meta) {
		let v = getNodes(meta[field]);
		if (v && v.map) {
			v = v.map(v => ((v && v.textContent) || v));
		}
		if (v || /boolean|number|string/g.test(typeof v)) {
			a.push({ f: field, v: (v && v.textContent) || v });
		}
	}
	let html = a.map(obj => {
		let v = obj.v;
		if (obj.v && obj.v.join && obj.v.length > 1) {
			v = `<ol><li>${obj.v.join('</li><li>')}</li></ol>`;
		}
		return `<div class="webscraping-metadata-field">${obj.f}: <b>${v}</b></div>`;
	});
	document.getElementById('webscraping-fields').innerHTML = `${html.join('\n')}`;
};

let scrapePage = () => {
	try {
		let c = JSON.parse(document.getElementById('webscraping-config').value);
		c = (c && c.length && c[0]) || {};
		exclude(c.exclude);

		getFields(c.metadata);
	} catch (e) {
		console.log(e);
	}
};
setTimeout(scrapePage, 222);
//scrapePage();

let encodeJson = () => {
	let json = JSON.parse(document.getElementById('webscraping-config').value);
	document.getElementById('webscraping-config').value = '"' + JSON.stringify(json).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    document.getElementById('webscraping-config').style.display = 'block';
};
let toggleHide = () => {
	localStorage.setItem('hideWhenExclude', '' + (localStorage.getItem('hideWhenExclude') !== 'true'));
	document.location = document.location.href;
};

//document.getElementById('webscraping-again-button').onclick = scrapePage;
document.getElementById('webscraping-encode-button').onclick = encodeJson;
document.getElementById('webscraping-hide-cb').onclick = toggleHide;
if ((localStorage.getItem('hideWhenExclude') === 'true')) {
	document.getElementById('webscraping-hide-cb').checked = 'checked';
}
})();
