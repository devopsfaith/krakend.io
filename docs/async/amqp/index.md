# AMQP driver for the Asynchronous Agent

> Leverage Asynchronous AMQP Agents in KrakenD for high-performance messaging and event-driven architectures

Source: https://www.krakend.io/docs/async/amqp/

The AMQP driver for **Async agents** allows you to have KrakenD consuming AMQP queues autonomously. Routines listening to AMQP queues will react by themselves to new events and push data to your backends.

This driver is different from the [AMQP backend consumer](https://www.krakend.io/docs/backends/amqp-consumer/). As opposed to endpoints, async agents do not require users to request something to trigger an action. Instead, the agents connect to the queue and fire an action when an event is delivered.

## Async/AMQP Driver Configuration

The AMQP driver has to be placed inside the `extra_config` of the [async component](https://www.krakend.io/docs/async/) and allows you connect to an AMQP queue (e.g: RabbitMQ). The settings are as follows:

```json
{
    "async/amqp": {
        "host": "amqp://guest:guest@localhost:5672/",
        "name": "krakend",
        "exchange": "foo",
        "durable": true,
        "delete": false,
        "exclusive": false,
        "no_wait": true,
        "prefetch_count": 5,
        "auto_ack": false,
        "no_local": true
    }
}
```

##### Fields of Async AMQP Driver

\* required fields

##### [`auto_ack`](https://www.krakend.io/docs/async/amqp/#auto_ack "Click to copy link to auto_ack") boolean

When KrakenD retrieves the messages, regardless of the success or failure of the operation, it marks them as ACK. When auto ACK is not used, only successful backend responses do the ACK, and failing messages are requeued. Defaults to `false`.

Defaults to `false`

##### [`delete`](https://www.krakend.io/docs/async/amqp/#delete "Click to copy link to delete") boolean

When `true`, AMQP deletes the queue when there are no remaining connections. This option is **not recommended** in most of the scenarios. If for instance, the connectivity between KrakenD and AMQP is lost for whatever reason and it’s the only client, AMQP will delete the queue no matter the number of messages there are inside, and when KrakenD gets the connection again the queue won’t exist and future connections will recreate it again.

Defaults to `false`

##### [`durable`](https://www.krakend.io/docs/async/amqp/#durable "Click to copy link to durable") boolean

Durable queues will survive server restarts and remain when there are no remaining consumers or bindings. Most of the times `true` is recommended, but depends on the use case.

Defaults to `false`

##### [`exchange`](https://www.krakend.io/docs/async/amqp/#exchange "Click to copy link to exchange") * string

The entity name where messages are retrieved (it will be created, or it must have a **topic** type if already exists).

Example: `"some-exchange"`

##### [`exclusive`](https://www.krakend.io/docs/async/amqp/#exclusive "Click to copy link to exclusive") boolean

When `true`, AMQP will allow **a single KrakenD client** to access the queue. This option is **not recommended** in environments where the gateway needs high availability and you have several instances running.

Defaults to `false`

##### [`host`](https://www.krakend.io/docs/async/amqp/#host "Click to copy link to host") * string

The connection string, ends in slash. E.g: `amqp://user:password@host:5672/`.

##### [`nack_discard`](https://www.krakend.io/docs/async/amqp/#nack_discard "Click to copy link to nack_discard") boolean

When `true`, messages that cannot be processed are discarded instead of being sent back to the queue. This is useful for scenarios where you want to avoid reprocessing failed messages.

Defaults to `false`

##### [`name`](https://www.krakend.io/docs/async/amqp/#name "Click to copy link to name") * string

The queue name.

##### [`no_local`](https://www.krakend.io/docs/async/amqp/#no_local "Click to copy link to no_local") boolean

The no\_local flag is not supported by RabbitMQ.

##### [`no_wait`](https://www.krakend.io/docs/async/amqp/#no_wait "Click to copy link to no_wait") boolean

When true, do not wait for the server to confirm the request and immediately begin deliveries. If it is not possible to consume, a channel exception will be raised and the channel will be closed.

##### [`prefetch_count`](https://www.krakend.io/docs/async/amqp/#prefetch_count "Click to copy link to prefetch_count") integer

The number of messages you want to prefetch prior to consume them.

Defaults to `10`

##### [`prefetch_size`](https://www.krakend.io/docs/async/amqp/#prefetch_size "Click to copy link to prefetch_size") integer

The number of bytes you want to use to prefetch messages.

Defaults to `0`

Schema: [https://www.krakend.io/schema/v3.0/async/amqp.json](https://www.krakend.io/schema/v3.0/async/amqp.json "JSON schema definition")
