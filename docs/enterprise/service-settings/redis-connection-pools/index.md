# Redis connection pools for stateful functionality

> How to configure Redis connection pools to reuse in stateful functionality backed on Redis

Source: https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/

KrakenD’s architecture allows developers to define all Redis connections in a single `redis` namespace, so you can reuse the definitions in other components across the configuration.

You can configure both **connection pools** and **clusters**. Whether you use one option or both, each pool and cluster is identified by a **unique name** that must not clash (make sure of it), which is then referenced by the components requiring a connection. This approach eliminates the need to repeatedly specify Redis connection details in every component configuration.

For example, a configuration that defines 2 connection pools and 1 cluster could be:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "shared_redis_pool",
          "address": "192.168.1.45:6379"
        },
        {
          "name": "ratelimit_counters",
          "address": "192.168.1.52:6379",
          "db": 2
        }
      ],
      "clusters": [
        {
          "name": "shared_redis_cluster",
          "addresses": ["192.168.1.90:6379", "192.168.1.91:6379"]
        }
      ]
    }
  }
}
```

The block above creates two Redis connection pools named `shared_redis_pool` and `ratelimit_counters`, and it also creates a connection set to a Redis Cluster `shared_redis_cluster` that utilizes internally two different addresses. These names are how other components (like the [Redis-based service rate limit](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/)) can select which one to use.

## Configuration of Redis connection pools

Different pools can connect to different redis instances, or to the same instances but with different parameters. The configuration allows you to declare extra options to fine tune how the pool should behave: secure connection, retries, etc ..

Best practices to select those parameters will depend on the components that will use the pool.

The full list of options is explained below.

##### Configuration of Redis Connection Pools

\* required fields

##### [`connection_pools`](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/#connection_pools "Click to copy link to connection_pools") array of objects

Defines all the connetion pools available to Redis functionality. The different components requiring Redis will access the pool based on its name

Each item of connection\_pools accepts the following properties:

##### [`address`](#connection_pools-address "Click to copy link to address") * string

The Redis host where you want to connect using the format `host:port`.

Example: `"shared.redis.example.com"`

##### [`client_name`](#connection_pools-client_name "Click to copy link to client_name") string

You can set how this connection shows in Redis when listing all the connections `CONN LIST`

Example: `"krakend_pool"`

##### [`conn_max_idle_time`](#connection_pools-conn_max_idle_time "Click to copy link to conn_max_idle_time") string

The maximum amount of time a connection may be idle. Should be less than server’s timeout.Expired connections may be closed lazily before reuse. If &lt;= 0, connections are not closed due to a connection’s idle time.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30m"`

##### [`conn_max_life_time`](#connection_pools-conn_max_life_time "Click to copy link to conn_max_life_time") string

The maximum amount of time a connection may be reused. When the attribute is not declared, the connection does not expire

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

##### [`db`](#connection_pools-db "Click to copy link to db") integer

The database number to select after connecting

Defaults to `0`

##### [`dial_timeout`](#connection_pools-dial_timeout "Click to copy link to dial_timeout") string

Dial timeout for establishing new connections

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"5s"`

##### [`max_active_conns`](#connection_pools-max_active_conns "Click to copy link to max_active_conns") integer

Maximum number of connections allocated by the pool at a given time. When zero, there is no limit on the number of connections in the pool.

Defaults to `0`

##### [`max_idle_conns`](#connection_pools-max_idle_conns "Click to copy link to max_idle_conns") integer

Maximum number of idle connections. The value `0` means connections not closed

Defaults to `0`

##### [`max_retries`](#connection_pools-max_retries "Click to copy link to max_retries") integer

The number of times you want to retry a Redis command using a different connection from the pool, applying a random delay between `min_retry_backoff` and `max_retry_backoff`. Use `-1` to never retry (it might not be a good idea)

Defaults to `3`

##### [`max_retry_backoff`](#connection_pools-max_retry_backoff "Click to copy link to max_retry_backoff") string

Every retry is executed increasing randomly starting at the `min_retry_backoff` until the `max_retry_backoff` is reached. This is the longest possible time.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"512ms"`

##### [`min_idle_conns`](#connection_pools-min_idle_conns "Click to copy link to min_idle_conns") integer

Minimum number of idle connections which is useful when establishing new connection is slow. `0` means connections are not closed.

Defaults to `0`

