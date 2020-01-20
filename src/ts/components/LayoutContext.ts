import * as React from 'react';

export interface Layout {
    tabPaddingTop: number;
    tabPaddingBottom: number;
    tabMarginTop: number;
    tabMarginBottom: number;
    windowHeaderHeight: number;
    sectionPaddingTop: number;
    sectionPaddingBottom: number;
    sectionHeaderFontSize: number;
    sectionHeaderMarginBottom: number;
    popupHeaderHeight: number;
}

export interface LayoutMap {
    compact: Layout;
    normal: Layout;
}
export type LayoutName = keyof LayoutMap;

export const layouts: LayoutMap = {
    compact: {
        tabPaddingTop: 0,
        tabPaddingBottom: 0,
        tabMarginTop: 0,
        tabMarginBottom: 0,
        windowHeaderHeight: 26,
        sectionPaddingTop: 6,
        sectionPaddingBottom: 4,
        sectionHeaderFontSize: 12,
        sectionHeaderMarginBottom: 4,
        popupHeaderHeight: 40
    },
    normal: {
        tabPaddingTop: 2,
        tabPaddingBottom: 2,
        tabMarginTop: 2,
        tabMarginBottom: 2,
        windowHeaderHeight: 30,
        sectionPaddingTop: 12,
        sectionPaddingBottom: 8,
        sectionHeaderFontSize: 14,
        sectionHeaderMarginBottom: 8,
        popupHeaderHeight: 44
    }
};
export const LayoutContext = React.createContext(
    layouts.normal // default value
);
