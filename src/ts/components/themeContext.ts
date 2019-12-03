import * as React from 'react';

export interface Theme {
    foreground: string;
    background: string;
    buttonBackground: string;
    windowBorder: string;
    windowSelectedBorder: string;
    lightBorder: string;
    tabItemHover: string;
    menuItemHover: string;
    buttonHover: string;
    headerBackground: string;
    closedGray: string;
    headerButtonColor: string;
    headerButtonHover: string;
    tabCloseHoverBackground: string;
    revertColor: string;
    revertHover: string;
}

export interface ThemeMap {
    light: Theme;
    dark: Theme;
}
export type ThemeName = keyof ThemeMap;

export const themes: ThemeMap = {
    light: {
        foreground: '#000000',
        background: '#ffffff',
        buttonBackground: '#ffffff',
        windowBorder: '#bababa',
        windowSelectedBorder: '#808080',
        lightBorder: '#cacaca',
        tabItemHover: '#cacaca',
        menuItemHover: '#f8f9fa',
        buttonHover: '#999999',
        headerBackground: '#ebe9eb',
        closedGray: '#979ca0',
        headerButtonColor: '#888888',
        headerButtonHover: '#000000',
        tabCloseHoverBackground: '#5f6368',
        revertColor: '#7472ff',
        revertHover: '#b4b3ff'
    },
    dark: {
        foreground: '#ffffff',
        background: '#222222',
        buttonBackground: '#333333',
        windowBorder: '#555555',
        windowSelectedBorder: '#bababa',
        lightBorder: '#cacaca',
        tabItemHover: '#333333',
        menuItemHover: '#555555',
        buttonHover: '#999999',
        headerBackground: '#141414',
        closedGray: '#777777',
        headerButtonColor: '#888888',
        headerButtonHover: '#dddddd',
        tabCloseHoverBackground: '#5f6368',
        revertColor: '#7472ff',
        revertHover: '#b4b3ff'
    }
};
export const ThemeContext = React.createContext(
    themes.light // default value
);