##### [`min_retry_backoff`](#connection_pools-min_retry_backoff "Click to copy link to min_retry_backoff") string

Every retry is executed increasing randomly starting at the `min_retry_backoff` until the `max_retry_backoff` is reached. This is the shortest possible time.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"8ms"`

##### [`name`](#connection_pools-name "Click to copy link to name") * string

The connection pool name. This is an arbitrary name used to reference this connection in other parts of the configuration needing Redis.

Examples: `"shared_instance"` , `"Redis_for_ratelimit"`

##### [`opentelemetry`](#connection_pools-opentelemetry "Click to copy link to opentelemetry") object

The OpenTelemetry configuration establishing how to report Redis connection activity

##### [`disable_metrics`](#opentelemetry-disable_metrics "Click to copy link to disable_metrics") boolean

Disables any metrics of this Redis pool

Defaults to `false`

##### [`disable_traces`](#opentelemetry-disable_traces "Click to copy link to disable_traces") boolean

Disables any traces of this Redis pool

Defaults to `false`

##### [`traces_static_attributes`](#opentelemetry-traces_static_attributes "Click to copy link to traces_static_attributes") array Show properties

Static attributes you want to pass for traces.

Each item of traces\_static\_attributes accepts the following properties:

##### [`key`](#traces_static_attributes-key "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#traces_static_attributes-value "Click to copy link to value") string

The value of the static attribute you want to send

##### [`password`](#connection_pools-password "Click to copy link to password") string

Sets the password to connect to Redis.

##### [`pool_size`](#connection_pools-pool_size "Click to copy link to pool_size") integer

The pool size defines the number of concurrent Redis commands that can be executed by this Redis pool. Take into account that this only saves the connection time to the server, but, Redis will still be a non-concurrent service. When `0` it maps to its default 10

Defaults to `10`

##### [`pool_timeout`](#connection_pools-pool_timeout "Click to copy link to pool_timeout") string

Amount of time the client waits for a connection if all connections are busy.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

##### [`tls`](#connection_pools-tls "Click to copy link to tls") object

An object with any [client TLS configuration](https://www.krakend.io/docs/enterprise/service-settings/tls/#client-tls-settings) to this connection

##### [`user_name`](#connection_pools-user_name "Click to copy link to user_name") string

The username to connect to Redis

Schema: [https://www.krakend.io/schema/v3.0/redis.json](https://www.krakend.io/schema/v3.0/redis.json "JSON schema definition")

## Configuration of Redis clusters

The configuration of Redis cluster is identical to connection pools, except that the `addresses` field is an array, that the `db` is not available, and a new field `max_redirects` is added.

A simple configuration would look like this:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "redis": {
      "clusters": [
        {
          "name": "shared_redis_cluster",
          "addresses": ["192.168.1.45:6379", "192.168.1.52:6379"]
        }
      ]
    }
  }
}
```

The full list of options is:

##### Configuration of Redis Clusters

\* required fields

##### [`clusters`](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/#clusters "Click to copy link to clusters") array of objects

Defines all the clusters available to Redis functionality. The different components requiring Redis will access the pool based on its name

Each item of clusters accepts the following properties:

##### [`addresses`](#clusters-addresses "Click to copy link to addresses") * array of strings

The list of redis members that conform the cluster using the format `host:port`. All members must be WRITEABLE

Example: `["192.168.1.45:6379","192.168.1.52:6379"]`

##### [`client_name`](#clusters-client_name "Click to copy link to client_name") string

You can set how this connection shows in Redis when listing all the connections `CONN LIST`

Example: `"krakend_pool"`

##### [`conn_max_idle_time`](#clusters-conn_max_idle_time "Click to copy link to conn_max_idle_time") string

The maximum amount of time a connection may be idle. Should be less than server’s timeout.Expired connections may be closed lazily before reuse. If &lt;= 0, connections are not closed due to a connection’s idle time.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30m"`

##### [`conn_max_life_time`](#clusters-conn_max_life_time "Click to copy link to conn_max_life_time") string

The maximum amount of time a connection may be reused. When the attribute is not declared, the connection does not expire

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

##### [`dial_timeout`](#clusters-dial_timeout "Click to copy link to dial_timeout") string

