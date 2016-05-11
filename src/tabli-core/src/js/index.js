'use strict';
/*
 * top-level module with exports for using Tabli as a library.
 *
 * Experimental to try and get Tabli working in Brave web browser
 */

import * as TabWindow from './tabWindow';
import TabManagerState from './tabManagerState';
import Popup from './components/Popup';
import Styles from './components/styles';
import * as utils from './utils';
import * as actions from './actions';
import * as pact from './pact';
import ViewRef from './viewRef';

module.exports = { actions, components: { Popup, Styles }, TabWindow, TabManagerState, ViewRef, utils, pact };