/*
 * Font size values -- We present these values as if pixels for
 * simplicity, but but we actually convert these to
 * percentages relative to an assumed browser font size of 16px (12pt),
 * so that by default we will respect the browser font size preferences.
 */
export const fontSizeVals = [
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24
];

// assumed base font size (in px):
const BASE_FONT_SIZE = 16;

// Convert font size to/from scale factor:
export const fontSizeToScaleFactor = (sz: number) => sz / BASE_FONT_SIZE;

export const fontScaleFactorToSize = (sf: number) =>
    Math.round(sf * BASE_FONT_SIZE);

// Set global font size to a scale factor of the system font size:
export function setRootFontSize(scaleFactor: number) {
    let rootNode = document.getElementsByTagName('html')[0];
    rootNode.style.fontSize = scaleFactor.toString() + 'em';
}
