import * as debug from './debug'

export function shallowClone(val) {
  if (typeof val === 'object') {
    if (val === null) {
      return val
    }
    else if (Array.isArray(val)) {
      return [].concat(val)
    }
    else {
      return Object.assign(Object.create(Object.getPrototypeOf(val)), val)
    }
  }
  else {
    return val
  }
}

export function deepClone(val) {
  if (typeof val === 'object') {
    if (val === null) {
      return null
    }
    else if (Array.isArray(val)) {
      return val.map((element) => deepClone(element))
    }
    else {
      let keys = Object.keys(val)
      let clone = Object.create(Object.getPrototypeOf(val))
      for (let key of keys) {
        clone[key] = deepClone(val[key])
      }
      return clone
    }
  }
  else {
    return val
  }
}

function deepEqualsObject(lhs, rhs) {
  let unionKeys = Object.keys(Object.assign({}, lhs, rhs))

  for (let key of unionKeys) {
    if (!lhs.hasOwnProperty(key)) {
      return false
    }
    else if (!rhs.hasOwnProperty(key)) {
      return false
    }
    else {
      if (!deepEquals(lhs[key], rhs[key])) {
        return false
      }
    }
    return true
  }
}

function deepEqualsArray(lhs, rhs) {
  if (lhs.length !== rhs.length)
    return false
  for (let i = 0; i < lhs.length; i++) {
    if (!deepEquals(lhs[i], rhs[i]))
      return false
  }
  return true
}

export function deepEquals(lhs, rhs) {
  if (Object.is(lhs, rhs)) {
    return true
  }
  else if (typeof lhs !== typeof rhs) {
    return false
  }
  else if (typeof lhs === 'object') {
    if (lhs === null || rhs === null) {
      return false
    }
    else if (Object.getPrototypeOf(lhs) !== Object.getPrototypeOf(rhs)) {
      return false
    }
    else if (Array.isArray(lhs)) {
      return deepEqualsArray(lhs, rhs)
    }
    else {
      return deepEqualsObject(lhs, rhs)
    }
  }
  else {
    return false
  }
}

function diffGeneric(lhs, rhs, path) {
  return [{
    kind: 'E',
    path: path,
    lhs: lhs,
    rhs: rhs
  }]
}

function diffObject(lhs, rhs, path) {
  let diffs = []
  let unionKeys = Object.keys(Object.assign({}, lhs, rhs))

  for (let key of unionKeys) {
    if (!lhs.hasOwnProperty(key)) {
      diffs.push({
        kind: 'N',
        path: path.concat(key),
        rhs: rhs[key]
      })
    }
    else if (!rhs.hasOwnProperty(key)) {
      diffs.push({
        kind: 'D',
        path: path.concat(key),
        lhs: lhs[key]
      })
    }
    else {
      diffs.push(...diff(lhs[key], rhs[key], path.concat(key)))
    }
  }
  return diffs
}

// Implementing LCS (https://en.wikipedia.org/wiki/Longest_common_subsequence_problem)
// for array diff-ing is hugely inefficient and largely useless for the redux
// use case. Most redux reducers only insert or delete one element from an
// array. Therefore, this algorithm checks if the values are Object.is()
// equal; if not, it looks for whether the element in question was added or
// removed from the array. If all this fails, it will do a dumb position based diff.
function diffArray(lhs, rhs, path) {
  let diffs = []
  let lhsIndex = 0
  let rhsIndex = 0
  while (lhsIndex < lhs.length || rhsIndex < rhs.length) {
    let left = lhs[lhsIndex]
    let right = rhs[rhsIndex]
    if (lhsIndex >= lhs.length) {
      diffs.push({
        kind: 'N',
        path: path.concat(rhsIndex),
        rhs: right
      })
      rhsIndex++;
    }
    else if (rhsIndex >= rhs.length) {
      diffs.push({
        kind: 'D',
        path: path.concat(lhsIndex),
        lhs: left
      })
      lhsIndex++
    }
    else if (Object.is(left, right)) {
      lhsIndex++
      rhsIndex++
    }
    else if (lhsIndex+1 < lhs.length && Object.is(right, lhs[lhsIndex+1])) {
      diffs.push({
        kind: 'D',
        path: path.concat(lhsIndex),
        lhs: left
      })
      lhsIndex++
    }
    else if (rhsIndex+1 < rhs.length && Object.is(left, rhs[rhsIndex+1])) {
      diffs.push({
        kind: 'N',
        path: path.concat(rhsIndex),
        rhs: right
      })
      rhsIndex++;
    }
    else {
      diffs.push(...diff(left, right, path.concat(lhsIndex)))
      lhsIndex++
      rhsIndex++
    }
  }
  return diffs
}

