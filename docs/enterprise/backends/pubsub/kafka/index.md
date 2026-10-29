# Kafka PubSub with Extended Connectivity

> Use advanced connection options to securely connect to Kafka services with mTLS or SASL.

Source: https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/

**Kafka PubSub** enables KrakenD to publish messages to and consume messages from Kafka topics directly from backend configurations. Use this component when you need to secure your Kafka connections with mutual TLS (mTLS) or SASL authentication. It provides two backend namespaces: `backend/pubsub/publisher/kafka` for publishing and `backend/pubsub/subscriber/kafka` for subscribing.

## Publisher Configuration

Add the `backend/pubsub/publisher/kafka` namespace under a backend’s `extra_config` to publish messages to a Kafka topic. KrakenD converts the backend’s `input_headers` into message metadata.

The following configuration enables publishing to the `orderplacement` topic with mTLS authentication:

```json
{
  "backend/pubsub/publisher/kafka": {
    "success_status_code": 201,
    "writer": {
        "topic": "orderplacement",
        "key_meta": "X-My-Key",
        "cluster": {
            "brokers": [
                "localhost:49092"
            ],
            "client_id": "krakend_async_agent",
            "client_tls": {
                "allow_insecure_connections": false,
                "ca_certs": [
                    "./config/ca/cacert.pem"
                ],
                "client_certs": [
                    {
                        "certificate": "./config/certs/client/client.signed.pem",
                        "private_key": "./config/certs/client/client.key"
                    }
                ]
            }
        },
        "producer": {
            "idempotent": true
        }
    }
  }
}
```

The top-level fields for `backend/pubsub/publisher/kafka` are:

##### Fields of PubSub Kafka Publisher EE

\* required fields

##### [`success_status_code`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#success_status_code "Click to copy link to success_status_code") number

HTTP status code to return for a successful write in the queue

Defaults to `200`

##### [`writer`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#writer "Click to copy link to writer") * object

Define how to write messages to a kafka topic

