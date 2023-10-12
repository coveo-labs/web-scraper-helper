import { Component, State, h } from '@stencil/core';
import state, { setState } from '../store';
import copyToClipboardIcon from '../../assets/icon/CopyToClipboard.svg';

@Component({
  tag: 'code-viewer',
  styleUrl: 'code-viewer.css',
  shadow: true,
})
export class CodeViewer {
  @State() invalidJSON = false;

  formatState() {
    const { exclude, metadata, subItems } = state;
    const formattedSubItems =
      subItems &&
      subItems.map(item => {
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

  getSubItemValues(arrayList, key) {
    return arrayList.find(obj => obj.name === key);
  }

  handleTextareaInput = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement;
    try {
      const parsedValue = textarea.value && JSON.parse(textarea.value);
      if (parsedValue) {
        const { name, exclude, metadata, subItems } = parsedValue[0];

        const formattedSubItems =
          subItems &&
          Object.keys(subItems).map(key => {
            const { exclude, metadata } = this.getSubItemValues(parsedValue, key);
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

        setState(formattedValue);
        this.invalidJSON = false;
      }
    } catch (error) {
      this.invalidJSON = true;
      console.error(error);
    }
  };

  copyToClipboard() {
    const json = JSON.stringify(this.formatState(), null, 2);
    navigator.clipboard.writeText(json);
  }

  render() {
    return (
      <div class="code-view-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Code View</div>
          <div class="copy-to-clipboard" onClick={() => this.copyToClipboard()}>
            <ion-img id="coveo-logo-img" src={copyToClipboardIcon}></ion-img>
            <span></span>
            <span>Copy to clipboard</span>
          </div>
        </div>
        <div class="code-view">
          <textarea
            class={this.invalidJSON ? 'invalid-JSON' : ''}
            value={JSON.stringify(this.formatState(), null, 2)}
            onInput={event => this.handleTextareaInput(event)}
          ></textarea>
        </div>
      </div>
    );
  }
}
