
import test from 'tape';
import * as TabWindow from '../src/js/tabWindow';
import difflet from 'difflet';

const diff = difflet({indent: 2});

test('basic test', (t) => {
  t.pass('This test will pass');
  t.end();
});

test('makeFolderTabWindow', (t) => {
  const bookmarkFolder = 
    {
      "children": [
        {
          "dateAdded": 1395768341441,
          "id": "432",
          "index": 0,
          "parentId": "431",
          "title": "API Reference · mbostock/d3 Wiki",
          "url": "https://github.com/mbostock/d3/wiki/API-Reference"
        },
        {
          "dateAdded": 1398004320075,
          "id": "534",
          "index": 1,
          "parentId": "431",
          "title": "D3.js - Data-Driven Documents",
          "url": "http://d3js.org/"
        },
        {
          "dateAdded": 1398004321188,
          "id": "535",
          "index": 2,
          "parentId": "431",
          "title": "Gallery · mbostock/d3 Wiki",
          "url": "https://github.com/mbostock/d3/wiki/Gallery"
        },
        {
          "dateAdded": 1398004392395,
          "id": "536",
          "index": 3,
          "parentId": "431",
          "title": "Tutorials · mbostock/d3 Wiki",
          "url": "https://github.com/mbostock/d3/wiki/Tutorials"
        },
        {
          "dateAdded": 1398004621941,
          "id": "537",
          "index": 4,
          "parentId": "431",
          "title": "Drag + Zoom",
          "url": "http://bl.ocks.org/mbostock/6123708"
        },
        {
          "dateAdded": 1405471223073,
          "id": "613",
          "index": 5,
          "parentId": "431",
          "title": "Focus+Context via Brushing",
          "url": "http://bl.ocks.org/mbostock/1667367"
        }
      ],
      "dateAdded": 1395768341427,
      "dateGroupModified": 1430260300118,
      "id": "431",
      "index": 4,
      "parentId": "377",
      "title": "d3 docs"
    };

    const tabWindow = TabWindow.makeFolderTabWindow(bookmarkFolder);
    const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));
    // console.log("makeFolderTabWindow returned:");
    // console.log(JSON.stringify(tabWindowJS,null,2));

    const expectedTabWindow = 
      {
        "saved": true,
        "savedTitle": "d3 docs",
        "savedFolderId": "431",
        "open": false,
        "openWindowId": -1,
        "focused": false,
        "tabItems": [
          {
            "title": "API Reference · mbostock/d3 Wiki",
            "url": "https://github.com/mbostock/d3/wiki/API-Reference",
            "saved": true,
            "savedBookmarkId": "432",
            "savedBookmarkIndex": 0,
            "open": false,
            "openTabId": -1,
            "active": false,
            "openTabIndex": 0
          },
          {
            "title": "D3.js - Data-Driven Documents",
            "url": "http://d3js.org/",
            "saved": true,
            "savedBookmarkId": "534",
            "savedBookmarkIndex": 1,
            "open": false,
            "openTabId": -1,
            "active": false,
            "openTabIndex": 0
          },
          {
            "title": "Gallery · mbostock/d3 Wiki",
            "url": "https://github.com/mbostock/d3/wiki/Gallery",
            "saved": true,
            "savedBookmarkId": "535",
            "savedBookmarkIndex": 2,
            "open": false,
            "openTabId": -1,
            "active": false,
            "openTabIndex": 0
          },
          {
            "title": "Tutorials · mbostock/d3 Wiki",
            "url": "https://github.com/mbostock/d3/wiki/Tutorials",
            "saved": true,
            "savedBookmarkId": "536",
            "savedBookmarkIndex": 3,
            "open": false,
            "openTabId": -1,
            "active": false,
            "openTabIndex": 0
          },
          {
            "title": "Drag + Zoom",
            "url": "http://bl.ocks.org/mbostock/6123708",
            "saved": true,
            "savedBookmarkId": "537",
            "savedBookmarkIndex": 4,
            "open": false,
            "openTabId": -1,
            "active": false,
            "openTabIndex": 0
          },
          {
            "title": "Focus+Context via Brushing",
            "url": "http://bl.ocks.org/mbostock/1667367",
            "saved": true,
            "savedBookmarkId": "613",
            "savedBookmarkIndex": 5,
            "open": false,
            "openTabId": -1,
            "active": false,
            "openTabIndex": 0
          }
        ]
      };    

    //diff(tabWindowJS,expectedTabWindow).pipe(process.stdout);
    /*
      var s = difflet({indent:2,comment:true}).compare(tabWindowJS,expectedTabWindow);
      console.log("diffs:");
      console.log(s);
    */
    t.deepEqual(tabWindowJS,expectedTabWindow,'makeFolderTabWindow basic functionality');
    t.end();
});