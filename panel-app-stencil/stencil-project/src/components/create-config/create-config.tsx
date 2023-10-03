import { Component, h } from '@stencil/core';

@Component({
  tag: 'create-config',
  styleUrl: 'create-config.css',
  shadow: true,
})
export class CreateConfig {
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
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="selector-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="selector-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="selector-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="selector-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>
                      <div class="add-rule">
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
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="expression-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="expression-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>
                      <div class="select-element-item">
                        <div>
                          <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Selector" interface="popover" fill="outline" value="CSS">
                            <ion-select-option value="CSS">CSS</ion-select-option>
                            <ion-select-option value="Xpath">XPath</ion-select-option>
                          </ion-select>
                        </div>
                        <div>
                          <ion-input class="expression-input" fill="outline" placeholder="header .header"></ion-input>
                        </div>
                        <div>
                          <ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
                        </div>
                      </div>

                      <div class="add-rule">
                        <ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
                        <span>Add Rule</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '24px' }}>Results</div>
                    <div class="result-container">
                      <div class="result-column">
                        <ion-list lines="full">
                          <ion-list-header lines="full">
                            <ion-label>Metadata</ion-label>
                          </ion-list-header>
                          <ion-item>
                            <ion-label>Full Lines</ion-label>
                          </ion-item>
                          <ion-item>
                            <ion-label>Full Lines</ion-label>
                          </ion-item>
                          <ion-item>
                            <ion-label>Full Lines</ion-label>
                          </ion-item>
                        </ion-list>
                      </div>
                      <div class="result-column">
                        <ion-list lines="full">
                          <ion-list-header lines="full">
                            <ion-label>Value (s)</ion-label>
                          </ion-list-header>
                          <ion-item>
                            <ion-label>Full Lines</ion-label>
                          </ion-item>
                          <ion-item>
                            <ion-label>Full Lines</ion-label>
                          </ion-item>
                          <ion-item>
                            <ion-label>Full Lines</ion-label>
                          </ion-item>
                        </ion-list>
                      </div>
                    </div>
                  </div>
                </ion-tab>
                <ion-tab tab="sub-items">SI</ion-tab>
                <ion-tab tab="json">JSON</ion-tab>
              </ion-tabs>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
