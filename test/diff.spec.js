import { expect } from 'chai'
import { diff, deepClone, apply, revert, findIndexOf } from '../src/diff.js'
import * as debug from "../src/debug.js"

debug.set(true)
runTestDiff()

function runTestDiff() {
  describe('Diff', () => {

    it('null case', () => {
      expect(diff(null, null)).to.eql([])
    })
    it('null to undefined', () => {
      expect(diff(null, undefined)).to.eql([{
        kind: 'E',
        path: [],
        lhs: null,
        rhs: undefined
      }])
    })

    it('string case', () => {
      expect(diff('Hello' + ' World', 'Hello World')).to.eql([])
    })

    it('string to undefined', () => {
      expect(diff('Hello World', undefined)).to.eql([{
        kind: 'E',
        path: [],
        lhs: 'Hello World',
        rhs: undefined
      }])
    })

    it('object to null', () => {
      expect(diff({}, null)).to.eql([{
        kind: 'E',
        path: [],
        lhs: {},
        rhs: null
      }])
    })

    it('object to array', () => {
      expect(diff({}, [])).to.eql([{
        kind: 'E',
        path: [],
        lhs: {},
        rhs: []
      }])
    })

    it('object equals object', () => {
      expect(diff({}, {})).to.eql([])
    })

    it('object key remove', () => {
      expect(diff({test: 'test'}, {})).to.eql([{
        kind: 'D',
        path: ['test'],
        lhs: 'test'
      }])
    })

    it('object key add', () => {
      expect(diff({}, {test: 'test'})).to.eql([{
        kind: 'N',
        path: ['test'],
        rhs: 'test'
      }])
    })

    it('object key remove undefined', () => {
      expect(diff({test: undefined}, {})).to.eql([{
        kind: 'D',
        path: ['test'],
        lhs: undefined
      }])
    })

    it('object key add undefined', () => {
      expect(diff({}, {test: undefined})).to.eql([{
        kind: 'N',
        path: ['test'],
        rhs: undefined
      }])
    })

    it('object key remove null', () => {
      expect(diff({test: null}, {})).to.eql([{
        kind: 'D',
        path: ['test'],
        lhs: null
      }])
    })

    it('object key add null', () => {
      expect(diff({}, {test: null})).to.eql([{
        kind: 'N',
        path: ['test'],
        rhs: null
      }])
    })

    it('object key edit', () => {
      expect(diff({test: null}, {test: undefined})).to.eql([{
        kind: 'E',
        path: ['test'],
        lhs: null,
        rhs: undefined
      }])
    })

    it('object key edit same type', () => {
      expect(diff({test: 3}, {test: 4})).to.eql([{
        kind: 'E',
        path: ['test'],
        lhs: 3,
        rhs: 4
      }])
    })

    it('object key edit object null', () => {
      expect(diff({test: null}, {test: {}})).to.eql([{
        kind: 'E',
        path: ['test'],
        lhs: null,
        rhs: {}
      }])
    })

    it('object key add nested', () => {
      expect(diff({test: {}}, {test: {test: null}})).to.eql([{
        kind: 'N',
        path: ['test', 'test'],
        rhs: null
      }])
    })

    it('object key delete nested', () => {
      expect(diff({test: {test: null}}, {test: {}})).to.eql([{
        kind: 'D',
        path: ['test', 'test'],
        lhs: null
      }])
    })

    it('object array add', () => {
      expect(diff([], [1, 2])).to.eql([{
        kind: 'N',
        path: [0],
        rhs: 1
      },
      {
        kind: 'N',
        path: [1],
        rhs: 2
      }])
    })

    it('object array remove', () => {
      expect(diff([1, 2], [])).to.eql([{
        kind: 'D',
        path: [0],
        lhs: 1
      },
      {
        kind: 'D',
        path: [1],
        lhs: 2
      }])
    })

    it('object array add remove', () => {
      expect(diff([1, 2, 4, 5, 6], [2, 3, 4, 6, 7])).to.eql([{
        kind: 'D',
        path: [0],
        lhs: 1
      },
      {
        kind: 'N',
        path: [1],
        rhs: 3
      },
      {
        kind: 'D',
        path: [3],
        lhs: 5
      },
      {
        kind: 'N',
        path: [4],
        rhs: 7
      }])
    })

    it('object array edit', () => {
      expect(diff([0, 1], [2, 3])).to.eql([{
        kind: 'E',
        path: [0],
        lhs: 0,
        rhs: 2
      },
      {
        kind: 'E',
        path: [1],
        lhs: 1,
        rhs: 3
      }])
    })

    it ('object discriminated by inheritance', () => {
      class Base {
        constructor() {
          this.c = 4;
        }
      }

      class Child extends Base {
        constructor() {
          super();
          this.d = 4;
        }
      }

      class AnotherBase {
        constructor() {
          this.c = 4;
        }
      }

      class AnotherChild extends AnotherBase {
        constructor() {
          super();
          this.d = 4;
        }
      }

      let result = diff(new Child(), new AnotherChild())

      expect(result).to.eql([{
        kind: 'E',
        path: [],
        lhs: {
          c: 4,
          d: 4
        },
        rhs: {
          c: 4,
          d: 4
        }
      }])

      expect(Object.getPrototypeOf(result[0].lhs)).to.equal(Child.prototype)
      expect(Object.getPrototypeOf(result[0].rhs)).to.equal(AnotherChild.prototype)
    })

  })

  describe('Deep clone', () => {

    it ('nested object', () => {
      let x = {
        a: {
          b : {
            c: undefined
          }
        }
      }

      let y = deepClone(x)

      expect(x).to.eql(y)
      expect(x !== y)
      expect(x.a !== y.a)
      expect(x.a.b !== y.a.b)
      expect(x.a.b.c !== y.a.b.c)
    })

    it ('nested array', () => {
      let x = [0, 1, [2, 3, 4], 5]
      let y = deepClone(x)

      expect(x).to.eql(y)
      expect(x !== y)
      expect(x[2] !== y[2])
    })
  })

  describe('Apply diff', () => {

    it('replacement', () => {
      let x = null
      let diff = [{
        kind: 'E',
        path: [],
        lhs: null,
        rhs: 1
      }]

      let y = apply(x, diff)
      expect(y).to.equal(1)
    })

    it('nested object', () => {
      let x = {
        a: {
          b: {}
        }
      }

      let diff = [{
        kind: 'N',
        path: ['a', 'b', 'c'],
        rhs: {}
      },
      {
        kind: 'N',
        path: ['a', 'd'],
        rhs: {
          e: 2,
          f: null
        }
      },
      {
        kind: 'D',
        path: ['a', 'd', 'e'],
        lhs: 2
      },
      {
        kind: 'E',
        path: ['a', 'd', 'f'],
        lhs: null,
        rhs: 3
      }]

      let y = apply(x, diff)
      expect(y).to.eql({
        a: {
          b: {
            c: {}
          },
          d: {
            f: 3
          }
        }
      })
    })
  })

  describe('Array patch', () => {

    it('array inserts', () => {
      let x = []
      let diff = [{
        kind: 'N',
        path: [0],
        rhs: 1
      }]

      let y = apply(x, diff)
      expect(y).to.eql([1])
    })

    it('array delete', () => {
      let x = [1, 2, 3]
      let diff = [{
        kind: 'D',
        path: [1],
        lhs: 2
      }]

      let y = apply(x, diff)
      expect(y).to.eql([1, 3])
    })

    it('array multiple insert', () => {
      let x = []
      let diff = [{
        kind: 'N',
        path: [0],
        rhs: 1
      },
      {
        kind: 'N',
        path: [0],
        rhs: 2
      }]
      let y = apply(x, diff)
      expect(y).to.eql([1, 2])
    })

    it('mixed insert and delete', () => {
      let x = [1, 3, 3, 5]
      let diff = [{
        kind: 'N',
        path: [1],
        rhs: 2
      },
      {
        kind: 'D',
        path: [2],
        lhs: 3
      },
      {
        kind: 'N',
        path: [3],
        rhs: 4
      }]
      let y = apply(x, diff)
      expect(y).to.eql([1, 2, 3, 4, 5])
    })

    it('reverse insert and delete', () => {
      let x = [1, 2, 3, 4, 5]
      let diff = [{
        kind: 'D',
        path: [1],
        lhs: 2
      },
      {
        kind: 'N',
        path: [2],
        rhs: 3
      },
      {
        kind: 'D',
        path: [3],
        lhs: 4
      }]
      let y = apply(x, diff)
      expect(y).to.eql([1, 3, 3, 5])
    })

    it('edit works on fixed index', () => {
      let x = [1, 3, 3, 5]
      let diff = [{
        kind: 'N',
        path: [1],
        rhs: 2
      },
      {
        kind: 'D',
        path: [2],
        lhs: 3
      },
      {
        kind: 'N',
        path: [3],
        rhs: 4
      },
      {
        kind: 'N',
        path: [1],
        rhs: 'a'
      },
      {
        kind: 'E',
        path: [1],
        lhs: 3,
        rhs: "hi"
      }]
      let y = apply(x, diff)
      expect(y).to.eql([1, 2, 'a', 'hi', 4, 5])
    })
  })

  describe('binary search', () => {
    it('test', () => {
      let x = [1, 2, 3, 4, 4, 5]
      let i = findIndexOf(x, 3)
      expect(i).to.equal(2)
    })

    it('test2', () => {
      let x = [1, 2, 4, 4, 4, 5]
      let i = findIndexOf(x, 4)
      expect(i).to.equal(4)
    })

    it('test3', () => {
      let x = [1, 2, 3, 5]
      let i = findIndexOf(x, 4)
      expect(i).to.equal(3)
    })

    it('non-inclusive', () => {
      let x = [1, 2, 3, 3, 5]
      let i = findIndexOf(x, 3, false)
      expect(i).to.equal(4)
    })
  })

  describe('revert', () => {
    let x = [1, 2, 3, 4, 5]
    let diff = [{
      kind: 'N',
      path: [1],
      rhs: 2
    },
    {
      kind: 'D',
      path: [2],
      lhs: 3
    },
    {
      kind: 'N',
      path: [3],
      rhs: 4
    }]
    let y = revert(x, diff)
    expect(y).to.eql([1, 3, 3, 5])
  })

  describe('inverse', () => {
    let x = [
      'x',
      'a',
      {
        b: [
        0,
        1,
        "hello",
        "!"
        ]
      },
      'c'
    ]
    let diff = [
    {
      kind: 'D',
      path: [0],
      lhs: 'x'
    },
    {
      kind: 'N',
      path: [1],
      rhs: 'd'
    },
    {
      kind: 'N',
      path: [1],
      rhs: 'c'
    },
    {
      kind: 'D',
      path: [1],
      lhs: 'a'
    },
    {
      kind: 'N',
      path: [2, 'b', 3],
      rhs: 'world'
    }]

    let y = apply(x, diff)
    let xprime = revert(y, diff)
    expect(xprime).to.eql(x)
  })

  describe('system', () => {
    it('works', () => {
      let a = {
        a: 'hello',
        b: 'world',
        c: [
          'c',
          ['porcupine', 3, undefined]
        ],
        d: undefined,
        e: {
          test: {
            fly: null
          }
        }
      }

      let b = {
        a: 'world',
        b: 'hello',
        c: [
          'c',
          [null, 'porcupine', 5, undefined],
          'd'
        ],
        d: {
          hello: 'world'
        },
        e: {
          hah: {
            whatabout: null
          }
        }
      }

      let d = diff(a, b)
      expect(apply(a, d)).to.eql(b)
      expect(revert(b, d)).to.eql(a)
    })
  })
}
