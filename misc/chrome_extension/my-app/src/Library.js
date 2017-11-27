import React, { Component } from 'react';
import Storage from './Storage';

// jshint -W110

class Library extends Component {

  constructor(props) {
    super(props);
    // this.state = {
    //   specs: {
    //     'blog.coveo.com': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"header,aside,footer"}],"metadata":{"tags":{"type":"CSS","path":".topics li::text"}}}]),
    //     'bell.ca': JSON.stringify([{"for":{"urls":[".*"]},"exclude":[{"type":"CSS","path":"footer, #inqC2CImgContainer_AnchoredB,iframe, .rsx-icon-links, .icon-links"},{"type":"CSS","path":"header > *:not(.rsx-federal-bar), .rsx-federal-bar *:not(option)"},{"type":"CSS","path":".rsx-modal-group-wrap, #write-review-modal-lightbox, .rsx-availability-bar, .availability-bar, .rsx-offer-details, .fui-box-footer"},{"type":"CSS","path":"ul.mte-page-header__options"},{"type":"CSS","path":".mte-category-header, .mte-category-nav, .mte-back"},{"type":"CSS","path":".fui-topbar, .fui-topnav, .fui-page-footer, .fui-page-aside"},{"type":"CSS","path":".rsx-connector-login-modal-pane,  .rsx-modal-group-wrap"},{"type":"CSS","path":".mte-article-footer, .mte-multi-column, .mte-back-to-top, .modal, figure.figure, .mte-contact-us"}],"metadata":{"errorpage":{"type":"CSS","isBoolean":true,"path":"main.error-page"},"howtotopic":{"type":"CSS","path":".mte-article-header h1::text"},"howtosteps":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item::text"},"howtosteps2":{"type":"CSS","path":".mte-article .mte-emulator__step-nav-item a::text"},"prov":{"type":"CSS","path":"footer .js-current-language-native option:not([disabled])::attr(value)"}}}]),
    //   }
    // };
    // this.onSpecUpdate = this.onSpecUpdate.bind(this);

    this.state = {names: Storage.getNames()};
  }

  componentDidMount() {
    // this._listenerId = Storage.addChangeListener(this.onSpecUpdate);
    Storage.reload(()=>{
      this.setState({names: Storage.getNames()});
    });
  }

  componentWillUnmount() {
    // Storage.removeChangeListener(this._listenerId);
  }

  // onSpecUpdate(spec) {
  //   console.log('LIBRARY::onSpecUpdate', spec);
  // }

  render() {
    let currentSpec = this.state.current || '__empty';

    let savedSpecs = this.state.names.map(name=>
      <option key={name} value={name}>{name}</option>
    );

    let saveDisabled = (currentSpec==='__empty');

    return (
      <div id="setup">

        <select id="storage" className="form-control" value={currentSpec} onChange={this.loadSpec.bind(this)}>
          <option value="__empty" disabled>Select a file to work on</option>
          <option disabled>------------------------------</option>
          { savedSpecs }
          <option value="__create">Create new file...</option>
        </select>

        <button id="storageSave" className="btn btn-primary" onClick={this.saveConfig.bind(this)} disabled={saveDisabled}>Save</button>
        &nbsp; &nbsp;
        <button id="storageDelete" className="btn btn-danger" onClick={this.deleteConfig.bind(this)} disabled={saveDisabled}>Delete</button>
        &nbsp; &nbsp; &nbsp; &nbsp;
        <button id="clear" className="btn btn-default">Clear page</button>
        &nbsp; &nbsp;
        <button id="copy" className="btn btn-default" onClick={this.copyConfigToClipboard.bind(this)} >Copy to clipboard</button>
      </div>
    );
  }

  copyConfigToClipboard() {
    console.log('NIY: copyConfigToClipboard');
  }

  deleteConfig() {
    Storage.remove(this.state.current);
    let names = this.state.names.filter( n=>(n!==this.state.current) );
    this.setState({names, current: '__empty'});
    // let name = document.getElementById('storage').value;
    // console.log('NIY: deleteConfig', name);

    // let specs = this.state.specs;
    // if (specs[name]) {
    //   delete specs[name];
    //   this.setState({
    //     specs: specs,
    //     current: '__empty',
    //   });
    // }
  }

  loadSpec(e) {
    let name = e.target.value;
    let state = {
      current: name
    };

    if (name === '__create') {
      name = prompt('Name?');
      state.current = name;
      Storage.newSpec(name);
      state.names = Storage.getNames();
    }

    this.setState(state, ()=>{
      Storage.loadSpec(name);
    });
  }

  saveConfig() {
    Storage.saveCurrent();
  }
}

export default Library;
