import { createStore } from '@stencil/store';

export type ElementsToExclude = {
	type: string;
	path: string;
};

export type Metadata = {
	[key: string]: {
		type: string;
		path: string;
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
	redirectToConfig: boolean;
	exclude: ElementsToExclude[];
	metadata: Metadata;
	subItems: SubItems[];
};

const { state }: { state: ConfigState } = createStore({
	redirectToConfig: false,
	exclude: [
		{
			type: 'CSS',
			path: '.header',
		},
		{
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
	subItems: [
		{
			name: 'product',
			type: 'CSS',
			path: '.rsx-product-list-product-wrap, .rsx-product-list-lightbox-product-wrap',
			exclude: [
				{
					type: 'CSS',
					path: '.header',
				},
				{
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
					type: 'CSS',
					path: '.header',
				},
				{
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

// onChange('exclude', (newValue) => {
// 	console.log('exclude-changed', newValue);
// });

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
		console.error(error);
		return true;
	}
}

function formatState() {
	const { exclude, metadata, subItems } = state;
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
			name: '',
		},
		...formattedSubItems,
	];

	return formattedState;
}

function addExcludedItem(item: ElementsToExclude) {
	state.exclude = [...state.exclude, item];
	console.log(state.exclude);
}

function removeExcludedItem(item: ElementsToExclude) {
	console.log('func called', item);
	state.exclude = state.exclude.filter((excludedItem) => {
		return excludedItem.type !== item.type || excludedItem.path !== item.path;
	});
	console.log(state.exclude);
}

function addMetadataItem(item: { name: string; type: string; path: string }) {
	state.metadata = { ...state.metadata, [item.name]: { type: item.type, path: item.path } };
	console.log(state.metadata);
}

function removeMetadataItem(item: { name: string; type: string; path: string }) {
	console.log('func called', item);
	const { [item.name]: _, ...metadata } = state.metadata;
	state.metadata = metadata;
	console.log(state.metadata);
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
	console.log(state.subItems);
}

function removeSubItem(itemName: string) {
	state.subItems = state.subItems.filter((subItem) => {
		return subItem.name !== itemName;
	});
	console.log(state.subItems);
}

function updateMetadataItem(newItem: { name: string; type: string; path: string }, oldItem: { name: string; type: string; path: string }) {
	if (newItem.name !== oldItem.name) {
		const metadata = {};
		for (const key in state.metadata) {
			if (key !== oldItem.name) {
				metadata[key] = state.metadata[key];
			}
		}
		metadata[newItem.name] = { type: newItem.type, path: newItem.path };
		state.metadata = metadata;
	} else {
		state.metadata = { ...state.metadata, [newItem.name]: { type: newItem.type, path: newItem.path } };
	}
}

function updateExcludedItem(newItem: ElementsToExclude, oldItem: ElementsToExclude) {
	// add opacity to the element
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		console.log(newItem.path, oldItem.path);
		chrome.tabs.sendMessage(tabs[0].id, { type: 'exclude-selector', payload: { newItem: newItem, oldItem: oldItem } });
	});
	state.exclude = state.exclude.map((excludedItem) => {
		if (excludedItem.type === oldItem.type && excludedItem.path === oldItem.path) {
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
