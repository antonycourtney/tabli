/*
 * Serializable, immutable user preferences
 */

import * as _ from 'lodash'
import * as Immutable from 'immutable'

type VersionedObject = { version: number, contents: any }

export const PREFS_VERSION = 2

export class Preferences extends Immutable.Record({
  popoutOnStart: false // show popout on startup?
}) {
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
  // should be an identit op, but just in case:
  const userJSPrefs = _.defaultsDeep(jsPrefs, defaultPrefsJS)
  return userJSPrefs
}
