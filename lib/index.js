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
    vue.mixin({
      created () {
        let vm = this
        let option = this.$options.listen

        let $get = vm.$get ? vm.$get.bind(vm) : function (path) {
          return vue.util.parsePath(path)(vm)
        }

        for (let exp in option) {
          let expOpt = option[exp]
          if (typeof expOpt !== 'object') {
            expOpt = {
              handler: expOpt
            }
          }

          let handler = expOpt.handler
          if (typeof handler === 'string') {
            handler = $get(handler)
          }

          let deep = expOpt.deep
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
      }
    })
  }
}