export function diff(lhs, rhs, path = []) {
  if (Object.is(lhs, rhs)) {
    return []
  }
  else if (typeof lhs !== typeof rhs) {
    return diffGeneric(lhs, rhs, path)
  }
  else if (typeof lhs === 'object') {
    if (lhs === null || rhs === null) {
      return diffGeneric(lhs, rhs, path)
    }
    else if (Object.getPrototypeOf(lhs) !== Object.getPrototypeOf(rhs)) {
      return diffGeneric(lhs, rhs, path)
    }
    else if (Array.isArray(lhs)) {
      return diffArray(lhs, rhs, path)
    }
    else {
      return diffObject(lhs, rhs, path)
    }
  }
  else {
    return diffGeneric(lhs, rhs, path)
  }
}

function createPath(arrPath, len) {
  if (len === undefined)
    len = arrPath.length
  return arrPath.slice(0, len).join('.');
}

function parsePath(strPath) {
  return strPath.split('.').map((x) => {
    let number;
    if ((number = parseInt(x)))
      return number;
    else
      return x;
  })
}

export function findIndexOf(arr, val, inclusive = true) {
  let low = 0
  let hig = arr.length
  let index
  while (low <= hig) {
    index = Math.floor((hig + low) / 2)
    let comp = arr[index]
    if (val < comp) {
      hig = index - 1
    }
    else if (comp < val) {
      low = index + 1
    }
    else {
      break;
    }
  }
  if (inclusive) {
    while (arr[index] < val || arr[index + 1] === val) {
      index++
    }
  }
  else {
    // get the index directly following target value
    while (arr[index] <= val) {
      index++
    }
  }
  return index
}

function insertCacheChild(cache, childKey, modified) {
  if (modified === undefined) modified = false
  if (!cache.children) {
    cache.children = { [childKey]: { modified: modified } }
  }
  else if (!cache.children[childKey]) {
    cache.children[childKey] = { modified: modified }
  }
  return cache.children[childKey]
}

function applyArrayDiff(base, diff, cache, curPathIndex, revert = false) {
  let {kind, path} = diff

  let origIndex = path[curPathIndex]

  if (!Array.isArray(base)) {
    debug.log("ERROR: Array operation on non-array")
    return base
  }

  if (!cache.N)
    cache.N = []
  if (!cache.D)
    cache.D = []

  if (!cache.modified) {
    cache.modified = true
    base = shallowClone(base)
  }

  let numInserts = findIndexOf(cache.N, origIndex, false)
  let numDeletes = findIndexOf(cache.D, origIndex, false)

  let targetIndex = origIndex
  if (!revert) {
    targetIndex = origIndex + numInserts - numDeletes
  }

  if (targetIndex > base.length - (kind === 'N' ? 0 : 1)) {
    debug.log("ERROR: array index", origIndex, "is out of bounds")
    return base
  }

  if (kind === 'N') {
    cache.N.splice(numInserts, 0, origIndex)
    base.splice(targetIndex, 0, diff.rhs)
  }
  else if (kind === 'D') {
    if (!deepEquals(diff.lhs, base[targetIndex])) {
      debug.log("ERROR: Expected lhs", base[targetIndex], "to equal", diff.lhs)
    }
    cache.D.splice(numDeletes, 0, origIndex)
    base.splice(targetIndex, 1)
  }
  return base
}