Dial timeout for establishing new connections

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"5s"`

##### [`max_active_conns`](#clusters-max_active_conns "Click to copy link to max_active_conns") integer

Maximum number of connections allocated by the pool at a given time. When zero, there is no limit on the number of connections in the pool.

Defaults to `0`

##### [`max_idle_conns`](#clusters-max_idle_conns "Click to copy link to max_idle_conns") integer

Maximum number of idle connections. The value `0` means connections not closed

Defaults to `0`

##### [`max_redirects`](#clusters-max_redirects "Click to copy link to max_redirects") integer

The maximum number of redirects to follow when requesting a key that is in another instance

Defaults to `3`

##### [`max_retries`](#clusters-max_retries "Click to copy link to max_retries") integer

The number of times you want to retry a Redis command using a different connection from the pool, applying a random delay between `min_retry_backoff` and `max_retry_backoff`. Use `-1` to never retry (it might not be a good idea)

Defaults to `3`

##### [`max_retry_backoff`](#clusters-max_retry_backoff "Click to copy link to max_retry_backoff") string

Every retry is executed increasing randomly starting at the `min_retry_backoff` until the `max_retry_backoff` is reached. This is the longest possible time.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"512ms"`

##### [`min_idle_conns`](#clusters-min_idle_conns "Click to copy link to min_idle_conns") integer

Minimum number of idle connections which is useful when establishing new connection is slow. `0` means connections are not closed.

Defaults to `0`

##### [`min_retry_backoff`](#clusters-min_retry_backoff "Click to copy link to min_retry_backoff") string

Every retry is executed increasing randomly starting at the `min_retry_backoff` until the `max_retry_backoff` is reached. This is the shortest possible time.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"8ms"`

##### [`name`](#clusters-name "Click to copy link to name") * string

The connection pool name. This is an arbitrary name used to reference this connection in other parts of the configuration needing Redis.

Examples: `"shared_instance"` , `"Redis_for_ratelimit"`

##### [`opentelemetry`](#clusters-opentelemetry "Click to copy link to opentelemetry") object

The OpenTelemetry configuration establishing how to report Redis connection activity

##### [`disable_metrics`](#opentelemetry-disable_metrics "Click to copy link to disable_metrics") boolean

Disables any metrics of this Redis pool

Defaults to `false`

##### [`disable_traces`](#opentelemetry-disable_traces "Click to copy link to disable_traces") boolean

Disables any traces of this Redis pool

Defaults to `false`

##### [`traces_static_attributes`](#opentelemetry-traces_static_attributes "Click to copy link to traces_static_attributes") array Show properties

Static attributes you want to pass for traces.

Each item of traces\_static\_attributes accepts the following properties:

##### [`key`](#traces_static_attributes-key "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#traces_static_attributes-value "Click to copy link to value") string

The value of the static attribute you want to send

##### [`password`](#clusters-password "Click to copy link to password") string

Sets the password to connect to Redis.

##### [`pool_size`](#clusters-pool_size "Click to copy link to pool_size") integer

The pool size defines the number of concurrent Redis commands that can be executed by this Redis pool. Take into account that this only saves the connection time to the server, but, Redis will still be a non-concurrent service. When `0` it maps to its default 10

Defaults to `10`

##### [`pool_timeout`](#clusters-pool_timeout "Click to copy link to pool_timeout") string

Amount of time the client waits for a connection if all connections are busy.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

##### [`tls`](#clusters-tls "Click to copy link to tls") object

An object with any [client TLS configuration](https://www.krakend.io/docs/enterprise/service-settings/tls/#client-tls-settings) to this connection

##### [`user_name`](#clusters-user_name "Click to copy link to user_name") string

The username to connect to Redis

Schema: [https://www.krakend.io/schema/v3.0/redis.json](https://www.krakend.io/schema/v3.0/redis.json "JSON schema definition")

## Best practices for Redis connection management

While the library sets defaults for all the options (except the address and the name), you might want to tweak several of the parameters available. Generally speaking, **the additional parameters are not needed**. A few things to have in mind when configuring pools and clusters:

- Set realistic timeouts and limits: Use appropriate values for timeouts and connection limits to prevent overloading Redis and ensure smooth operations during peak traffic.
- Don’t disable monitoring: Let OpenTelemetry to track metrics and traces, helping you identify and address potential bottlenecks. Add the [Redis Grafana dashboard](https://www.krakend.io/docs/enterprise/telemetry/grafana/) for greater visibility.
- Align pools with functionality: Use separate pools for different functionalities to isolate workloads and ensure predictable performance.
