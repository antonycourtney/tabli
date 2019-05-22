import * as fs from 'fs';
import TabManagerState from '../src/ts/tabManagerState';

test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
});

function getWindowSnap() {
    const content = fs.readFileSync('test-data/chromeWindowSnap.json');
    const snap = JSON.parse(content.toString());
    return snap.chromeWindows;
}

function initialWinStore() {
    const folderId = 6666;
    const archiveFolderId = 7777;
    const baseWinStore = new TabManagerState({ folderId, archiveFolderId });

    const windowList = getWindowSnap();
    const initWinStore = baseWinStore.syncWindowList(windowList);

    return initWinStore;
}

test('basic load state', () => {
    const snap = getWindowSnap();

    // console.log('basic load state: ', snap);

    expect(snap.length).toBe(3);
});

test('basic window state', () => {
    const winStore = initialWinStore();

    const openTabCount = winStore.countOpenTabs();
    const openWinCount = winStore.countOpenWindows();
    const savedCount = winStore.countSavedWindows();

    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
    const summarySentence =
        'Tabs: ' +
        openTabCount +
        ' Open. Windows: ' +
        openWinCount +
        ' Open, ' +
        savedCount +
        ' Saved.';

    console.log(summarySentence + '\n');
    expect(openTabCount).toBe(14);
    expect(openWinCount).toBe(3);
    expect(savedCount).toBe(0);
});
