// jshint -W110, -W003
/*global chrome*/

let MOCK = {
	'blog.coveo.com': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"header,aside,footer"}],"metadata":{"tags":{"type":"CSS","path":".topics li::text"}}}]),
	'bell.ca': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"footer, #inqC2CImgContainer_AnchoredB,iframe, .rsx-icon-links, .icon-links"},{"type":"CSS","path":"header > *:not(.rsx-federal-bar), .rsx-federal-bar *:not(option)"},{"type":"CSS","path":".rsx-modal-group-wrap, #write-review-modal-lightbox, .rsx-availability-bar, .availability-bar, .rsx-offer-details, .fui-box-footer"},{"type":"CSS","path":"ul.mte-page-header__options"},{"type":"CSS","path":".mte-category-header, .mte-category-nav, .mte-back"},{"type":"CSS","path":".fui-topbar, .fui-topnav, .fui-page-footer, .fui-page-aside"},{"type":"CSS","path":".rsx-connector-login-modal-pane,  .rsx-modal-group-wrap"},{"type":"CSS","path":".mte-article-footer, .mte-multi-column, .mte-back-to-top, .modal, figure.figure, .mte-contact-us"}],"metadata":{"errorpage":{"type":"CSS","isBoolean":true,"path":"main.error-page"},"howtotopic":{"type":"CSS","path":".mte-article-header h1::text"},"howtosteps":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item::text"},"howtosteps2":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item a::text"},"prov":{"type":"CSS","path":"footer .js-current-language-native option:not([disabled])::attr(value)"}}}]),
};

let _guid = 0, guid = ()=> { return `guid-${_guid++}`; };

class Storage {
	constructor() {
		this._listeners = {};
		this._sCurrentName = null;
		this._sCurrentSpec = null;
		this.specs = MOCK;

		console.log('SORTAGA:E');
		this.reload();
	}

	addChangeListener(f) {
		let id = guid();
		this._listeners[id] = f;
		return id;
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

	getNames() {
		return Object.keys(this.specs);
	}

	getSpec(name) {
		this._sCurrentName = name;
		return this.specs[name] || this.getDefault();
	}

	loadSpec(name) {
		this._sCurrentName = name;
		this.set( this.getSpec(name) );
	}

	newSpec(name) {
		console.log('NEW SPEC: ', name);
		this.specs[name] = this.getDefault();
	}

	reload(callback) {
		if (chrome.storage && chrome.storage.local) {
			chrome.storage.local.get(null, store=>{
				console.log('RELOAD-CB: ', store);
				let specs = {};
				try {
					Object.keys(store).forEach(k=>{
						try {
							let j = JSON.parse(store[k]);
							j = j && j.length && j[0];
							if (j && j.exclude && j.metadata) {
								specs[k] = store[k];
							}
						}
						catch(e) {
							console.log('Parse failed for ', k, store[k]);
						}
					});
					this.specs = specs;
					if (callback) {
						callback(this.specs);
					}
				}
				catch(e) {
					console.log(e);
				}
			});
		}
	}

	remove(name) {
		this._sCurrentName = null;
		this._sCurrentSpec = null;

		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.remove(name);
		}
		else {
			delete this.specs[name];
		}

		Object.keys(this._listeners)
			.forEach(k=>{
				this._listeners[k]([{'for':null, exclude:null, metadata: null }]);
			});

	}

	saveCurrent() {
		this.specs[this._sCurrentName] = this._sCurrentSpec;
	}

	set(json, id) {
		// if (chrome.storage && chrome.storage.local) {
		// 	return chrome.storage.local.set(json);
		// }

		// debugger;
		// console.log(`SET - Need mock for`, json);
		// Object.keys(json).forEach(k=>{
		// 	MOCK[k] = json[k];
		// });


		try {
			if (typeof json !== 'string') {
				json = JSON.stringify(json);
			}

			this._sCurrentSpec = json;
			json = JSON.parse(json);
			console.log(Object.keys(this._listeners), id);
			Object.keys(this._listeners)
				.filter( k=>(k!==id) )
				.forEach(k=>{
					this._listeners[k](json);
				});
		}
		catch(e) {
			console.log(e);
		}
	}
}

export default (new Storage());
