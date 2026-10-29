# Stateful endpoint rate limit (Redis backed)

> Implement endpoint rate limiting in KrakenD API Gateway's Enterprise Edition to control and manage API traffic at an endpoint level using Redis as the backend.

Source: https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/

The **Stateful Endpoint Rate Limit based on Redis** centralizes the activity of all KrakenD instances rate limiting. It works identically to the [stateful service rate limit](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/) but applies the limits to specific endpoints instead of the whole service.

![](https://www.krakend.io/images/documentation/krakend-global-rate-limit.png "Global rate limit")

You should always use the stateless rate limit unless an unavoidable business rule forces you to choose this one. The stateless rate limit does not need any database and does not generate network activity to manage the token bucket. From a functional perspective, both rate limits, stateless and stateful, offer the same features. The difference lies in the fact that in the stateless, each node counts on its traffic, while the stateful counts all traffic. But don’t be misled; with a stateless rate limit, you can achieve the same results without adding a network dependency, even when you scale up and down your infrastructure.

## Redis rate-limit endpoint configuration

To configure Redis-backed rate limits on your endpoints, you must declare at least two namespaces. One with the Redis configuration at the service level (`redis` namespace), and another that sets the rate limit values in the desired endpoint’s `extra_config` with the namespace `qos/ratelimit/router/redis`.

The following configuration enables 10 requests per minute to the `/foo` endpoint, based on the identity of the `sub` claim present in the JWT token:

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
  },
  "endpoints": [
    {
      "endpoint": "/foo",
      "extra_config": {
        "qos/ratelimit/router/redis": {
          "connection_name": "shared_instance",
          "on_failure_allow": false,
          "client_max_rate": 10,
          "client_capacity": 10,
          "every": "1m",
          "strategy": "jwt",
          "key": "sub"
        }
      }
    }
  ]
}
```

The `redis` namespace allows you to set a [lot of Redis pool options](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/). The two basic ones are the `name` and the `address` as shown above. Then, the namespace `qos/ratelimit/router/redis` defines how the endpoint Rate Limit will work in this endpoint. The properties you can set in this namespace are the same as you find in the [stateful service rate limit](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/):

##### Fields of Redis-backed Rate Limit

\* required fields

Minimum configuration needs **any of**: `connection_pool` + `max_rate` , or `connection_pool` + `client_max_rate` , or `connection_name` + `max_rate` , or `connection_name` + `client_max_rate`

##### [`capacity`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#capacity "Click to copy link to capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **all users together** at **any given instant**. When the gateway starts, the bucket is full. As requests from users come, the remaining tokens in the bucket decrease. At the same time, the `max_rate` refills the bucket at the desired rate until its maximum capacity is reached. The default value for the `capacity` is the `max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `max_rate`.

Defaults to `1`

##### [`client_capacity`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#client_capacity "Click to copy link to client_capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **each individual user** at **any given instant**. Works just as `capacity`, but instead of having one bucket for all users, keeps a counter for every connected client and endpoint, and refills from `client_max_rate` instead of `max_rate`. The client is recognized using the `strategy` field (an IP address, a token, a header, etc.). The default value for the `client_capacity` is the `client_max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `client_max_rate`.

Defaults to `1`

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#client_max_rate "Click to copy link to client_max_rate") number

Number of tokens you add to the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) for each individual user (*user quota*) in the time interval you want (`every`). The remaining tokens in the bucket are the requests a specific user can do. It keeps a counter for every client and endpoint. Keep in mind that every KrakenD instance keeps its counters in memory for **every single client**.

##### [`connection_name`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#connection_name "Click to copy link to connection_name") string

The connection pool name or cluster name that is used by this ratelimit. The value must match what you configured in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/)

##### [`connection_pool`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#connection_pool "Click to copy link to connection_pool") string Deprecated

The connection pool name that is used by this ratelimit. The value must match what you configured in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/)

##### [`every`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`key`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#key "Click to copy link to key") string

Available when using `client_max_rate` and you have set a `strategy` equal to `header` or `param`. It makes no sense in other contexts. For `header` it is the header name containing the user identification (e.g., `Authorization` on tokens, or `X-Original-Forwarded-For` for IPs). When they contain a list of space-separated IPs, it will take the IP from the client that hit the first trusted proxy. For `param` it is the name of the placeholder used in the endpoint, like `id_user` for an endpoint `/user/{id_user}`.

Examples: `"X-Tenant"` , `"Authorization"` , `"id_user"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#max_rate "Click to copy link to max_rate") number

Sets the maximum number of requests all users can do in the given time frame. Internally uses the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) algorithm. The absence of `max_rate` in the configuration or a `0` is the equivalent to no limitation. You can use decimals if needed.

##### [`on_failure_allow`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#on_failure_allow "Click to copy link to on_failure_allow") boolean

Whether you want to allow a request to continue when the Redis connection is failing or not. The default behavior blocks the request if Redis is not responding correctly

Defaults to `false`

##### [`strategy`](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/#strategy "Click to copy link to strategy")

Available when using `client_max_rate`. Sets the strategy you will use to set client counters. Choose `ip` when the restrictions apply to the client’s IP address, or set it to `header` when there is a header that identifies a user uniquely. That header must be defined with the `key` entry.

Possible values are: `"ip"` , `"header"` , `"param"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/redis.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/redis.json "JSON schema definition")
