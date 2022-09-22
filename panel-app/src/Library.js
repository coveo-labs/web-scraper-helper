import React, { Component } from 'react';
import Guid from './Guid';
import Storage from './Storage';

// jshint -W110

class Library extends Component {

  constructor(props) {
    super(props);
    this.state = { names: Storage.getNames() };
  }

  componentDidMount() {
    Storage.reload(() => {
      this.setState({ names: Storage.getNames() });
    });
  }

  componentWillUnmount() {
  }

  render() {
    let currentSpec = this.state.current || '__empty';

    let savedSpecs = this.state.names.map(name =>
      <option key={name} value={name}>{name}</option>
    );

    let saveDisabled = (currentSpec === '__empty');

    return (
      <div id="setup">

        <select id="storage" className="form-control" value={currentSpec} onChange={this.loadSpec.bind(this)}>
          <option value="__empty" disabled>Select a file to work on</option>
          <option disabled>------------------------------</option>
          {savedSpecs}
          <option value="__create">Create new file...</option>
        </select>

        <button id="storageSave" className="btn btn-primary" onClick={this.saveConfig.bind(this)} disabled={saveDisabled}>Save</button>
        &nbsp; &nbsp;
        <button id="storageDelete" className="btn btn-danger" onClick={this.deleteConfig.bind(this)} disabled={saveDisabled}>Delete</button>
        &nbsp; &nbsp; &nbsp; &nbsp;
        <button id="clear" className="btn btn-light" onClick={this.clear.bind(this)}>Clear page</button>
        &nbsp; &nbsp;
        <button id="copy" className="btn btn-light" onClick={this.copyConfigToClipboard.bind(this)}>Copy to clipboard</button>

        <a class="btn btn-link mt-1 float-end" href="https://github.com/coveo-labs/web-scraper-helper/blob/master/docs/howto.md" target="web-scraper-help" title="How-to Guide">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question-square" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
          </svg>
        </a>

        <div id="messages"></div>
      </div>
    );
  }

  clear() {
    Storage.remove(Guid.get());
    this.setState({ current: '__empty' });
  }

  copyConfigToClipboard() {
    document.getElementById('text-editor-button').click();
    setTimeout(() => {
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
      let names = this.state.names.filter(n => (n !== this.state.current));
      this.setState({ names, current: '__empty' });
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

    this.setState(state, () => {
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
    setTimeout(() => {
      let msg = document.getElementById(guid);
      msg.classList.add('fade');
      setTimeout(msg.remove.bind(msg), 200);
    }, 1500);

  }
}

export default Library;
