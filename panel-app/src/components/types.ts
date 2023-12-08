export type SelectorType = 'CSS' | 'XPATH';

export type Selector = {
	type: SelectorType;
	path: string;
	isBoolean?: boolean;
};

export type SelectorElement = Selector & { id?: string };
export type MetadataElement = SelectorElement & { name: string };

export type MetadataMap = {
	[key: string]: MetadataElement;
};

export type SubItem = Selector & {
	name: string;
	exclude?: SelectorElement[];
	metadata?: MetadataMap;
};

export type ConfigState = {
	name?: string;
	currentFile: {
		name: string;
		triggerType: 'new-file' | 'load-file';
	} | null;
	hasChanges: boolean;
	exclude: SelectorElement[];
	metadata: MetadataMap;
	subItems: SubItem[];
};

export type PayloadForFileSave = {
	for: number;
	excludeSelectors: string[];
	exclude: number;
	metadata: number;
	subItems: number;
	name: number;
};
