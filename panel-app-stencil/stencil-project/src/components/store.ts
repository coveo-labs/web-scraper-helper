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
  exclude: ElementsToExclude[];
  metadata: Metadata;
  subItems: SubItems[];
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
  metadata: {
    Title: {
      type: 'CSS',
      path: 'head > title',
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
          path: 'head > title',
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

function setState(newState: ConfigState) {
  state.exclude = newState.exclude;
  state.metadata = newState.metadata;
  state.subItems = newState.subItems;
}

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

function addMetadataItem(item: { name: string; type: string; path: string }) {
  state.metadata = { ...state.metadata, [item.name]: item };
  console.log(state.metadata);
}

function removeMetadataItem(item: { name: string; type: string; path: string }) {
  console.log('func called', item);
  const { [item.name]: _, ...metadata } = state.metadata;
  state.metadata = metadata;
  console.log(state.metadata);
}

function addSubItem() {
  state.subItems = [...state.subItems, { name: 'subItem', type: 'CSS', path: '', exclude: [], metadata: {} }];
  console.log(state.subItems);
}

function removeSubItem(itemName: string) {
  state.subItems = state.subItems.filter(subItem => {
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
  state.exclude = state.exclude.map(excludedItem => {
    if (excludedItem.type === oldItem.type && excludedItem.path === oldItem.path) {
      return newItem;
    } else {
      return excludedItem;
    }
  });
}

function updateSubItem(newItem: SubItems, oldItem: SubItems) {
  state.subItems = state.subItems.map(subItem => {
    if (subItem.name === oldItem.name && subItem.type === oldItem.type && subItem.path === oldItem.path) {
      return newItem;
    } else {
      return subItem;
    }
  });
}

export default state;
export { setState, addExcludedItem, removeExcludedItem, addMetadataItem, removeMetadataItem, addSubItem, removeSubItem, updateExcludedItem, updateMetadataItem, updateSubItem };
