import * as React from 'react'

export const themes = {
  light: {
    foreground: '#000000',
    background: '#ffffff',
    buttonBackground: '#ffffff'
  },
  dark: {
    foreground: '#ffffff',
    background: '#222222',
    buttonBackground: '#aaaaaa'
  },
}

export const ThemeContext = React.createContext(
  themes.light // default value
)
