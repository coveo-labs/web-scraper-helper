import { Component, State, h } from '@stencil/core';
import '@ionic/core';
import noFileImage from '../../assets/icon/NotFoundImage.svg';
import infoToken from '../../assets/icon/InfoToken.svg';
import state, { formatState } from '../store';
import { alertController } from '@ionic/core';

const RECENT_FILES_ITEM_NAME = '__Recent__Files__';
@Component({
	tag: 'file-explorer',
	styleUrl: 'file-explorer.scss',
	shadow: false,
})
export class FileExplorer {
	@State() showModal = false;
	@State() fileName = '';
	@State() triggerType = 'new-file'; // keeps track whether a new file is created or loaded
	@State() fileList = [];
	@State() recentFiles = [];

	async onSaveClick() {
		this.showModal = false;
		const modal = document.querySelector('ion-modal');
		await modal.dismiss();

		// save the default state right away
		try {
			chrome.storage.local.set({
				[this.fileName]: JSON.stringify(formatState(), null, 2),
			});
		} catch (e) {
			console.log(e);
		}

		state.redirectToConfig = true;
	}

	async componentWillRender() {
		try {
			const items = await new Promise((resolve) => {
				chrome.storage.local.get(null, (items) => resolve(items));
			});

			this.fileList = Object.keys(items).filter((item) => item !== RECENT_FILES_ITEM_NAME);
			this.recentFiles = (items[RECENT_FILES_ITEM_NAME] || []).filter((item) => this.fileList.includes(item));
		} catch (e) {
			console.log(e);
			this.fileList = [];
		}
	}

	renderFileList() {
		if (this.fileList.length) {
			return (
				<div>
					{this.fileList.map((item, idx) => {
						return (
							<ion-select-option class="file-list-names" key={idx} value={item}>
								{item}
							</ion-select-option>
						);
					})}
				</div>
			);
		} else {
			return <ion-select-option class="no-files-option">Sorry, you haven’t created any files yet.</ion-select-option>;
		}
	}

	renderRecentFiles() {
		if (this.recentFiles?.length) {
			const recentFiles = this.recentFiles.map((item) => (
				<div class="recent-file">
					<div class="recent-file-name" onClick={() => this.loadFile(item)}>
						{item}
					</div>
					<ion-icon name="trash-outline" size="small" color="primary" onClick={() => this.removeFile(item)}></ion-icon>
				</div>
			));

			return (
				<div class="recent-files-container">
					<div class="recent-title">Your recent files</div>
					<div class="recent-subtitle">Choose one of recently created file or search for more in the list above.</div>
					<div class="recent-files-section">
						{recentFiles}
						<div class="recent-file create-new" onClick={() => (this.showModal = true)}>
							<div class="recent-file-name">Create a new file</div>
							<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div class="no-file-container">
				<div class="createFile-wrapper">
					<div class="info-text">You have no files</div>
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
		);
	}

	handleFileSelection(event) {
		this.loadFile(event.target.value);
	}

	loadFile(fileName) {
		this.fileName = fileName;
		this.triggerType = 'load-file';
		state.redirectToConfig = true;
	}

	async removeFile(filename) {
		const alert = await alertController.create({
			header: 'Remove file',
			cssClass: 'alert-remove-file',
			message: `Are you sure you want to remove the file "${filename}"?`,
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
				},
				{
					text: 'Delete',
					handler: () => {
						chrome.storage.local.remove(filename);
						this.recentFiles = this.recentFiles.filter((item) => item !== filename);
						this.fileList = this.fileList.filter((item) => item !== filename);
					},
				},
			],
		});

		await alert.present();
	}

	render() {
		return state.redirectToConfig === false ? (
			<div id="file-explorer">
				<div class="header-section">
					<div class="header_text-container">
						<div class="header_title-text">
							Your Web Scraper files
							<a href="https://github.com/coveo-labs/web-scraper-helper" target="web-scraper-help">
								<ion-img id="infoToken-img" src={infoToken}></ion-img>
							</a>
						</div>
						<div class="header_sub-text">Choose an existing file or create a new one to work on.</div>
					</div>
					<div class="header_file-picker">
						<ion-select
							class="never-flip"
							toggleIcon="caret-down-sharp"
							aria-label="Files"
							interface="popover"
							placeholder="File name"
							fill="outline"
							onIonChange={(event) => this.handleFileSelection(event)}
						>
							{this.renderFileList()}
						</ion-select>
					</div>
				</div>
				<div class="content-section">
					{this.renderRecentFiles()}
					<ion-modal id="create-file-modal" isOpen={this.showModal} backdropDismiss={false}>
						<div class="modal-header">
							<div>Create new file</div>
							<ion-icon name="close-outline" onClick={() => (this.showModal = false)}></ion-icon>
						</div>
						<div class="modal-content">
							<div>Enter a name for your Web Scraper file.</div>
							<ion-input fill="outline" placeholder="Name" onIonInput={(event) => (this.fileName = (event.target as HTMLIonInputElement).value as string)} value={this.fileName}></ion-input>
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
			<create-config fileName={this.fileName} triggerType={this.triggerType}></create-config>
		);
	}
}
