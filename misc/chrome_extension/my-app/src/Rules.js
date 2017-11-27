import React, { Component } from 'react';
import Storage from './Storage';


let _guid = 0, guid = ()=> { return `guid-${_guid++}`; };

class Item extends Component {

  constructor(props) {
    super(props);
    this.state = {
      name: props.name || '',
      type: props.type || 'CSS',
      path: props.path || ''
    };
  }

  static getId(e) {
    let id = null;
    if (e) {
      id = e.getAttribute('data-id');
      if (!id && e.parentNode) {
        return this.getId(e.parentNode);
      }
    }
    return id;
  }

  // Pass along the change to the listener.
  onChange(state, e) {
    this.setState(state);

    state.id = Item.getId(e.target);
    this.props.onChange( state );
   }

  onChangePath(e) {
    this.onChange({path: e.target.value}, e);
  }

  onChangeType(e) {
    this.onChange({type: e.target.checked ? 'CSS' : 'XPATH'}, e);
  }

  renderPath() {
    return [
      <input key="1" type="text" className="wsh-rule-path" placeholder="Selector (XPath or CSS)" value={this.state.path} onChange={this.onChangePath.bind(this)} />,
      <span key="2" className="glyphicon glyphicon-remove" onClick={this.props.onRemove}></span>
    ];
  }

  renderType() {
    let isCss = this.state.type === 'CSS';
    return <input type="checkbox" className="wsh-rule-type" checked={isCss} onChange={this.onChangeType.bind(this)}/>;
  }

  render() {
    return (
      <div data-id={this.props.id} className="rule">
        {this.renderType()}
        {this.renderPath()}
      </div>
    );
  }
}

class MetaItem extends Item {

  onNameChange(e) {
    this.onChange({name: e.target.value}, e);
  }

  render() {
    return (
      <div data-id={this.props.id} className="rule">
        {this.renderType()}
        <input type="text" className="wsh-rule-name" placeholder="Name" value={this.state.name} onChange={this.onNameChange.bind(this)} />
        {this.renderPath()}
      </div>
    );
  }

}

class Rules extends Component {
  constructor(props) {
    super(props);
    this.state = this.setIdsOnSpec({
      exclude: [
        {"type":"CSS","path":"footer, #inqC2CImgContainer_AnchoredB,iframe, .rsx-icon-links, .icon-links"},
        {"type":"CSS","path":"header > *:not(.rsx-federal-bar), .rsx-federal-bar *:not(option)"},
        {"type":"CSS","path":".rsx-modal-group-wrap, #write-review-modal-lightbox, .rsx-availability-bar, .availability-bar, .rsx-offer-details, .fui-box-footer"},
        {"type":"CSS","path":"ul.mte-page-header__options"},
        {"type":"CSS","path":".mte-category-header, .mte-category-nav, .mte-back"},
        {"type":"CSS","path":".fui-topbar, .fui-topnav, .fui-page-footer, .fui-page-aside"},
        {"type":"CSS","path":".rsx-connector-login-modal-pane,  .rsx-modal-group-wrap"},
        {"type":"CSS","path":".mte-article-footer, .mte-multi-column, .mte-back-to-top, .modal, figure.figure, .mte-contact-us"}
      ],
      metadata:{
        "aside":{"type":"XPATH","path":"//aside"},
        "errorpage":{"type":"CSS","isBoolean":true,"path":"main.error-page"},
        "howtotopic":{"type":"CSS","path":".mte-article-header h1::text"},
        "howtosteps":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item::text"},
        "howtosteps2":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item a::text"},
        "prov":{"type":"CSS","path":"footer .js-current-language-native option:not([disabled])::attr(value)"}
      }
    });
    this.state = null;
    this._listenerId = null;
  }

  componentDidMount() {
    this._listenerId = Storage.addChangeListener(this.onSpecUpdate.bind(this));
  }

  componentWillUnmount() {
    Storage.removeChangeListener(this._listenerId);
  }

  addExclude() {
    this.state.exclude.push({id:guid(), type: 'CSS', path: ''});
    this.setState(this.state.exclude);
  }

  addMeta() {
    this.state.metadata.push({id:guid(), name: '', type: 'CSS', path: ''});
    this.setState(this.state.metadata);
  }

  getSpec() {
    let metadata = {};
    let a = this.state.metadata;
    a.forEach(m=>{
      let spec = {...m};
      delete spec.id;
      metadata[spec.name]=spec;
    });
    let spec = [{
      "for": this.state.for || {"urls":[".*"]},
      exclude: this.state.exclude.map(e=>{
        return {type: e.type, path: e.path};
      }),
      metadata
    }];

    return spec;
  }

  prettifyJson() {
    try {
      let txt = JSON.stringify( JSON.parse(this.state.txt), 2, 2 );
      this.setState({txt, txtState: 'valid'});
    }
    catch(e) {
      console.log(e);
    }
  }

