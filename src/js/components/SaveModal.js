import * as React from 'react';
import Styles from './styles';
import * as Constants from './constants';
import * as Modal from './Modal';

const SaveModal = React.createClass({
  handleKeyDown(e) {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault();
      this.props.onClose(e);
    }
  },

  handleSubmit(e) {
    e.preventDefault();
    const titleStr = this.refs.titleInput.getDOMNode().value;
    console.log('handleSubmit: title: ', titleStr);
    this.props.onSubmit(titleStr);
  },

  render() {
    return (
      <Modal.Dialog title="Save Tabs" focusRef="titleInput" onClose={this.props.onClose} >
        <Modal.Info>
          <span>Save all tabs in this window</span>
                                                                                                                                                                                                                                                                </Modal.Info>
        <Modal.Body>
          <div style={Styles.centerContents}>
            <form className="dialog-form" onSubmit={this.handleSubmit}>
              <fieldset>
                <label htmlFor="title">Window Title</label>
                <input type="text" name="title" id="title" ref="titleInput"
                  autoFocus
                  defaultValue={this.props.initialTitle}
                  onKeyDown={this.handleKeyDown}
                />
              </fieldset>
            </form>
          </div>
        </Modal.Body>
                                                                                                                                                                                                </Modal.Dialog>
    );
  },

  componentDidMount() {
    console.log('SaveModal: did mount');
    var titleElem = this.refs.titleInput.getDOMNode();
    /* titleElem.val(this.props.initialTitle); */
    const titleLen = this.props.initialTitle.length;
    window.setTimeout(() => {
      console.log('timer func');
      titleElem.setSelectionRange(0, titleLen);
    }, 0);
  },
});

export default SaveModal;
