// @flow
/*
 * Serializable, immutable user preferences
 */

import defaultsDeep from 'lodash/defaultsDeep'
import * as Immutable from 'immutable'

const _ = { defaultsDeep }

type VersionedObject = { version: number, contents: any }

export const PREFS_VERSION = 5

export class Preferences extends Immutable.Record({
  popoutOnStart: false, // show popout on startup?
  dedupeTabs: false, // close tab if URL matches existing tab
  revertOnOpen: true // revert to anchor tabs when opening saved window
}) {
  popoutOnStart: boolean
  dedupeTabs: boolean
  revertOnOpen: boolean

  static deserialize (blob: ?string): Preferences {
    let jsPrefs = defaultPrefsJS
    if (blob != null) {
      const storedPrefsObj = JSON.parse(blob)
      jsPrefs = migrate(storedPrefsObj)
    }
    return new Preferences(jsPrefs)
  }

  serialize (): string {
    const jsPrefs = this.toJS()
    const serPrefs: VersionedObject = { version: PREFS_VERSION, contents: jsPrefs }
    return JSON.stringify(serPrefs)
  }
}

export const defaultPrefsJS = (new Preferences()).toJS()

/*
 * migrate a potentially older version of preferences
 * Takes a VersionedObject as input, returns a JS encoded version of
 * preferences
 */
export const migrate = (storedPrefs: VersionedObject): Object => {
  if (storedPrefs.version < 2) {
    console.log('prefs.migrate: reverting v1 preferences')
    return defaultPrefsJS
  }
  // otherwise, just grab contents, which should be a JS store of preferences:
  const jsPrefs = storedPrefs.contents
  // should be an identity op, but just in case:
  const userJSPrefs = _.defaultsDeep(jsPrefs, defaultPrefsJS)
  return userJSPrefs
}
