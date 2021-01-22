/* globals describe, it, expect */
import React from 'react';
import ReactDOM from 'react-dom';
import { configure, mount, render, shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import Rules from './Rules';

configure({ adapter: new Adapter() });

describe('<Rules /> empty', () => {

  const div = document.createElement('div');
  let rules = ReactDOM.render(<Rules />, div);

  it('renders without crashing', () => {
    expect(rules.state).toEqual({ tab: 'editor' });
  });

  const wrapper = render(
    <Rules />
  );
  it('validate html for empty spec', () => {
    expect(wrapper.html()).toEqual('<div class="alert alert-warning" role="alert">Create or Load a spec.</div>');
  });

});

describe('<Rules /> default', () => {

  const wrapper = render(
    <Rules specs='[{"for":{"urls":[".*"]},"exclude":[],"metadata":{}}]' />
  );

  it('default is 3 tabs', () => {
    expect(wrapper.find('.nav-tabs li').length).toEqual(3);
  });
  it('no exclude', () => {
    expect(wrapper.find('.exclude-rules > div').length).toEqual(0);
  });
  it('no meta', () => {
    expect(wrapper.find('.metadata-rules > div').length).toEqual(0);
  });

});

describe('<Rules /> 2 excludes, no meta', () => {

  let spec = [
    {
      for: { urls: ['.*'] },
      exclude: [
        { type: 'XPATH', path: '//header' },
        { type: 'CSS', path: '#footer' }
      ],
      metadata: {}
    }];

  const wrapper = render(<Rules specs={JSON.stringify(spec)} />);

  it('should have 3 tabs', () => {
    expect(wrapper.find('.nav-tabs li').length).toEqual(3);
  });
  it('2 excludes', () => {
    expect(wrapper.find('.exclude-rules .rule').length).toEqual(2);
  });
  it('no meta', () => {
    expect(wrapper.find('.metadata-rules .rule').length).toEqual(0);
  });

});

describe('<Rules /> subitems', () => {
  let spec = [
    {
      "for": { "urls": ["showthread.php\\/.*"] },
      "exclude": [
        { "type": "CSS", "path": "#container > div.bottommenu" },
        { "type": "CSS", "path": "#copyright" }],
      "metadata": {
        "threadTitle": { "type": "XPATH", "path": "//*[@id=\"content\"]/div[1]/span/text()" }
      },
      "subItems": { "post": { "type": "CSS", "path": "#posts > table" } }
    }, {
      "for": { "types": ["post"] },
      "metadata": {
        "postDirectUrl": { "isAbsolute": true, "type": "XPATH", "path": "//tbody/tr[1]/td[2]/table/tbody/tr/td/div[1]/span/strong/a/@href" },
        "postBody": { "type": "CSS", "path": ".post_body" },
        "hasBody": { "type": "CSS", "isBoolean": true, "path": ".post_body" },
        "postAuthor": { "type": "XPATH", "path": "//tbody/tr[1]/td[1]/strong/span/a/span/*/text()" },
        "postDate": { "type": "XPATH", "path": "//tbody/tr[2]/td[1]/span/text()" }
      }
    }];

  const wrapper = mount(<Rules specs={JSON.stringify(spec)} />);

  it('renders 4 tabs', () => {
    expect(wrapper.find('.nav-tabs li')).toHaveLength(4);
    expect(wrapper.find('.nav-tabs li.active a#editor-button')).toHaveLength(1);
    expect(wrapper.find('.nav-tabs li a#post-button')).toHaveLength(1);

    expect(wrapper.find('.tab-pane').length).toEqual(1);
  });
  it('Excludes & Metas', () => {
    expect(wrapper.find('.exclude-rules .rule')).toHaveLength(2);
    expect(wrapper.find('.metadata-rules .rule').length).toEqual(1);
    expect(wrapper.find('#editor .metadata-rules .rule').length).toEqual(1);

    expect(wrapper.find('#post .metadata-rules .rule')).toHaveLength(0);
  });
});

describe('<Rules /> POST subitems', () => {
  let spec = [
    {
      "for": { "urls": ["showthread.php\\/.*"] },
      "exclude": [
        { "type": "CSS", "path": "#container > div.bottommenu" },
        { "type": "CSS", "path": "#copyright" }],
      "metadata": {
        "threadTitle": { "type": "XPATH", "path": "//*[@id=\"content\"]/div[1]/span/text()" }
      },
      "subItems": { "post": { "type": "CSS", "path": "#posts > table" } }
    }, {
      "for": { "types": ["post"] },
      "metadata": {
        "postDirectUrl": { "isAbsolute": true, "type": "XPATH", "path": "//tbody/tr[1]/td[2]/table/tbody/tr/td/div[1]/span/strong/a/@href" },
        "postBody": { "type": "CSS", "path": ".post_body" },
        "hasBody": { "type": "CSS", "isBoolean": true, "path": ".post_body" },
        "postAuthor": { "type": "XPATH", "path": "//tbody/tr[1]/td[1]/strong/span/a/span/*/text()" },
        "postDate": { "type": "XPATH", "path": "//tbody/tr[2]/td[1]/span/text()" }
      }
    }];

  const wrapper = mount(<Rules specs={JSON.stringify(spec)} />);

  wrapper.find('.nav-tabs li a#post-button').simulate('click');

  it('Tabs', () => {
    expect(wrapper.find('.nav-tabs li')).toHaveLength(4);
    expect(wrapper.find('.nav-tabs li.active a#editor-button')).toHaveLength(0);
    expect(wrapper.find('.nav-tabs li.active a#post-button')).toHaveLength(1);

    expect(wrapper.find('.tab-pane').length).toEqual(1);
  });
  it('Excludes & Metas', () => {
    expect(wrapper.find('.exclude-rules .rule')).toHaveLength(0);
    expect(wrapper.find('.metadata-rules .rule')).toHaveLength(5);

    expect(wrapper.find('#editor .metadata-rules .rule').length).toEqual(0);
    expect(wrapper.find('#post .metadata-rules .rule')).toHaveLength(5);
  });

});
