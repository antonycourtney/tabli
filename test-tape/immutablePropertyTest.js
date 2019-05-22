/*
 * simple test of property accessors for immutable JS records, since we are
 * hitting issues with this after Babel 7 upgrade
 */
import test from 'tape'
import * as Immutable from 'immutable'

class Point extends Immutable.Record({
 x: 10,
 y: 20
}) {
}

class Rectangle extends Immutable.Record({
 ul: null,
 lr: null,
 id: ''
}) {
  id: string
}

class SavedTabState extends Immutable.Record({
  bookmarkId: '',
  bookmarkIndex: 0, // position in bookmark folder
  title: '',
  url: ''
}) {
}


test('immutablePropertyAccess', (t) => {
    let pt = new Point()

    console.log('point: ', pt.toJS())

    t.equal(pt.get('x'), 10)
    t.equal(pt.get('y'), 20)
    t.equal(pt.y, 20)

    let pt2 = new Point({x: 30, y: 50})
    t.equal(pt2.get('x'), 30)
    t.equal(pt2.get('y'), 50)
    t.equal(pt2.y, 50)

    t.equal(pt.x, 10)
    t.equal(pt.y, 20)
    t.end()
})

test('aggPropertyAccess', (t) => {
  let ul = new Point({x: 15, y: 25})
  let lr = new Point({x:75,y: 85})

  let r = new Rectangle({ul, lr, id: 'hello'})

  console.log('r.id: ', r.id)

  t.equal(r.ul.x, 15)
  t.equal(r.ul.y, 25)
  t.equal(r.lr.x, 75)
  t.equal(r.lr.y, 85)
  t.equal(r.id, 'hello')
  t.end()
})

const bm =     {
  dateAdded: 1395768341441,
  id: '432',
  index: 0,
  parentId: '431',
  title: 'API Reference · mbostock/d3 Wiki',
  url: 'https://github.com/mbostock/d3/wiki/API-Reference'
}

test('basicTabState', (t) => {
  const ts = new SavedTabState({
    url: bm.url,
    title: bm.title,
    bookmarkId: bm.id,
    bookmarkIndex: bm.index
  })
  console.log('ts: ', ts.toJS())
  console.log('ts bookmarkId (get): ', ts.get('bookmarkId'))
  console.log('ts bookmarkId: ', ts.bookmarkId)

  t.end()
})
