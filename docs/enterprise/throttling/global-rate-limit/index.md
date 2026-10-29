# Stateful service rate limit (Redis backed)

> Implement global rate limiting in KrakenD API Gateway's Enterprise Edition to control and manage API traffic at a global level

Source: https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/

The Redis rate limit functionality enables a Redis database store to centralize all KrakenD rate limit counters. Instead of having each KrakenD node count its hits in memory, the counters are global and persist in the database.

![](https://www.krakend.io/images/documentation/krakend-global-rate-limit.png "Global rate limit")

## Rate limit (stateless) vs. Redis-backed rate limit (stateful)

It’s essential to understand the differences between these two antagonistic approaches, so let’s put an example.

Let’s say you have four different KrakenD nodes running in a cluster and want to limit a specific group of users to **100 requests per second**.

With the **stateless rate limit** (`qos/ratelimit/service`), every KrakenD node only knows about itself. Whatever is happening in the rest of the nodes is not visible to itself. Since you have four KrakenD boxes, you need to write a limit of 25 reqs/s in the configuration. When all nodes run simultaneously and balance equally, you get the average limit of 100 reqs/s. Users can see rejections when the system runs to almost the configured limit’s total capacity. Some nodes will already reach their limit, while others still have a margin. If you ever deploy a 5th machine with the same configuration, your total rate limit upgrades to 125 reqs/s. You are adding 25reqs/s more capacity with the new node. But if you remove instead one of the four nodes, your total rate limit would be 75 reqs/s.

On the other hand, the **stateful rate limit** (`qos/ratelimit/service/redis`) uses a shared Redis store by all neighbors, and all nodes are affected and aware of other’s activity. Awareness comes from all KrakenD nodes reading and writing the counters on the central database, knowing the real number of hits on the whole platform. The limits are invariable if you add or remove nodes on the fly.

From a business perspective, the Global rate limit might sound more attractive. In contrast, from an architectural point of view, the default rate limit is much better as it offers infinite scalability, no network dependency, and much higher throughput.

Our recommendation (an engineer writing) is always to use the stateless rate limit.

## Configuration

To configure Redis-backed rate limits, you must declare at least two namespaces. One with the Redis configuration and another that sets the rate limit values. The two namespaces could look like this:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "shared_instance",
          "address": "redis:6379"
        }
      ]
    },
    "qos/ratelimit/service/redis": {
      "connection_pool": "shared_instance",
      "on_failure_allow": false,
      "max_rate": 10,
      "capacity": 10,
      "client_max_rate": 10,
      "client_capacity": 10,
      "every": "1m",
      "strategy": "header",
      "key": "x-client-id"
    }
  }
}
```

The `redis` namespace allows you to set a [lot of Redis pool options](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/). The two basic ones are the `name` and the `address` as shown above. Then, the namespace `qos/ratelimit/service/redis` defines how the Service Rate Limit is going to work. The properties you can set in this namespace are:

##### Fields of Redis-backed Rate Limit

\* required fields

Minimum configuration needs **any of**: `connection_pool` + `max_rate` , or `connection_pool` + `client_max_rate` , or `connection_name` + `max_rate` , or `connection_name` + `client_max_rate`

##### [`capacity`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#capacity "Click to copy link to capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **all users together** at **any given instant**. When the gateway starts, the bucket is full. As requests from users come, the remaining tokens in the bucket decrease. At the same time, the `max_rate` refills the bucket at the desired rate until its maximum capacity is reached. The default value for the `capacity` is the `max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `max_rate`.

Defaults to `1`

##### [`client_capacity`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#client_capacity "Click to copy link to client_capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **each individual user** at **any given instant**. Works just as `capacity`, but instead of having one bucket for all users, keeps a counter for every connected client and endpoint, and refills from `client_max_rate` instead of `max_rate`. The client is recognized using the `strategy` field (an IP address, a token, a header, etc.). The default value for the `client_capacity` is the `client_max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `client_max_rate`.

Defaults to `1`

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#client_max_rate "Click to copy link to client_max_rate") number

Number of tokens you add to the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) for each individual user (*user quota*) in the time interval you want (`every`). The remaining tokens in the bucket are the requests a specific user can do. It keeps a counter for every client and endpoint. Keep in mind that every KrakenD instance keeps its counters in memory for **every single client**.

