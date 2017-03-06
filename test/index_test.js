import sinon from 'sinon'
import chai from 'chai'
let assert = chai.assert

import Vue from 'vue'
import VueListen from '../'

function async (done, fn) {
  setTimeout(function () {
    fn()
    done()
  }, 0)
}

describe('index', () => {
  Vue.use(VueListen)

  it('should add $listen() to Vue', () => {
    let vm = new Vue()
    assert.isFunction(vm.$listen)
  })

  it('should $listen() normal', (done) => {
    let listener = sinon.spy()
    let vm = new Vue({
      data: {
        name: 'hal'
      }
    })

    vm.$listen('name', listener)
    vm.name = 'hal.zhong'

    async(done, () => assert.equal(listener.called, true))
  })

  it('should invoke listener', (done) => {
    let listener = sinon.spy()

    let vm = new Vue({
      data: {
        name: 'hal'
      },
      listen: {
        name: listener
      }
    })

    vm.name = 'jerry'

    async(done, () => assert.equal(listener.called, true))
  })

  it('should provide path info as parameter to listener', (done) => {
    let watcher2 = sinon.spy()

    let vm = new Vue({
      data: {
        user: {
          name: 'hal'
        }
      },
      listen: {
        user: {
          handler: watcher2,
          deep: true
        }
      }
    })

    vm.user.name = 'jerry'

    let path = {absolute: 'user.name', relative: '.name'}
    async(done, () => {
      assert.isOk(watcher2.calledWithMatch('jerry', 'hal', path))
    })
  })

  it('should invoke method if listener be a string of method name', (done) => {
    let vm = new Vue({
      data: {
        user: {
          name: 'hal'
        }
      },
      methods: {
        nameWatcher (val, oldVal) {
          assert.equal(val, 'hal.zhong')
          assert.equal(oldVal, 'hal')
          done()
        }
      },
      listen: {
        'user.name': 'nameWatcher'
      }
    })

    vm.user.name = 'hal.zhong'
  })

  it('should watch array item normal', (done) => {
    let vm = new Vue({
      data: {
        model: {
          users: [
            {name: 'hal'},
            {name: 'jerry'}
          ]
        }
      },

      listen: {
        'model.users': {
          handler (val, oldVal, path) {
            assert.equal(path.absolute, 'model.users[0].name')
            done()
          },
          deep: true,
          onlyDescendence: true
        }
      }
    })

    vm.model.users[0].name = 'hal.zhong'
  })

  describe('option.onlyDescendence', () => {
    it('should not trigger listener when target reference changed', (done) => {
      let called = false
      let vm = new Vue({
        data: {
          user: {
            name: 'hal'
          }
        },
        methods: {
          nameWatcher () {
            called = true
          }
        },
        listen: {
          'user.name': {
            handler: 'nameWatcher',
            deep: true,
            onlyDescendence: true
          }
        }
      })

      vm.user = {name: 'ok'}

      vm.$nextTick(() => {
        assert.equal(called, false)
        done()
      })
    })

    it('should trigger listener when target property changed', (done) => {
      let vm = new Vue({
        data: {
          user: {
            name: 'hal'
          }
        },
        methods: {
          nameWatcher () {
            done()
          }
        },
        listen: {
          'user.name': {
            handler: 'nameWatcher',
            deep: true,
            onlyDescendence: false
          }
        }
      })

      vm.user.name = 'hal.zhong'
    })
  })
})
