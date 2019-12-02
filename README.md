## 前言

Decorator 目前还处于 Stage 2 阶段，也就是草案是规范的第一个版本，与最终标准中包含的特性不会有太大差别，尽管还没正式发布，但是 Decorator 在开发中的使用还是较为普遍的，例如 Redux 中的 `@connect`、React-Router 中的 `@withRouter` 等等，本篇博客主要讲解了 Decorator 的基础知识，以及在实际开发中接口（api）逻辑层中的实践。

## 背景

日常开发中，经常会写很多重复性的代码，比如每次请求发回来，如果请求错误，那么要在 `.catch` 做一些 toast 的提示，还有一些需要注入到请求体中的监控逻辑，如记录请求时间、成功率，需要向后台发送这些监控日志，这会让函数内部充满各种与**请求**无关的逻辑，是否有一些办法能够简化代码，对一些固有模式做一些封装呢？

### 重复代码

这里我们列出一个很简单的例子，相信很多小伙伴在开发中都会写这样的代码：

```
// 这里将与 user 有关的接口都放在 UserApi 类中
class UserApi {
  // @optionLog
  static setUserName(name) {
    return setUserName(name)
  }
}

// 发送请求，成功/错误都分别 toast 提示
UserApi.setUserName('vince').then(res => {
  toast('设置成功')
}).catch(err => {
  toast('设置失败，请重试')
})
```

看似很平常的代码，如果接口非常多，每个接口函数都需要加入这套 toast 提示逻辑，这就出现了代码中的坏味道：**重复代码**。

### 使用装饰器后

这里我们先不讨论 Decotator 的用法，直接看使用后的样子：

```
function operateToast(target, key, descriptor) {
  const originFunc = descriptor.value;

  descriptor.value = function() {
    return originFunc.apply(this, arguments).then(res => {
      toast('操作成功')
      return res
    }).catch(err => {
      toast('操作失败')
      throw err
    })
  }
  return descriptor
}

class UserApi {
  // 加入装饰器
  @operateToast
  static setUserName(name) {
    return setUserName(name)
  }
}

// 调用接口
UserApi.setUserName('vince')
```

使用装饰器后，我们只需要在定义方法的时候加上 `@xxx` 便能**无痕**地注入 toast 提示逻辑，下面我们将一步步介绍装饰器的用法和更多的实践。

## 装饰器入门

