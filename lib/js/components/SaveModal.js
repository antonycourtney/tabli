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

var _Modal = require('./Modal');

var Modal = _interopRequireWildcard(_Modal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var SaveModal = React.createClass({
  displayName: 'SaveModal',
  handleKeyDown: function handleKeyDown(e) {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault();
      this.props.onClose(e);
    }
  },
  handleSubmit: function handleSubmit(e) {
    e.preventDefault();
    var titleStr = this.refs.titleInput.value;
    console.log('handleSubmit: title: ', titleStr);
    this.props.onSubmit(titleStr);
  },
  render: function render() {
    return React.createElement(
      Modal.Dialog,
      { title: 'Save Tabs', focusRef: 'titleInput', onClose: this.props.onClose },
      React.createElement(
        Modal.Info,
        null,
        React.createElement(
          'span',
          null,
          'Save all tabs in this window'
        )
      ),
      React.createElement(
        Modal.Body,
        null,
        React.createElement(
          'div',
          { style: _styles2.default.centerContents },
          React.createElement(
            'form',
            { className: 'dialog-form', onSubmit: this.handleSubmit },
            React.createElement(
              'fieldset',
              null,
              React.createElement(
                'label',
                { htmlFor: 'title' },
                'Window Title'
              ),
              React.createElement('input', { type: 'text', name: 'title', id: 'title', ref: 'titleInput',
                autoFocus: true,
                defaultValue: this.props.initialTitle,
                onKeyDown: this.handleKeyDown
              })
            )
          )
        )
      )
    );
  },
  componentDidMount: function componentDidMount() {
    console.log('SaveModal: did mount');
    var titleElem = this.refs.titleInput;
    /* titleElem.val(this.props.initialTitle); */
    var titleLen = this.props.initialTitle.length;
    window.setTimeout(function () {
      console.log('timer func');
      titleElem.setSelectionRange(0, titleLen);
    }, 0);
  }
});

exports.default = SaveModal;