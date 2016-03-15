/**
 * mixin for that maintains a "hovering" state
 * and provides callbacks for mouseOver/mouseOut
 * User of mixin must connect these callbacks to onMouseOver / onMouseOut
 * of appropriate component
 */
const Hoverable = {
  getInitialState() {
    return { hovering: false };
  },

  handleMouseOver() {
    this.setState({ hovering: true });
  },

  handleMouseOut() {
    this.setState({ hovering: false });
  },
};

export default Hoverable;
