'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _oneref = require('oneref');

var OneRef = _interopRequireWildcard(_oneref);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A wrapper around OneRef.Ref that tracks listeners by numeric id
 * so that we can share a ref between background page and popup
 * in Chrome extension and clean up when popup goes away
 *
 *
 */

var ViewRef = function (_OneRef$Ref) {
  _inherits(ViewRef, _OneRef$Ref);

  /**
   * construct a new ViewRef with initial value v
   */

  function ViewRef(v) {
    _classCallCheck(this, ViewRef);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ViewRef).call(this, v));

    _this.viewListeners = [];
    return _this;
  }

  /*
   * Add a view listener and return its listener id
   *
   * We have our own interface here because we don't have a reliable destructor / close event
   * on the chrome extension popup window, and our GC technique requires us to have
   * numeric id's (rather than object references) that we can encode in a Chrome JSON
   * message
   */

  _createClass(ViewRef, [{
    key: 'addViewListener',
    value: function addViewListener(listener) {
      // check to ensure this listener not yet registered:
      var idx = this.viewListeners.indexOf(listener);
      if (idx === -1) {
        idx = this.viewListeners.length;
        this.viewListeners.push(listener);
        this.on('change', listener);
      }

      return idx;
    }
  }, {
    key: 'removeViewListener',
    value: function removeViewListener(id) {
      // console.log("removeViewListener: removing listener id ", id);
      var listener = this.viewListeners[id];
      if (listener) {
        this.removeListener('change', listener);
      } else {
        console.warn('removeViewListener: No listener found for id ', id);
      }

      delete this.viewListeners[id];
    }
  }]);

  return ViewRef;
}(OneRef.Ref);

exports.default = ViewRef;