Schema: [https://www.krakend.io/schema/v3.0/backend/pubsub/kafka/publisher.json](https://www.krakend.io/schema/v3.0/backend/pubsub/kafka/publisher.json "JSON schema definition")

The `writer` field contains the configuration for writing to a Kafka topic:

##### Fields of Kafka Writer

\* required fields

##### [`cluster`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#cluster "Click to copy link to cluster") * object

Settings to establish the connection to the kafka cluster

##### [`key_meta`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#key_meta "Click to copy link to key_meta") string

Name of the header where the kafka message key value is written

##### [`producer`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#producer "Click to copy link to producer") object

Details about how to write to a topic

##### [`topic`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#topic "Click to copy link to topic") * string

Topic to write to

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/writer.json](https://www.krakend.io/schema/v3.0/messaging/kafka/writer.json "JSON schema definition")

The `cluster` field describes details about the connection to the Kafka cluster. It is the same configuration used for the Kafka PubSub subscriber and the Kafka async agent:

##### Fields of Kafka Cluster Connection

\* required fields

##### [`brokers`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#brokers "Click to copy link to brokers") * array of strings

##### [`channel_buffer_size`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#channel_buffer_size "Click to copy link to channel_buffer_size") number

The number of events to buffer in internal and external channels. This permits the producer and consumer to continue processing some messages in the background while user code is working, greatly improving throughput

Defaults to `256`

##### [`client_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#client_id "Click to copy link to client_id") string

A name to give to the client stablishing the connection

Defaults to `"KrakenD v[X].[Y].[Z]"`

##### [`client_tls`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#client_tls "Click to copy link to client_tls") object

Enables specific TLS connection options when connecting to the Kafke brokers. Supports all options under [TLS client settings](https://www.krakend.io/docs/service-settings/tls/#client-tls-settings).

##### [`dial_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#dial_timeout "Click to copy link to dial_timeout") string

Dial timeout for establishing new connections

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

##### [`keep_alive`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#keep_alive "Click to copy link to keep_alive") string

Time to maintain an idle connection open

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`metadata_retry_backoff`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#metadata_retry_backoff "Click to copy link to metadata_retry_backoff") string

The time between attempts to reconnect when disconnected

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"250ms"`

##### [`metadata_retry_max`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#metadata_retry_max "Click to copy link to metadata_retry_max") number

When a disconnection happens, the client needs to refresh its metadata to know the current state of the kafka cluster (effectively the number of attempts to reconnect)

Defaults to `3`

##### [`rack_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#rack_id "Click to copy link to rack_id") string

A name to identify the rack we are connecting from

Defaults to `""`

##### [`read_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#read_timeout "Click to copy link to read_timeout") string

Maximum time allowed to read from broker

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

##### [`sasl`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#sasl "Click to copy link to sasl") object

Enables to authenticate to the Kafka service using user and password

##### [`write_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#write_timeout "Click to copy link to write_timeout") string

Maximum time allowed to write to broker

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/cluster.json](https://www.krakend.io/schema/v3.0/messaging/kafka/cluster.json "JSON schema definition")

Reconnection parameters

The `metadata_retry_max` and `metadata_retry_backoff` play a **very important role in reconnection** in case you have network issues. By default, its values allow to recovery only from connections lost during less that 750ms (3 retries with 250ms backoff). We strongly advise incrementing the number of retries (and increasing the backoff to 1sec), if you want to protect yourself from longer disconnection times.

The `cluster` field includes a `client_tls` field that allows you to authenticate with the Kafka service, as described in [Service Client TLS Settings](https://www.krakend.io/docs/enterprise/service-settings/tls/#client-tls-settings).

You can also use user and password authentication with the SASL config:

##### Fields of Kafka SASL

\* required fields

##### [`auth_identity`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#auth_identity "Click to copy link to auth_identity") string

Auth Identity is an (optional) authorization identity (authzid) to use for SASL/PLAIN authentication (if different from User) when an authenticated user is permitted to act as the presented alternative user. See RFC4616 for details

##### [`azure_event_hub`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#azure_event_hub "Click to copy link to azure_event_hub") boolean

Kafka &gt; 1.x should use SASL V1, except on Azure EventHub which uses V0

Defaults to `false`

##### [`disable_hanshake`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#disable_hanshake "Click to copy link to disable_hanshake") boolean

Whether or not to send the Kafka SASL handshake first if enabled. You should only set this to false if you’re using a non-Kafka SASL proxy

Defaults to `true`

##### [`mechanism`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#mechanism "Click to copy link to mechanism")

Name of the enabled SASL mechanism

Possible values are: `"PLAIN"` , `"OAUTHBEARER"`

Defaults to `"PLAIN"`

##### [`password`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#password "Click to copy link to password") string

Password for SASL/PLAIN authentication

##### [`scram_auth_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#scram_auth_id "Click to copy link to scram_auth_id") string

Authz id used for SASL/SCRAM authentication

##### [`user`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#user "Click to copy link to user") string

Authentication identity (authcid) to present for SASL/PLAIN or SASL/SCRAM authentication

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/sasl.json](https://www.krakend.io/schema/v3.0/messaging/kafka/sasl.json "JSON schema definition")

The `producer` field has details about how to write messages:

##### Fields of Kafka Producer Details

\* required fields

##### [`compression_codec`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#compression_codec "Click to copy link to compression_codec")

Type of compression to use on messages (defaults to no compression). Similar to `compression.codec` setting of the JVM producer.

Possible values are: `"none"` , `"gzip"` , `"snappy"` , `"lz4"` , `"zstd"`

Defaults to `"none"`

##### [`compression_level`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#compression_level "Click to copy link to compression_level") string

Level of compression to use on messages. The meaning depends on the actual compression type used and defaults to default compression level for the codec.

##### [`idempotent`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#idempotent "Click to copy link to idempotent") boolean

If enabled, the producer will ensure that exactly one copy of each message is written

Defaults to `false`

##### [`max_message_bytes`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#max_message_bytes "Click to copy link to max_message_bytes") number

Maximum permitted size of a message. Should be set equal to or smaller than the broker’s `message.max.bytes`.

##### [`partitioner`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#partitioner "Click to copy link to partitioner")

Select behaviour for choosing the partition to send messages (similar to the `partitioner.class` setting for the JVM producer). The options are:

\- `sarama`: **DEPRECATED** uses a Partitioner which behaves as follows: If the message’s key is nil then a random partition is chosen. Otherwise the `FNV-1a` hash of the encoded bytes of the message key is used, modulus the number of partitions. This ensures that messages with the same key always end up on the same partition.

\- `standard` is like `sarama` except that it handles absolute values in the same way as the reference Java implementation. `sarama` was supposed to do that but it had a mistake and now there are people depending on both behaviours. This will all go away on the next major version bump.

\- `random` uses a Partitioner which chooses a random partition each time.

\- `roundrobin` uses a Partitioner which walks through the available partitions one at a time.

Possible values are: `"sarama"` , `"standard"` , `"random"` , `"roundrobin"`

Defaults to `"standard"`

##### [`required_acks`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#required_acks "Click to copy link to required_acks") string

Level of acknowledgement reliability needed from the broker. Equivalent to the `request.required.acks` setting of the JVM producer. Can be a positibe number (as a string), or one of hte following values: `no_response` (no required acks), `wait_for_local` (waits for only the local commit to succeed before responding), `wait_for_all` (waits for all in-sync replicas to commit before responding).

Defaults to `"wait_for_local"`

##### [`required_acks_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#required_acks_timeout "Click to copy link to required_acks_timeout") string

Maximum duration the broker will wait the receipt of the number of `required_acks`. This is only relevant when `required_acks` is set to WaitForAll or a number &gt; 1. Only supports millisecond resolution, nanoseconds will be truncated. Equivalent to the JVM producer’s `request.timeout.ms` setting.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"10s"`

##### [`retry_backoff`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#retry_backoff "Click to copy link to retry_backoff") string

How long to wait for the cluster to settle between retries (similar to the `retry.backoff.ms` setting of the JVM producer.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"100ms"`

##### [`retry_max`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#retry_max "Click to copy link to retry_max") number

The total number of times to retry sending a message. Similar to the `message.send.max.retries` setting of the JVM producer.

Defaults to `3`

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/producer.json](https://www.krakend.io/schema/v3.0/messaging/kafka/producer.json "JSON schema definition")

### OpenTelemetry

**Metrics**

When OpenTelemetry is enabled, KrakenD reports the following metrics for all messages:

- `messaging.write.body.size`: histogram of body sizes in bytes (does not include metadata).
- `messaging.write.body.duration`: histogram of duration taken to write a message.
- `messaging.write.failure.count`: histogram of the time taken to fail to write a message.

All metrics include the following attributes:

- `kind`: identifies the messaging system (in this case `kafka`).
- `topic`: the topic where the message is written to.

**Traces**

KrakenD adds information about the write process as a new span if a trace is active, with the following fields:

- `kind`: identifies the messaging system (in this case `kafka`).
- `topic`: the topic where the message is written to.
- `messaging.write.body.size`: size of the message body.
- `messaging.write.body.duration`: time taken to write the message in seconds.

## Subscriber Configuration

Add the `backend/pubsub/subscriber/kafka` namespace under a backend’s `extra_config` to consume messages from a Kafka topic. It contains a `reader` field with the same configuration as the Kafka async agent driver.

The following configuration subscribes to the `orderplacement` topic with mTLS authentication:

```json
{
    "backend/pubsub/subscriber/kafka": {
        "reader": {
            "topics": ["orderplacement"],
            "key_meta": "X-Idempotency-Key",
            "cluster": {
                "brokers": [
                    "localhost:49092"
                ],
                "client_id": "krakend_async_agent",
                "client_tls": {
                    "allow_insecure_connections": false,
                    "ca_certs": [
                        "./config/ca/cacert.pem"
                    ],
                    "client_certs": [
                        {
                            "certificate": "./config/certs/client/client.signed.pem",
                            "private_key": "./config/certs/client/client.key"
                        }
                    ]
                }
            },
            "group": {
                "id": "k_endpoint_read",
                "isolation_level": "read_commited"
            }
        }
    }
}
```

##### Fields of PubSub Kafka Subscriber EE

\* required fields

##### [`reader`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#reader "Click to copy link to reader") * object

Define how to read messages from a kafka topic

Schema: [https://www.krakend.io/schema/v3.0/backend/pubsub/kafka/subscriber.json](https://www.krakend.io/schema/v3.0/backend/pubsub/kafka/subscriber.json "JSON schema definition")

KrakenD consumes messages following the “latest” offset policy, meaning it processes only messages produced after KrakenD starts.

The `reader` field defines how to read from a Kafka cluster:

##### Fields of Kafka Reader

\* required fields

##### [`cluster`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#cluster "Click to copy link to cluster") * object

Settings to stablish the connection to the kafka cluster

##### [`group`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#group "Click to copy link to group") object

Details about the consumer croup

##### [`key_meta`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#key_meta "Click to copy link to key_meta") string

Name of the header where the kafka message key value is written

##### [`topics`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#topics "Click to copy link to topics") * array of strings

List of topics to read from

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/reader.json](https://www.krakend.io/schema/v3.0/messaging/kafka/reader.json "JSON schema definition")

The `cluster` field describes details about the connection to the Kafka cluster. It is the same configuration used for the Kafka PubSub publisher and the Kafka async agent:

##### Fields of Kafka Cluster Connection

\* required fields

##### [`brokers`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#brokers "Click to copy link to brokers") * array of strings

##### [`channel_buffer_size`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#channel_buffer_size "Click to copy link to channel_buffer_size") number

The number of events to buffer in internal and external channels. This permits the producer and consumer to continue processing some messages in the background while user code is working, greatly improving throughput

Defaults to `256`

##### [`client_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#client_id "Click to copy link to client_id") string

A name to give to the client stablishing the connection

Defaults to `"KrakenD v[X].[Y].[Z]"`

##### [`client_tls`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#client_tls "Click to copy link to client_tls") object

Enables specific TLS connection options when connecting to the Kafke brokers. Supports all options under [TLS client settings](https://www.krakend.io/docs/service-settings/tls/#client-tls-settings).

##### [`dial_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#dial_timeout "Click to copy link to dial_timeout") string

Dial timeout for establishing new connections

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

##### [`keep_alive`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#keep_alive "Click to copy link to keep_alive") string

Time to maintain an idle connection open

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`metadata_retry_backoff`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#metadata_retry_backoff "Click to copy link to metadata_retry_backoff") string

The time between attempts to reconnect when disconnected

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"250ms"`

##### [`metadata_retry_max`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#metadata_retry_max "Click to copy link to metadata_retry_max") number

When a disconnection happens, the client needs to refresh its metadata to know the current state of the kafka cluster (effectively the number of attempts to reconnect)

Defaults to `3`

##### [`rack_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#rack_id "Click to copy link to rack_id") string

A name to identify the rack we are connecting from

Defaults to `""`

##### [`read_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#read_timeout "Click to copy link to read_timeout") string

Maximum time allowed to read from broker

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

##### [`sasl`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#sasl "Click to copy link to sasl") object

Enables to authenticate to the Kafka service using user and password

##### [`write_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#write_timeout "Click to copy link to write_timeout") string

Maximum time allowed to write to broker

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30s"`

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/cluster.json](https://www.krakend.io/schema/v3.0/messaging/kafka/cluster.json "JSON schema definition")

Reconnection parameters

The `metadata_retry_max` and `metadata_retry_backoff` play a **very important role in reconnection** in case you have network issues. By default, its values allow to recovery only from connections lost during less that 750ms (3 retries with 250ms backoff). We strongly advise incrementing the number of retries (and increasing the backoff to 1sec), if you want to protect yourself from longer disconnection times.

The `cluster` field includes a `client_tls` field that allows you to authenticate with the Kafka service, as described in [Service Client TLS Settings](https://www.krakend.io/docs/enterprise/service-settings/tls/#client-tls-settings).

You can also use user and password authentication with the SASL config:

##### Fields of Kafka SASL

\* required fields

##### [`auth_identity`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#auth_identity "Click to copy link to auth_identity") string

Auth Identity is an (optional) authorization identity (authzid) to use for SASL/PLAIN authentication (if different from User) when an authenticated user is permitted to act as the presented alternative user. See RFC4616 for details

##### [`azure_event_hub`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#azure_event_hub "Click to copy link to azure_event_hub") boolean

Kafka &gt; 1.x should use SASL V1, except on Azure EventHub which uses V0

Defaults to `false`

##### [`disable_hanshake`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#disable_hanshake "Click to copy link to disable_hanshake") boolean

Whether or not to send the Kafka SASL handshake first if enabled. You should only set this to false if you’re using a non-Kafka SASL proxy

Defaults to `true`

##### [`mechanism`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#mechanism "Click to copy link to mechanism")

Name of the enabled SASL mechanism

Possible values are: `"PLAIN"` , `"OAUTHBEARER"`

Defaults to `"PLAIN"`

##### [`password`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#password "Click to copy link to password") string

Password for SASL/PLAIN authentication

##### [`scram_auth_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#scram_auth_id "Click to copy link to scram_auth_id") string

Authz id used for SASL/SCRAM authentication

##### [`user`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#user "Click to copy link to user") string

Authentication identity (authcid) to present for SASL/PLAIN or SASL/SCRAM authentication

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/sasl.json](https://www.krakend.io/schema/v3.0/messaging/kafka/sasl.json "JSON schema definition")

The `group` field has details about the Kafka consumer group:

##### Fields of Kafka Consumer Details

\* required fields

##### [`fetch_default`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#fetch_default "Click to copy link to fetch_default") number

The default number of message bytes to fetch from the broker in each request (default 1MB). This should be larger than the majority of your messages, or else the consumer will spend a lot of time negotiating sizes and not actually consuming. Similar to the JVM’s `fetch.message.max.bytes`

##### [`heartbeat_interval`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#heartbeat_interval "Click to copy link to heartbeat_interval") string

Expected time between heartbeats to the consumer coordinator when using Kafka’s group management facilities. Heartbeats are used to ensure that the consumer’s session stays active and to facilitate rebalancing when new consumers join or leave the group. The value must be set lower than Consumer.Group.Session.Timeout, but typically should be set no higher than 1/3 of that value. It can be adjusted even lower to control the expected time for normal rebalances

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"3s"`

##### [`id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#id "Click to copy link to id") string

Name of the consumer group to use

##### [`instance_id`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#instance_id "Click to copy link to instance_id") string

Support KIP-345

##### [`isolation_level`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#isolation_level "Click to copy link to isolation_level")

Supports 2 modes: `read_commited` to consume and return all messages in message channel, and `read_uncommited` to hide messages that are part of an aborted transaction

Possible values are: `"read_commited"` , `"read_uncommited"`

Defaults to `"read_commited"`

##### [`rebalance_strategies`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#rebalance_strategies "Click to copy link to rebalance_strategies") array

Priority-ordered list of client-side consumer group balancing strategies that will be offered to the coordinator. The first strategy that all group members support will be chosen by the leader. Options are: `range`, `roundrobin`, and `sticky`

Defaults to `["range"]`

##### [`rebalance_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#rebalance_timeout "Click to copy link to rebalance_timeout") string

Maximum allowed time for each worker to join the group once a rebalance has begun. This is basically a limit on the amount of time needed for all tasks to flush any pending data and commit offsets. If the timeout is exceeded, then the worker will be removed from the group, which will cause offset commit failures.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"60s"`

##### [`session_timeout`](https://www.krakend.io/docs/enterprise/backends/pubsub/kafka/#session_timeout "Click to copy link to session_timeout") string

Timeout used to detect consumer failures when using Kafka’s group management facility. The consumer sends periodic heartbeats to indicate its liveness to the broker. If no heartbeats are received by the broker before the expiration of this session timeout, then the broker will remove this consumer from the group and initiate a rebalance. Note that the value must be in the allowable range as configured in the broker configuration by `group.min.session.timeout.ms` and `group.max.session.timeout.ms`

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"10s"`

Schema: [https://www.krakend.io/schema/v3.0/messaging/kafka/group.json](https://www.krakend.io/schema/v3.0/messaging/kafka/group.json "JSON schema definition")

### OpenTelemetry

**Metrics**

When OpenTelemetry is enabled, KrakenD reports the following metrics for all messages read:

- `messaging.read.body.size`: histogram of body sizes in bytes (does not include metadata).
- `messaging.read.body.duration`: histogram of the duration taken to read a message.
- `messaging.read.ack.duration`: histogram of the time taken to acknowledge the message.
- `messaging.read.failure.count`: histogram of time taken to fail reading a message.

All metrics include the following attributes:

- `kind`: identifies the messaging system (for example `kafka`).
- `topic`: the topic where the message is read from.
- `origin`: always set to `subscriber`, to differentiate reading metrics from those of an async agent (which can take longer as it waits for new events).

**Traces**

KrakenD adds information about the read process as a new span if a trace is active, with the following fields:

- `kind`: identifies the messaging system (for example `kafka`).
- `topic`: the topic where the message is read from.
- `messaging.read.body.size`: size of the read message body.
- `messaging.read.body.duration`: time taken to read a message in seconds.

### ACK Behaviour in Kafka

Kafka has no per-message ACK: acknowledging a Kafka message **commits the client’s partition offset**.

KrakenD ACKs every message read, even when the response of the pipeline results in a non-successful status code.
