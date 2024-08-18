import * as Constants from './components/constants';
import ChromePromise from 'chrome-promise';
import { readSnapStateStr } from './state';
import { readPreferences } from './actions';

const chromep = ChromePromise;

async function main() {
    console.log('in bgHelper...:');

    // first, check for existence of session state -- if it exists, we're already running
    const snapStateStr = await readSnapStateStr();
    if (snapStateStr) {
        console.log('bgHelper: snapStateStr found, returning');
        return;
    }

    const userPrefs = await readPreferences();

    console.log(
        'bgHelper: no session state. Read userPrefs: ',
        userPrefs.toJS(),
    );

    if (userPrefs.popoutOnStart) {
        console.log('bgHelper: popoutOnStart is true, creating popout');
        chromep.windows.create({
            url: 'popout.html',
            type: 'popup',
            left: 0,
            top: 0,
            width: Constants.POPOUT_DEFAULT_WIDTH,
            height: Constants.POPOUT_DEFAULT_HEIGHT,
        });
    } else {
        console.log('bgHelper: popoutOnStart is false, skipping popout');
    }
}

main();
