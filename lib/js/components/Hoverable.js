"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * mixin for that maintains a "hovering" state
 * and provides callbacks for mouseOver/mouseOut
 * User of mixin must connect these callbacks to onMouseOver / onMouseOut
 * of appropriate component
 */
var Hoverable = {
  getInitialState: function getInitialState() {
    return { hovering: false };
  },
  handleMouseOver: function handleMouseOver() {
    this.setState({ hovering: true });
  },
  handleMouseOut: function handleMouseOut() {
    this.setState({ hovering: false });
  }
};

exports.default = Hoverable;