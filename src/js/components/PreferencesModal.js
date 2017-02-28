import * as React from 'react'
import Styles from './styles'
import * as Constants from './constants'
import * as Modal from './Modal'
import * as Util from './util'

const PreferencesModal = React.createClass({
  handleKeyDown (e) {
    if (e.keyCode === Constants.KEY_ESC) {
      // ESC key
      e.preventDefault()
      this.props.onClose(e)
    } else if (e.keyCode === Constants.KEY_ENTER) {
      this.handleSubmit(e)
    }
  },

  handleSubmit (e) {
    e.preventDefault()
    this.props.onSubmit()
  },

  render () {
    return (
      <Modal.Dialog title='Tabli Preferences' onClose={this.props.onClose}>
        <Modal.Body>
          <div className='container'>
            <form className='dialog-form form-inline preferences-form' onSubmit={this.handleSubmit}>
              <div className='checkbox'>
                <label>
                  <input type='checkbox' value='checked' />
                  Show Tabli Popout Window at Startup
                </label>
              </div>
            </form>
            <hr />
            <div style={Util.merge(Styles.alignRight, Styles.dialogButtonRow)}>
              <button
                type='button'
                className='btn btn-primary btn-sm tabli-dialog-button'
                onClick={this.handleSubmit}
                ref='okButton'
                tabIndex={0}
                onKeyDown={this.handleKeyDown}>
                OK
              </button>
              <button
                type='button'
                className='btn btn-default btn-sm tabli-dialog-button'
                onClick={this.props.onClose}
                tabIndex={0}>
                Cancel
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal.Dialog>
    )
  }

})

export default PreferencesModal
