import React from 'react';
import Storage from './Storage';
import Item from './Item';
import MetaItem from './MetaItem';
import SpecHelper from './SpecHelper';

class TextEditor extends React.Component {

  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.value = this.props.value;
  }

  onChange(e) {
    this.value = e.target.value;
    let ta = document.querySelector('#text-editor > textarea');

    try {
      JSON.parse(this.value);
      // valid JSON, replace current spec.
      ta.classList.remove('invalid');
    }
    catch(e) {
      ta.classList.add('invalid');
    }
    this.props.onChange(this.value);
  }

  render() {
    return (
      <textarea value={this.value} onChange={this.onChange}></textarea>
    );
  }
}

class Rules extends React.Component {
  constructor(props) {
    super(props);
    this.state = {tab: 'editor'};

    if (props.specs) {
      try {
        let specs = JSON.parse(this.props.specs);
        specs = SpecHelper.setIds(specs);
        this.state.specs = specs;
      }
      catch(e) {
        // console.log(e);
      }
    }
    this._listenerId = null;
  }

  componentDidMount() {
    this._listenerId = Storage.addChangeListener(this.onSpecUpdate.bind(this));
  }

  componentWillUnmount() {
    Storage.removeChangeListener(this._listenerId);
  }

  addExclude(subItemType) {
    SpecHelper.addExclude(this.state.specs, subItemType==='editor'?null:subItemType);
    this.setState(this.state);
  }

  addMeta(subItemType) {
    SpecHelper.addMeta(this.state.specs, subItemType==='editor'?null:subItemType);
    this.setState(this.state);
  }

  addSubItems() {
    let name = prompt('Name?');
    if (name) {
      let specs = SpecHelper.addSubItem(this.state.specs, name);
      this.setState({specs, tab: name});
    }
  }

  prettifyJson() {
    try {
      let txt = JSON.stringify( JSON.parse(this.state.txt), 2, 2 );
      this.setState({txt, txtState: 'valid'});
    }
    catch(e) {
      // console.log(e);
    }
  }

  onChangeItem(changeSpec) {
    SpecHelper.update(this.state.specs, changeSpec);
    this.setState(this.state);

    Storage.set(JSON.stringify(this.state.specs), this._listenerId);
  }

  onTextChange(txtSpec) {
    this._lastTextValue = txtSpec;
    this.setState({txt: txtSpec});

    try {
      JSON.parse(txtSpec);  // for validation, don't want to send an invalid spec
      Storage.set(txtSpec);
    }
    catch(e) {}
  }

  onRemoveItem(e) {
    let id = Item.getId(e.target);

    // delete this._rules[id];
    SpecHelper.remove(this.state.specs, id);

    this.setState(this.state);
    Storage.set(JSON.stringify(this.state.specs), this._listenerId);
  }

  onRemoveSubItems(id) {
    SpecHelper.removeSubItem(this.state.specs, id);
    this.setState({state: this.state, tab: 'editor'});
  }

  onSpecUpdate(specs, reset) {
    if (reset) {
      this.setState({tab: 'editor'});
    }
    this.setSpecs(specs);
  }

  onTab(id, e) {
    e.preventDefault();
    let state = {tab: id};
    if (id === 'text-editor') {
      this._lastTextValue = SpecHelper.toJson(this.state.specs, true);
      state.txt = this._lastTextValue;
    }

    this.setState(state);
  }

  onValidate(validateSpec) {
    if (validateSpec) {
      this._lastValidationSpec = validateSpec;
    }
    else if (this._lastValidationSpec) {
      validateSpec = this._lastValidationSpec;
    }

    document.querySelectorAll('.bg-danger, .bg-success, .bg-warning').forEach(
      e=>e.classList.remove('bg-danger', 'bg-success', 'bg-warning')
    );

    Object.keys((validateSpec && validateSpec.rules) || {}).forEach(k=>{
      let state = validateSpec.rules[k];
      document.querySelectorAll(`.rule[data-id="${k}"] .wsh-rule-type`).forEach(e=>{
        e.classList.add( state );
      });
    });
  }

  setSpecs(o) {
    let specs = o;
    SpecHelper.setIds(specs);
    this.setState( {specs} );
  }

  getSubItemsFor(name) {
    let a = [];
    (this.state.subItems || []).forEach(s=>{
      if (s.name === name) {
        a = s.metadata || [];
      }
    });
    return a;
  }