function applyDiff(base, diff, cache, curPathIndex, revert = false) {
  let {kind, path} = diff

  if (curPathIndex === path.length) {
    if (kind === 'E') {
      if (!deepEquals(diff.lhs, base)) {
        debug.log("ERROR: Expected lhs", base, "to equal", diff.lhs)
      }
      let cacheKeys = Object.keys(cache)
      for (let key of cacheKeys) {
        delete cache[key]
      }
      cache.modified = true
      return diff.rhs
    }
    else if (kind === 'N' || kind === 'D') {
      debug.log("ERROR: Add or Delete diff cannot exist on root path")
      return base
    }
  }
  else if (curPathIndex === path.length - 1 &&
           (kind === 'N' || kind === 'D')) {
    let index = path[curPathIndex]
    if (typeof index === 'number') {
      return applyArrayDiff(base, diff, cache, curPathIndex, revert)
    }
    else {
      if (typeof base !== 'object' || base === null) {
        debug.log("ERROR: expected type", base, "to be non-null object")
        return base
      }
      if (kind === 'N') {
        if (Object.prototype.hasOwnProperty.call(base, index)) {
          debug.log("ERROR: base", base, "already has property", index)
        }

        insertCacheChild(cache, index, true)
        if (cache.modified) {
          base[index] = diff.rhs
          return base
        }
        else {
          cache.modified = true
          let clone = shallowClone(base)
          clone[index] = diff.rhs
          return clone
        }
      }
      else if (kind === 'D') {
        if (!Object.prototype.hasOwnProperty.call(base, index)) {
          debug.log("ERROR: base", base, "is missing property", index)
          return base
        }
        if (!deepEquals(diff.lhs, base[index])) {
          debug.log("ERROR: Expected lhs", base[index], "to equal", diff.lhs)
        }

        if (cache.children && cache.children[index]) {
          delete cache.children[index]
        }
        if (cache.modified) {
          delete base[index]
          return base
        }
        else {
          cache.modified = true
          let clone = shallowClone(base)
          delete clone[index]
          return clone
        }
      }
    }
  }
  else {
    let index = path[curPathIndex]
    let targetIndex = index

    if (typeof index === 'number') {
      if (!cache.N) {
        cache.N = []
      }
      if (!cache.D) {
        cache.D = []
      }
      // fixup index
      let numInserts = findIndexOf(cache.N, index, false)
      let numDeletes = findIndexOf(cache.D, index, false)

      if (!revert) {
        targetIndex = index + numInserts - numDeletes
      }
    }

    if (!Object.prototype.hasOwnProperty.call(base, targetIndex)) {
      debug.log("ERROR: base", base, "is missing property", index)
      return base
    }

    insertCacheChild(cache, index)
    if (cache.modified) {
      base[targetIndex] = applyDiff(base[targetIndex], diff, cache.children[index], curPathIndex + 1, revert)
      return base
    }
    else {
      cache.modified = true
      let clone = shallowClone(base)
      clone[targetIndex] = applyDiff(base[targetIndex], diff, cache.children[index], curPathIndex + 1, revert)
      return clone
    }
  }
}

export function invertDiffs(diffs) {
  return diffs.map((d) => {
    switch (d.kind) {
      case 'N':
        return {
          kind: 'D',
          path: d.path,
          lhs: d.rhs
        }
      case 'D':
        return {
          kind: 'N',
          path: d.path,
          rhs: d.lhs
        }
      case 'E':
        return {
          kind: 'E',
          path: d.path,
          lhs: d.rhs,
          rhs: d.lhs
        }
      default:
        debug.log("ERROR: Undefined diff type", d)
        return undefined
    }
  })
}

function sortDiffs(diffs) {
  for (let i = 0; i < diffs.length; i++) {
    diffs[i].keyIndex = i
  }
  diffs.sort((a, b) => {
    let len = Math.max(a.path.length, b.path.length)
    for (let i = 0; i < len; i++) {
      if (i >= a.path.length) {
        return -1
      }
      else if (i >= b.path.length) {
        return 1
      }
      else {
        let pathA = a.path[i]
        let pathB = b.path[i]
        if (typeof pathA !== typeof pathB) {
          return a.keyIndex - b.keyIndex
        }
        else if (pathA !== pathB) {
          if (typeof pathA === 'number') {
            return pathA - pathB
          }
          else {
            return pathA.localeCompare(pathB)
          }
        }
      }
    }
    return a.keyIndex - b.keyIndex
  })
}

export function apply(base, diffs) {
  let cache = {}
  for (let d of diffs) {
    base = applyDiff(base, d, cache, 0, false)
  }
  return base
}

export function revert(base, diffs) {
  let cache = {}
  for (let d of invertDiffs(diffs)) {
    base = applyDiff(base, d, cache, 0, true)
  }
  return base
}
