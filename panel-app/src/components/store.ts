import { createStore } from '@stencil/store';
import { v4 as uuidv4 } from 'uuid';

export type ElementsToExclude = {
	id: string;
	type: string;
	path: string;
};

export type Metadata = {
	[key: string]: {
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

const { state }: { state: ConfigState } = createStore({
	redirectToConfig: false,
	exclude: [
		{
			id: getId(),
			type: 'CSS',
			path: '.header',
		},
		{
			id: getId(),
			type: 'XPath',
			path: '/html/body/div[1]/div[2]/div[1]/div/div[1]/div[1]/div/p[2]',
		},
	],
	metadata: {
		Title: {
			type: 'CSS',
			path: '.title::text',
		},
	},
	subItems: [
		{
			name: 'product',
			type: 'CSS',
			path: '.rsx-product-list-product-wrap, .rsx-product-list-lightbox-product-wrap',
			exclude: [
				{
					id: getId(),
					type: 'CSS',
					path: '.header',
				},
				{
					id: getId(),
					type: 'XPath',
					path: '#footer',
				},
			],
			metadata: {
				Title: {
					type: 'CSS',
					path: '.title',
				},
			},
		},
		{
			name: 'product1',
			type: 'CSS',
			path: '.rsx-product-list-product-wrap, .rsx-product-list-lightbox-product-wrap',
			exclude: [
				{
					id: getId(),
					type: 'CSS',
					path: '.header',
				},
				{
					id: getId(),
					type: 'XPath',
					path: '#footer',
				},
			],
			metadata: {
				Title: {
					type: 'CSS',
					path: 'head > title',
				},
			},
		},
	],
});

function getId() {
	let uniqueId = uuidv4();
	return `uid-${uniqueId}-${Date.now()}`;
}

function getSubItemValues(arrayList, key) {
	return arrayList.find((obj) => obj.name === key);
}

function updateState(newState): boolean {
	try {
		const parsedValue = JSON.parse(newState);
		if (parsedValue) {
			const { name, exclude, metadata, subItems } = parsedValue[0];

			const formattedSubItems =
				subItems &&
				Object.keys(subItems).map((key) => {
					const { exclude, metadata } = getSubItemValues(parsedValue, key);
					return {
						name: key,
						type: subItems[key].type,
						path: subItems[key].path,
						exclude,
						metadata,
					};
				});

			const formattedValue = {
				name,
				exclude,
				metadata,
				subItems: subItems ? formattedSubItems : [],
			};

			state.name = formattedValue.name;
			state.exclude = formattedValue.exclude;
			state.metadata = formattedValue.metadata;
			state.subItems = formattedValue.subItems && formattedValue.subItems;

			// add opacity to the elements onLoad
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'update-excludeItem-onLoad', payload: { exclude: formattedValue.exclude } });
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
	const formattedSubItems =
		subItems &&
		subItems.map((item) => {
			const { name, exclude, metadata } = item;
			return {
				for: {
					types: [name],
				},
				exclude,
				metadata,
				name,
			};
		});

	const formattedState = [
		{
			name: name,
			for: {
				urls: ['.*'],
			},
			exclude,
			metadata,
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
	state.metadata = { ...state.metadata, [item.name]: { type: item.type, path: item.path } };
}

function removeMetadataItem(item: { name: string; type: string; path: string }) {
	const { [item.name]: _, ...metadata } = state.metadata;
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

function updateMetadataItem(newItem: { name: string; type: string; path: string; isBoolean?: boolean }, oldItem: { name: string; type: string; path: string; isBoolean?: boolean }) {
	if (newItem.name !== oldItem.name) {
		const metadata = {};
		for (const key in state.metadata) {
			if (key !== oldItem.name) {
				metadata[key] = state.metadata[key];
			}
		}
		metadata[newItem.name] = { type: newItem.type, path: newItem.path, ...(newItem.isBoolean && { isBoolean: newItem.isBoolean }) };
		state.metadata = metadata;
	} else {
		state.metadata = { ...state.metadata, [newItem.name]: { type: newItem.type, path: newItem.path, ...(newItem.isBoolean && { isBoolean: newItem.isBoolean }) } };
	}
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
