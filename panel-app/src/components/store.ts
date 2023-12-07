import { createStore } from '@stencil/store';
import { v4 as uuidv4 } from 'uuid';
import { ConfigState, MetadataMap, Selector, SelectorElement, SelectorType, SubItem } from './types';
import { logEvent } from './analytics';

export function getId(): string {
	let uniqueId = uuidv4();
	return `uid-${uniqueId}-${Date.now()}`;
}

const { reset, state, onChange }: { reset: Function; state: ConfigState; onChange: Function } = createStore({
	currentFile: null,
	hasChanges: false,
	exclude: [
		{
			id: getId(),
			type: 'CSS',
			path: 'header, .header, *[role="header"]',
		},
		{
			id: getId(),
			type: 'CSS',
			path: 'footer, .footer',
		},
		{
			id: getId(),
			type: 'CSS',
			path: 'noscript, nav',
		},
	],
	metadata: {},
	subItems: [],
});

function resetStore() {
	reset();
}

onChange('name', () => {
	state.hasChanges = true;
});

onChange('exclude', () => {
	state.hasChanges = true;
});

onChange('metadata', () => {
	state.hasChanges = true;
});

onChange('subItems', () => {
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

function updateState(newState, hasChanges?: boolean): boolean {
	try {
		const parsedValue = JSON.parse(newState);
		if (parsedValue) {
			const { name, exclude, metadata, subItems } = parsedValue[0];

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

			const formattedValue = {
				name,
				exclude: formattedExclude,
				metadata: formattedMetadata,
				subItems: subItems ? formattedSubItems : [],
			};

			state.name = formattedValue.name;
			state.exclude = formattedValue.exclude;
			state.metadata = formattedValue.metadata;
			state.subItems = formattedValue.subItems && formattedValue.subItems;

			// add opacity to the elements onLoad
			sendMessageToContentScript({ type: 'update-excludeItem-onLoad', payload: { exclude: state.exclude, subItems: state.subItems } });

			if (hasChanges !== undefined) {
				state.hasChanges = hasChanges;
			}
		}
	} catch (error) {
		console.log(error);
		return true;
	}

	return false;
}

function formatState() {
	const { exclude, metadata, subItems, name } = state;

	const formattedExclude =
		exclude &&
		exclude.map((item) => {
			return { type: item.type, path: item.path };
		});

	const formattedMetadata = getFormattedMetadata('formatState', metadata);

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
			for: {
				urls: ['.*'],
			},
			exclude: formattedExclude,
			metadata: formattedMetadata,
			subItems:
				subItems &&
				subItems.reduce((acc, curr) => {
					acc[curr.name] = {
						type: curr.type,
						path: curr.path,
					};
					return acc;
				}, {}),
		},
		...formattedSubItems,
	];

	return formattedState;
}

function updateGlobalName(newName) {
	state.name = newName;
}

function addExcludedItem(item) {
	const id = getId();
	state.exclude = [...state.exclude, { ...item, id }];
}

function removeExcludedItem(item: SelectorElement) {
	state.exclude = state.exclude.filter((excludedItem) => {
		return excludedItem.id !== item.id;
	});

	sendMessageToContentScript({ type: 'remove-exclude-selector', payload: { item } });
}

function addMetadataItem(item: { name: string; type: SelectorType; path: string }) {
	state.metadata = { ...state.metadata, [getId()]: { name: item.name, type: item.type, path: item.path } };
}

function removeMetadataItem(uid: string) {
	const { [uid]: _, ...metadata } = state.metadata;
	state.metadata = metadata;
}

async function getMetadataResults(type = 'global', metadata: MetadataMap = {}, parentSelector: Selector = null) {
	const response = await new Promise((resolve) => {
		sendMessageToContentScript({ type: 'metadata-results', payload: { metadata: type === 'global' ? state.metadata : metadata, parentSelector: parentSelector } }, resolve);
	});
	console.log('getMetadataResults-response', response);
	return response;
}

function addSubItem() {
	state.subItems = [...state.subItems, { name: 'subItem', type: 'CSS', path: '', exclude: [], metadata: {} }];
	logEvent('added subitem');
}

function removeSubItem(itemName: string) {
	state.subItems = state.subItems.filter((subItem) => {
		return subItem.name !== itemName;
	});
	logEvent('deleted subitem');
}

function updateMetadataItem(newItem: { id: string; name: string; type: string; path: string; isBoolean?: boolean }) {
	state.metadata = Object.keys(state.metadata).reduce((acc, key) => {
		if (key === newItem.id) {
			acc[key] = { name: newItem.name, type: newItem.type, path: newItem.path, ...(newItem.isBoolean && { isBoolean: newItem.isBoolean }) };
		} else {
			acc[key] = state.metadata[key];
		}
		return acc;
	}, {});
}

function updateExcludedItem(newItem: SelectorElement, oldItem: SelectorElement) {
	// add opacity to the element
	sendMessageToContentScript({ type: 'exclude-selector', payload: { newItem, oldItem } });
	state.exclude = state.exclude.map((excludedItem) => {
		if (excludedItem.id === oldItem.id) {
			return newItem;
		}
		return excludedItem;
	});
}

function updateSubItem(newItem: SubItem, oldItem: SubItem) {
	state.subItems = state.subItems.map((subItem) => {
		if (subItem.name === oldItem.name && subItem.type === oldItem.type && subItem.path === oldItem.path) {
			return newItem;
		}
		return subItem;
	});
}

const addToRecentFiles = async (filename: string): Promise<string[]> => {
	const RECENT_FILES_ITEM_NAME = '__Recent__Files__';

	return new Promise((resolve) => {
		chrome.storage.local.get(RECENT_FILES_ITEM_NAME, (items) => {
			let recentFiles = items[RECENT_FILES_ITEM_NAME] || [];
			recentFiles = [filename, ...recentFiles.filter((item) => item !== filename)];
			chrome.storage.local.set({ [RECENT_FILES_ITEM_NAME]: recentFiles });

			resolve(recentFiles);
		});
	});
};

const sendMessageToContentScript = (message: any, callback: any = null): any => {
	try {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			console.log('tabs', tabs);
			if (tabs?.length && tabs[0].id) chrome.tabs.sendMessage(tabs[0].id, message, null, callback);
		});
	} catch (e) {
		console.log(e);
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
