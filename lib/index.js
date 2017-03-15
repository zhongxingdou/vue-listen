let debug = false

function log (msg) {
  if (debug === true) {
    console.log(msg)
  }
}

function clearDescendencePath (map, mapKeys, path) {
  mapKeys.forEach(p => {
    if (p !== path && p.startsWith(path)) {
      deleteMapPath(map, p)
    }
  })
}

function deleteMapPath (map, path) {
  let info = map[path]
  info.unWatch()

  delete map[path]

  log('delete map: ' + path)
}

function updateMap(map, path, val) {
  let info = map[path]
  if (info) {
    info.type = Array.isArray(val) ? 'array' : typeof(val)
    info.isNull = val === null || val === undefined
    log('update map: ' + path)
  }
}

function setMap(map, path, value, unWatch) {
  if (map[path]) return

  map[path]= {
    type: Array.isArray(value) ? 'array' : typeof(value),
    unWatch: unWatch,
    isNull: value === null || value === undefined
  }
  log('set map: ' + path)
}

function clearPathForArray (map, mapKeys, path, array) {
  let l = array.length

  let itemKeys = []
  mapKeys.forEach((p, i) => {
    let index = p.substring(p.indexOf('[') + 1, p.indexOf(']'))
    if (parseInt(index) >= l) {
      mapKeys.splice(i, 1)
      deleteMapPath(map, p)
    } else {
      if (!itemKeys[index]) {
        itemKeys[index] = [p]
      } else {
        itemKeys[index].push(p)
      }
    }
  })

  array.forEach((item, i) => {
    if (itemKeys[i]) {
      clearPath(map, itemKeys[i], path + '[' + i + ']', item)
    }
    delete itemKeys[i]
  })
}

function clearPathForObject(map, mapKeys, path, val) {
  let members = Object.keys(val)

  mapKeys.forEach(p => {
    if (!members.some(prop => p.startsWith(path + '.' + prop))) {
      deleteMapPath(map, p)
    }
  })

  for(let prop in val) {
    let propPath = path + '.' + prop
    let propKeys = mapKeys.filter(k => k.startsWith(propPath))
    if (propKeys.length) {
      clearPath(map, propKeys, propPath, val[prop])
    }
  }
}

function clearPath (map, mapKeys, path, val) {
  mapKeys = mapKeys.filter(p => p !== path)

  let info = map[path]
  let oldType = info.type
  let oldIsNull = info.isNull
  let oldIsObj = !oldIsNull && oldType === 'object'
  let oldIsArray = oldType === 'array'

  let newType = Array.isArray(val) ? 'array' : typeof(val)
  let newIsNull = val === null || val === undefined
  let newIsObj = !newIsNull && newType === 'object'
  let newIsArray = newType === 'array'

  if (!mapKeys.length) {
    return
  }

  if (newIsArray && oldIsArray) {
    return clearPathForArray(map, mapKeys, path, val)
  }

  if (newIsObj && oldIsObj) {
    return clearPathForObject(map, mapKeys, path, val)
  }

  if (oldIsObj || oldIsArray) {
    return clearDescendencePath(map, mapKeys, path)
  }
}

function buildWatchHandler (deepWatchOption) {
  let { path } = deepWatchOption
  return function (val, oldVal) {
    let mapKeys = Object.keys(this._listenPath)
      .filter(p => p !== path && p.startsWith(path))

    if (mapKeys.length) {
      clearPath(this._listenPath, mapKeys, path, val)
    }

    if (typeof val === 'object' && val) {
      deepWatch({
        ...deepWatchOption,
        vm: this,
        value: val,
        onlyDescendence: false
      })
    }

    updateMap(this._listenPath, path, val)

    deepWatchOption.handler(val, oldVal, path)
  }
}

function deepWatch(option) {
  let { vm, path, onlyDescendence, watchOption} = option
  let obj = option.value
  let isA = Array.isArray(obj)
  let isO = !isA && typeof(obj) === 'object'

  if (!onlyDescendence) {
    let watchTarget = path.indexOf('[') >= 0
      ? new Function('return this.' + path)
      : path

    if (!vm._listenPath[path]) {
      let unWatch = vm.$watch(
        watchTarget,
        buildWatchHandler(option),
        watchOption
      )
      setMap(vm._listenPath, path, obj, unWatch)
    }
  }

  if (isA) {
    obj.forEach((item, i) => {
      deepWatch({
        ...option,
        path: path + '[' + i + ']',
        value: item,
        onlyDescendence: false
      })
    })
  } else if (isO) {
    for(let p in obj) {
      deepWatch({
        ...option,
        path: path + '.' + p,
        value: obj[p],
        onlyDescendence: false
      })
    }
  }
}

export default {
  install: function (vue, option = {}) {
    debug = !!option.debug

    vue.prototype.$listen = function (exp, handler, option = {}) {
      let vm = this
      let deep = option.deep
      var onlyDescendence = deep && option.onlyDescendence
      let option2 = Object.assign({}, option)
      delete option2.deep
      delete option2.onlyDescendence

      if (typeof handler === 'string') {
        handler = vm[handler]
      }

      if (deep) {
        if (!vm._listenPath) {
          vm._listenPath = {}
        }

        let val = vm.$get
          ? vm.$get(exp)
          : (new Function('return this.' + exp)).call(vm, exp)

        deepWatch({
          vm: vm,
          path: exp,
          value: val,
          handler: function (val, oldVal, path) {
            handler(val, oldVal, {
              absolute: path,
              relative: path.substr(exp.length)
            })
          },
          watchOption: option2,
          onlyDescendence
        })
      } else {
        vm.$watch(exp, function (val, oldVal) {
          handler(val, oldVal)
        }, option2)
      }
    }

    vue.mixin({
      created () {
        let vm = this
        let option = this.$options.listen
        if (!option) return

        for (let exp in option) {
          let val = option[exp]

          switch (typeof val) {
            case 'function':
            case 'string':
              vm.$listen(exp, val)
              break
            case 'object':
              vm.$listen(exp, val.handler, val)
              break
          }
        }
      }
    })
  }
}
