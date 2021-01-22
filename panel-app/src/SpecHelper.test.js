// For more info: https://coveord.atlassian.net/wiki/spaces/CT/pages/6496805/Web+Scraping+Configuration

/* globals it, expect */
import SpecHelper from './SpecHelper';

let removeTimestampsFromGuids = (spec)=>{
  return JSON.parse( JSON.stringify(spec).replace(/(guid-\d+)(-\d+)/g, '$1') );
};

let getGuid = (spec, guid)=>{
  try {
    let s = JSON.stringify(spec);
    return s.match( new RegExp(guid+'-\\d+') )[0];
  }
  catch(e) {
    // empty
  }
  return null;
};


it('test default', ()=>{
  let s = SpecHelper.getDefault();
  expect(s).toEqual( [{"exclude": [], "for": {"urls": [".*"]}, "metadata": {}}] );
});

it('test addExclude', ()=>{
  let s = SpecHelper.getDefault();
  let s2 = SpecHelper.addExclude(s);

  let expected = [{"exclude": [{"id": "guid-1", "path": "", "type": "CSS"}], "for": {"urls": [".*"]}, "metadata": {}}];

  expect( removeTimestampsFromGuids(s) ).toEqual( expected );
  expect( removeTimestampsFromGuids(s2) ).toEqual( expected );

  expect( SpecHelper.toJson(s) ).toEqual( [{"exclude": [{"path": "", "type": "CSS"}], "for": {"urls": [".*"]}, "metadata": {}}] );
});

it('test addSubItem', ()=>{
  let s = SpecHelper.getDefault();
  let s2 = SpecHelper.addSubItem(s, 'blogPosts');

  let expected = [
    {
      for: { "urls": [".*"] },
      exclude: [],
      metadata: {},
      subItems: {
        blogPosts: { id: "guid-2", path: "", type: "CSS" }
      }
    }, {
      for: { types: ["blogPosts"] },
      exclude: [],
      metadata: {},
    }];

  expect( removeTimestampsFromGuids(s) ).toEqual( expected );
  expect( removeTimestampsFromGuids(s2) ).toEqual( expected );

  expect( SpecHelper.toJson(s) ).toEqual([{
    for: { "urls": [".*"] },
    exclude: [],
    metadata: {},
    subItems: {
      blogPosts: { path: "", type: "CSS" }
    }
  }, {
    for: { types: ["blogPosts"] },
    exclude: [],
    metadata: {},
  }]);
});


