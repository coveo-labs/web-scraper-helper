import { Component, h } from '@stencil/core';
import { Header } from '@coveord/plasma-mantine';
// import { Select } from '@mantine/core';

@Component({
  tag: 'file-explorer',
  styleUrl: 'file-explorer.css',
  shadow: false,
})
export class FileExplorer {
  render() {
    return (
      // <div>TESTTT</div>
      <Header children={{ description: 'Choose an existing file or create a new one to work on.' }}>
        Your Web Scraper files
        <Header.DocAnchor href="https://about:blank" label="Tooltip text" />
      </Header>
    );
  }
}
