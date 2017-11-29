// jshint -W110, -W003
/*global chrome*/

import Guid from './Guid';

class Storage {
	constructor() {
		this.specs = {};
		this._listeners = {};
		this._sCurrentName = null;
		this._sCurrentSpec = null;

		this.reload();
	}

	addChangeListener(f) {
		let id = Guid.get();
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
		this.specs[name] = this.getDefault();
	}

	reload(callback) {
		if (chrome.storage && chrome.storage.local) {
			chrome.storage.local.get(null, store=>{
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
			chrome.storage.local.remove(name);
		}
		else {
			delete this.specs[name];
		}

		Object.keys(this._listeners)
			.forEach(k=>{
				this._listeners[k]([{'for': null, exclude: null, metadata: null, validate: {}}]);
			});
	}

	saveCurrent() {
		this.specs[this._sCurrentName] = this._sCurrentSpec;
		if (chrome.storage && chrome.storage.local) {
			return chrome.storage.local.set({
				[this._sCurrentName]: this._sCurrentSpec
			});
		}
	}

	set(json, id) {
		try {
			if (typeof json !== 'string') {
				json = JSON.stringify(json);
			}

			this._sCurrentSpec = json;
			json = JSON.parse(json);

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
