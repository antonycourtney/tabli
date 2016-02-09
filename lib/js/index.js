'use strict';
/*
 * top-level module with exports for using Tabli as a library.
 *
 * Experimental to try and get Tabli working in Brave web browser
 */

var _tabWindow = require('./tabWindow');

var TabWindow = _interopRequireWildcard(_tabWindow);

var _tabManagerState = require('./tabManagerState');

var _tabManagerState2 = _interopRequireDefault(_tabManagerState);

var _Popup = require('./components/Popup');

var _Popup2 = _interopRequireDefault(_Popup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

module.exports = { TabWindow: TabWindow, TabManagerState: _tabManagerState2.default, components: { Popup: _Popup2.default } };