装饰器能够只能对类、类属性起作用，改写其特性或者执行逻辑，可以讲一些固有的模式注入其中。那为什么不能用在函数身上呢，因为存在函数提升，由于不是本篇文章的重点，可以看阮一峰老师对其的的解释：[为什么装饰器不能用于函数？](http://es6.ruanyifeng.com/#docs/decorator#%E4%B8%BA%E4%BB%80%E4%B9%88%E8%A3%85%E9%A5%B0%E5%99%A8%E4%B8%8D%E8%83%BD%E7%94%A8%E4%BA%8E%E5%87%BD%E6%95%B0%EF%BC%9F)。

### 准备工作

本篇文章主要讲解装饰器的内容，不赘述如何配置 babel，因此我们直接使用 `create-react-app` 创建一个前端项目，并且安装装饰器对应的 babel 转译插件。

1. 初始化项目

``` bash
create-react-app  es7-decorator-practice
cd es7-decorator-practice
npm run eject
```

2. 安装插件

```
npm i @babel/plugin-proposal-decorators -D
```

3. 更改 babel 配置

打开 `package.json` 文件，增加以下 babel 配置：

```
  "babel": {
    "presets": [
      "react-app"
    ],
    "plugins": [
      [
        "@babel/plugin-proposal-decorators",
        {
          "legacy": true
        }
      ]
    ]
  },
```

4. 运行项目

配置完成后，我们加入一些装饰器的代码，测试是否能正常运行

```
// App.js
function sayAge(target, name, descriptor) {
  let sayName = descriptor.value;
  descriptor.value = function() {
    sayName.apply(this);
    console.log('age: 12');
  }
}

class Cat {
  name = 'vince'
  @sayAge
  sayName() {
    console.log(this.name)
  }
}

class App extends React.Component {
  componentDidMount() {
    let catA = new Cat();
    catA.sayName();
  }
  render() {
    ...
  }
}
export default App;
```

运行 `npm start` ，查看 Console 中，是否输出

``` bash
>>> vince
>>> age: 12
```

### 什么是装饰器

装饰器是一种与 class （类）相关的语法，用来修改类和类方法、属性的**函数**，减少书写重复性的代码，使得代码逻辑更易读，避免过多与**主逻辑**无关的代码注入其中。

### 类的装饰器

装饰器可以用来修改整个类，例如，有些类是不在维护的，有些类是持续维护的，那么我们可以这样表示:

```
@updateable(true)
class DesignerApi {
    ...
}

console.log(DesignerApi.isUpdateable) // >>> true
```

这个装饰器的实现方式也很简单：

```
function updateable(isUpdateable) {
  return function(target) {
    target.isUpdateable = isUpdateable;
  }
}
```

这里包两层函数是为了给装饰器增加**配置**参数，我们可以在 `updateable` 函数参数添加各种配置，而真正的装饰器逻辑是在内部 `return` 的函数中，这里的 `target` 参数指的是 `DesignerApi` 类本身。


### 类方法装饰器

对类方法的装饰器就是最上面的例子，我们先来看看该装饰器中的三个参数分别指的是什么：

```
function testDecorator(target, name, descriptor) {
  console.log(target)
  console.log(name)
  console.log(descriptor)
}

class DesignerApi {
  @testDecorator
  getUserDate() {
    console.log('xxx')
  }
}
```

输出的结果如下图：

![image](http://static4.vince.xin/WeChat9549fe85075073de653b4cf2f144f90f.png)

- **target**：该类原型对象，即 `DesignerApi.prototype`，注意这里与上述**类装饰器**不一样，它指的是类的本身，类方法装饰指的是类原型。

- **name**：指的是所装饰函数名

- **descriptor**： 指的是该属性的描述对象，注意 `target.value` 指的是该类方法本身。

理清楚这些问题后，我们将会讲解几个在**接口层**逻辑中的装饰器方法。

## 在接口逻辑中的实践

接口层逻辑方法模式都差不多，首先是发送请求，接收请求，判断请求是否成功，分别对其做相应的提示反馈，并且部分接口需要监控其具体行为数据、做一些容错，这时候接口逻辑就需要注入较多与接口无关的代码，显得有些**浮肿**，我们将针对这些问题，使用装饰器来优化。

### 接口时间监控

**需求**：每个接口都需要记录耗时时间，并且需要向后台发送该接口的唯一id和耗时时间。

```
// 装饰器函数
function logTime(apiId) {
  return function(target, key, descriptor) {
    const originFunc = descriptor.value;
    descriptor.value = function() {
      const startTime = new Date().valueOf();
      return originFunc.apply(this, arguments).then(res => {
        const endTime = new Date().valueOf();
        const spendTime = endTime - startTime;
        console.log('apiId: ',apiId);
        console.log('spendTime: ', spendTime)
        // 向后台发送一些数据监控
        // logApi.logData(apiName, spendTime);
        return res;
      }).catch(err => {
          throw err
      })
    }
    return descriptor
  }
}

// 使用装饰器
class UserApi {
  @logTime('ididid')
  static setUserName(name) {
    return setUserName(name)
  }
}

// 使用接口
UserApi.setUserName('vince')
```

**注意**：这里我们使用了一个函数包裹着装饰器函数，这样的目的是为了添加装饰器自定义参数配置。

这样我们就能毫无**侵入性**地将监控逻辑注入到接口中。

### 接口 Toast 提醒

**需求**：在变更操作较多的页面，往往需要写很多`post`类型接口，操作成功/失败都需要给用户反馈，并且根据接口类型不同，反馈的文案也不同。

```
// 装饰器函数
function operateToast(successInfo = '操作成功', errorInfo = '操作失败，请重试') {
  return function (target, key, descriptor) {
    const originFunc = descriptor.value;
  
    descriptor.value = function() {
      return originFunc.apply(this, arguments).then(res => {
        toast(successInfo)
        return res
      }).catch(err => {
        toast(errorInfo)
        throw err
      })
    }
    return descriptor
  }
}

// 使用装饰器
class UserApi {
  @operateToast('设置用户名称成功', '后端太垃圾了，设置用户名称接口挂了')
  static setUserName(name) {
    return setUserName(name)
  }

  @operateToast('设置用户年龄成功', '后端太垃圾了，接口又挂了')
  static setUserAge(age) {
    return setUserAge(age)
  }
}

// 调用接口
UserApi.setUserName('vince')
UserApi.setUserAge(12)
```

假如把所以的 `toast` 提示都放入接口逻辑中，将会有一大片冗余的**与接口无关的提示逻辑**，装饰器完美地给我们解决了这个问题，省时省力代码还清晰易懂。

### 接口容错发送

**需求**：在一些不可抗拒的条件下，比如用户网络状况差、接口存在较高的错误率，这时候需要对接口做特殊的处理，假如接口挂了，需要隔 1000ms 再次发送请求，重复发送 3 次，3 次都失败，则接口最终失败。

```
// 装饰器函数
function retryFunc(counts, times) {
  return function(target, name, descriptor) {
    const originFunc = descriptor.value;
    descriptor.value = function() {
      let count = 1;
      return new Promise((resolve, reject) => {
          const retry = () => {
              console.log('开始请求')
              return originFunc().then(res => {
                  resolve(res);
              }).catch(() => {
                  count++;
                  if (count > counts) {
                      reject(new Error('多次请求错误，请稍后再试'));
                      return;
                  }
                  console.log(`请求失败，第${count}次重试`)
                  setTimeout(() => {
                      retry();
                  }, times)
              })
          }
          retry();
      })
    }
    return descriptor
  }
}

// 使用装饰器
class UserApi {
  @retryFunc(3, 1000)
  static setUserName(name) {
    return setUserName(name)
  }
}

// 调用接口
UserApi.setUserName('vince')
```

由于情况特殊，该装饰器有些许复杂，不要被多个 `return` 搞昏了头脑，当然这种逻辑也可以写在接口函数中，但是无法很好的抽离出**重试**的逻辑。

### 多个装饰器共用

上述讲解了三个与接口逻辑相关的装饰器，很多情况下，我们需要使用多个装饰器，用法也很简单：

```
class UserApi {
  @logTime('ididid')
  @operateToast('设置用户名称成功', '后端太垃圾了，设置用户名称接口挂了')
  @retryFunc(3, 1000)
  static setUserName(name) {
    return setUserName(name)
  }

}
```

不过需要注意的是，在特殊情况下，不同顺序会造成不同的结果，这主要看装饰器的实现过程。

## 总结

本文没有详细讲解装饰器的每个细节，主要围绕着在接口逻辑层中遇到的场景来讲解具体的实践方案，装饰器能够简化开发流程，将固定模式代码封装到装饰器中，使得接口逻辑更加清晰简洁，当然只是给读者一个案例，还有更多场景需要读者结合自身情况去发掘装饰器的威力。

### 项目源码

[decorator-practice](https://github.com/Vincedream/decorator-practice)

### Refs

[阮一峰 ES6标准入门](https://es6.ruanyifeng.com/#docs/decorator)
