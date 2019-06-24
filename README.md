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

## DEAD LETTER QUEUE

From the RabbitMQ documenation, the [Dead Letter Exchange](https://www.rabbitmq.com/dlx.html) is a RabbitMQ Exchange, that is attached to a queue. And message in that queue can be _"dead-lettered"_ if the queue reach its *length limit*, or, if the messages has *expired* (TTL) and also if the message is *negatively acknowledged* with requeue option set to false.

By default, The Exchange `DEAD_LETTER_EXCHANGE` (and its bound queue `DEAD_LETTER_QUEUE`) is automatically created and attached to all queues.

The names of the queue and the exchange can be changed by setting the options properties.

See <Acknowledge / N-Acknowledge> to see how to send an event to the *Dead Letter Exchange* 

> :warning: Be carefull, if you change the names of the `DEAD_LETTER_EXCHANGE` and the `DEAD_LETTER_QUEUE`, remember that you will have to do it for all producers and all consumers, as they will all use the same RabbitMQ server.

## QUEUE NO QUEUE 

When an _Event Exchange_ is created, an exchange `NO_QUEUE_EXCHANGE` is created and a queue named `QUEUE_NO_QUEUE` is created and bound to it.

When an event is emitted to the _Event Exchange_ if the exchange has no queue bounded to it, all the messages are routed to the `NO_QUEUE_EXCHANGE`

The names of the queue and the exchange can be changed by setting the options properties.

> :warning: Be carefull, if you change the names of the `DEAD_LETTER_EXCHANGE` and the `DEAD_LETTER_QUEUE`, remember that you will have to do it for all producers and all consumers, as they will all use the same RabbitMQ server.


## Acknowledge / N-Acknowledge

The `return` statement at the end of the handler function, will tell RabbitMQ to _"acknowledge"_ the message.

You can _"negatively acknowledge"_ and **Requeue** the message by returning `false` (rejecting the Promise).

If you don't want to **requeue** the message you can simply throw an exception ...

### Acknowledge the message (remove from queue)

```js
import EventManager from 'rabbitmq-event-manager';
const myEventManager = new EventManager({url:'amqp://localhost'}, appName:'OTHER_CONSUMER');
myEventManager.on('MY_EVENT_NAME', async (payload)=>{
    return true; // the message will be acknoledge
    // or even
    // return;
    // or nothing
});
```

After the message is acknowledged, it will be removed from the queue and deleted.

### Negatively Acknowledge and Requeue the message

```js
import EventManager from 'rabbitmq-event-manager';
const myEventManager = new EventManager({url:'amqp://localhost'}, appName:'OTHER_CONSUMER');
myEventManager.on('MY_EVENT_NAME', async (payload)=>{
    return false; // the message will be acknoledge
    
});
```

### Negatively Acknowledge and Flush the message


```js
import EventManager from 'rabbitmq-event-manager';
const myEventManager = new EventManager({url:'amqp://localhost'}, appName:'OTHER_CONSUMER');
myEventManager.on('MY_EVENT_NAME', async (payload)=>{
    throw new Error('This will flush the message to DEAD LETTER QUEUE')
});
```

After the message is negatively acknowledged, it will be send to the Dead Letter Exhange, so in the queue DEAD_LETTER_QUEUE.

## NOTES :

### Should we integrate the application name in the event name 

In a world of *events* an event is fired, and some listeners will listen some events.
So with events sent by "Application", if we have an Application `UserAdminApp` which will send the event 'USER_CREATED', and we have an other application (WelcomeEmail) (or service) wanted to send on email to new users ... 
So let's define that  `WelcomeEmail` is listening USER_CREATED, it should knows that the event was fired by the `UserAdminApp`, but does we need to add the name of the application in event payload (_metas), or in the event name.

On the `WelcomeEmail` side : 
```ts
myEventManager.on('UserAdminApp.USER_CREATED', (payload)=>{ /* ... */ });
```
Or

```ts
myEventManager.on('USER_CREATED', (payload)=>{ /* 
    payload._metas.application = UserAdminApp
*/ });
```

If we consider **RabbitMQ** it means that the Exchange name will be `UserAdminApp.USER_CREATED` or `USER_CREATED`, so listening queues will be bound to the exchange.

Regarding this, I really think that the event should be `USER_CREATED` without any consideration of the application name, but as it is important to be able to know which application fires wich event, we may add the application name in the _metas information of the event's payload;

### Alternate Exchange notes

* If the _"Alternate Exchange"_ was not created first it's not a problem, as it's configured, the only thing is that if one message is sent to the exchange 'My_EVENT', and the _"Alternate Exchange"_ does not exists (if no queues are bound to the exchange 'My_EVENT'), the message will be lost ! 

* When we listen to an event :
```ts
import EventManager from 'rabbitmq-event-manager';
const myEventManager = new EventManager({url:'amqp://localhost'}, appName:'CONSUMER');
myEventManager.on('MY_EVENT_NAME', async (payload)=>{
    console.log(payload);
    return true;
});
```
It will automatically create an exchange of name `MY_EVENT_NAME`, and a Queue : `CONSUMER::MY_EVENT_NAME` bound to that exchange. 

The Queue `CONSUMER::MY_EVENT_NAME` is configured with the _DEAD LETTER EXHANGE_, even if that exchange does not exists yet. It means that if a `MY_EVENT_NAME` is emmited, and the "listener" mark the event to be flush (dead lettered), the message will be lost (as no _DEAD LETTER EXHANGE_ is define, so ne queue are bound to it...).

:warning: In RabbitMQ only queue store messages, not exchangesso it's important that you initialize your rabbitMQ instance with the values of _alternateExchangeName_,  _alternateQueueName_,  _deadLetterExchangeName_, and  _deadLetterQueueName_

### Requeue with delay

It could be very intersting to _"negatively acknowledge"_ a message and ask to be requeue after a delay, but this will be (if can) in version 2 !


