import * as Constants from './components/constants';
import ChromePromise from 'chrome-promise';
const chromep = ChromePromise;

console.log('in bhHelper, creating popout window...:');
chromep.windows.create({
    url: 'popout.html',
    type: 'popup',
    left: 0,
    top: 0,
    width: Constants.POPOUT_DEFAULT_WIDTH,
    height: Constants.POPOUT_DEFAULT_HEIGHT,
});
