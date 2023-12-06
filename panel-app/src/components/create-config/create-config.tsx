import { Component, Host, Listen, State, h } from '@stencil/core';
import state, { addExcludedItem, addMetadataItem, addSubItem, addToRecentFiles, formatState, removeSubItem, resetStore, sendMessageToContentScript, updateGlobalName, updateState } from '../store';
import { alertController, toastController } from '@ionic/core';
import infoToken from '../../assets/icon/InfoToken.svg';
import { SubItem } from '../types';
import { logEvent } from '../analytics';

@Component({
	tag: 'create-config',
	styleUrl: 'create-config.scss',
	shadow: false,
})
export class CreateConfig {
	@State() showSubItemConfig: boolean;
	@State() subItem: SubItem;
	@State() activeTab: number = 0;

	@Listen('updateSubItemState')
	hideSubItemConfig() {
		this.showSubItemConfig = !this.showSubItemConfig;
	}

	renderExcludedItems() {
		return state.exclude.map((item) => {
			return <select-element-item type="excludeItem" selector={item} uniqueId={item.id}></select-element-item>;
		});
	}

	renderMetadataItems() {
		const metadata = state.metadata;
		return Object.keys(metadata).map((key) => {
			const item = metadata[key];
			return <select-element-item type="metadataItem" uniqueId={key} name={item.name} selector={item}></select-element-item>;
		});
	}

	redirectAndReset() {
		state.currentFile = null;
		resetStore();
		sendMessageToContentScript({ type: 'remove-excluded-on-file-close' });
	}

	async onDone() {
		if (state.hasChanges) {
			const alert = await alertController.create({
				header: 'Unsaved Changes',
				cssClass: 'alert-unsaved',
				message: 'You have unsaved changes.\n\nAre you sure you want to close the file?',
				buttons: [
					{
						text: 'No',
						role: 'cancel',
					},
					{
						text: 'Yes',
						role: 'destructive',
						handler: () => {
							this.redirectAndReset();
						},
					},
				],
			});

			await alert.present();
		} else {
			this.redirectAndReset();
		}
	}

	onSave() {
		try {
			chrome.storage.local.set({
				[state.currentFile.name]: JSON.stringify(formatState(), null, 2),
			});
			toastController
				.create({
					message: 'File saved successfully!',
					duration: 3000,
					position: 'top',
				})
				.then((toast) => {
					toast.present();
				});
			state.hasChanges = false; // changes have been saved

			logEvent('completed file edit');
		} catch (e) {
			console.log(e);
		}
	}

	handleGlobalNameChange(e) {
		updateGlobalName(e.detail.value);
	}

	async componentWillLoad() {
		try {
			if (state.currentFile?.triggerType === 'load-file') {
				const fileName = state.currentFile.name;
				const fileItem = await new Promise((resolve) => {
					chrome.storage.local.get(fileName, (items) => resolve(items));
				});

				updateState(fileItem[fileName], false);
				await addToRecentFiles(fileName);
			} else {
				sendMessageToContentScript({ type: 'update-excludeItem-onLoad', payload: { exclude: state.exclude, subItems: state.subItems } });
			}
		} catch (e) {
			console.log(e);
		}
	}

	async showPopover(className) {
		const popover = document.querySelector(`.${className}`) as HTMLIonPopoverElement;
		await popover.present();
		setTimeout(() => {
			popover.dismiss();
		}, 10000);
	}

	renderInfoIcon(id, content) {
		return (
			<span>
				<ion-icon name="information-circle-outline" id={id} onClick={() => this.showPopover(id)}></ion-icon>
				<ion-popover id="info-popover" class={id} trigger={id} side="top" alignment="center" showBackdrop={false} backdropDismiss={false}>
					<ion-content class="ion-padding"> {content}</ion-content>
				</ion-popover>
			</span>
		);
	}

	renderElementsToExcludeTab() {
		return (
			<div class="collection-subContainer">
				<div>
					Select page elements to exclude
					{this.renderInfoIcon('exclude-information-circle-outline', 'Exclude specific parts of the page from being indexed')}
				</div>
				<div class="select-element__container">
					<div id="select-element__wrapper">{this.renderExcludedItems()}</div>
					<div class="action-info-container">
						<div class="add-rule" onClick={() => addExcludedItem({ type: 'CSS', path: '' })}>
							<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
							<span>Add Rule</span>
						</div>
						<div class="info-message">
							Learn more about the validation states{' '}
							<a
								href="https://github.com/coveo-labs/web-scraper-helper/blob/Update_readme/docs/howto.md#validation-states"
								target="web-scraper-help"
								onClick={() => logEvent('clicked file learn more about the validation states', { tab: 'elements to exclude' })}
							>
								here.
							</a>
						</div>
					</div>
				</div>
				<div style={{ marginTop: '32px' }}>Global section name</div>
				<ion-input class="global-section-input" fill="outline" placeholder="Name your global section" value={state.name || ''} onIonInput={(e) => this.handleGlobalNameChange(e)}></ion-input>
			</div>
		);
	}

