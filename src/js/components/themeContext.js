import * as React from 'react'

export const themes = {
  light: {
    foreground: '#000000',
    background: '#ffffff',
    buttonBackground: '#ffffff',
    lightBorder: '#cacaca',
    tabItemSelected: '#dadada',
    menuItemHover: '#f8f9fa',
    buttonHover: '#999999',
    headerBackground: '#ebe9eb',
    closedGray: '#979ca0'
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
    closedGray: '#777777'
  },
}

export const ThemeContext = React.createContext(
  themes.light // default value
)
