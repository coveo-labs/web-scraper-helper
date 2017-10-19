let _guid = 0, guid = ()=>{
  let s4 = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `guid-${s4}-${_guid++}`;
};

class WebScraperSelector {
  constructor(json) {
    this.id = guid();
    this.setType(json && json.type);
    this.path = (json && json.path) || '';
  }
  render() {
    return `<div id="${this.id}" class="rule">
      <input type="checkbox" class="wsh-rule-type" ${this.type === 'CSS' ? 'checked' : ''}>
      <input type="text" class="wsh-rule-path" placeholder="Selector (XPath or CSS)" value="${this.path}">
      <span class="glyphicon glyphicon-remove"></span>
    </div>`;
  }
  setType(type) {
    this.type = type === 'XPATH' ? 'XPATH' : 'CSS';
  }
  toJson() {
    if (!this.path) {
      return null;
    }
    return {type: this.type, path: this.path};
  }
}

class WebScraperMetadata extends WebScraperSelector {
  constructor(name, json) {
    super(json);
    this.name = name || '';
  }

  render() {
    return `<div id="${this.id}" class="rule" data-field="${this.name}">
      <input type="checkbox" class="wsh-rule-type" ${this.type === 'CSS' ? 'checked' : ''}>
      <input type="text" class="wsh-rule-name" placeholder="Name" value="${this.name}">
      <input type="text" class="wsh-rule-path" placeholder="Selector (XPath or CSS)" value="${this.path}">
      <span class="glyphicon glyphicon-remove"></span>
    </div>`;
  }

  toJson() {
    let selector = super.toJson();
    if (!selector) {
      return null;
    }
    if (this.isAbsolute) {
      selector.isAbsolute = true;
    }
    if (this.isBoolean) {
      selector.isBoolean = true;
    }
    let o = {};
    o[this.name] = selector;
    return o;
  }
}

class WebScraperItem {
  constructor(json) {
    this._for = {};
    this.exclude = [];
    this.metadata = [];
    this.subItems = [];
    if (json) {
      Object.assign(this._for, json.for || {});
      this.exclude = (json.exclude||[]).map(i=>{
        return new WebScraperSelector(i);
      });
      Object.keys(json.metadata||{}).forEach(k=>{
        this.metadata.push(new WebScraperMetadata(k, json.metadata[k]));
      });
      Object.keys(json.subItems||{}).forEach(k=>{
        this.subItems.push(new WebScraperMetadata(k, json.subItems[k]));
      });
    }
  }

  _metaArrayToMap(name) {
    let map = {};
    (this[name] || [])
      .map(r=>r.toJson()) // simplify objects to their JSON expression
      .filter(r=>r) // Filter out null values
      .forEach(r=>{
        Object.assign(map, r); // add to map
      });
    return Object.keys(map).length ? map : null;
  }

  removeById(id) {
    this.exclude = this.exclude.filter(item=>{return item.id !== id;});
    this.metadata = this.metadata.filter(item=>{return item.id !== id;});
  }

  toJson() {
    let o = {
      for: this._for,
      exclude: (this.exclude || []).map(r=>r.toJson()).filter(r=>r),
    };
    let m = this._metaArrayToMap('metadata');
    if (m) {
      o.metadata = m;
    }
    m = this._metaArrayToMap('subItems');
    if (m) {
      o.subItems = m;
    }
    return o;
  }
  toString() {
    return JSON.stringify(this.toJson());
  }
}

class WebScraperSpec {
  constructor(json) {
    this._subItems = {};
    this._global = new WebScraperItem({urls: ['.*']});

    if (json && json.length) {
      let g = json.shift();
      this._global = new WebScraperItem(g);
    }
  }

  static create(sJson) {
    try {
      let json = JSON.parse(sJson);
      return new WebScraperSpec(json);
    }
    catch(e) {
      console.log('Invalid json:', e);
      return null;
    }
  }

  addExclude() {
    let newItem = new WebScraperSelector();
    this._global.exclude.push(newItem);
    return newItem;
  }

  addMeta() {
    let newItem = new WebScraperMetadata();
    this._global.metadata.push(newItem);
    return newItem;
  }

  // addSubItem(json) {
  // }

  removeById(id) {
    this._global.removeById(id);
  }

  _renderAddButton(name) {
    return `<div class="text-center">
        <div id="add-${name}" class="btn btn-sm btn-success"><span class="glyphicon glyphicon-plus"></span></div>
      </div>`;
  }

  render() {
      return `
      <h1>Exclude</h1>
      <div id="exclude-rules">
        ${this._global.exclude.map(e=>e.render()).join('\n')}
      </div>
      ${this._renderAddButton('exclude')}
      <h1>Metadata</h1>
      <div id="metadata-rules">
        ${this._global.metadata.map(e=>e.render()).join('\n')}
      </div>
      ${this._renderAddButton('metadata')}`;
  }

  toJson() {
    return [ Object.assign({}, this._global.toJson()) ];
    // , this._subItems);
  }

  toString() {
    return JSON.stringify(this.toJson());
  }
}

if (typeof module !== 'undefined') {
  module.exports = WebScraperSpec;
}
