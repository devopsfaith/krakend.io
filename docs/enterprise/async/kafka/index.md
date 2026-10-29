# Kafka Driver for the Asynchronous Agent

> Use the Kafka driver for KrakenD async agents to subscribe to Kafka topics and trigger backend actions on new events.

Source: https://www.krakend.io/docs/enterprise/async/kafka/

The Kafka driver for **async agents** allows KrakenD to consume Kafka queues autonomously. Routines listening to Kafka topics react to new events and push data to your backends.

This driver differs from the [Kafka backend consumer](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#subscriber-configuration). Unlike endpoints, async agents do not require a client request to trigger an action. Instead, the agent subscribes to the topics and fires an action when an event is delivered.

## Driver Configuration

Place the Kafka driver inside the `extra_config` of the [async component](https://www.krakend.io/docs/async/) to subscribe to one or more topics:

```json
{
    "async/kafka": {
        "cluster": {
            "brokers": [
                "localhost:9092"
            ],
            "client_id": "cid_stocksconsumer"
        },
        "group": {
            "group_id": "my_group_id",
            "isolation_level": "read_commited"
        },
        "key_meta": "Message-Id"
    }
}
```

KrakenD consumes messages following the “latest” offset policy, meaning it processes only messages produced after startup.

The Kafka driver configuration accepts the same fields as the `reader` field in [backend kafka consumer](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/) (`backend/pubsub/kafka/subscriber`), except for the `topics` field that is defined in the general [async agent configuration](https://www.krakend.io/docs/enterprise/async/):

##### Fields of Kafka Reader

\* required fields

##### [`cluster`](https://www.krakend.io/docs/enterprise/async/kafka/#cluster "Click to copy link to cluster") * object

Settings to stablish the connection to the kafka cluster

##### [`group`](https://www.krakend.io/docs/enterprise/async/kafka/#group "Click to copy link to group") object

Details about the consumer croup

##### [`key_meta`](https://www.krakend.io/docs/enterprise/async/kafka/#key_meta "Click to copy link to key_meta") string

Name of the header where the kafka message key value is written

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/async\_reader.json](https://www.krakend.io/schema/v3.0/messaging/kafka/async_reader.json "JSON schema definition")

The `cluster` field describes details about the connection to the Kafka cluster. It is the same configuration used for the Kafka PubSub [publisher](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#publisher-configuration) and [subscriber](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#subscriber-configuration):

##### Fields of Kafka Cluster Connection

\* required fields

##### [`brokers`](https://www.krakend.io/docs/enterprise/async/kafka/#brokers "Click to copy link to brokers") * array of strings

##### [`channel_buffer_size`](https://www.krakend.io/docs/enterprise/async/kafka/#channel_buffer_size "Click to copy link to channel_buffer_size") number

The number of events to buffer in internal and external channels. This permits the producer and consumer to continue processing some messages in the background while user code is working, greatly improving throughput

Defaults to `256`

##### [`client_id`](https://www.krakend.io/docs/enterprise/async/kafka/#client_id "Click to copy link to client_id") string

A name to give to the client stablishing the connection

Defaults to `"KrakenD v[X].[Y].[Z]"`

##### [`client_tls`](https://www.krakend.io/docs/enterprise/async/kafka/#client_tls "Click to copy link to client_tls") object

Enables specific TLS connection options when connecting to the Kafke brokers. Supports all options under [TLS client settings](https://www.krakend.io/docs/service-settings/tls/#client-tls-settings).

##### [`dial_timeout`](https://www.krakend.io/docs/enterprise/async/kafka/#dial_timeout "Click to copy link to dial_timeout") string

Dial timeout for establishing new connections

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

##### [`keep_alive`](https://www.krakend.io/docs/enterprise/async/kafka/#keep_alive "Click to copy link to keep_alive") string

Time to maintain an idle connection open

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`metadata_retry_backoff`](https://www.krakend.io/docs/enterprise/async/kafka/#metadata_retry_backoff "Click to copy link to metadata_retry_backoff") string

The time between attempts to reconnect when disconnected

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"250ms"`

##### [`metadata_retry_max`](https://www.krakend.io/docs/enterprise/async/kafka/#metadata_retry_max "Click to copy link to metadata_retry_max") number

When a disconnection happens, the client needs to refresh its metadata to know the current state of the kafka cluster (effectively the number of attempts to reconnect)

Defaults to `3`

##### [`rack_id`](https://www.krakend.io/docs/enterprise/async/kafka/#rack_id "Click to copy link to rack_id") string

A name to identify the rack we are connecting from

Defaults to `""`

##### [`read_timeout`](https://www.krakend.io/docs/enterprise/async/kafka/#read_timeout "Click to copy link to read_timeout") string

Maximum time allowed to read from broker

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

##### [`sasl`](https://www.krakend.io/docs/enterprise/async/kafka/#sasl "Click to copy link to sasl") object

Enables to authenticate to the Kafka service using user and password

##### [`write_timeout`](https://www.krakend.io/docs/enterprise/async/kafka/#write_timeout "Click to copy link to write_timeout") string

Maximum time allowed to write to broker

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/cluster.json](https://www.krakend.io/schema/v3.0/messaging/kafka/cluster.json "JSON schema definition")

Reconnection parameters

The `metadata_retry_max` and `metadata_retry_backoff` play a **very important role in reconnection** in case you have network issues. By default, its values allow to recovery only from connections lost during less that 750ms (3 retries with 250ms backoff). We strongly advise incrementing the number of retries (and increasing the backoff to 1sec), if you want to protect yourself from longer disconnection times.

The `cluster` field includes a `client_tls` field that allows you to authenticate with the Kafka service, as described in [Service Client TLS Settings](https://www.krakend.io/docs/enterprise/service-settings/tls/#client-tls-settings).

You can also use **Kafka user and password authentication** with the SASL config:

```json
{
    "cluster": {
        "brokers": [
            "localhost:9092"
        ],
        "sasl": {
            "user": "johnsmith",
            "password": "myp4ssword"
        }
    }
}
```

##### Fields of Kafka SASL

\* required fields

##### [`auth_identity`](https://www.krakend.io/docs/enterprise/async/kafka/#auth_identity "Click to copy link to auth_identity") string

Auth Identity is an (optional) authorization identity (authzid) to use for SASL/PLAIN authentication (if different from User) when an authenticated user is permitted to act as the presented alternative user. See RFC4616 for details

##### [`azure_event_hub`](https://www.krakend.io/docs/enterprise/async/kafka/#azure_event_hub "Click to copy link to azure_event_hub") boolean

Kafka &gt; 1.x should use SASL V1, except on Azure EventHub which uses V0

Defaults to `false`

##### [`disable_hanshake`](https://www.krakend.io/docs/enterprise/async/kafka/#disable_hanshake "Click to copy link to disable_hanshake") boolean

Whether or not to send the Kafka SASL handshake first if enabled. You should only set this to false if you’re using a non-Kafka SASL proxy

Defaults to `true`

##### [`mechanism`](https://www.krakend.io/docs/enterprise/async/kafka/#mechanism "Click to copy link to mechanism")

Name of the enabled SASL mechanism

Possible values are: `"PLAIN"` , `"OAUTHBEARER"`

Defaults to `"PLAIN"`

##### [`password`](https://www.krakend.io/docs/enterprise/async/kafka/#password "Click to copy link to password") string

Password for SASL/PLAIN authentication

##### [`scram_auth_id`](https://www.krakend.io/docs/enterprise/async/kafka/#scram_auth_id "Click to copy link to scram_auth_id") string

Authz id used for SASL/SCRAM authentication

##### [`user`](https://www.krakend.io/docs/enterprise/async/kafka/#user "Click to copy link to user") string

Authentication identity (authcid) to present for SASL/PLAIN or SASL/SCRAM authentication

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/sasl.json](https://www.krakend.io/schema/v3.0/messaging/kafka/sasl.json "JSON schema definition")

The `group` field has details about the Kafka consumer group behaviour:

##### Fields of Kafka Consumer Details

\* required fields

##### [`fetch_default`](https://www.krakend.io/docs/enterprise/async/kafka/#fetch_default "Click to copy link to fetch_default") number

The default number of message bytes to fetch from the broker in each request (default 1MB). This should be larger than the majority of your messages, or else the consumer will spend a lot of time negotiating sizes and not actually consuming. Similar to the JVM’s `fetch.message.max.bytes`

##### [`heartbeat_interval`](https://www.krakend.io/docs/enterprise/async/kafka/#heartbeat_interval "Click to copy link to heartbeat_interval") string

Expected time between heartbeats to the consumer coordinator when using Kafka’s group management facilities. Heartbeats are used to ensure that the consumer’s session stays active and to facilitate rebalancing when new consumers join or leave the group. The value must be set lower than Consumer.Group.Session.Timeout, but typically should be set no higher than 1/3 of that value. It can be adjusted even lower to control the expected time for normal rebalances

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"3s"`

##### [`id`](https://www.krakend.io/docs/enterprise/async/kafka/#id "Click to copy link to id") string

Name of the consumer group to use

##### [`instance_id`](https://www.krakend.io/docs/enterprise/async/kafka/#instance_id "Click to copy link to instance_id") string

Support KIP-345

##### [`isolation_level`](https://www.krakend.io/docs/enterprise/async/kafka/#isolation_level "Click to copy link to isolation_level")

Supports 2 modes: `read_commited` to consume and return all messages in message channel, and `read_uncommited` to hide messages that are part of an aborted transaction

Possible values are: `"read_commited"` , `"read_uncommited"`

Defaults to `"read_commited"`

##### [`rebalance_strategies`](https://www.krakend.io/docs/enterprise/async/kafka/#rebalance_strategies "Click to copy link to rebalance_strategies") array

Priority-ordered list of client-side consumer group balancing strategies that will be offered to the coordinator. The first strategy that all group members support will be chosen by the leader. Options are: `range`, `roundrobin`, and `sticky`

Defaults to `["range"]`

##### [`rebalance_timeout`](https://www.krakend.io/docs/enterprise/async/kafka/#rebalance_timeout "Click to copy link to rebalance_timeout") string

Maximum allowed time for each worker to join the group once a rebalance has begun. This is basically a limit on the amount of time needed for all tasks to flush any pending data and commit offsets. If the timeout is exceeded, then the worker will be removed from the group, which will cause offset commit failures.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"60s"`

##### [`session_timeout`](https://www.krakend.io/docs/enterprise/async/kafka/#session_timeout "Click to copy link to session_timeout") string

Timeout used to detect consumer failures when using Kafka’s group management facility. The consumer sends periodic heartbeats to indicate its liveness to the broker. If no heartbeats are received by the broker before the expiration of this session timeout, then the broker will remove this consumer from the group and initiate a rebalance. Note that the value must be in the allowable range as configured in the broker configuration by `group.min.session.timeout.ms` and `group.max.session.timeout.ms`

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"10s"`

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/group.json](https://www.krakend.io/schema/v3.0/messaging/kafka/group.json "JSON schema definition")

### ACK Behaviour in Kafka

Kafka has no per-message ACK: acknowledging a Kafka message **commits the client’s partition offset**.

KrakenD ACKs every message read, even when the response of the pipeline results in a non-successful status code.
