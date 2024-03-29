import { toastController } from '@ionic/core';
import { Component, Event, EventEmitter, Listen, Prop, State, h } from '@stencil/core';
import state, { getId, sendMessageToContentScript } from '../store';
import { MetadataMap, SelectorElement, SubItem } from '../types';
import { logEvent } from '../analytics';

@Component({
	tag: 'subitem-edit-config',
	styleUrl: 'subitem-edit-config.scss',
	shadow: false,
})
export class SubitemEditConfig {
	@Prop() subItem: {};
	@Event() updateSubItemState: EventEmitter<any>;
	@State() excludedItems: SelectorElement[];
	@State() metadata: MetadataMap;
	@State() subItemState: SubItem;
	selectorValidity;

	@Listen('updateSubItem')
	updateSubItemElement(event) {
		const { action, newItem, oldItem } = event.detail;
		this.updateState(action, newItem, oldItem);
	}

	onSave() {
		state.subItems = state.subItems.map((item: SubItem): SubItem => {
			if (item.name === this.subItem['name']) {
				return {
					...this.subItemState,
					exclude: this.excludedItems,
					metadata: this.metadata,
				};
			}
			return item;
		});
		this.updateSubItemState.emit();
		toastController
			.create({
				message: 'Subitem saved successfully!',
				duration: 3000,
				position: 'top',
			})
			.then((toast) => {
				toast.present();
			});
		this.removeParentSelectorStyle();
		logEvent('cancelled subitem config');
	}

	onCancel() {
		this.updateSubItemState.emit();
		this.removeParentSelectorStyle();
		logEvent('saved subitem config');
	}

	removeParentSelectorStyle() {
		sendMessageToContentScript({ type: 'remove-parentSelector-style', payload: { parentSelector: this.subItemState } });
	}

	componentWillLoad() {
		this.subItemState = { name: this.subItem['name'], type: this.subItem['type'], path: this.subItem['path'] };
		this.excludedItems = this.subItem['exclude'];
		this.metadata = this.subItem['metadata'];

		sendMessageToContentScript({ type: 'update-parentSelector-style', payload: { newSelector: this.subItemState, oldSelector: null } });
	}

	updateState(action: string, newItem, oldItem = { type: '', path: '' }) {
		switch (action) {
			case 'add-excludeItem': {
				this.excludedItems = [...this.excludedItems, { ...newItem, id: getId() }];
				break;
			}
			case 'remove-excludeItem': {
				this.excludedItems = this.excludedItems.filter((excludedItem) => {
					return excludedItem.id !== newItem.id;
				});
				sendMessageToContentScript({ type: 'remove-exclude-selector', payload: { item: newItem, parentSelector: this.subItemState } });
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
			case 'update-excludeItem': {
				this.excludedItems = this.excludedItems.map((excludedItem) => {
					if (excludedItem.id === newItem.id) {
						sendMessageToContentScript({ type: 'exclude-selector', payload: { newItem, oldItem, parentSelector: this.subItemState } });
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
				if (this.subItemState.path !== newItem.path || this.subItemState.type !== newItem.type) {
					sendMessageToContentScript({ type: 'update-parentSelector-style', payload: { newSelector: newItem, oldSelector: oldItem } });
				}

				this.subItemState = { name: newItem.name as '', type: newItem.type, path: newItem.path };
				break;
			}
		}
	}

	renderExcludedItems() {
		return this.excludedItems.map((item) => {
			return <sub-item-input-element uniqueId={item.id} type="excludeItem" selector={item}></sub-item-input-element>;
		});
	}

	renderMetadataItems() {
		return Object.keys(this.metadata).map((key) => {
			const item = this.metadata[key];
			return <sub-item-input-element uniqueId={key} type="metadataItem" selector={item}></sub-item-input-element>;
		});
	}

	renderSubItemInfo() {
		return <sub-item-input-element type="subItem" selector={this.subItemState}></sub-item-input-element>;
	}

	render() {
		return (
			<div class="subItem-edit-container">
				<div class="subItem-edit-titleText">Edit Subitem : {this.subItem['name']}</div>
				<div class="subItem-config-wrapper">
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
							<div class="action-info-container">
								<div class="add-rule" onClick={() => this.updateState('add-excludeItem', { type: 'CSS', path: '' })}>
									<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
									<span>Add Rule</span>
								</div>
								<div class="info-message">
									Learn more about the validation states{' '}
									<a href="https://github.com/coveo-labs/web-scraper-helper/blob/Update_readme/docs/howto.md#validation-states" target="web-scraper-help">
										here.
									</a>
								</div>
							</div>
						</div>
					</div>
					<div class="subItem-metadata-container">
						<div class="subItem-edit-text">Metadata to extract</div>
						<div class="subItem-box">
							<div id="select-subItem__wrapper">{this.renderMetadataItems()}</div>
							<div class="action-info-container">
								<div class="add-rule" onClick={() => this.updateState('add-metadataItem', { name: '', type: 'CSS', path: '' })}>
									<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
									<span>Add Rule</span>
								</div>
								<div class="info-message">
									Learn more about the validation states{' '}
									<a href="https://github.com/coveo-labs/web-scraper-helper/blob/Update_readme/docs/howto.md#validation-states" target="web-scraper-help">
										here.
									</a>
								</div>
							</div>
						</div>
					</div>
					<div class="subItem-metadata-container">
						<metadata-results metadata={this.metadata} type="sub-item" parentSelector={this.subItemState}></metadata-results>
					</div>
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
