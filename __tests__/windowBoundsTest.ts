import { createWindowSafe } from '../src/ts/windowBounds';
import { rememberableSize } from '../src/ts/tabWindowUtils';

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
