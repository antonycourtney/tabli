/*
 * actions that can be sent to Flux store
 */
'use strict';

var constants = require('./constants.js');

var actions = {

    addTabWindow: function(tabWindow) {
        var payload = { tabWindow: tabWindow };
        this.dispatch(constants.ADD_TAB_WINDOW, payload);
    },

    removeTabWindow: function(tabWindow) {
        var payload = { tabWindow: tabWindow };
        this.dispatch(constants.REMOVE_TAB_WINDOW, payload);
    },
};

module.exports = actions;