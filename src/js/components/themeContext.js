import * as React from 'react'

export const themes = {
  light: {
    foreground: '#000000',
    background: '#ffffff',
    buttonBackground: '#ffffff',
    lightBorder: '#cacaca',
    menuItemHover: '#f8f9fa',
    buttonHover: '#999999'
  },
  dark: {
    foreground: '#ffffff',
    background: '#222222',
    buttonBackground: '#aaaaaa',
    lightBorder: '#cacaca',
    menuItemHover: '#f8f9fa',
    buttonHover: '#999999'
  },
}

export const ThemeContext = React.createContext(
  themes.light // default value
)
