'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.matchTabItem = matchTabItem;
exports.matchTabWindow = matchTabWindow;
exports.filterTabWindows = filterTabWindows;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _immutable = require('immutable');

var Immutable = _interopRequireWildcard(_immutable);

var _tabWindow = require('./tabWindow');

var TabWindow = _interopRequireWildcard(_tabWindow);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * A TabItem augmented with search results
 */
var FilteredTabItem = Immutable.Record({
  tabItem: new TabWindow.TabItem(),

  urlMatches: null,
  titleMatches: null
});

/**
 * Use a RegExp to match a particular TabItem
 *
 * @return {FilteredTabItem} filtered item (or null if no match)
 */
/**
 * Search and filter operations on TabWindows
 */
function matchTabItem(tabItem, searchExp) {
  var urlMatches = tabItem.url.match(searchExp);
  var titleMatches = tabItem.title.match(searchExp);

  if (urlMatches === null && titleMatches === null) {
    return null;
  }

  return new FilteredTabItem({ tabItem: tabItem, urlMatches: urlMatches, titleMatches: titleMatches });
}

/**
 * A TabWindow augmented with search results
 */
var FilteredTabWindow = Immutable.Record({
  tabWindow: new TabWindow.TabWindow(),
  titleMatches: [],
  itemMatches: Immutable.Seq() });

/**
 * Match a TabWindow using a Regexp
 *
 */
// matching tab items
function matchTabWindow(tabWindow, searchExp) {
  var itemMatches = tabWindow.tabItems.map(function (ti) {
    return matchTabItem(ti, searchExp);
  }).filter(function (fti) {
    return fti !== null;
  });
  var titleMatches = tabWindow.title.match(searchExp);

  if (titleMatches === null && itemMatches.count() === 0) {
    return null;
  }

  return FilteredTabWindow({ tabWindow: tabWindow, titleMatches: titleMatches, itemMatches: itemMatches });
}

/**
 * filter an array of TabWindows using a searchRE to obtain
 * an array of FilteredTabWindow
 */
function filterTabWindows(tabWindows, searchExp) {
  var res;
  if (searchExp === null) {
    res = _.map(tabWindows, function (tw) {
      return new FilteredTabWindow({ tabWindow: tw });
    });
  } else {
    var mappedWindows = _.map(tabWindows, function (tw) {
      return matchTabWindow(tw, searchExp);
    });
    res = _.filter(mappedWindows, function (fw) {
      return fw !== null;
    });
  }

  return res;
}