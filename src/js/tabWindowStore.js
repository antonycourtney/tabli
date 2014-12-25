/*
 * A Flux store for TabWindows
 */
var Fluxxor = require('fluxxor');
var constants = require('./constants.js');

var windowIdMap = {};
var tabWindows = [];

/*
 * add a new Tab window to global maps:
 */
function addTabWindow( tabWindow ) {
    var chromeWindow = tabWindow.chromeWindow;
    if( chromeWindow ) {
      windowIdMap[ chromeWindow.id ] = tabWindow;
    }
    tabWindows.push( tabWindow );     
 }

function removeTabWindow(tabWindow) {
    // could keep an inverse map instead of doing a linear search...
    for (var i = 0; i < tabWindows.length; i++) {
        if (tabWindows[i]===tabWindow)
            break;
    }
    if (i < tabWindows.length) {
        delete tabWindows[ i ];
    } else {
        console.log("removeTabWindow: request to remove window not in collection", tabWindow);
    }
    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
    if ( windowId ) 
        delete windowIdMap[ windowId ];
}

function attachChromeWindow(tabWindow,chromeWindow) {
    tabWindow.chromeWindow = chromeWindow;
    tabWindow.open = true;
    windowIdMap[ chromeWindow.id ] = tabWindow;        
}

var TabWindowStore = Fluxxor.createStore({
    initialize: function() {
        this.bindActions(
            constants.ADD_TAB_WINDOW, this.onAddTabWindow,
            constants.REMOVE_TAB_WINDOW, this.onRemoveTabWindow,
            constants.ATTACH_CHROME_WINDOW, this.onAttachChromeWindow
        );
    },

    onAddTabWindow: function(payload) {
        addTabWindow(payload.tabWindow);
        this.emit("change");
    },

    onRemoveTabWindow: function(payload) {
        removeTabWindow(payload.tabWindow);
        this.emit("change");
    },

    onAttachChromeWindow: function(payload) {
        attachChromeWindow(payload.tabWindow,payload.chromeWindow);
        this.emit("change");
    },

    getAll: function() {
        return tabWindows;
    },

    // returns a tabWindow or undefined
    getTabWindowByChromeId: function(chromeId) {
        return windowIdMap[chromeId];
    }
});

module.exports = TabWindowStore;