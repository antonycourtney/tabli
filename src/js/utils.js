/**
 * 
 * Common utility routines
 */
'use strict';

// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
// From http://james.padolsey.com/javascript/parsing-urls-with-the-dom/ 
export function parseURL(url) {
  var a =  document.createElement('a');
  a.href = url;
  return {
      source: url,
      protocol: a.protocol.replace(':',''),
      host: a.hostname,
      port: a.port,
      query: a.search,
      params: (function(){
          var ret = {},
              seg = a.search.replace(/^\?/,'').split('&'),
              len = seg.length, i = 0, s;
          for (;i<len;i++) {
              if (!seg[i]) { continue; }
              s = seg[i].split('=');
              ret[s[0]] = s[1];
          }
          return ret;
      })(),
      file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
      hash: a.hash.replace('#',''),
      path: a.pathname.replace(/^([^\/])/,'/$1'),
      relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
      segments: a.pathname.replace(/^\//,'').split('/')
  };
}

/**
 * symmetric difference of two arrays using optional field extractor functions
 *
 */
export function symmetricDiffBy(a,b,af,bf) {

}

/*
var CONTEXT_MENU_ID = 99;
var contextMenuCreated = false;

function initContextMenu() {
  var sendToMenuItem = { type: "normal",
                     id: CONTEXT_MENU_ID,
                     title: "Open Link in Existing Window",
                     contexts: [ "link" ]
                    };
  chrome.contextMenus.create( sendToMenuItem, function() {
    contextMenuCreated = true;
  });
}
*/
