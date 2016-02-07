'use strict';
/*
 * top-level module with exports for using Tabli as a library.
 *
 * Experimental to try and get Tabli working in Brave web browser
 */

var _tabWindow = require('./tabWindow');

var _tabWindow2 = _interopRequireDefault(_tabWindow);

var _tabManagerState = require('./tabManagerState');

var _tabManagerState2 = _interopRequireDefault(_tabManagerState);

var _Popup = require('./components/Popup');

var _Popup2 = _interopRequireDefault(_Popup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = { TabWindow: _tabWindow2.default, TabManagerState: _tabManagerState2.default, components: { Popup: _Popup2.default } };