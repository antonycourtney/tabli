import * as React from 'react';

export interface Theme {
    foreground: string;
    background: string;
    buttonBackground: string;
    lightBorder: string;
    tabItemSelected: string;
    menuItemHover: string;
    buttonHover: string;
    headerBackground: string;
    closedGray: string;
    headerButtonColor: string;
    headerButtonHover: string;
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
        lightBorder: '#cacaca',
        tabItemSelected: '#dadada',
        menuItemHover: '#f8f9fa',
        buttonHover: '#999999',
        headerBackground: '#ebe9eb',
        closedGray: '#979ca0',
        headerButtonColor: '#888888',
        headerButtonHover: '#000000'
    },
    dark: {
        foreground: '#ffffff',
        background: '#222222',
        buttonBackground: '#333333',
        lightBorder: '#cacaca',
        tabItemSelected: '#333333',
        menuItemHover: '#555555',
        buttonHover: '#999999',
        headerBackground: '#141414',
        closedGray: '#777777',
        headerButtonColor: '#888888',
        headerButtonHover: '#dddddd'
    }
};
export const ThemeContext = React.createContext(
    themes.light // default value
);
