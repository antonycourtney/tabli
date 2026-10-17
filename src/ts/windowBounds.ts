import { log } from './globals';
import ChromePromise from 'chrome-promise';
const chromep = ChromePromise;

// Prefix of Chrome's kInvalidWindowBoundsError, raised by windows.create()
// when the requested bounds aren't at least 50% within visible screen space.
const BOUNDS_ERROR_PREFIX = 'Invalid value for bounds';

type CreateWindowFn = (
    createData: chrome.windows.CreateData,
) => Promise<chrome.windows.Window>;

const hasBounds = (createData: chrome.windows.CreateData): boolean =>
    createData.left !== undefined ||
    createData.top !== undefined ||
    createData.width !== undefined ||
    createData.height !== undefined;

export function stripBounds(
    createData: chrome.windows.CreateData,
): chrome.windows.CreateData {
    const { left, top, width, height, ...rest } = createData;
    return rest;
}

const isBoundsError = (e: unknown): boolean => {
    const msg =
        e != null && typeof (e as any).message === 'string'
            ? (e as any).message
            : String(e);
    return msg.startsWith(BOUNDS_ERROR_PREFIX);
};

/**
 * chrome.windows.create(), but if Chrome rejects the requested geometry
 * (e.g. remembered bounds on a display that's gone or that Chrome 155
 * misjudges), retry without any geometry so the window still opens.
 * Chrome only applies its bounds check when geometry is specified.
 */
export async function createWindowSafe(
    createData: chrome.windows.CreateData,
    createWindow: CreateWindowFn = (cd) => chromep.windows.create(cd),
): Promise<chrome.windows.Window> {
    try {
        return await createWindow(createData);
    } catch (e) {
        if (!(isBoundsError(e) && hasBounds(createData))) {
            throw e;
        }
        log.warn(
            'createWindowSafe: window bounds rejected by Chrome, retrying without geometry: ',
            e,
            { createData },
        );
        return await createWindow(stripBounds(createData));
    }
}
