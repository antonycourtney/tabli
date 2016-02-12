'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _constants = require('./constants');

var Constants = _interopRequireWildcard(_constants);

var _actions = require('../actions');

var actions = _interopRequireWildcard(_actions);

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var SearchBar = React.createClass({
  displayName: 'SearchBar',
  handleChange: function handleChange() {
    var searchStr = this.refs.searchInput.value;
    this.props.onSearchInput(searchStr);
  },
  handleKeyDown: function handleKeyDown(e) {
    console.log('handleKeyDown: ', _.omit(e, _.isObject));
    if (e.keyCode === Constants.KEY_F1 || e.keyCode === Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      actions.showHelp();
    }

    if (e.keyCode === Constants.KEY_UP) {
      if (this.props.onSearchUp) {
        e.preventDefault();
        this.props.onSearchUp(e.ctrlKey);
      }
    }

    if (e.keyCode === Constants.KEY_DOWN) {
      if (this.props.onSearchDown) {
        e.preventDefault();
        this.props.onSearchDown(e.ctrlKey);
      }
    }

    if (e.keyCode === Constants.KEY_TAB) {
      // We need to determine if it was forward or backwards tab:
      // N.B. we still try and use e.ctrlKey to determine paged
      // nav, but that key combo consumed by Chrome before we see it...
      if (this.props.onSearchUp && this.props.onSearchDown) {
        e.preventDefault();
        if (e.shiftKey) {
          this.props.onSearchUp(e.ctrlKey);
        } else {
          this.props.onSearchDown(e.ctrlKey);
        }
      }
    }

    if (e.keyCode === Constants.KEY_ENTER) {
      if (this.props.onSearchEnter) {
        e.preventDefault();
        this.props.onSearchEnter();
      }
    }
  },
  handleHelpClick: function handleHelpClick(e) {
    console.log('Help button clicked!');
    e.preventDefault();
    actions.showHelp();
  },
  render: function render() {
    var helpButton = React.createElement('span', { className: 'fa fa-question-circle fa-lg', style: _styles2.default.helpButton,
      title: 'Open Tabli Usage Manual', onClick: this.handleHelpClick
    });
    return React.createElement(
      'div',
      { style: _styles2.default.headerContainer },
      React.createElement('input', { style: _styles2.default.searchInput, type: 'text', ref: 'searchInput', id: 'searchBox', placeholder: 'Search...',
        onChange: this.handleChange, onKeyDown: this.handleKeyDown,
        title: 'Search Page Titles and URLs'
      }),
      helpButton
    );
  }
});

exports.default = SearchBar;