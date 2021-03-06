# vue-listen
[![Build Status](http://travis-ci.org/zhongxingdou/vue-listen.png)](http://travis-ci.org/zhongxingdou/vue-listen)
[![NPM version](https://badge.fury.io/js/vue-listen.png)](http://badge.fury.io/js/vue-listen)

## Install

```bash
npm install vue-listen --save
```

## Usage

```js
import Vue from 'vue'
import VueListen from 'vue-listen'

Vue.use(VueListen)

let vm = new Vue({
  data: {
    user: {
      name: 'hal'
    }
  },
  methods: {
    nameWatcher (val, oldVal) {
      console.info(oldVal + ' --> ' + val)
    }
  },
  listen: {
    user: {
      handler: function (val, oldVal, path) {
        console.info(val)
        console.info(oldVal)
        console.info(path.absolute)
        console.info(path.relative)
      },
      deep: true
    },
    'user.name': 'nameWatcher'
  }
})

vm.name = 'hal.zhong'

// output:
// hal
// hal.zhong
// user.name
// .name
// hal --> hal.zhong

vm.$listen('user.name', function (val, oldVal, path) {
  conosle.info(val)
})
```
