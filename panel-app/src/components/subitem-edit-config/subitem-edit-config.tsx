import { Component, Prop, h, Event, EventEmitter, State, Listen } from '@stencil/core';
import state, { ElementsToExclude, Metadata, getId } from '../store';

@Component({
	tag: 'subitem-edit-config',
	styleUrl: 'subitem-edit-config.scss',
	shadow: false,
})
export class SubitemEditConfig {
	@Prop() subItem: {};
	@Event() updateSubItemState: EventEmitter<any>;
	@State() excludedItems: ElementsToExclude[];
	@State() metadata: Metadata;
	@State() subItemState: { name: ''; type: ''; path: '' };
	selectorValidity;

	@Listen('updateSubItem')
	updateSubItemElement(event) {
		const { action, newItem, oldItem } = event.detail;
		this.updateState(action, newItem, oldItem);
	}

	removeExcludeStyleOnClose() {
		try {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'remove-excluded-on-file-close', payload: { parentSelector: this.subItemState.path } });
			});
		} catch (e) {
			console.log(e);
		}
	}

	onSave() {
		state.subItems = state.subItems.map((item) => {
			if (item.name === this.subItem['name']) {
				return {
					...this.subItemState,
					exclude: this.excludedItems,
					metadata: this.metadata,
				};
			} else {
				return item;
			}
		});
		this.updateSubItemState.emit();
		this.removeExcludeStyleOnClose();
	}

	onCancel() {
		this.updateSubItemState.emit();
		this.removeExcludeStyleOnClose();
	}

	componentWillLoad() {
		this.subItemState = { name: this.subItem['name'], type: this.subItem['type'], path: this.subItem['path'] };
		this.excludedItems = this.subItem['exclude'];
		this.metadata = this.subItem['metadata'];
		try {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'update-excludeSubItem-onLoad', payload: { exclude: this.excludedItems, parentSelector: this.subItemState.path } });
			});
		} catch (e) {
			console.log(e);
		}
	}

	updateState(action: string, newItem, oldItem = { type: '', path: '' }) {
		switch (action) {
			case 'add-excludedItem': {
				this.excludedItems = [...this.excludedItems, { ...newItem, id: getId() }];
				break;
			}
			case 'remove-excludedItem': {
				this.excludedItems = this.excludedItems.filter((excludedItem) => {
					return excludedItem.id !== newItem.id;
				});
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					chrome.tabs.sendMessage(tabs[0].id, { type: 'remove-exclude-selector', payload: { item: newItem, parentSelector: this.subItemState.path } });
				});
				break;
			}
			case 'add-metadataItem': {
				this.metadata = { ...this.metadata, [getId()]: newItem };
				break;
			}
			case 'remove-metadataItem': {
				const { [newItem.id]: removed, ...rest } = this.metadata;
				this.metadata = rest;
				break;
			}
			case 'update-excludedItem': {
				this.excludedItems = this.excludedItems.map((excludedItem) => {
					if (excludedItem.id === newItem.id) {
						chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
							console.log('updateExcludedSubItem: ', newItem.path, oldItem.path);
							chrome.tabs.sendMessage(tabs[0].id, { type: 'exclude-selector', payload: { newItem: newItem, oldItem: oldItem, parentSelector: this.subItemState.path } });
						});
						return { id: newItem.id, type: newItem.type, path: newItem.path };
					} else {
						return excludedItem;
					}
				});
				console.log(this.excludedItems);
				break;
			}
			case 'update-metadataItem': {
				const metadataItem = this.metadata[newItem.id];
				if (metadataItem) {
					this.metadata = { ...this.metadata, [newItem.id]: { name: newItem.name, type: newItem.type, path: newItem.path, ...(newItem.isBoolean && { isBoolean: newItem.isBoolean }) } };
				}
				break;
			}
			case 'update-subItem': {
				this.subItemState = { name: newItem.name as '', type: newItem.type, path: newItem.path };
				break;
			}
		}
	}

	renderExcludedItems() {
		return this.excludedItems.map((item) => {
			return <sub-item-input-element uniqueId={item.id} type="excludeItem" selectorType={item.type} selector={item.path}></sub-item-input-element>;
		});
	}

	renderMetadataItems() {
		return Object.keys(this.metadata).map((key) => {
			const item = this.metadata[key];
			return <sub-item-input-element uniqueId={key} type="metadataItem" name={item.name} selectorType={item.type} selector={item.path} isBoolean={item.isBoolean}></sub-item-input-element>;
		});
	}

	renderSubItemInfo() {
		return <sub-item-input-element type="subItem" name={this.subItemState.name} selectorType={this.subItemState.type} selector={this.subItemState.path}></sub-item-input-element>;
	}

	render() {
		return (
			<div class="subItem-edit-container">
				<div class="subItem-edit-titleText">Edit Subitem : {this.subItem['name']}</div>
				<div class="subItem-selector-container">
					<div class="subItem-edit-text">Selector for the subItem</div>
					<div class="subItem-box">
						{this.renderSubItemInfo()}
						{/* <select-element-item type="subItem" name={this.subItem['name']} selectorType={this.subItem['type']} selector={this.subItem['path']}></select-element-item> */}
					</div>
				</div>
				<div class="subItem-exclude-container">
					<div class="subItem-edit-text">Elements to exlude</div>
					<div class="subItem-box">
						<div id="select-subItem__wrapper">{this.renderExcludedItems()}</div>
						<div class="add-rule" onClick={() => this.updateState('add-excludedItem', { type: 'CSS', path: '' })}>
							<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
							<span>Add Rule</span>
						</div>
					</div>
				</div>
				<div class="subItem-metadata-container">
					<div class="subItem-edit-text">Metadata to extract</div>
					<div class="subItem-box">
						<div id="select-subItem__wrapper">{this.renderMetadataItems()}</div>
						<div class="add-rule" onClick={() => this.updateState('add-metadataItem', { name: '', type: 'CSS', path: '' })}>
							<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
							<span>Add Rule</span>
						</div>
					</div>
				</div>
				<div class="subItem-metadata-container">
					<metadata-results metadata={this.metadata} type="sub-item" parentSelector={this.subItemState.path}></metadata-results>
				</div>
				<div class="action-btn-container">
					<ion-button onClick={() => this.onCancel()} fill="outline">
						Cancel
					</ion-button>
					<ion-button onClick={() => this.onSave()} fill="outline" class="save-btn">
						Save
					</ion-button>
				</div>
			</div>
		);
	}
}
