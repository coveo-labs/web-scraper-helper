import { Component, Prop, h, Event, EventEmitter, State } from '@stencil/core';

@Component({
	tag: 'sub-item-input-element',
	styleUrl: 'sub-item-input-element.scss',
	shadow: false,
})
export class SubItemInputElement {
	@Event() updateSubItem: EventEmitter<any>;
	@Prop() uniqueId: string;
	@Prop() type: string;
	@Prop() name: string;
	@Prop() selectorType: string;
	@Prop() selector: string;
	@Prop() isBoolean: boolean = false;
	@State() selectorValidity;

	updateState(action: string, newItem, oldItem = { type: '', path: '' }) {
		this.validateSelector(newItem.path, newItem.type);
		this.updateSubItem.emit({ action, newItem, oldItem });
	}

	async validateSelector(selector: string, selectorType: string) {
		const response = await new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'validate-selector', payload: { type: selectorType, selector: selector } }, null, (response) => {
					resolve(response);
				});
			});
		});
		this.selectorValidity = response;
	}

	componentWillLoad() {
		this.validateSelector(this.selector, this.selectorType);
	}

	render() {
		const cssClassForValidity =
			{
				'No element found': 'no-element-found-selector',
				Invalid: 'invalid-selector',
				Valid: 'valid-selector',
			}[this.selectorValidity] || 'never-flip';
		return (
			<div class="subItem-select-element">
				{(this.type === 'metadataItem' || this.type === 'subItem') && (
					<div style={{ flex: '1' }}>
						<ion-input
							class={this.type === 'metadataItem' ? 'metadata-name-input name-input' : 'name-input'}
							fill="outline"
							value={this.name}
							placeholder="Name"
							onIonInput={(event) =>
								this.updateState(this.type === 'metadataItem' ? 'update-metadataItem' : 'update-subItem', { id: this.uniqueId, name: event.target.value, type: this.selectorType, path: this.selector })
							}
						></ion-input>
					</div>
				)}
				<div>
					<ion-input
						id="subItem-selector-type-input"
						fill="outline"
						class={cssClassForValidity}
						value={this.selectorType}
						onClick={() =>
							this.updateState(
								this.type === 'excludeItem' ? 'update-excludedItem' : this.type === 'metadataItem' ? 'update-metadataItem' : 'update-subItem',
								{ id: this.uniqueId, name: this.name, type: this.selectorType === 'CSS' ? 'XPath' : 'CSS', path: this.selector },
								{
									type: this.selectorType,
									path: this.selector,
								}
							)
						}
					></ion-input>
				</div>
				<div style={{ flex: '2' }}>
					<ion-input
						class={this.type === 'excludeItem' ? 'selector-input' : this.type === 'metadataItem' ? 'metadata-selector-input' : 'subItem-selector-input'}
						fill="outline"
						value={this.selector}
						placeholder="expression"
						onIonInput={(event) =>
							this.updateState(
								this.type === 'excludeItem' ? 'update-excludedItem' : this.type === 'metadataItem' ? 'update-metadataItem' : 'update-subItem',
								{ id: this.uniqueId, name: this.name, type: this.selectorType, path: event.detail.value },
								{
									type: this.selectorType,
									path: this.selector,
								}
							)
						}
					></ion-input>
				</div>
				{this.type === 'metadataItem' && (
					<div>
						<ion-checkbox
							checked={this.isBoolean}
							onIonChange={(event) =>
								this.updateState(
									'update-metadataItem',
									{ id: this.uniqueId, name: this.name, type: this.selectorType, path: this.selector, isBoolean: event.detail.checked },
									{
										type: this.selectorType,
										path: this.selector,
									}
								)
							}
						></ion-checkbox>
						<ion-icon name="information-circle-outline"></ion-icon>
					</div>
				)}
				{!(this.type === 'subItem') && (
					<div
						style={{ cursor: 'pointer' }}
						onClick={() =>
							this.updateState(this.type === 'excludeItem' ? 'remove-excludedItem' : 'remove-metadataItem', { id: this.uniqueId, name: this.name, type: this.selectorType, path: this.selector })
						}
					>
						<ion-icon name="remove-circle-outline" size="small" color="primary"></ion-icon>
					</div>
				)}
			</div>
		);
	}
}