##### [`connection_name`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#connection_name "Click to copy link to connection_name") string

The connection pool name or cluster name that is used by this ratelimit. The value must match what you configured in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/)

##### [`connection_pool`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#connection_pool "Click to copy link to connection_pool") string Deprecated

The connection pool name that is used by this ratelimit. The value must match what you configured in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/)

##### [`every`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`key`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#key "Click to copy link to key") string

Available when using `client_max_rate` and you have set a `strategy` equal to `header` or `param`. It makes no sense in other contexts. For `header` it is the header name containing the user identification (e.g., `Authorization` on tokens, or `X-Original-Forwarded-For` for IPs). When they contain a list of space-separated IPs, it will take the IP from the client that hit the first trusted proxy. For `param` it is the name of the placeholder used in the endpoint, like `id_user` for an endpoint `/user/{id_user}`.

Examples: `"X-Tenant"` , `"Authorization"` , `"id_user"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#max_rate "Click to copy link to max_rate") number

Sets the maximum number of requests all users can do in the given time frame. Internally uses the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) algorithm. The absence of `max_rate` in the configuration or a `0` is the equivalent to no limitation. You can use decimals if needed.

##### [`on_failure_allow`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#on_failure_allow "Click to copy link to on_failure_allow") boolean

Whether you want to allow a request to continue when the Redis connection is failing or not. The default behavior blocks the request if Redis is not responding correctly

Defaults to `false`

##### [`strategy`](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/#strategy "Click to copy link to strategy")

Available when using `client_max_rate`. Sets the strategy you will use to set client counters. Choose `ip` when the restrictions apply to the client’s IP address, or set it to `header` when there is a header that identifies a user uniquely. That header must be defined with the `key` entry.

Possible values are: `"ip"` , `"header"` , `"param"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/redis.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/redis.json "JSON schema definition")

## Migrating from the old Redis plugin (legacy)

KrakenD Enterprise v2.8 deprecated the `redis-ratelimit` plugin in favor of the native namespace `qos/ratelimit/service/redis`, which offers a better way of dealing with stateful functionality, and v3.0 removed it.

To migrate, you need to remove the plugin configuration from your settings, and put the values in the new namespace.

Here is a diff example to compare the previous and the new configurations:

```diff
<   "plugin": {
<     "pattern": ".so",
<     "folder": "/opt/krakend/plugins/"
<   },
<   "extra_config": {
<     "plugin/http-server": {
<       "name": [
<         "redis-ratelimit"
<       ],
<       "redis-ratelimit": {
<         "host": "redis:6379",
<         "tokenizer": "jwt",
<         "tokenizer_field": "sub",
<         "burst": 10,
<         "rate": 10,
<         "period": "60s"
<       }
<     }
<   }
< }
---
> "qos/ratelimit/service/redis": {
>       "redis_instance": "shared_instance",
>       "on_failure_allow": false,
>       "client_max_rate": 10,
>       "client_capacity": 10,
>       "every": "60s",
>       "strategy": "jwt",
>       "key": "sub"
>     }
```

The changes you need to do are:

- The `plugin` entry can be removed entirely from the configuration **if you don’t have other plugins**.
- Instead of the `plugin/http-server` entry in the service `extra_config`, you must add a `redis` namespace that declares the connection pools (now you can have many)
- Instead of the `redis-ratelimit` field inside the plugin, you have to declare the new namespace `qos/ratelimit/service/redis` under the service `extra_config`, at the same level than the `redis` namespace.

In all, the **new Redis configuration** should be similar to this:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "redis": {
      "nodes": [
        {
          "name": "shared_instance",
          "host": "redis:6379"
        }
      ]
    },
    "qos/ratelimit/service/redis": {
          "redis_instance": "shared_instance",
          "on_failure_allow": false,
          "max_rate": 10,
          "capacity": 10,
          "client_max_rate": 10,
          "client_capacity": 10,
          "every": "60s",
          "strategy": "jwt",
          "key": "sub"
        }
      }
}
```

To see the documentation of the old Redis plugin, browse the documentation for KrakenD Enterprise v2.7 or older.
