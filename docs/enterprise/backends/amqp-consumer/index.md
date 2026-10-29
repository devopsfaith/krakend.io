# AMQP Consumer Integration in the API Gateway (RabbitMQ)

> Integrate AMQP consumers into KrakenD API Gateway for seamless communication with message queue systems like RabbitMQ

Source: https://www.krakend.io/docs/enterprise/backends/amqp-consumer/

The AMQP component allows to **send and receive messages to and from a queue** through the API Gateway.

The configuration of the queue is a straightforward process. To connect the endpoints to the messaging system you only need to include the `extra_config` key with the namespaces `backend/amqp/consumer` or `backend/amqp/producer`.

To create Async agents that consume messages asynchronously and without requiring a user request, see [Async Agents](https://www.krakend.io/docs/enterprise/async/).

The parameters of this integration follow the AMQP specification. To understand what are the implications of a certain parameter, see the [**AMQP Complete Reference Guide**](https://www.rabbitmq.com/amqp-0-9-1-reference.html).

**KrakenD creates both the exchange and the queue for you**.

## Configuration

The consumer retrieves messages from the queue when a KrakenD endpoint plugs to its AMQP backend. The recommendation is to connect consumers to `GET` endpoints.

A single endpoint can consume messages from N queues, or can consume N messages from the same queue by adding N backends with the proper queue name.

See [Async Agents](https://www.krakend.io/docs/enterprise/async/) to consume messages without an endpoint.

The needed configuration to run a consumer is:

```json
{
    "backend": [{
        "host": ["amqp://guest:guest@myqueue.host.com:5672"],
        "disable_host_sanitize": true,
        "extra_config": {
            "backend/amqp/consumer": {
                "name": "queue-1",
                "exchange": "some-exchange",
                "durable": true,
                "delete": false,
                "no_wait": true,
                "no_local": false,
                "routing_key": ["#"],
                "prefetch_count": 10,
                "auto_ack": false,
                "backoff_strategy": "exponential-jitter"
            }
        }
    }]
}
```

##### Fields of AMQP Consumer

\* required fields

##### [`auto_ack`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#auto_ack "Click to copy link to auto_ack") boolean

When KrakenD retrieves the messages, regardless of the success or failure of the operation, it marks them as `ACK`nowledge.

Defaults to `false`

##### [`backoff_strategy`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#backoff_strategy "Click to copy link to backoff_strategy")

When the connection to your event source gets interrupted for whatever reason, KrakenD keeps trying to reconnect until it succeeds or until it reaches the `max_retries`. The backoff strategy defines the delay in seconds in between consecutive failed retries. [Check the meaning of each strategy](https://www.krakend.io/docs/async/#backoff-strategies).

Possible values are: `"linear"` , `"linear-jitter"` , `"exponential"` , `"exponential-jitter"` , `"fallback"`

Defaults to `"fallback"`

##### [`delete`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#delete "Click to copy link to delete") boolean

When `true`, AMQP deletes the queue when there are no remaining connections. This option is **not recommended** in most of the scenarios. If for instance, the connectivity between KrakenD and AMQP is lost for whatever reason and it’s the only client, AMQP will delete the queue no matter the number of messages there are inside, and when KrakenD gets the connection again the queue won’t exist and future connections will recreate it again.

Defaults to `false`

##### [`durable`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#durable "Click to copy link to durable") boolean

Durable queues will survive server restarts and remain when there are no remaining consumers or bindings. `true` is recommended, but depends on the use case.

Defaults to `false`

##### [`exchange`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#exchange "Click to copy link to exchange") * string

The exchange name (must have a **topic** type if already exists).

Example: `"some-exchange"`

##### [`exclusive`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#exclusive "Click to copy link to exclusive") boolean

When `true`, AMQP will allow **a single KrakenD instance** to access the queue. This option is **not recommended** in environments where the gateway needs high availability and you have several instances running.

Defaults to `false`

##### [`max_retries`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#max_retries "Click to copy link to max_retries") integer

The maximum number of times you will allow KrakenD to retry reconnecting to a broken messaging system. During startup KrakenD will wait for a maximum of 3 retries before starting to use this policy. Use 0 for unlimited retries.

Defaults to `0`

##### [`nack_discard`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#nack_discard "Click to copy link to nack_discard") boolean

When `true`, messages that cannot be processed are discarded instead of being sent back to the queue. This is useful for scenarios where you want to avoid reprocessing failed messages.

Defaults to `false`

##### [`name`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#name "Click to copy link to name") * string

Queue name.

##### [`no_local`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#no_local "Click to copy link to no_local") boolean

The no\_local flag is not supported by RabbitMQ.

##### [`no_wait`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#no_wait "Click to copy link to no_wait") boolean

When true, do not wait for the server to confirm the request and immediately begin deliveries. If it is not possible to consume, a channel exception will be raised and the channel will be closed.

##### [`prefetch_count`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#prefetch_count "Click to copy link to prefetch_count") integer

The number of messages you want to prefetch prior to consume them.

Defaults to `0`

##### [`routing_key`](https://www.krakend.io/docs/enterprise/backends/amqp-consumer/#routing_key "Click to copy link to routing_key") * array of strings

The list of routing keys you will use to consume messages.

Example: `["#"]`

Schema: [https://www.krakend.io/schema/v3.0/backend/amqp/consumer.json](https://www.krakend.io/schema/v3.0/backend/amqp/consumer.json "JSON schema definition")

## Connection retries

The gateway will try to reconnect to the AMQP server if the connection is lost for any reason. You can set the [back-off strategy](https://www.krakend.io/docs/enterprise/async/#backoff-strategies) that better fits your needs.