  render() {
    if ( !(this.state && this.state.specs && this.state.specs.length && this.state.specs[0].for) ) {
      return (<div id="rules">
        <div className="alert alert-warning" role="alert">
          Create or Load a spec.
        </div>
      </div>);
    }

    let isTextEditor = (this.state.tab === 'text-editor');

    let subItems = this.state.specs[0].subItems || {},
      subItemsKeys = Object.keys(subItems),
      subItemsTabs = [],
      currentTabId = this.state.tab;

    subItemsTabs = subItemsKeys.map(s=> {
      let tabId = s;

      return (
        <li key={tabId} role="presentation" className={currentTabId === tabId ? 'active' : ''}>
          <a href={'#'+tabId} aria-controls={tabId} role="tab" data-toggle="tab" id={tabId + '-button'} onClick={this.onTab.bind(this,tabId)}>
            {s}
            <span onClick={this.onRemoveSubItems.bind(this,s)} className="glyphicon glyphicon-remove"></span>
          </a>
        </li>
      );
    });

    let onTextChange = this.onTextChange.bind(this);

    /* eslint-disable jsx-a11y/anchor-has-content */
    let tabContent = null;
    if (this.state.tab === 'editor') {
      tabContent = this.renderTabContent(this.state.specs[0], 'editor');
    }
    else if (this.state.tab === 'text-editor') {
      tabContent = (
        <div id="text-editor" key="text-editor" role="tabpanel" className={'tab-pane' + (this.state.tab === 'text-editor' ? ' active' : '')}>
          <TextEditor value={this.state.txt} onChange={onTextChange} />
        </div>
      );
    }
    else {
      tabContent = this.state.specs
        .filter(s=>{
          if (!s.name) {
            s.name = ( (s.for && s.for.types) || []).join('_').replace(/[^\w]/g, '_');
          }
          return s.name === this.state.tab;
        })
        .map(s=>{
          return this.renderTabContent(s, s.name);
        });
    }

    setTimeout(this.onValidate.bind(this), 100);

    return (
      <div id="rules">
        <ul className="nav nav-tabs" role="tablist">
          <li key="global-rules" role="presentation" className={this.state.tab === 'editor'? 'active' : ''}><a href="#editor" aria-controls="editor" role="tab" data-toggle="tab" id="editor-button" onClick={this.onTab.bind(this,'editor')}>urls: .*</a></li>
          {subItemsTabs}
          <li role="presentation"><a href="#add-sub-item" className="glyphicon glyphicon-plus" title="Add Sub Items" onClick={this.addSubItems.bind(this)}></a></li>
          <li role="presentation" className={ isTextEditor? 'active' : ''}><a href="#text-editor" aria-controls="text-editor" role="tab" data-toggle="tab" id="text-editor-button" onClick={this.onTab.bind(this,'text-editor')}>Text</a></li>

        </ul>
        <div id="editor-container" className="tab-content">
          { tabContent }
        </div>
      </div>
    );
    /* eslint-enable */
  }

  renderTabContent(spec, id) {
    let tabId = id || 'editor';

    let onRemove = this.onRemoveItem.bind(this);
    let onChange = this.onChangeItem.bind(this);

    let excludes = (spec.exclude || []).map((e)=>
      <Item key={e.id} onRemove={onRemove} onChange={onChange} {...e}/>
    );

    let metas = SpecHelper.getMetadataAsArray(spec, id);
    metas = metas.map((e)=>
      <MetaItem key={e.id} onRemove={onRemove} onChange={onChange} {...e}/>
    );

    let typeSelector = '';

    // retrieve the subItem info from the global spec, to get the path from it
    let globalSpec = this.state.specs[0],
      subItem = globalSpec && globalSpec.subItems && globalSpec.subItems[id];

    let guid = (subItem && subItem.id) || ('subitem-' + id);

    if ( id !== 'editor' ) {
      typeSelector = (
        <div>
          <h4>Selector for this Type</h4>
          <Item data-id={id} key={tabId+'-selector'} onChange={onChange} id={guid} path={subItem && subItem.path} type={subItem && subItem.type} {...spec}/>
          <br/>
        </div>
      );
    }

    return (
      <div id={id} key={id} role="tabpanel" className={'tab-pane' + (this.state.tab === tabId ? ' active' : '')}>
        {typeSelector}

        <h4>Excludes</h4>
        <div className="exclude-rules">
          {excludes}
        </div>
        <button className="btn btn-sm btn-success" onClick={this.addExclude.bind(this, id)}>Add</button>

        <br/><br/>
        <h4>Metadata</h4>
        <div className="metadata-rules">
          {metas}
        </div>
        <button className="btn btn-sm btn-success" onClick={this.addMeta.bind(this, id)}>Add</button>

      </div>
    );
  }
}

export default Rules;
