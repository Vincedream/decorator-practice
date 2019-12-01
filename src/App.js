import React from 'react';
import './App.css';

function toast(message) {
  alert(message)
}

function setUserName(name) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve({data: `userName is ${name}`})
      } else {
        reject(new Error('接口错误啦~'))
      }
    }, 200)
  })
}

// function sayAge(target, name, descriptor) {
//   let sayName = descriptor.value;
//   descriptor.value = function() {
//     sayName.apply(this);
//     console.log('age: 12');
//   }
// }

// class Cat {
//   name = 'vince'
//   @sayAge
//   sayName() {
//     console.log(this.name)
//   }
// }

function operateToast(target, key, descriptor) {
  const originFunc = descriptor.value;

  descriptor.value = function() {
    return originFunc.apply(this, arguments).then(res => {
      toast('操作成功')
      return res
    }).catch(err => {
      toast('操作失败')
      return err
    })
  }
  return descriptor
}

class UserApi {
  @operateToast
  static setUserName(name) {
    return setUserName(name)
  }
}

function updateable(isUpdateable) {
  return function(target) {
    target.isUpdateable = isUpdateable;
  }
}

function testDecorator(target, name, descriptor) {
  console.log(target)
  console.log(name)
  console.log(descriptor)
}

@updateable(true)
class DesignerApi {
  @testDecorator
  getUserDate() {
    console.log('xxx')
  }
}

class App extends React.Component {
  componentDidMount() {
    // let catA = new Cat();
    // catA.sayName();
    // UserApi.setUserName('vince')
    // console.log(UserApi.xxx)
    // console.log(DesignerApi.isUpdateable)
  }

  render() {
    return (
      <div>es7 装饰器</div>
    )
  }
}


export default App;
