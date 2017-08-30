// @flow

let testMode = false

let testTimeVal = 0

export const setTestMode = (timeVal: number): void => {
  testTimeVal = timeVal
  testMode = true
}

export const now = (): number => {
  if (testMode) {
    return testTimeVal
  } else {
    return Date.now()
  }
}
