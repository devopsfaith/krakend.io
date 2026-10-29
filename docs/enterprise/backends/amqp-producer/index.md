# AMQP Producer Integration in the API Gateway (RabbitMQ)

> Integrate AMQP producers with KrakenD for seamless communication with backend systems. Follow our documentation to set up reliable and scalable messaging with Advanced Message Queuing Protocol (AMQP).

Source: https://www.krakend.io/docs/enterprise/backends/amqp-producer/

The AMQP producer component allows to **send messages to a queue** through the API Gateway.

The configuration of the queue is a straightforward process. To connect the endpoints to the messaging system you only need to include the `extra_config` key with the namespace `backend/amqp/producer`.

The parameters of this integration follow the AMQP specification. To understand what are the implications of a certain parameter, see the [**AMQP Complete Reference Guide**](https://www.rabbitmq.com/amqp-0-9-1-reference.html).

**KrakenD creates both the exchange and the queue for you**.

## Producer Configuration

```json
{
    "backend": [{
        "host": ["amqp://guest:guest@myqueue.host.com:5672"],
        "disable_host_sanitize": true,
        "extra_config": {
            "backend/amqp/producer": {
                "name": "queue-1",
                "exchange": "some-exchange",
                "durable": true,
                "delete": false,
                "no_wait": true,
                "no_local": false,
                "routing_key": "#",
                "mandatory": false,
                "immediate": false,
                "backoff_strategy": "exponential-jitter"
            }
        }
    }]
}
```

##### Fields of AMQP Producer

\* required fields

##### [`backoff_strategy`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#backoff_strategy "Click to copy link to backoff_strategy")

When the connection to your event source gets interrupted for whatever reason, KrakenD keeps trying to reconnect until it succeeds or until it reaches the `max_retries`. The backoff strategy defines the delay in seconds in between consecutive failed retries. [Check the meaning of each strategy](https://www.krakend.io/docs/async/#backoff-strategies).

Possible values are: `"linear"` , `"linear-jitter"` , `"exponential"` , `"exponential-jitter"` , `"fallback"`

Defaults to `"fallback"`

##### [`delete`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#delete "Click to copy link to delete") boolean

When `true`, AMQP deletes the queue when there are no remaining connections. This option is **not recommended** in most of the scenarios. If for instance, the connectivity between KrakenD and AMQP is lost for whatever reason and it’s the only client, AMQP will delete the queue no matter the number of messages there are inside, and when KrakenD gets the connection again the queue won’t exist and future connections will recreate it again.

Defaults to `false`

##### [`durable`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#durable "Click to copy link to durable") boolean

true is recommended, but depends on the use case. Durable queues will survive server restarts and remain when there are no remaining consumers or bindings.

Defaults to `false`

##### [`exchange`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#exchange "Click to copy link to exchange") * string

The exchange name (must have a topic type if already exists).

Example: `"some-exchange"`

##### [`exclusive`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#exclusive "Click to copy link to exclusive") boolean

When `true`, AMQP will allow **a single KrakenD instance** to access the queue. This option is **not recommended** in environments where the gateway needs high availability and you have several instances running.

Defaults to `false`

##### [`exp_key`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#exp_key "Click to copy link to exp_key") string

Take a parameter from a `{placeholder}` in the endpoint definition to use as the expiration key. The key must have the first letter uppercased. For instance, when an endpoint parameter is defined as `{id}`, you must write `Id`.

Defaults to `""`

##### [`immediate`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#immediate "Click to copy link to immediate") boolean

A consumer must be connected to the queue when true.

Defaults to `false`

##### [`mandatory`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#mandatory "Click to copy link to mandatory") boolean

The exchange must have at least one queue bound when true.

Defaults to `false`

##### [`max_retries`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#max_retries "Click to copy link to max_retries") integer

The maximum number of times you will allow KrakenD to retry reconnecting to a broken messaging system. During startup KrakenD will wait for a maximum of 3 retries before starting to use this policy. Use 0 for unlimited retries.

Defaults to `0`

##### [`msg_id_key`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#msg_id_key "Click to copy link to msg_id_key") string

Take a parameter from a `{placeholder}` in the endpoint definition to use as the message identifier. The key must have the first letter uppercased. For instance, when an endpoint parameter is defined as `{id}`, you must write `Id`.

Defaults to `""`

##### [`name`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#name "Click to copy link to name") * string

Queue name.

##### [`no_local`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#no_local "Click to copy link to no_local") boolean

The no\_local flag is not supported by RabbitMQ.

##### [`no_wait`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#no_wait "Click to copy link to no_wait") boolean

When true, do not wait for the server to confirm the request and immediately begin deliveries. If it is not possible to consume, a channel exception will be raised and the channel will be closed.

##### [`priority_key`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#priority_key "Click to copy link to priority_key") string

Take a parameter from a `{placeholder}` in the endpoint definition to use as the reply key. The key must have the first letter uppercased. For instance, when an endpoint parameter is defined as `{id}`, you must write `Id`.

Defaults to `""`

##### [`reply_to_key`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#reply_to_key "Click to copy link to reply_to_key") string

Take a parameter from a `{placeholder}` in the endpoint definition to use as the reply key. The key must have the first letter uppercased. For instance, when an endpoint parameter is defined as `{id}`, you must write `Id`.

Defaults to `""`

##### [`routing_key`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#routing_key "Click to copy link to routing_key") * string

The routing key you will use to send messages, case sensitive.

Defaults to `"#"`

##### [`static_routing_key`](https://www.krakend.io/docs/enterprise/backends/amqp-producer/#static_routing_key "Click to copy link to static_routing_key") boolean

Defines whether the `routing_key` will have a static value or not, instead of taking the value from a parameter.

Defaults to `false`

Schema: [https://www.krakend.io/schema/v3.0/backend/amqp/producer.json](https://www.krakend.io/schema/v3.0/backend/amqp/producer.json "JSON schema definition")

Additionally, the items below are parameter keys that can be present in the endpoint URL and are passed to the producer. Parameters need **capitalization on the first letter**.

Parameters’ first character uppercased

Notice the **capitalization** of the first letter of the parameter names at the configuration below used in `exp_key`, `reply_to_key`, `msg_id_key`, `priority_key`, and `routing_key`.

For instance, an `endpoint` URL could be declared as `/produce/{a}/{b}/{id}/{prio}/{route}` and the producer knows how to map them with a configuration like this:

```json
{
  "backend/amqp/producer": {
    "@comment": "Rest of the settings omitted",
    "exp_key":"A",
    "reply_to_key":"B",
    "msg_id_key":"Id",
    "priority_key":"Prio",
    "routing_key":"Route"
  }
}
```

## Connection retries

The gateway will try to reconnect to the AMQP server if the connection is lost for any reason. You can set the [back-off strategy](https://www.krakend.io/docs/enterprise/async/#backoff-strategies) that better fits your needs.
