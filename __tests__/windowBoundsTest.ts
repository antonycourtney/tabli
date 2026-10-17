import { createWindowSafe } from '../src/ts/windowBounds';
import { rememberableBounds, rememberableSize } from '../src/ts/tabWindowUtils';
import TabManagerState from '../src/ts/tabManagerState';
import { enablePatches } from 'immer';

jest.mock('chrome-promise', () => ({}));

const BOUNDS_ERROR = {
    message:
        'Invalid value for bounds. Bounds must be at least 50% within visible screen space.',
};

const fakeWindow = { id: 42 } as chrome.windows.Window;

test('createWindowSafe retries without geometry on bounds error', async () => {
    const createWindow = jest
        .fn()
        .mockRejectedValueOnce(BOUNDS_ERROR)
        .mockResolvedValueOnce(fakeWindow);
    const createData: chrome.windows.CreateData = {
        url: ['https://example.com/'],
        focused: true,
        type: 'normal',
        left: -2988,
        top: -344,
        width: 450,
        height: 750,
    };
    const w = await createWindowSafe(createData, createWindow);
    expect(w).toBe(fakeWindow);
    expect(createWindow).toHaveBeenCalledTimes(2);
    expect(createWindow.mock.calls[1][0]).toEqual({
        url: ['https://example.com/'],
        focused: true,
        type: 'normal',
    });
});

test('createWindowSafe rethrows non-bounds errors', async () => {
    const err = { message: 'Invalid value for state' };
    const createWindow = jest.fn().mockRejectedValueOnce(err);
    await expect(
        createWindowSafe({ type: 'normal', width: 800 }, createWindow),
    ).rejects.toBe(err);
    expect(createWindow).toHaveBeenCalledTimes(1);
});

test('createWindowSafe rethrows bounds error when no geometry given', async () => {
    const createWindow = jest.fn().mockRejectedValueOnce(BOUNDS_ERROR);
    await expect(
        createWindowSafe({ type: 'normal' }, createWindow),
    ).rejects.toBe(BOUNDS_ERROR);
    expect(createWindow).toHaveBeenCalledTimes(1);
});

test('rememberableSize only trusts normal windows with a size', () => {
    const w = (props: Partial<chrome.windows.Window>) =>
        props as chrome.windows.Window;
    expect(
        rememberableSize(w({ state: 'normal', width: 800, height: 600 })),
    ).toEqual({
        width: 800,
        height: 600,
    });
    expect(
        rememberableSize(w({ state: 'maximized', width: 800, height: 600 })),
    ).toBeNull();
    expect(
        rememberableSize(w({ state: 'minimized', width: 800, height: 600 })),
    ).toBeNull();
    expect(
        rememberableSize(w({ state: 'normal', width: 0, height: 0 })),
    ).toBeNull();
});

describe('lastNormalBounds', () => {
    beforeAll(() => {
        enablePatches();
    });

    const w = (props: Partial<chrome.windows.Window>) =>
        props as chrome.windows.Window;
    const normalWindow = w({
        type: 'normal',
        state: 'normal',
        left: -2988,
        top: -344,
        width: 1200,
        height: 800,
    });
    const normalBounds = { left: -2988, top: -344, width: 1200, height: 800 };
    const popout = w({
        type: 'popup',
        state: 'normal',
        left: 0,
        top: 0,
        width: 450,
        height: 750,
    });

    test('rememberableBounds only trusts normal-type, normal-state windows', () => {
        expect(rememberableBounds(normalWindow)).toEqual(normalBounds);
        expect(rememberableBounds(popout)).toBeNull();
        expect(
            rememberableBounds({ ...normalWindow, state: 'maximized' }),
        ).toBeNull();
        expect(
            rememberableBounds(
                w({ type: 'normal', state: 'normal', width: 800, height: 600 }),
            ),
        ).toBeNull();
    });

    test('updateLastNormalBounds keeps the last usable bounds', () => {
        const st0 = TabManagerState.create();
        expect(st0.lastNormalBounds).toBeNull();

        const st1 = st0.updateLastNormalBounds(normalWindow);
        expect(st1.lastNormalBounds).toEqual(normalBounds);

        // focusing the popout or a maximized window leaves them in place:
        expect(st1.updateLastNormalBounds(popout)).toBe(st1);
        expect(
            st1.updateLastNormalBounds({ ...normalWindow, state: 'maximized' }),
        ).toBe(st1);
        // unchanged bounds don't produce a new state:
        expect(st1.updateLastNormalBounds({ ...normalWindow })).toBe(st1);
    });

    test('lastNormalBounds survives a snapshot round trip', () => {
        const st =
            TabManagerState.create().updateLastNormalBounds(normalWindow);
        const snap = JSON.parse(JSON.stringify(st.toJS()));
        expect(TabManagerState.deserialize(snap).lastNormalBounds).toEqual(
            normalBounds,
        );

        // snapshots written before this field existed:
        delete snap.lastNormalBounds;
        expect(TabManagerState.deserialize(snap).lastNormalBounds).toBeNull();
    });
});