	renderMetadataToExtractTab() {
		return (
			<div class="collection-subContainer">
				<div>
					Select metadata to extract
					{this.renderInfoIcon('metadata-information-circle-outline', 'Create metadata from elements on the page.')}
				</div>
				<div class="select-element__container">
					<div id="select-element__wrapper">{this.renderMetadataItems()}</div>
					<div class="action-info-container">
						<div class="add-rule" onClick={() => addMetadataItem({ name: '', type: 'CSS', path: '' })}>
							<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
							<span>Add Rule</span>
						</div>
						<div class="info-message">
							Learn more about the validation states{' '}
							<a
								href="https://github.com/coveo-labs/web-scraper-helper/blob/Update_readme/docs/howto.md#validation-states"
								target="web-scraper-help"
								onClick={() => logEvent('clicked file learn more about the validation states', { tab: 'metadata to extract' })}
							>
								here.
							</a>
						</div>
					</div>
				</div>
				<div style={{ marginTop: '24px' }}>Results</div>
				<metadata-results metadata={state.metadata}></metadata-results>
			</div>
		);
	}

	renderSubItemsTab() {
		return state.subItems.length == 0 ? (
			<div class="empty-subItem-container">
				<div class="subItem-text-container">
					<div class="subItem-text">Sub-items</div>
					<div class="subItem-subtext">
						Define specific elements on the page that must be indexed as separate documents. You may want to do this when a page contains different types of content that you want to be individually
						searchable.
					</div>
					<div>
						<ion-button fill="outline" class="add-subItem-btn" onClick={() => addSubItem()}>
							<ion-icon slot="start" name="add-circle-outline"></ion-icon>
							Add sub-item
						</ion-button>
					</div>
				</div>
			</div>
		) : (
			<div style={{ padding: '32px 24px' }}>
				<table class="subItem-container">
					<thead class="subItem-header">
						<th>
							<div class="add-subItem" onClick={() => addSubItem()}>
								<ion-icon slot="start" name="add-circle-outline"></ion-icon>
								<span>Add sub-item</span>
							</div>
						</th>
					</thead>
					<tbody>
						{state.subItems.map((item, idx) => (
							<tr>
								<div
									key={item.name}
									class="subItem"
									onClick={() => {
										this.subItem = item;
										this.showSubItemConfig = true;
									}}
								>
									<span>
										Sub Item {idx + 1} : {item.name}
									</span>
									<span>
										<ion-icon
											slot="start"
											name="trash"
											onClick={(event) => {
												removeSubItem(item.name);
												event.stopPropagation();
											}}
										></ion-icon>
									</span>
								</div>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	renderJSONTab() {
		return <code-viewer></code-viewer>;
	}

	renderTabContent() {
		switch (this.activeTab) {
			case 0:
				return this.renderElementsToExcludeTab();
			case 1:
				return this.renderMetadataToExtractTab();
			case 2:
				return this.renderSubItemsTab();
			case 3:
				return this.renderJSONTab();
			default:
				return null;
		}
	}

	tabClicked(index: number) {
		this.activeTab = index;
		logEvent(`viewed file ${this.tabs[this.activeTab].toLowerCase()}`);
	}

	tabs = ['Elements to exclude', 'Metadata to extract', 'SubItems', 'JSON'];

	render() {
		const dirty = state.hasChanges ? (
			<span class="is-dirty" title="Unsaved changes">
				*
			</span>
		) : (
			''
		);
		return (
			<Host id="create-config">
				<div class="header-section">
					<div class="header_text-container">
						<div class="header_title-text">
							Web Scraper file name:{' '}
							<span style={{ marginLeft: '4px', textTransform: 'capitalize' }}>
								{state.currentFile?.name}
								{dirty}
							</span>
							<a href="https://github.com/coveo-labs/web-scraper-helper" target="web-scraper-help" onClick={() => logEvent('clicked documentation link', { page: 'file' })}>
								<ion-img id="infoToken-img" src={infoToken}></ion-img>
							</a>
						</div>
						<div class="header_sub-text">Start creating Web Scraper configuration for this file.</div>
					</div>
					<div class="header_btn">
						<ion-button onClick={() => this.onDone()}>Done</ion-button>
					</div>
				</div>
				<div class="content-section">
					<div class="content-container">
						{!this.showSubItemConfig ? (
							<div>
								{/* <div class="content-text">Create a Web Scraping configuration</div> */}
								<div class="content-tabs">
									<div class="custom-tab-bar">
										{this.tabs.map((tab, index) => (
											<div class={this.activeTab === index ? 'active tab-btn' : 'tab-btn'} onClick={() => this.tabClicked(index)}>
												{tab}
											</div>
										))}
									</div>
									<div id="collection-container">{this.renderTabContent()}</div>
								</div>
							</div>
						) : (
							<subitem-edit-config subItem={this.subItem}></subitem-edit-config>
						)}
					</div>
				</div>
				{!this.showSubItemConfig && (
					<div class="config-action-btns">
						<ion-button
							onClick={() => {
								this.onDone();
								logEvent('cancelled file edit');
							}}
							fill="outline"
							class="cancel-btn"
						>
							Cancel
						</ion-button>
						<ion-button onClick={() => this.onSave()} fill="outline" class="save-btn">
							Save
						</ion-button>
					</div>
				)}
			</Host>
		);
	}
}
