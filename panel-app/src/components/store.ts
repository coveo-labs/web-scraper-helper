import { createStore } from '@stencil/store';
import { v4 as uuidv4 } from 'uuid';

export type ElementsToExclude = {
	id: string;
	type: string;
	path: string;
};

export type Metadata = {
	[key: string]: {
		name: string;
		type: string;
		path: string;
		isBoolean?: boolean;
	};
};

type SubItems = {
	name: string;
	type: string;
	path: string;
	exclude?: ElementsToExclude[];
	metadata?: Metadata;
};

type ConfigState = {
	name?: string;
	redirectToConfig: boolean;
	exclude: ElementsToExclude[];
	metadata: Metadata;
	subItems: SubItems[];
};

export function getId(): string {
	let uniqueId = uuidv4();
	return `uid-${uniqueId}-${Date.now()}`;
}

const { state }: { state: ConfigState } = createStore({
	redirectToConfig: false,
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
	metadata: {
		'uid-7fb4d0a5-664b-4df7-89a0-702b7b47e255-1698474061246': {
			name: '',
			type: 'CSS',
			path: '',
		},
	},
	subItems: [
		{
			name: 'SubItemName',
			type: 'CSS',
			path: '.productpage',
			exclude: [
				{
					id: 'uid-7fb4d0a5-664b-4df7-89a0-702b7b47e255-1698474061555',
					type: 'CSS',
					path: '',
				},
			],
			metadata: {
				'uid-7fb4d0a5-664b-4df7-89a0-702b7b47e255-1698474061247': {
					name: '',
					type: 'CSS',
					path: '',
				},
			},
		},
	],
});

function getSubItemValues(arrayList, key) {
	return arrayList.find((obj) => obj.name === key);
}

function updateState(newState): boolean {
	try {
		const parsedValue = JSON.parse(newState);
		if (parsedValue) {
			const { name, exclude, metadata, subItems } = parsedValue[0];

			const formattedExclude =
				exclude &&
				exclude.map((item) => {
					return { id: getId(), type: item.type, path: item.path };
				});

			const formattedMetadata =
				metadata &&
				Object.keys(metadata).reduce((acc, key) => {
					const item = metadata[key];
					const { type, path, isBoolean } = item;
					acc[getId()] = { name: key, type: type, path: path, ...(isBoolean && { isBoolean: isBoolean }) };
					return acc;
				}, {});

			const formattedSubItems =
				subItems &&
				Object.keys(subItems).map((key) => {
					const { exclude, metadata } = getSubItemValues(parsedValue, key);
					const formattedSubItemExclude =
						exclude &&
						exclude.map((item) => {
							return { id: getId(), type: item.type, path: item.path };
						});
					const formattedSubItemMetadata =
						metadata &&
						Object.keys(metadata).reduce((acc, key) => {
							const item = metadata[key];
							const { type, path, isBoolean } = item;
							acc[getId()] = { name: key, type: type, path: path, ...(isBoolean && { isBoolean: isBoolean }) };
							return acc;
						}, {});
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
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'update-excludeItem-onLoad', payload: { exclude: state.exclude } });
			});

			return false;
		}
	} catch (error) {
		console.log(error);
		return true;
	}
}

function formatState() {
	const { exclude, metadata, subItems, name } = state;

	const formattedExclude =
		exclude &&
		exclude.map((item) => {
			return { type: item.type, path: item.path };
		});

	const formattedMetadata =
		metadata &&
		Object.keys(metadata).reduce((result, key) => {
			const { name, type, path, isBoolean } = metadata[key];
			result[name] = { type, path, isBoolean };
			return result;
		}, {});

	const formattedSubItems =
		subItems &&
		subItems.map((item) => {
			const { name, exclude, metadata } = item;
			const formattedSubItemExclude =
				exclude &&
				exclude.map((item) => {
					return { type: item.type, path: item.path };
				});
			const formattedSubItemMetadata =
				metadata &&
				Object.keys(metadata).reduce((result, key) => {
					const { name, type, path, isBoolean } = metadata[key];
					result[name] = { type, path, isBoolean };
					return result;
				}, {});

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

function removeExcludedItem(item: ElementsToExclude) {
	state.exclude = state.exclude.filter((excludedItem) => {
		return excludedItem.id !== item.id;
	});

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { type: 'remove-exclude-selector', payload: { item: item } });
	});
}

function addMetadataItem(item: { name: string; type: string; path: string }) {
	state.metadata = { ...state.metadata, [getId()]: { name: item.name, type: item.type, path: item.path } };
}

function removeMetadataItem(uid: string) {
	const { [uid]: _, ...metadata } = state.metadata;
	state.metadata = metadata;
}

async function getMetadataResults() {
	const response = await new Promise((resolve) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, { type: 'metadata-results', payload: { metadata: state.metadata } }, (response) => {
				resolve(response);
			});
		});
	});
	console.log('response', response);
	return response;
}

function addSubItem() {
	state.subItems = [...state.subItems, { name: 'subItem', type: 'CSS', path: '', exclude: [], metadata: {} }];
}

function removeSubItem(itemName: string) {
	state.subItems = state.subItems.filter((subItem) => {
		return subItem.name !== itemName;
	});
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

function updateExcludedItem(newItem: ElementsToExclude, oldItem: ElementsToExclude) {
	// add opacity to the element
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		console.log('updateExcludedItem: ', newItem.path, oldItem.path);
		chrome.tabs.sendMessage(tabs[0].id, { type: 'exclude-selector', payload: { newItem: newItem, oldItem: oldItem } });
	});
	state.exclude = state.exclude.map((excludedItem) => {
		if (excludedItem.id === oldItem.id) {
			return newItem;
		} else {
			return excludedItem;
		}
	});
}

function updateSubItem(newItem: SubItems, oldItem: SubItems) {
	state.subItems = state.subItems.map((subItem) => {
		if (subItem.name === oldItem.name && subItem.type === oldItem.type && subItem.path === oldItem.path) {
			return newItem;
		} else {
			return subItem;
		}
	});
}

export default state;
export {
	updateState,
	updateGlobalName,
	addExcludedItem,
	removeExcludedItem,
	addMetadataItem,
	removeMetadataItem,
	addSubItem,
	removeSubItem,
	updateExcludedItem,
	updateMetadataItem,
	updateSubItem,
	formatState,
	getMetadataResults,
};
