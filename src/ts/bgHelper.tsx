
///<reference path='../../node_modules/immutable/dist/Immutable.d.ts'/>
import * as Immutable from 'immutable';

import * as TabWindow from './tabWindow';

var map1: Immutable.Map<string, number>;
map1 = Immutable.Map({a:1, b:2, c:3});

function main() {
  console.log("Hello, Tabli!");
  console.log("map1.get(b): ", map1.get('b'));
}

main();