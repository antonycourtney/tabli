import * as Constants from './components/constants';
import ChromePromise from 'chrome-promise';
import * as log from 'loglevel';
import { initState, loadSnapState, readSnapStateStr } from './state';
import * as actions from './actions';
import { mutableGet } from 'oneref';
import * as utils from './utils';

const chromep = ChromePromise;

/*
 * show the popout window in response to a show popout command
 *
 * Reads the latest snapshot of window state, and either sends focus to existing
 * popout or opens a new one.
 */
async function showPopout() {
    // first, check for existence of session state -- if it exists, we're already running
    const stateRef = await loadSnapState();
    if (stateRef == null) {
        console.log(
            'showPopout: no snap state found, creating popout window...',
        );
        chromep.windows.create({
            url: 'popout.html',
            type: 'popup',
            left: 0,
            top: 0,
            width: Constants.POPOUT_DEFAULT_WIDTH,
            height: Constants.POPOUT_DEFAULT_HEIGHT,
        });
        return;
    }
    const st = mutableGet(stateRef);
    console.log(
        'bgHelper: showPopout: before syncChromeWindows: st.popoutWindowId: ',
        st.popoutWindowId,
    );
    await actions.syncChromeWindows(stateRef);
    const st2 = mutableGet(stateRef);
    console.log(
        'bgHelper: showPopout: after syncChromeWindows: st.popoutWindowId: ',
        st2.popoutWindowId,
    );

    actions.showPopout(stateRef);
}

async function main() {
    console.log('in bgHelper...:');
    utils.setLogLevel(log);
    const userPrefs = await actions.readPreferences();
    console.log('bgHelper: Read userPrefs: ', userPrefs.toJS());

    const stateRef = await initState(true);

    log.debug('bgHelper: initialized stateRef');

    if (userPrefs.popoutOnStart) {
        console.log('bgHelper: popoutOnStart is true, creating popout');
        showPopout();
    } else {
        console.log('bgHelper: popoutOnStart is false, skipping popout');
    }
    chrome.commands.onCommand.addListener((command) => {
        console.log('Chrome Event: onCommand: ', command);

        if (command === 'show_popout') {
            showPopout();
        }
    });
}

main();