  onChangeItem(changeSpec) {
    let id = changeSpec.id;
    delete changeSpec.id;

    let exclude = this.state.exclude.map( e=>{
      if (e.id === id) {
        for (let k in changeSpec) {
          e[k] = changeSpec[k];
        }
      }
      return e;
    });

    let metadata = this.state.metadata.map( e=>{
      if (e.id === id) {
        for (let k in changeSpec) {
          e[k] = changeSpec[k];
        }
      }
      return e;
    });

    this.setState({exclude, metadata});
  }

  onRemoveItem(e) {
    let id = Item.getId(e.target);
    console.log('REMOVING: ', Item.getId(e.target));
    let exclude = this.state.exclude.filter( e=>(e.id !== id) );
    let metadata = this.state.metadata.filter( e=>(e.id !== id) );

    this.setState({exclude, metadata});
  }

  onSpecUpdate(spec) {
    console.log('RULES::onSpecUpdate', JSON.stringify(spec));
    this.setSpec(spec);
  }

  onTab(id, e) {
    e.preventDefault();
    let state = {tab: id};
    console.log( `TAB: "${id}"` );
    if (id === 'text-editor') {
      state.txt = JSON.stringify(this.getSpec(),2,2);
    }
    this.setState(state);
  }

  onTextChange(e) {
    let txt = e.target.value;
    let txtState = 'valid';

    try {
      let o = JSON.parse(txt);
      // valid JSON, replace current spec.
      this.setSpec(o);
    }
    catch(e) {
      console.log('Not valid JSON. ', e);
      txtState = 'invalid';
    }

    this.setState({txt, txtState});
  }

  setIdsOnSpec(o) {
    if (o.exclude) {
      o.exclude = o.exclude.map(e=>{
        e.id = e.id || guid();
        return e;
      })
    }
    if (o.metadata) {
      let metadata = Object.keys(o.metadata).map(k=>{
        let m = o.metadata[k];
        m.name = k;
        m.id = m.id || guid();
        o.metadata[k] = m;
        return m;
      });

      o.metadata = metadata;
    }
    return o;
  }

  setSpec(o) {
    let spec = o;
    if (o && o.length) {
      // support only the first group (.*)
      spec = o[0];
    }
    spec = spec && this.setIdsOnSpec(spec);
    console.log('Update Spec: ', JSON.stringify(spec));
    this.setState( spec );
  }

  render() {
    if ( !(this.state && this.state.for) ) {
      return (<div id="rules">
          <div className="alert alert-warning" role="alert">
            Create or Load a spec.
          </div>
        </div>);
    }

    let onRemove = this.onRemoveItem.bind(this);
    let onChange = this.onChangeItem.bind(this);

    let excludes = this.state.exclude.map((e)=>
      <Item key={e.id} onRemove={onRemove} onChange={onChange} {...e}/>
    );

    let metas = this.state.metadata.map((e)=>
      <MetaItem key={e.id} onRemove={onRemove} onChange={onChange} {...e}/>
    );

    let isTextEditor = (this.state.tab === 'text-editor');
    let txtClass = this.state.txtState || 'valid';
    let textValue = isTextEditor ? this.state.txt : JSON.stringify(this.getSpec(),2,2);

    if (txtClass === 'valid') {
      Storage.set(textValue, this._listenerId);
    }

    return (
      <div id="rules">
        <ul className="nav nav-tabs" role="tablist">
          <li role="presentation" className={!isTextEditor? 'active' : ''}><a href="#editor" aria-controls="editor" role="tab" data-toggle="tab" id="editor-button" onClick={this.onTab.bind(this,'editor')}>Visual</a></li>
          <li role="presentation" className={ isTextEditor? 'active' : ''}><a href="#text-editor" aria-controls="text-editor" role="tab" data-toggle="tab" id="text-editor-button" onClick={this.onTab.bind(this,'text-editor')}>Text</a></li>
        </ul>
        <div id="editor-container" className="tab-content">
          <div id="editor" role="tabpanel" className={!isTextEditor? 'tab-pane active' : 'tab-pane'}>

            <h1>Exclude</h1>
            <div id="exclude-rules">
              {excludes}
            </div>
            <button className="btn btn-sm btn-success" onClick={this.addExclude.bind(this)}>Add</button>
            <h1>Metadata</h1>
            <div id="metadata-rules">
              {metas}
            </div>
            <button className="btn btn-sm btn-success" onClick={this.addMeta.bind(this)}>Add</button>

          </div>

          <div id="text-editor" role="tabpanel" className={ isTextEditor? 'tab-pane active' : 'tab-pane'}>
            <textarea id="json-config" className={txtClass} placeholder="Create/Load a file..." value={textValue} onChange={this.onTextChange.bind(this)}></textarea>
            <button id="pretty" className="button" onClick={this.prettifyJson.bind(this)}>Make JSON pretty</button>
          </div>
        </div>
      </div>

    );
  }
}

export default Rules;
