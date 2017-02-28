/*
 * Serializable, immutable user preferences
 */

import * as Immutable from 'immutable'

export class Preferences extends Immutable.Record({
  popoutOnStart: true // show popout on startup?
}) {
}
