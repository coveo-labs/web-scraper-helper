import Guid from './Guid';

class SpecHelper {

  static getDefault() {
    return [{
      for: {urls: ['.*']},
      exclude: [],
      metadata: {},
    }];
  }

  static get(specs, type) {
    let spec = null;
    if (specs instanceof Array) {
      if (!type) {
        spec = specs[0];
      }
      else {
        for (let i = 1; i < specs.length; i++) {
          if (specs[i].for.types.includes(type)) {
            spec = specs[i];
            break;
          }
        }
      }
    }
    return spec;
  }

  // Turns metadata object to an array, useful for rendering.
  static getMetadataAsArray(specs, type) {
    let spec = (specs instanceof Array ? SpecHelper.get(specs, type) : specs);
    let a = [];
    if (spec) {
      Object.keys(spec.metadata).forEach(k => {
        let m = spec.metadata[k];
        m.name = m.name !== undefined ? m.name : k;
        a.push(m);
      });
    }
    return a;
  }

  static addExclude(specs, type) {
    // return SpecHelper.addRule(specs, 'exclude', type, {id:Guid.get(), type: 'CSS', path: ''});
    let rule = { id: Guid.get(), type: 'CSS', path: '' };
    let spec = SpecHelper.get(specs, type);
    if (spec) {
      if (!spec.exclude) {
        spec.exclude = [];
      }
      spec.exclude.push(rule);
    }
    return specs;
  }

  static addMeta(specs, type) {
    let rule = { id: Guid.get(), name: '', type: 'CSS', path: '' };
    let spec = SpecHelper.get(specs, type);
    if (spec) {
      if (!spec.metadata) {
        spec.metadata = {};
      }
      spec.metadata[rule.name] = rule;
    }
    return specs;
  }

  static addSubItem(specs, name) {
    if (!specs[0].subItems) {
      specs[0].subItems = {};
    }
    specs[0].subItems[name] = { id: Guid.get(), type: 'CSS', path: '' };
    specs.push({
      'for': {types: [name]},
      exclude: [],
      metadata: {},
    });
    return specs;
  }

  static remove(specs, id) {
    specs = specs.map(spec => {
      if (spec.exclude) {
        spec.exclude = spec.exclude.filter(e=>(e.id!==id));
      }
      if (spec.metadata) {
        for (let k in spec.metadata) {
          if (spec.metadata[k].id === id) {
            delete spec.metadata[k];
          }
        }
      }
      return spec;
    });

    return specs;
  }

  static removeSubItem(specs, name) {
    for (let i=0; i<specs.length; i++) {
      if (specs[i]) {
        if (specs[i].for && specs[i].for.types && specs[i].for.types.includes(name)) {
          specs.splice(i,1);
          i--;
        }
        if (specs[i].subItems) {
          delete specs[i].subItems[name];
        }
      }
    }

    return specs;
  }

  static setIds(specs) {
    (specs || []).forEach(spec => {
      if (spec.exclude) {
        spec.exclude = spec.exclude.map(e=>{
          if (!e.id) {
            e.id = Guid.get();
          }
          return e;
        });
      }
      if (spec.metadata) {
        for (let k in spec.metadata) {
          if (spec.metadata[k] && !spec.metadata[k].id) {
            let m = spec.metadata[k];
            m.name = k;
            m.id = Guid.get();
            // delete spec.metadata[k];
            // spec.metadata[m.id] = m;
          }
        }
      }
      if (spec.subItems) {
        for (let k in spec.subItems) {
          if (spec.subItems[k] && !spec.subItems[k].id) {
            spec.subItems[k].id = Guid.get();
          }
        }
      }

    });
    return specs;
  }

  // get a clean spec
  static toJson(_specs, asText) {

    let cleanItem = (item)=>{
      delete item.id;
      delete item.name;
      if ( !item.isAbsolute ) {
        delete item.isAbsolute;
      }
      if ( !item.isBoolean ) {
        delete item.isBoolean;
      }
      return item;
    };

    let specs = JSON.parse(JSON.stringify(_specs));
    specs = specs.map( (spec)=>{
      spec.exclude = (spec.exclude || []).map( e=>cleanItem(e) );

      let metadata = {};
      for (let i in spec.metadata) {
        let m = spec.metadata[i], name = m.name;
        metadata[name] = cleanItem(m);
      }
      spec.metadata = metadata;

      let subItems = {};
      for (let i in spec.subItems) {
        subItems[i] = cleanItem(spec.subItems[i]);
      }
      spec.subItems = subItems;

      if (spec.subItems && Object.keys(spec.subItems).length <= 0) {
        delete spec.subItems;
      }
      return spec;
    });

    return asText ? JSON.stringify(specs,2,2) : specs;
  }

  static update(specs, changeSpec) {
    let id = changeSpec.id;
    delete changeSpec.id;

    let updateRule = e=>{
      if (e.id === id) {
        for (let k in changeSpec) {
          e[k] = changeSpec[k];
        }
      }
      return e;
    };

    specs.map(spec => {
      (spec.exclude || []).map( updateRule );
      if (spec.metadata) {
        let newMetadatMap = {}; // need a new map, in case the 'name' is changing, need to update the key in the map.
        for (let i in spec.metadata) {
          let rule = updateRule(spec.metadata[i]);
          let name = rule.name;
          while(newMetadatMap[name]) {
            // add a space to prevent rules being deleted while typing a name that matches another rule
            name += ' ';
          }
          newMetadatMap[name] = rule;
        }
        spec.metadata = newMetadatMap;
      }
      if (spec.subItems) {
        for (let i in spec.subItems) {
          spec.subItems[i] = updateRule(spec.subItems[i]);
        }
      }
      return spec;
    });

    return specs;
  }
}

export default SpecHelper;
