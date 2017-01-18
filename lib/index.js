function deepWatch(vm, obj, handler, path) {
  let isA = Array.isArray(obj)
  let isO = !isA && typeof(obj) === 'object'

  let unWatch = vm.$watch(path, function (val, oldVal) {
    if (typeof val === 'object' && val) {
      unWatch()
      deepWatch(vm, val, handler, path)
    }

    handler(val, oldVal, path)
  })


  if (isO) {
    for(let p in obj) {
      let objP = obj[p]
      deepWatch(vm, objP, handler, path + '.' + p)
    }
  }
}

export default {
  install: function (vue) {
    vue.prototype.$listen = function (exp, handler, option = {}) {
      let vm = this
      let deep = option.deep

      let $get = vm.$get ? vm.$get.bind(vm) : function (path) {
        return vue.util.parsePath(path)(vm)
      }

      if (typeof handler === 'string') {
        handler = $get(handler)
      }

      if (!deep) {
        vm.$watch(exp, function (val, oldVal) {
          handler(val, oldVal)
        })
      } else {
        let val = $get(exp)
        deepWatch(vm, val, function (val, oldVal, path) {
          handler(val, oldVal, {
            absolute: path,
            relative: path.substr(exp.length)
          })
        }, exp)
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
