# NodeJS Event Manager

A NodeJS Event Manager using builtin NodeJS Events.

The main purpose of this package, is to facilitate the use of events, in a node JS  application.

It implements the same _"api"_ (_"interface"_) as [rabbitmq-event-manager](https://www.npmjs.com/package/rabbitmq-event-manager) so you can easily switch from NodeJS to RabbitMQ of vice-versa.

It can be usefull for testing purpose, but also in order to start quickly with nodeJS and if your application is getting bigger and you want to externalize some parts, you can deploy a RabittMQ and make your applications communicate together

## Install 

```
npm install nodejs-event-manager
```

Or with Yarn 

```
yarn add nodejs-event-manager
```

## Basic Example

* **Initialize** 
```js
import EventManager from 'nodejs-event-manager';
const myEventManager = new EventManager();
myEventManager.initialize()
    .then(()=>{
        /** Do something after initialization */
    })
    .catch((err)=> {
        /** An error occured while initialization */
    });
```

* **Consumer**
```js
import EventManager from 'nodejs-event-manager';
const myEventManager = new EventManager({appName:'CONSUMER');
myEventManager.on('MY_EVENT_NAME', async (payload)=>{
    console.log(payload);
});
```

* **Producer**
```js
import EventManager from 'nodejs-event-manager';
const myEventManager = new EventManager({appName:'PRODUCER_1'});

myEventManager.emit('MY_EVENT_NAME', payload);
```

> NOTE: :warning: A very good convention may be to prefix the name of the event with the emitter application name, for example : `PRODUCER_1.MY_EVENT_NAME` but it's not mandatory.

Then we can create new Consumer and listen the same event : 

```js
import EventManager from 'nodejs-event-manager';
const myEventManager = new EventManager({appName:'OTHER_CONSUMER');
myEventManager.on('MY_EVENT_NAME', async (payload)=>{
    console.log(payload);
});
```

## Options

Name | Type | Default | Description
---- | ---- | ---- | ---- 
appName | String | - | The name of the application (used for naming exchanges and queues).
metas | boolean or (function) | true | Weither or not to add `_metas` infirmations in the event, If a function this returned value, will become the  `_metas` object (see <Metas Informations>) 
logPrefix | string | [RABBITMQ] | The text that will be printed before the error log
logLevel | string | error | The log Level [(see winston logLevels)](https://github.com/winstonjs/winston#logging-levels) 
logTransportMode | string | console | Mute (no log), or output to console. Possible values are (_"console"_ or _"mute"_)

## Metas Informations

By defaut, some metas data are added to the payload : 

* guid : A unique id generated, to be able to debug for example, or for following the event.
* timestamp : A number of milliseconds elapsed since January 1, 1970 00:00:00 UTC. (`Date.now()`)
* name : A string which is the name of the emitted event.
* applicationName: The value of the application which emits the Event.

So if your payload is : 

```js
{
    userId:42
}
```

With Metas data it will be : 

```js
{
    _metas:{
        guid: '465e008c-d37f-4e31-b494-023e6d187946',
        name: 'MY_EVENT_NAME',
        timestamp: 1519211809934,
        applicationName: 'PRODUCER_1'
    },
    userId:42
}
```

You can remove metas informations by settings the option value "metas" to false.

You can also override the metas generation by giving a function as *metas* options value (on the emitter side only, as the event is generated there).

### With no metas

```js
import EventManager from 'rabbitmq-event-manager';
const myEventManagerWithNoMetas = new EventManager({
    url: 'amqp://localhost', 
    appName: 'PRODUCER_1',
    metas: false,
});
const payload = { userId:42 };
myEventManagerWithNoMetas.emit('MY_EVENT_NAME', payload);
// Payload will be 
// {
//    userId:42
// }
```

### Override Metas
```js
import EventManager from 'rabbitmq-event-manager';
const myEventManagerOverrideMetas = new EventManager({
    url: 'amqp://localhost', 
    appName: 'PRODUCER_1',
    metas: (sourceMetas) => {
        // sourceMetas contains the default metaa
        return {
            ...sourceMetas, 
            otherProperty:'MyValue'
        };
    },
});
const payload = { userId:42 };
myEventManagerOverrideMetas.emit('MY_EVENT_NAME', payload);
// Payload will be 
// {
//    _metas: {
//        guid : '465e008c-d37f-4e31-b494-023e6d187947'
//        name: 'MY_EVENT_NAME',
//        timestamp: 1519211809934,
//        otherProperty:'MyValue'
//    }
//    userId:42
// }
```