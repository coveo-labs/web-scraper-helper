import { Component, h } from '@stencil/core';
import state, { addExcludedItem, addMetadataItem } from '../store';
import copyToClipboardIcon from '../../assets/icon/CopyToClipboard.svg';

@Component({
  tag: 'create-config',
  styleUrl: 'create-config.css',
  shadow: true,
})
export class CreateConfig {
  renderExcludedItems() {
    return state.exclude.map(item => {
      return <select-element-item type="excludeItem" selectorType={item.type} selector={item.path}></select-element-item>;
    });
  }

  renderMetadataItems() {
    return state.metadata.map(item => {
      return <select-element-item type="metadataItem" name={item.name} selectorType={item.type} selector={item.path}></select-element-item>;
    });
  }

  render() {
    return (
      <div id="create-config">
        <div class="header-section">
          <div class="header_text-container">
            <div class="header_title-text">Web Scraper files name ( TEST )</div>
            <div class="header_sub-text">Start creating Web Scraper configuration for this file.</div>
          </div>
          <div class="header_btn">
            <ion-button>Done</ion-button>
          </div>
        </div>
        <div class="content-section">
          <div class="content-container">
            <div class="content-text">Create a Web Scraping configuration</div>
            <div class="content-tabs">
              <ion-tabs>
                <ion-tab-bar selectedTab="elements-to-exclude">
                  <ion-tab-button tab="elements-to-exclude" selected>
                    Elements to exclude
                  </ion-tab-button>
                  <ion-tab-button tab="metadata-to-extract">Metadata to extract</ion-tab-button>
                  <ion-tab-button tab="sub-items">Sub-items</ion-tab-button>
                  <ion-tab-button tab="json">JSON</ion-tab-button>
                </ion-tab-bar>

                <ion-tab tab="elements-to-exclude" id="collection-container">
                  <div>
                    <div>Global section name</div>
                    <ion-input class="global-section-input" fill="outline" placeholder="Name your global section"></ion-input>
                    <div>Select page elements to exclude</div>
                    <div class="select-element__container">
                      {this.renderExcludedItems()}
                      <div class="add-rule" onClick={() => addExcludedItem({ type: 'CSS', path: '' })}>
                        <ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
                        <span>Add Rule</span>
                      </div>
                    </div>
                  </div>
                </ion-tab>
                <ion-tab tab="metadata-to-extract" id="collection-container">
                  <div>
                    <div>Global section name</div>
                    <ion-input class="global-section-input" fill="outline" placeholder="Name your global section"></ion-input>
                    <div>Select metadata to extract</div>
                    <div class="select-element__container">
                      {this.renderMetadataItems()}
                      <div class="add-rule" onClick={() => addMetadataItem({ name: '', type: 'CSS', path: '' })}>
                        <ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
                        <span>Add Rule</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '24px' }}>Results</div>
                    <div class="result-container">
                      <table id="resultGlobalTable" class="table table-condensed table-bordered">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Value(s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr></tr>
                          <tr></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </ion-tab>
                <ion-tab tab="sub-items">SI</ion-tab>
                <ion-tab tab="json">
                  <div class="code-view-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>Code View</div>
                      <div class="copy-to-clipboard">
                        <ion-img id="coveo-logo-img" src={copyToClipboardIcon}></ion-img>
                        <span></span>
                        <span>Copy to clipboard</span>
                      </div>
                    </div>
                    <div class="code-view">
                      <pre>{JSON.stringify(state, null, 2)}</pre>
                    </div>
                  </div>
                </ion-tab>
              </ion-tabs>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
