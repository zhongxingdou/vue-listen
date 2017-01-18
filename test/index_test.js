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

  it('should $listen normal', (done) => {
    let watcher = sinon.spy()
    let vm = new Vue({
      data: {
        name: 'hal'
      }
    })

    vm.$listen('name', watcher)
    vm.name = 'hal.zhong'

    async(done, () => assert.equal(watcher.called, true))
  })

  it('should invoke listener', (done) => {
    let watcher = sinon.spy()

    let vm = new Vue({
      data: {
        name: 'hal'
      },
      listen: {
        name: watcher
      }
    })

    vm.name = 'jerry'

    async(done, () => assert.equal(watcher.called, true))
  })

  it('should provide path info to watcher', (done) => {
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

  it('should invoke method which listened to data', (done) => {
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
})
