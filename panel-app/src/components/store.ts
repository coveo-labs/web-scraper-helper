import { createStore } from '@stencil/store';
import { v4 as uuidv4 } from 'uuid';
import { OverallConfiguration, Configuration, MetadataMap, Selector, SelectorElement, SelectorType, SubItem } from './types';
import { logErrorEvent, logEvent } from './analytics';
import storage from './storage/storage';

export function getId(): string {
	let uniqueId = uuidv4();
	return `uid-${uniqueId}-${Date.now()}`;
}

const { reset, state, onChange }: { reset: Function; state: OverallConfiguration; onChange: Function; } = createStore(
	{
		currentFile: null,
		index: 0,
		currentConfiguration: () => {
			return state.configurations[state.index];
		},
		configurations: [
			{
				name: '[Default Coveo web scraping configuration]',
				hasChanges: false,
				exclude: [
					{
						id: getId(),
						type: 'CSS',
						path: 'script',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'noscript',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'iframe',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'menu',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'nav',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'header',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'footer',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'video',
					},
					{
						id: getId(),
						type: 'CSS',
						path: 'audio',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.menu',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.nav',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.navigation',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.navbar',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.nav-bar',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.head',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.header',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.foot',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.footer',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.sidebar',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.sidenav',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.banner',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.ad',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.advert',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.advertisement',
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.adsbygoogle'
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.popup'
					},
					{
						id: getId(),
						type: 'CSS',
						path: '.modal'
					}
				],
				metadata: {},
				subItems: [],
			}
		],
		hasChanges: false,
	});

function resetStore() {
	reset();
}

onChange('configurations', () => {
	state.hasChanges = true;
});

onChange('index', () => {
	state.hasChanges = true;
});

function getSubItemValues(arrayList, key) {
	return arrayList.find((obj) => obj.name === key);
}

function getFormattedMetadata(action, metadata) {
	let formattedMetadata = {};

	const keys = Object.keys(metadata || {});
	if (keys.length) {
		switch (action) {
			case 'updateState':
				formattedMetadata = keys.reduce((acc, key) => {
					const item = metadata[key];
					const { type, path, isBoolean } = item;
					acc[getId()] = { name: key, type: type, path: path, ...(isBoolean && { isBoolean: isBoolean }) };
					return acc;
				}, {});
				break;
			case 'formatState':
				formattedMetadata = keys.reduce((result, key) => {
					const { name, type, path, isBoolean } = metadata[key];
					result[name] = { type, path, isBoolean };
					return result;
				}, {});
				break;
		}
	}
	return formattedMetadata;
}

function updateState(newJsonState: string): boolean {
	try {
		const parsedValue = JSON.parse(newJsonState);

		if (Array.isArray(parsedValue)) {
			state.configurations = [];

			parsedValue.forEach(({ name, exclude, for: forvalue, metadata, subItems }, _) => {
				const formattedExclude =
					exclude &&
					exclude.map((item) => {
						return { id: getId(), type: item.type, path: item.path };
					});

				const formattedMetadata = getFormattedMetadata('updateState', metadata);

				const formattedSubItems =
					subItems &&
					Object.keys(subItems).map((key) => {
						const { exclude, metadata } = getSubItemValues(parsedValue, key);
						const formattedSubItemExclude =
							exclude &&
							exclude.map((item) => {
								return { id: getId(), type: item.type, path: item.path };
							});
						const formattedSubItemMetadata = getFormattedMetadata('updateState', metadata);
						return {
							name: key,
							type: subItems[key].type,
							path: subItems[key].path,
							exclude: formattedSubItemExclude,
							metadata: formattedSubItemMetadata,
						};
					});

				const formattedValue: Configuration = {
					name,
					exclude: formattedExclude,
					for: forvalue,
					metadata: formattedMetadata,
					subItems: subItems ? formattedSubItems : [],
				};

				state.configurations.push(formattedValue);
				// It's the index change triggers the refresh (No need to use 'UpdateConfiguration' method)
				state.index = state.configurations.length - 1;

				// add opacity to the elements onLoad
				sendMessageToContentScript({ type: 'update-excludeItem-onLoad', payload: { exclude: formattedValue.exclude, subItems: formattedValue.subItems } });
			});
		}
	} catch (e) {
		logErrorEvent('error state update', e);
		return true;
	}

	return false;
}

function formatState() {
	const formattedState = [];

	state.configurations.forEach((config, _) => {
		formattedState.push(...formatConfiguration(config));
	});

	return formattedState;
}

function formatConfiguration(configuration: Configuration) {
	const { exclude, for: forValue, metadata, subItems, name } = configuration;

	const formattedExclude =
		exclude &&
		exclude.map((item) => {
			return { type: item.type, path: item.path };
		});

	const formattedMetadata = getFormattedMetadata('formatState', metadata);

	const formattedForValue = forValue && {
		urls: forValue.urls,
		types: forValue.types,
	};

	const formattedSubItems =
		subItems &&
		subItems.map((item) => {
			const { name, exclude, metadata } = item;
			const formattedSubItemExclude =
				exclude &&
				exclude.map((item) => {
					return { type: item.type, path: item.path };
				});
			const formattedSubItemMetadata = getFormattedMetadata('formatState', metadata);

			return {
				for: {
					types: [name],
				},
				exclude: formattedSubItemExclude,
				metadata: formattedSubItemMetadata,
				name,
			};
		});

	const formattedState = [
		{
			name: name,
			exclude: formattedExclude,
			for: formattedForValue,
			metadata: formattedMetadata,
			...(subItems?.length > 0
				? {
					subItems: subItems.reduce((acc, curr) => {
						acc[curr.name] = {
							type: curr.type,
							path: curr.path,
						};
						return acc;
					}, {}),
				}
				: {}),
		},
		...formattedSubItems,
	];

	return formattedState;
}

