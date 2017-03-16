/*
 * Serializable, immutable user preferences
 */

import * as Immutable from 'immutable'

export const PREFS_VERSION = 1

export class Preferences extends Immutable.Record({
  popoutOnStart: true // show popout on startup?
}) {
}

export const defaultPrefsJS = (new Preferences()).toJS()
