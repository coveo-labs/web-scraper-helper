import React, { Component } from 'react';
import Guid from './Guid';
import Storage from './Storage';

// jshint -W110

class Library extends Component {

  constructor(props) {
    super(props);
    this.state = {names: Storage.getNames()};
  }

  componentDidMount() {
    Storage.reload(()=>{
      this.setState({names: Storage.getNames()});
    });
  }

  componentWillUnmount() {
  }

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
        <button id="clear" className="btn btn-default" onClick={this.clear.bind(this)}>Clear page</button>
        &nbsp; &nbsp;
        <button id="copy" className="btn btn-default" onClick={this.copyConfigToClipboard.bind(this)}>Copy to clipboard</button>

        <div id="messages"></div>
      </div>
    );
  }

  clear() {
    Storage.remove(Guid.get());
    this.setState({current: '__empty'});
  }

  copyConfigToClipboard() {
    document.getElementById('text-editor-button').click();
    setTimeout(()=>{
      let textAreaElement = document.getElementById('json-config');
      textAreaElement.focus();
      textAreaElement.select();

      try {
        let successful = document.execCommand('copy');
        if (successful) {
          this.showMessage('Copied to Clipboard.');
        }
      } catch (err) {
        alert('Failed to copy');
      }
    }, 200);
  }

  deleteConfig() {
    if (window.confirm('\nAre you sure you want to delete this config?\n\n' + this.state.current + '\n\n')) {
      Storage.remove(this.state.current);
      let names = this.state.names.filter( n=>(n!==this.state.current) );
      this.setState({names, current: '__empty'});
    }
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
    this.showMessage('Saved.');
  }

  showMessage(message) {
    let guid = Guid.get();
    document.getElementById('messages').innerHTML += `<div id="${guid}" class="alert alert-info" role="alert">${message}</div>`;
    setTimeout(()=> {
      let msg = document.getElementById(guid);
      msg.classList.add('fade');
      setTimeout(msg.remove.bind(msg), 200);
    }, 1500);

  }
}

export default Library;
