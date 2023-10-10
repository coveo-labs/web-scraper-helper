import { Component, State, h } from '@stencil/core';
import '@ionic/core';
import noFileImage from '../../assets/icon/NotFoundImage.svg';

@Component({
  tag: 'file-explorer',
  styleUrl: 'file-explorer.css',
  shadow: true,
})
export class FileExplorer {
  @State() showModal = false;
  @State() redirectToConfig = false;
  @State() fileName = ''; // new state variable to keep track of input value

  async onSaveClick() {
    this.showModal = false;
    const modal = document.querySelector('ion-modal');
    await modal.dismiss();
    this.redirectToConfig = true;
  }

  render() {
    console.log('render');
    return this.redirectToConfig === false ? (
      <div id="file-explorer">
        <div class="header-section">
          <div class="header_text-container">
            <div class="header_title-text">Your Web Scraper files</div>
            <div class="header_sub-text">Choose an existing file or create a new one to work on.</div>
          </div>
          <div class="header_file-picker">
            <ion-select class="never-flip" toggleIcon="caret-down-sharp" aria-label="Files" interface="popover" placeholder="File name" fill="outline">
              <ion-select-option value="File 1">File 1</ion-select-option>
              <ion-select-option value="File 2">File 2</ion-select-option>
            </ion-select>
          </div>
        </div>
        <div class="content-section">
          <div class="no-file-container">
            <div class="createFile-wrapper">
              <div class="info-text"> You have no files</div>
              <div>
                <ion-button class="create-file-btn" onClick={() => (this.showModal = true)}>
                  <ion-icon slot="start" name="add-circle-outline"></ion-icon>
                  Create a new file
                </ion-button>
              </div>
            </div>
            <div class="noFile-img-wrapper">
              <ion-img id="coveo-logo-img" src={noFileImage}></ion-img>
            </div>
          </div>
          <ion-modal id="create-file-modal" isOpen={this.showModal}>
            <div class="modal-header">
              <div>Create new file</div>
              <ion-icon name="close-outline" onClick={() => (this.showModal = false)}></ion-icon>
            </div>
            <div class="modal-content">
              <div>Enter a name for your Web Scraper file.</div>
              <ion-input
                fill="outline"
                placeholder="Name"
                onIonInput={event => (this.fileName = (event.target as HTMLIonInputElement).value as string)}
                value={this.fileName}
              ></ion-input>
            </div>
            <div class="modal-footer">
              <ion-button fill="outline" onClick={() => (this.showModal = false)}>
                Cancel
              </ion-button>
              <ion-button fill="outline" onClick={() => this.onSaveClick()} disabled={!this.fileName}>
                Save
              </ion-button>
            </div>
          </ion-modal>
        </div>
      </div>
    ) : (
      <create-config fileName={this.fileName}></create-config>
    );
  }
}
