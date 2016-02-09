'use strict';
/*
 * top-level module with exports for using Tabli as a library.
 *
 * Experimental to try and get Tabli working in Brave web browser
 */

import * as TabWindow from './tabWindow';
import TabManagerState from './tabManagerState';
import Popup from './components/Popup';

module.exports = { TabWindow, TabManagerState, components: { Popup } };