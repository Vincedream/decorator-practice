import React from 'react';
import './App.css';

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
    return (
      <div>es7 装饰器</div>
    )
  }
}


export default App;
