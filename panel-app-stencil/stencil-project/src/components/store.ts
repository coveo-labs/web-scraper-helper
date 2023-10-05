import { createStore } from '@stencil/store';

type ElementsToExclude = {
  type: string;
  path: string;
};

type Metadata = {
  name: string;
  type: string;
  path: string;
};

type ConfigState = {
  exclude: ElementsToExclude[];
  metadata: Metadata[];
};

const { state }: { state: ConfigState } = createStore({
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
  metadata: [
    {
      name: 'Title',
      type: 'CSS',
      path: 'head > title',
    },
  ],
});

function addExcludedItem(item: ElementsToExclude) {
  state.exclude = [...state.exclude, item];
  console.log(state.exclude);
}

function removeExcludedItem(item: ElementsToExclude) {
  console.log('func called', item);
  state.exclude = state.exclude.filter(excludedItem => {
    return excludedItem.type !== item.type || excludedItem.path !== item.path;
  });
  console.log(state.exclude);
}

function addMetadataItem(item: Metadata) {
  state.metadata = [...state.metadata, item];
  console.log(state.metadata);
}

function removeMetadataItem(item: Metadata) {
  console.log('func called', item);
  state.metadata = state.metadata.filter(metadataItem => {
    return metadataItem.name !== item.name || metadataItem.type !== item.type || metadataItem.path !== item.path;
  });
  console.log(state.exclude);
}

function updateExcludedItem(newItem: ElementsToExclude, oldItem: ElementsToExclude) {
  state.exclude = state.exclude.map(excludedItem => {
    if (excludedItem.type === oldItem.type && excludedItem.path === oldItem.path) {
      return newItem;
    } else {
      return excludedItem;
    }
  });
}

function updateMetadataItem(newItem: Metadata, oldItem: Metadata) {
  state.metadata = state.metadata.map(metadataItem => {
    if (metadataItem.name === oldItem.name && metadataItem.type === oldItem.type && metadataItem.path === oldItem.path) {
      return newItem;
    } else {
      return metadataItem;
    }
  });
}

export default state;
export { addExcludedItem, removeExcludedItem, addMetadataItem, removeMetadataItem, updateExcludedItem, updateMetadataItem };
