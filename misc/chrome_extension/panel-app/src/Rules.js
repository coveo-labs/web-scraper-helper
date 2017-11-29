import React, { Component } from 'react';
import Guid from './Guid';
import Storage from './Storage';

class Item extends Component {

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
    let cssName = 'wsh-rule-path';
    return [
      <input key="1" type="text" className={cssName} placeholder="Selector (XPath or CSS)" value={this.props.path} onChange={this.onChangePath.bind(this)} />,
      <span key="2" className="glyphicon glyphicon-remove" onClick={this.props.onRemove}></span>
    ];
  }

  renderType() {
    let isCss = this.props.type === 'CSS';
    let cssName = 'wsh-rule-type';
    if (this.props.validationState) {
      cssName += ' ' + this.props.validationState;
    }
    return <input type="checkbox" className={cssName} checked={isCss} onChange={this.onChangeType.bind(this)}/>;
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
        <input type="text" className="wsh-rule-name" placeholder="Name" value={this.props.name} onChange={this.onNameChange.bind(this)} />
        {this.renderPath()}
      </div>
    );
  }

}

class Rules extends Component {
  constructor(props) {
    super(props);
    this.state = null;
    this._listenerId = null;
    this._subItems = {};
  }

  componentDidMount() {
    this._listenerId = Storage.addChangeListener(this.onSpecUpdate.bind(this));
  }

  componentWillUnmount() {
    Storage.removeChangeListener(this._listenerId);
  }

  addExclude() {
    this.state.exclude.push({id:Guid.get(), type: 'CSS', path: ''});
    this.setState(this.state.exclude);
  }

  addMeta() {
    this.state.metadata.push({id:Guid.get(), name: '', type: 'CSS', path: ''});
    this.setState(this.state.metadata);
  }

  getSpec() {
    let metadata = {};
    let a = this.state.metadata || [];
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

    delete this._subItems[id];
    let exclude = this.state.exclude.filter( e=>(e.id !== id) );
    let metadata = this.state.metadata.filter( e=>(e.id !== id) );

    this.setState({exclude, metadata});
  }

  onSpecUpdate(spec) {
    this.setSpec(spec);
  }

  onTab(id, e) {
    e.preventDefault();
    let state = {tab: id};
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

  onValidate(validateSpec) {
    let previousState = JSON.stringify(this.state);

    let state = {...this.state};
    (validateSpec.exclude || []).forEach( (vExcludeState,idx) => {
      try{
        state.exclude[idx].validationState = vExcludeState;
      }
      catch(e) {
        console.log('Rules::onValidate(exclude) ', e);
      }
    });
    try {
      let vStates = validateSpec.metadata || {};
      state.metadata = (state.metadata || []).map(m=>{
        let vState = vStates[m.name];
        if (vState) {
          m.validationState = vState;
        }
        return m;
      });
    }
    catch(e) {
      console.log('Rules::onValidate(metadata) ', e);
    }

    // skip updates if state has not changed.
    if (previousState !== JSON.stringify(state)) {
      this.setState(state, ()=>{
        let updateSubItem = e=>{
          let i = this._subItems[e.id];
          if (i) {
            i.setState({validationState: e.validationState});
          }
        };
        (this.state.exclude||[]).forEach(updateSubItem);
        (this.state.metadata||[]).forEach(updateSubItem);
      });
    }
  }

  setIdsOnSpec(o) {
    if (o.exclude) {
      o.exclude = o.exclude.map(e=>{
        e.id = e.id || Guid.get();
        return e;
      })
    }
    if (o.metadata) {
      let metadata = Object.keys(o.metadata).map(k=>{
        let m = o.metadata[k];
        m.name = k;
        m.id = m.id || Guid.get();
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
      // support only the first group (.*) for now
      spec = o[0];
    }
    spec = spec && this.setIdsOnSpec(spec);
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

    let isTextEditor = (this.state.tab === 'text-editor');
    let txtClass = this.state.txtState || 'valid';
    let textValue = isTextEditor ? this.state.txt : JSON.stringify(this.getSpec(),2,2);

    if (txtClass === 'valid') {
      this._lastTextValue = textValue;
      Storage.set(textValue, this._listenerId);
    }

    let onRemove = this.onRemoveItem.bind(this);
    let onChange = this.onChangeItem.bind(this);

    let excludes = this.state.exclude.map((e)=>
      <Item key={e.id} ref={(ref) => { this._subItems[e.id] = ref; }} onRemove={onRemove} onChange={onChange} {...e}/>
    );

    let metas = this.state.metadata.map((e)=>
      <MetaItem key={e.id} ref={(ref) => { this._subItems[e.id] = ref; }} onRemove={onRemove} onChange={onChange} {...e}/>
    );

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
