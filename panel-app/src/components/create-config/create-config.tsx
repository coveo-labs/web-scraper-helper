import { Component, Listen, Prop, State, h } from '@stencil/core';
import state, { addExcludedItem, addMetadataItem, addSubItem, formatState, removeSubItem, updateState } from '../store';

@Component({
	tag: 'create-config',
	styleUrl: 'create-config.css',
	shadow: true,
})
export class CreateConfig {
	@Prop() fileName;
	@Prop() triggerType;
	@State() showSubItemConfig: boolean;
	@State() subItem: {};

	@Listen('updateSubItemState')
	hideSubItemConfig() {
		this.showSubItemConfig = !this.showSubItemConfig;
	}

	renderExcludedItems() {
		return state.exclude.map((item) => {
			return <select-element-item type="excludeItem" selectorType={item.type} selector={item.path}></select-element-item>;
		});
	}

	renderMetadataItems() {
		const metadata = state.metadata;
		return Object.keys(metadata).map((key) => {
			const item = metadata[key];
			return <select-element-item type="metadataItem" name={key} selectorType={item.type} selector={item.path}></select-element-item>;
		});
	}

	onDone() {
		state.redirectToConfig = false;
	}

	onSave() {
		try {
			chrome.storage.local.set({
				[this.fileName]: JSON.stringify(formatState(), null, 2),
			});
		} catch (e) {
			console.log(e);
		}
		// state.redirectToConfig = false; /
	}

	async componentWillLoad() {
		if (this.triggerType === 'load-file') {
			try {
				const fileItem = await new Promise((resolve) => {
					chrome.storage.local.get(this.fileName, (items) => resolve(items));
				});

				updateState(fileItem[this.fileName]);
			} catch (e) {
				console.log(e);
			}
		}
	}

	render() {
		return (
			<div id="create-config">
				<div class="header-section">
					<div class="header_text-container">
						<div class="header_title-text">Web Scraper file name: {this.fileName}</div>
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
												<metadata-results></metadata-results>
											</div>
										</ion-tab>
										<ion-tab tab="sub-items">
											{state.subItems.length == 0 ? (
												<div class="empty-subItem-container">
													<div class="subItem-text-container">
														<div class="subItem-text">Sub-items</div>
														<div class="subItem-subtext">
															Define specific elements on the page that must be indexed as separate documents. You may want to do this when a page contains different types of content that you want to
															be individually searchable.
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
											)}
										</ion-tab>
										<ion-tab tab="json">
											<code-viewer></code-viewer>
										</ion-tab>
									</ion-tabs>
								</div>
							</div>
						) : (
							<subitem-edit-config subItem={this.subItem}></subitem-edit-config>
						)}
					</div>
					{!this.showSubItemConfig && (
						<div class="config-action-btns">
							<ion-button onClick={() => this.onDone()} fill="outline" class="cancel-btn">
								Cancel
							</ion-button>
							<ion-button onClick={() => this.onSave()} fill="outline" class="save-btn">
								Save
							</ion-button>
						</div>
					)}
				</div>
			</div>
		);
	}
}