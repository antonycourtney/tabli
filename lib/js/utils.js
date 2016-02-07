'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseURL = parseURL;
exports.seqActions = seqActions;
exports.logWrap = logWrap;
/**
 *
 * Common utility routines
 */
// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
// From http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
function parseURL(url) {
  var a = document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':', ''),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: function () {
      var ret = {};
      var seg = a.search.replace(/^\?/, '').split('&');
      var len = seg.length;
      var i = 0;
      var s;
      for (; i < len; i++) {
        if (!seg[i]) {
          continue;
        }

        s = seg[i].split('=');
        ret[s[0]] = s[1];
      }

      return ret;
    }(),

    file: (a.pathname.match(/\/([^\/?#]+)$/i) || [null, ''])[1],
    hash: a.hash.replace('#', ''),
    path: a.pathname.replace(/^([^\/])/, '/$1'),
    relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [null, ''])[1],
    segments: a.pathname.replace(/^\//, '').split('/')
  };
}

/**
 * chain a sequence of asynchronous actions
 *

 */
function seqActions(actions, seed, onCompleted) {
  var index = 0;

  function invokeNext(v) {
    var action = actions[index];
    action(v, function (res) {
      index = index + 1;
      if (index < actions.length) {
        invokeNext(res);
      } else {
        onCompleted(res);
      }
    });
  }

  invokeNext(seed);
}

// wrapper to log exceptions
function logWrap(f) {
  function wf() {
    var ret;
    try {
      ret = f.apply(this, arguments);
    } catch (e) {
      console.error('logWrap: caught exception invoking function: ');
      console.error(e.stack);
      throw e;
    }

    return ret;
  }

  return wf;
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