function updateGlobalName(newName) {
	state.currentConfiguration().name = newName;
	updateConfiguration({ ...state.currentConfiguration() });
}

function addExcludedItem(item) {
	const id = getId();
	const exclude = [...state.currentConfiguration().exclude, { ...item, id }];
	updateConfiguration({ ...state.currentConfiguration(), exclude });
}

/*
* Stencil doesn't support deep mutation.
* If we want to ensure onChange'configs' is triggered, we have to update the higher hierarchy element.
*/
function updateConfiguration(partial: Partial<Configuration>) {
	const updated = {
		...state.configurations[state.index],
		...partial
	};
	state.configurations[state.index] = updated;
	state.configurations = [...state.configurations];
}

function removeExcludedItem(item: SelectorElement) {
	const exclude = state.currentConfiguration().exclude.filter((excludedItem) => {
		return excludedItem.id !== item.id;
	});
	updateConfiguration({ ...state.currentConfiguration(), exclude });
	sendMessageToContentScript({ type: 'remove-exclude-selector', payload: { item } });
}

function addMetadataItem(item: { name: string; type: SelectorType; path: string; }) {
	const metadata = { ...state.currentConfiguration().metadata, [getId()]: { name: item.name, type: item.type, path: item.path } };
	updateConfiguration({ ...state.currentConfiguration(), metadata });
}

function removeMetadataItem(uid: string) {
	const { [uid]: _, ...metadata } = state.currentConfiguration().metadata;
	updateConfiguration({ ...state.currentConfiguration(), metadata });
}

async function getMetadataResults(type = 'global', metadata: MetadataMap = {}, parentSelector: Selector = null) {
	const response = await new Promise((resolve) => {
		sendMessageToContentScript({ type: 'metadata-results', payload: { metadata: type === 'global' ? state.currentConfiguration().metadata : metadata, parentSelector: parentSelector } }, resolve);
	});
	return response;
}

function addSubItem() {
	state.currentConfiguration().subItems = [...state.currentConfiguration().subItems, { name: 'subItem', type: 'CSS', path: '', exclude: [], metadata: {} }];
	updateConfiguration({ ...state.currentConfiguration() });
	logEvent('added subitem');
}

function removeSubItem(itemName: string) {
	state.currentConfiguration().subItems = state.currentConfiguration().subItems.filter((subItem) => {
		return subItem.name !== itemName;
	});
	updateConfiguration({ ...state.currentConfiguration() });
	logEvent('deleted subitem');
}

function updateMetadataItem(newItem: { id: string; name: string; type: string; path: string; isBoolean?: boolean; }) {
	const metadata = Object.keys(state.currentConfiguration().metadata).reduce((acc, key) => {
		if (key === newItem.id) {
			acc[key] = { name: newItem.name, type: newItem.type, path: newItem.path, ...(newItem.isBoolean && { isBoolean: newItem.isBoolean }) };
		} else {
			acc[key] = state.currentConfiguration().metadata[key];
		}
		return acc;
	}, {});
	updateConfiguration({ ...state.currentConfiguration(), metadata });
}

function updateExcludedItem(newItem: SelectorElement, oldItem: SelectorElement) {
	// add opacity to the element
	sendMessageToContentScript({ type: 'exclude-selector', payload: { newItem, oldItem } });
	const exclude = state.currentConfiguration().exclude.map((excludedItem) => {
		if (excludedItem.id === oldItem.id) {
			return newItem;
		}
		return excludedItem;
	});
	updateConfiguration({ ...state.currentConfiguration(), exclude });
}

function updateSubItem(newItem: SubItem, oldItem: SubItem) {
	const subItems = state.currentConfiguration().subItems.map((subItem) => {
		if (subItem.name === oldItem.name && subItem.type === oldItem.type && subItem.path === oldItem.path) {
			return newItem;
		}
		return subItem;
	});
	updateConfiguration({ ...state.currentConfiguration(), subItems });
}

const addToRecentFiles = async (filename: string): Promise<string[]> => {
	return storage.addToRecentFiles(filename);
};

const sendMessageToContentScript = (message: any, callback: any = null): any => {
	try {
		const tabId = chrome.devtools?.inspectedWindow?.tabId;
		chrome.tabs.sendMessage(tabId, { tabId, ...message }, null, callback);
	} catch (e) {
		logErrorEvent('error send message', e);
	}
};

export default state;
export {
	addExcludedItem,
	addMetadataItem,
	addSubItem,
	addToRecentFiles,
	formatState,
	getMetadataResults,
	onChange,
	removeExcludedItem,
	removeMetadataItem,
	removeSubItem,
	resetStore,
	sendMessageToContentScript,
	updateExcludedItem,
	updateGlobalName,
	updateMetadataItem,
	updateState,
	updateSubItem,
};