it('full workflow', ()=>{
  let s = SpecHelper.getDefault();

  SpecHelper.addSubItem(s, 'blogPosts');
  SpecHelper.addMeta(s);
  SpecHelper.addExclude(s);
  SpecHelper.addMeta(s, 'blogPosts');
  SpecHelper.addExclude(s, 'blogPosts');

  expect( removeTimestampsFromGuids(s) ).toEqual( [{
    "exclude": [{"id": "guid-5", "path": "", "type": "CSS"}],
    "for": {"urls": [".*"]},
    "metadata": {"": {"id": "guid-4", "name": "", "path": "", "type": "CSS"}},
    "subItems": {"blogPosts": {"id": "guid-3", "path": "", "type": "CSS"}}
  }, {
    "exclude": [{"id": "guid-7", "path": "", "type": "CSS"}],
    "for": {"types": ["blogPosts"]},
    "metadata": {"": {"id": "guid-6", "name": "", "path": "", "type": "CSS"}}
  }] );


  SpecHelper.update(s, {id: getGuid(s,'guid-6'), name: 'author'});
  SpecHelper.update(s, {id: getGuid(s,'guid-6'), path: '.author'});

  SpecHelper.update(s, {id: getGuid(s,'guid-5'), type: 'XPATH', path:'//header'});

  SpecHelper.remove(s, getGuid(s,'guid-7'));

  expect( removeTimestampsFromGuids(s) ).toEqual( [{
    "exclude": [{"id": "guid-5", "path": "//header", "type": "XPATH"}],
    "for": {"urls": [".*"]},
    "metadata": {"": {"id": "guid-4", "name": "", "path": "", "type": "CSS"}},
    "subItems": {"blogPosts": {"id": "guid-3", "path": "", "type": "CSS"}}
  }, {
    "exclude": [],
    "for": {"types": ["blogPosts"]},
    "metadata": {"author": {"id": "guid-6", "name": "author", "path": ".author", "type": "CSS"}}
  }] );

  expect( SpecHelper.toJson(s) ).toEqual([{
    "exclude": [{ "path": "//header", "type": "XPATH" }],
    "for": { "urls": [".*"] },
    "metadata": { "": { "path": "", "type": "CSS" } },
    "subItems": { "blogPosts": { "path": "", "type": "CSS" } }
  }, {
    "exclude": [],
    "for": { "types": ["blogPosts"] },
    "metadata": { "author": { "path": ".author", "type": "CSS" } }
  }]);

  // DO NOT REFORMAT the JSON below, it's the expected strings from toJson()
  /* eslint-disable no-useless-escape */
  expect( SpecHelper.toJson(s, true) ).toEqual(`[
  {
    \"for\": {
      \"urls\": [
        \".*\"
      ]
    },
    \"exclude\": [
      {
        \"type\": \"XPATH\",
        \"path\": \"//header\"
      }
    ],
    \"metadata\": {
      \"\": {
        \"type\": \"CSS\",
        \"path\": \"\"
      }
    },
    \"subItems\": {
      \"blogPosts\": {
        \"type\": \"CSS\",
        \"path\": \"\"
      }
    }
  },
  {
    \"for\": {
      \"types\": [
        \"blogPosts\"
      ]
    },
    \"exclude\": [],
    \"metadata\": {
      \"author\": {
        \"type\": \"CSS\",
        \"path\": \".author\"
      }
    }
  }
]`);
  /* eslint-enable */

  SpecHelper.removeSubItem(s, 'x');
  expect( SpecHelper.toJson(s) ).toEqual([{
    "exclude": [{ "path": "//header", "type": "XPATH" }],
    "for": { "urls": [".*"] },
    "metadata": { "": { "path": "", "type": "CSS" } },
    "subItems": { "blogPosts": { "path": "", "type": "CSS" } }
  }, {
    "exclude": [],
    "for": { "types": ["blogPosts"] },
    "metadata": { "author": { "path": ".author", "type": "CSS" } }
  }]);

  SpecHelper.removeSubItem(s, 'blogPosts');
  expect( SpecHelper.toJson(s) ).toEqual([{
    "exclude": [{ "path": "//header", "type": "XPATH" }],
    "for": { "urls": [".*"] },
    "metadata": { "": { "path": "", "type": "CSS" } }
  }]);

});


