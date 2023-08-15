import { BrandVariants, createLightTheme, createDarkTheme, Theme } from '@fluentui/react-components'

const sandwichTheme: BrandVariants = {
  10: '#030302',
  20: '#1A1811',
  30: '#2A281C',
  40: '#373323',
  50: '#44402B',
  60: '#524C34',
  70: '#60593D',
  80: '#6F6647',
  90: '#7E7351',
  100: '#8D815C',
  110: '#9C8F67',
  120: '#AC9D73',
  130: '#BBAC7F',
  140: '#CBBA8D',
  150: '#DCC99A',
  160: '#ECD8A9'
}

const lightTheme: Theme = {
  ...createLightTheme(sandwichTheme)
}

const darkTheme: Theme = {
  ...createDarkTheme(sandwichTheme),
  colorBrandForeground1: sandwichTheme[140],
  colorBrandForeground2: sandwichTheme[150]
}

darkTheme.colorBrandForeground1 = sandwichTheme[140]
darkTheme.colorBrandForeground2 = sandwichTheme[150]

export { darkTheme, lightTheme }
