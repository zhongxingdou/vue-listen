function deepWatch(vm, obj, handler, path, onlyDescendence, option) {
  let isA = Array.isArray(obj)
  let isO = !isA && typeof(obj) === 'object'

  if (!onlyDescendence) {
    let watchTarget = path

    if (path.indexOf('[') >= 0) {
      watchTarget = new Function('return this.' + path)
    }

    let unWatch = vm.$watch(watchTarget, function (val, oldVal) {
      if (typeof val === 'object' && val) {
        unWatch()
        deepWatch(vm, val, handler, path)
      }

      handler(val, oldVal, path)
    }, option)
  }

  if (isA) {
    obj.forEach((item, i) => {
      deepWatch(vm, item, handler, path + '[' + i + ']', false, option)
    })
  } else if (isO) {
    for(let p in obj) {
      let objP = obj[p]
      deepWatch(vm, objP, handler, path + '.' + p, false, option)
    }
  }
}

export default {
  install: function (vue) {
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
        let val = vm[exp]
        deepWatch(vm, val, function (val, oldVal, path) {
          handler(val, oldVal, {
            absolute: path,
            relative: path.substr(exp.length)
          })
        }, exp, onlyDescendence, option2)
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
