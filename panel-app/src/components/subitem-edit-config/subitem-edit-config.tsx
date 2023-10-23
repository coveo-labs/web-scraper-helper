import { Component, Prop, h, Event, EventEmitter, State } from '@stencil/core';
import state, { ElementsToExclude, Metadata } from '../store';

@Component({
	tag: 'subitem-edit-config',
	styleUrl: 'subitem-edit-config.css',
	shadow: true,
})
export class SubitemEditConfig {
	@Prop() subItem: {};
	@Event() updateSubItemState: EventEmitter<any>;
	@State() excludedItems: ElementsToExclude[];
	@State() metadata: Metadata;
	@State() subItemState: { name: ''; type: ''; path: '' };
	selectorValidity;

	async validateSelector(selector: string, selectorType: string) {
		const response = await new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'validate-selector', payload: { type: selectorType, selector: selector } }, null, (response) => {
					resolve(response);
				});
			});
		});
		return response;
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
	}

	onCancel() {
		this.updateSubItemState.emit();
	}

	componentWillLoad() {
		this.subItemState = { name: this.subItem['name'], type: this.subItem['type'], path: this.subItem['path'] };
		this.excludedItems = this.subItem['exclude'];
		this.metadata = this.subItem['metadata'];
	}

	updateState(action: string, newItem, key = '', oldItem = { type: '', path: '' }) {
		switch (action) {
			case 'add-excludedItem': {
				this.excludedItems = [...this.excludedItems, newItem];
				break;
			}
			case 'remove-excludedItem': {
				this.excludedItems = this.excludedItems.filter((excludedItem) => {
					return excludedItem.type !== newItem.type || excludedItem.path !== newItem.path;
				});
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					chrome.tabs.sendMessage(tabs[0].id, { type: 'remove-exclude-selector', payload: { item: newItem } });
				});
				break;
			}
			case 'add-metadataItem': {
				this.metadata = { ...this.metadata, [key]: newItem };
				break;
			}
			case 'remove-metadataItem': {
				const { [key]: removed, ...rest } = this.metadata;
				this.metadata = rest;
				break;
			}
			case 'update-excludedItem': {
				// this.validateSelector(newItem.path, newItem.type);
				this.excludedItems = this.excludedItems.map((excludedItem) => {
					if (excludedItem.type === oldItem.type && excludedItem.path === oldItem.path) {
						chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
							console.log('updateExcludedSubItem: ', newItem.path, oldItem.path);
							chrome.tabs.sendMessage(tabs[0].id, { type: 'exclude-selector', payload: { newItem: newItem, oldItem: oldItem } });
						});
						return newItem;
					} else {
						return excludedItem;
					}
				});
				break;
			}
			case 'update-metadataItem': {
				const metadataItem = this.metadata[key];
				if (metadataItem) {
					if (newItem.name && newItem.name !== key) {
						const { [key]: removed, ...rest } = this.metadata;
						this.metadata = { ...rest, [newItem.name]: { type: newItem.type, path: newItem.path } };
					} else {
						this.metadata = { ...this.metadata, [key]: { ...metadataItem, ...{ type: newItem.type, path: newItem.path } } };
					}
				}
				break;
			}
			case 'update-subItem': {
				this.subItemState = { name: key as '', type: newItem.type, path: newItem.path };
				break;
			}
		}
	}

	renderExcludedItems() {
		return this.excludedItems.map((item) => {
			return this.renderInputItem('excludeItem', '', item.type, item.path);
		});
	}

	renderMetadataItems() {
		return Object.keys(this.metadata).map((key) => {
			const item = this.metadata[key];
			return this.renderInputItem('metadataItem', key, item.type, item.path);
		});
	}

	renderSubItemInfo() {
		return this.renderInputItem('subItem', this.subItemState.name, this.subItemState.type, this.subItemState.path);
	}

	renderInputItem(type, name = '', selectorType, selector) {
		return (
			<div class="subItem-select-element">
				{(type === 'metadataItem' || type === 'subItem') && (
					<div>
						<ion-input
							class="name-input"
							fill="outline"
							value={name}
							placeholder="Name"
							onIonInput={(event) =>
								this.updateState(
									type === 'metadataItem' ? 'update-metadataItem' : 'update-subItem',
									{ name: event.target.value, type: selectorType, path: selector },
									type === 'subItem' ? (event.target.value as string) : name
								)
							}
						></ion-input>
					</div>
				)}
				<div>
					<ion-input
						id="subItem-selector-type-input"
						fill="outline"
						// class={this.getClassTest(selector, selectorType)}
						value={selectorType}
						onClick={() =>
							this.updateState(
								type === 'excludeItem' ? 'update-excludedItem' : type === 'metadataItem' ? 'update-metadataItem' : 'update-subItem',
								{ type: selectorType === 'CSS' ? 'XPath' : 'CSS', path: selector },
								name,
								{
									type: selectorType,
									path: selector,
								}
							)
						}
					></ion-input>
				</div>
				<div>
					<ion-input
						class={type === 'excludeItem' ? 'selector-input' : type === 'metadataItem' ? 'metadata-selector-input' : 'subItem-selector-input'}
						fill="outline"
						value={selector}
						placeholder="expression"
						onIonInput={(event) =>
							this.updateState(
								type === 'excludeItem' ? 'update-excludedItem' : type === 'metadataItem' ? 'update-metadataItem' : 'update-subItem',
								{ type: selectorType, path: event.detail.value },
								name,
								{
									type: selectorType,
									path: selector,
								}
							)
						}
					></ion-input>
				</div>
				{!(type === 'subItem') && (
					<div
						style={{ cursor: 'pointer' }}
						onClick={() => this.updateState(type === 'excludeItem' ? 'remove-excludedItem' : 'remove-metadataItem', { name, type: selectorType, path: selector }, name)}
					>
						<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
					</div>
				)}
			</div>
		);
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
						<div class="add-rule" onClick={() => this.updateState('add-metadataItem', { type: 'CSS', path: '' }, '')}>
							<ion-icon name="add-circle-outline" size="small" color="primary"></ion-icon>
							<span>Add Rule</span>
						</div>
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
