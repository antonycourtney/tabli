/**
 * Background helper page.
 * Gathering bookmark and window state and places in local storage so that
 * popup rendering will be as fast as possible
 */
'use strict';

var TabMan = require('./tabman.js');

function main() {
  console.log("Hello from background page!");

  TabMan.init(function (winStore) {
    console.log("bgHelper: initialization complete.");
    var tabWindows = winStore.getAll();

    var storeState = {
        'formatVersion': '0.1',
        'contents': tabWindows
    };
    chrome.storage.local.set({'contents': storeState}, function () {
        console.log("Wrote bookmark state to local storage");
    });

    console.log("tab windows: ", tabWindows);
  });
}

main();