// jshint -W110, -W003
/*global chrome*/

let MOCK = {
	'__jsons': ['blog.coveo.com', 'bell.ca'],
	'blog.coveo.com': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"header,aside,footer"}],"metadata":{"tags":{"type":"CSS","path":".topics li::text"}}}]),
	'bell.ca': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"footer, #inqC2CImgContainer_AnchoredB,iframe, .rsx-icon-links, .icon-links"},{"type":"CSS","path":"header > *:not(.rsx-federal-bar), .rsx-federal-bar *:not(option)"},{"type":"CSS","path":".rsx-modal-group-wrap, #write-review-modal-lightbox, .rsx-availability-bar, .availability-bar, .rsx-offer-details, .fui-box-footer"},{"type":"CSS","path":"ul.mte-page-header__options"},{"type":"CSS","path":".mte-category-header, .mte-category-nav, .mte-back"},{"type":"CSS","path":".fui-topbar, .fui-topnav, .fui-page-footer, .fui-page-aside"},{"type":"CSS","path":".rsx-connector-login-modal-pane,  .rsx-modal-group-wrap"},{"type":"CSS","path":".mte-article-footer, .mte-multi-column, .mte-back-to-top, .modal, figure.figure, .mte-contact-us"}],"metadata":{"errorpage":{"type":"CSS","isBoolean":true,"path":"main.error-page"},"howtotopic":{"type":"CSS","path":".mte-article-header h1::text"},"howtosteps":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item::text"},"howtosteps2":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item a::text"},"prov":{"type":"CSS","path":"footer .js-current-language-native option:not([disabled])::attr(value)"}}}]),
};

let _guid = 0, guid = ()=> { return `guid-${_guid++}`; };

class Storage {
	constructor() {
		this._listeners = {};
	}

	addChangeListener(f) {
		let id = guid();
		this._listeners[id] = f;
	}

	removeChangeListener(id) {
		delete this._listeners[id];
	}

	get(attr, callback) {
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

	getDefault() {
		return JSON.stringify( [{"for":{"urls":[".*"]},"exclude":[],"metadata":{}}] );
	}

	remove(attr, callback) {
		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.remove(attr, callback);
		}

		console.log(`REMOVE - Need mock for`, attr, callback);
	}

	set(json, callback) {
		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.set(json, callback);
		}

		console.log(`SET - Need mock for`, json, callback);
		Object.keys(json).forEach(k=>{
			MOCK[k] = json[k];
		});

		try {
			json = JSON.parse(json);
			Object.values(this._listeners).forEach(listener=>{
				listener(json);
			});
		}
		catch(e) {
			console.log(e);
		}


		if (callback) {
			callback();
		}
	}
}

export default (new Storage());