it('test setIds', ()=>{

  let specs = [{
    "for": { "urls": ["showthread.php\\/.*"] },
    "exclude": [
      { "type": "CSS", "path": "#container > div.bottommenu" },
      { "type": "CSS", "path": "#copyright" }
    ],
    "metadata": { "threadTitle": { "type": "XPATH", "path": "//*[@id=\"content\"]/div[1]/span/text()" } },
    "subItems": {
      "post": { "type": "css", "path": "#posts > table" }
    }
  },
  {
    "for": { "types": ["post"] },
    "metadata": {
      "postDirectUrl": { "isAbsolute": true, "type": "XPATH", "path": "//tbody/tr[1]/td[2]/table/tbody/tr/td/div[1]/span/strong/a/@href" },
      "postBody": { "type": "CSS",  "path": ".post_body" },
      "hasBody": { "type": "CSS", "isBoolean": true, "path": ".post_body" },
      "postAuthor": { "type": "XPATH", "path": "//tbody/tr[1]/td[1]/strong/span/a/span/*/text()" },
      "postDate": { "type": "XPATH", "path": "//tbody/tr[2]/td[1]/span/text()" }
    }
  }];
  SpecHelper.setIds(specs);

  let expected = [{
    "exclude": [
      {"id": "guid-8", "path": "#container > div.bottommenu", "type": "CSS"},
      {"id": "guid-9", "path": "#copyright", "type": "CSS"}
    ],
    "for": {"urls": ["showthread.php\\/.*"]},
    "metadata": {"threadTitle": {"id": "guid-10", "name": "threadTitle", "path": "//*[@id=\"content\"]/div[1]/span/text()", "type": "XPATH"}},
    "subItems": {"post": {"id": "guid-11", "path": "#posts > table", "type": "css"}}
  }, {
    "for": {"types": ["post"]},
    "metadata": {
      "postDirectUrl": {"id": "guid-12", "name": "postDirectUrl", "isAbsolute": true, "path": "//tbody/tr[1]/td[2]/table/tbody/tr/td/div[1]/span/strong/a/@href", "type": "XPATH"},
      "postBody": {"id": "guid-13", "name": "postBody", "path": ".post_body", "type": "CSS"},
      "hasBody": {"id": "guid-14", "name": "hasBody", "isBoolean": true, "path": ".post_body", "type": "CSS"},
      "postAuthor": {"id": "guid-15", "name": "postAuthor", "path": "//tbody/tr[1]/td[1]/strong/span/a/span/*/text()", "type": "XPATH"},
      "postDate": {"id": "guid-16", "name": "postDate", "path": "//tbody/tr[2]/td[1]/span/text()", "type": "XPATH"}}
  }];

  expect( removeTimestampsFromGuids(specs) ).toEqual( expected );

  let a = SpecHelper.getMetadataAsArray(specs);
  expect( removeTimestampsFromGuids(a) ).toEqual( [{"id": "guid-10", "name": "threadTitle", "path": "//*[@id=\"content\"]/div[1]/span/text()", "type": "XPATH"}]  );

  a = SpecHelper.getMetadataAsArray(specs, 'post');
  expect( removeTimestampsFromGuids(a) ).toEqual( [
    {"id": "guid-12", "isAbsolute": true, "name": "postDirectUrl", "path": "//tbody/tr[1]/td[2]/table/tbody/tr/td/div[1]/span/strong/a/@href", "type": "XPATH"},
    {"id": "guid-13", "name": "postBody", "path": ".post_body", "type": "CSS"},
    {"id": "guid-14", "isBoolean": true, "name": "hasBody", "path": ".post_body", "type": "CSS"},
    {"id": "guid-15", "name": "postAuthor", "path": "//tbody/tr[1]/td[1]/strong/span/a/span/*/text()", "type": "XPATH"},
    {"id": "guid-16", "name": "postDate", "path": "//tbody/tr[2]/td[1]/span/text()", "type": "XPATH"}
  ] );

  // try getMetadataAsArray not from an array of specs.
  let spec = SpecHelper.get(specs, 'post');
  a = SpecHelper.getMetadataAsArray(spec);
  expect( removeTimestampsFromGuids(a) ).toEqual( [
    {"id": "guid-12", "isAbsolute": true, "name": "postDirectUrl", "path": "//tbody/tr[1]/td[2]/table/tbody/tr/td/div[1]/span/strong/a/@href", "type": "XPATH"},
    {"id": "guid-13", "name": "postBody", "path": ".post_body", "type": "CSS"},
    {"id": "guid-14", "isBoolean": true, "name": "hasBody", "path": ".post_body", "type": "CSS"},
    {"id": "guid-15", "name": "postAuthor", "path": "//tbody/tr[1]/td[1]/strong/span/a/span/*/text()", "type": "XPATH"},
    {"id": "guid-16", "name": "postDate", "path": "//tbody/tr[2]/td[1]/span/text()", "type": "XPATH"}
  ] );
});