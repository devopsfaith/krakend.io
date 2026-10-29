# Rate Limit Tiers

> KrakenD's tiered rate limiting allows you to apply different rate limits based on user levels or API clients, ensuring fair usage and protecting your services efficiently.

Source: https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/

The rate limit based on tiers allows you to have **multiple sets of [service](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/) and [endpoint](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/) rate limits** that apply differently to users depending on their tier or sometimes called subscription plans.

There are four variants of the Tiered Rate Limit:

- Service Tiered Rate Limit (stateless)
- Endpoint Tiered Rate Limit (stateless)
- Service Tiered Rate Limit consolidated to Redis (stateful)
- Endpoint Tiered Rate Limit consolidated to Redis (stateful)

The **service rate limits apply to all traffic** in the gateway, while the **endpoint rate limits apply to specific endpoints** where you include them.

Choose stateless

The stateless option is the most performant solution, using the server RAM to manage the activity. The stateful options based on Redis centralize the management in a Redis database, which has an extra network hop and dependency. Choose the stateless solution whenever possible.

## How do tiers work?

For example, Mary has a Gold plan that entitles her to make more requests per second than John, who is in an inferior Silver plan:

![tiered-rate-limit-example.mmd diagram](https://www.krakend.io/images/documentation/diagrams/tiered-rate-limit-example.mmd.svg)

The tiered rate limit component allows you to get a header from the requests that set the tier a user belongs to. Then, the limits apply depending on the plan.

When a request comes in, the gateway must be able to identify two things:

- **Who is doing the request**. You will need to specify in the configuration which `strategy` to use to identify the user, and under which `key` is this information (e.g., a header, an IP, a claim in a token, etc.)
- **Which tier the user has**. You will need to set in the configuration where to find the tier value (or the plan name). It must be in a header or somewhere else.

Once the user is properly identified and associated with a tier, you can set multiple behaviors for the different tiers or even set a fallback behavior.

## Tiered rate-limiting configuration

The tiers configuration uses the `extra_config`’s namespace `qos/ratelimit/tiered` and can be done either at the service level (root) or the endpoint level. When you set the tiers at the service level, you define the tiers for all API endpoints. On the endpoint level, you set the tiers for that specific endpoint.

The `tiers` configuration object is an array with all the different tiers available, which are **evaluated in order**. This means that if a user can match more than one plan, the first plan matching in the list is the rate limit applied to them.

The configuration of the tiers is as follows:

##### Fields of Tiered Rate Limit

\* required fields

##### [`tier_key`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#tier_key "Click to copy link to tier_key") * string

The header name containing the tier name. The string you provide is case-insensitive. If you need to take the value from a place that is not a header (a token, an API key), you must use propagate functions in the components that convert values to internal headers.

##### [`tiers`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#tiers "Click to copy link to tiers") * array of objects

The list of all tier definitions and limits for each. Each item in the list is a tier object.

Each item of tiers accepts the following properties:

##### [`ratelimit`](#tiers-ratelimit "Click to copy link to ratelimit") object

The rate limit definition. This is an object with the same attributes the [service rate limit](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/) has.

##### [`ratelimit_redis`](#tiers-ratelimit_redis "Click to copy link to ratelimit_redis") object

The stateful rate limit definition. This is an object with the same attributes the [stateful service rate limit](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/) has.

##### [`tier_value`](#tiers-tier_value "Click to copy link to tier_value") string

The tier value. When you use `literal`, it is the tier name. When you use `policy`, it is the expression you want to evaluate to determine if the user matches this tier or not (see security policies for syntax).

Examples: `"gold"` , `"silver"` , `"value.matches('User-[a-zA-Z]+')"`

Defaults to `""`

##### [`tier_value_as`](#tiers-tier_value_as "Click to copy link to tier_value_as")

Determines how to parse the value found in the tier header. When `literal` is used, the exact value of the header is compared against the tier name. When `policy` is used, the value is used to evaluate a policy. When `*` is used, all values will match. Make sure to put the `*` as the last tier; otherwise the rest will be ignored.

Possible values are: `"literal"` , `"policy"` , `"*"`

Defaults to `"literal"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/tiered.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/tiered.json "JSON schema definition")

As you can see, all tier definitions come with an associated `ratelimit` object and/or a `ratelimit_redis`. You can set a stateless rate limit and a stateful rate limit simultaneously. This can be used as a contention measure, so if Redis fails for whatever reason, you have a secondary rate limit that does not need network connectivity. When you enable both options, all rate limits act simultaneously, so do some math!

### Stateless tiered rate limit

The stateless `ratelimit` object accepts the following properties:

##### Configuration for each \`ratelimit\` in the tier

\* required fields

Minimum configuration needs **any of**: `max_rate` , or `client_max_rate`

##### [`capacity`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#capacity "Click to copy link to capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **all users together** at **any given instant**. When the gateway starts, the bucket is full. As requests from users come, the remaining tokens in the bucket decrease. At the same time, the `max_rate` refills the bucket at the desired rate until its maximum capacity is reached. The default value for the `capacity` is the `max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `max_rate`.

Defaults to `1`

##### [`cleanup_period`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#cleanup_period "Click to copy link to cleanup_period") string

The cleanup period is how often the routine(s) in charge of optimizing the memory dedicated will go iterate all counters looking for outdated TTL and remove them. A low value keeps the memory slightly decreasing, but as a trade-off, it will increase the CPU dedicated to achieving this optimization. This is an advanced micro-optimization setting that should be used with caution.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1m"`

##### [`cleanup_threads`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#cleanup_threads "Click to copy link to cleanup_threads") integer

These are the number of routines that search for and remove outdated rate limit counters. The more routine(s) you add, the faster the memory optimization is completed, but the more CPU it will consume. Generally speaking, a single thread is more than enough because the delete operation is very fast, even with a large number of counters. This is an advanced micro-optimization setting that you should use with caution.

Defaults to `1`

##### [`client_capacity`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#client_capacity "Click to copy link to client_capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **each individual user** at **any given instant**. Works just as `capacity`, but instead of having one bucket for all users, keeps a counter for every connected client and endpoint, and refills from `client_max_rate` instead of `max_rate`. The client is recognized using the `strategy` field (an IP address, a token, a header, etc.). The default value for the `client_capacity` is the `client_max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `client_max_rate`.

Defaults to `1`

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#client_max_rate "Click to copy link to client_max_rate") number

Number of tokens you add to the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) for each individual user (*user quota*) in the time interval you want (`every`). The remaining tokens in the bucket are the requests a specific user can do. It keeps a counter for every client and endpoint. Keep in mind that every KrakenD instance keeps its counters in memory for **every single client**.

##### [`every`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`key`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#key "Click to copy link to key") string

Available when using `client_max_rate` and you have set a `strategy` equal to `header` or `param`. It makes no sense in other contexts. For `header` it is the header name containing the user identification (e.g., `Authorization` on tokens, or `X-Original-Forwarded-For` for IPs). When they contain a list of space-separated IPs, it will take the IP from the client that hit the first trusted proxy. For `param` it is the name of the placeholder used in the endpoint, like `id_user` for an endpoint `/user/{id_user}`.

Examples: `"X-Tenant"` , `"Authorization"` , `"id_user"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#max_rate "Click to copy link to max_rate") number

Sets the maximum number of requests all users can do in the given time frame. Internally uses the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) algorithm. The absence of `max_rate` in the configuration or a `0` is the equivalent to no limitation. You can use decimals if needed.

##### [`num_shards`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#num_shards "Click to copy link to num_shards") integer

All rate limit counters are stored in memory in groups (shards). All counters in the same shard share a mutex (which controls that one counter is modified at a time), and this helps with contention. Having, for instance, 2048 shards (default) and 1M users connected concurrently (same instant) means that each user will need to coordinate writes in their counter with an average of under 500 other users (1M/2048=489). Lowering the shards might increase contention and latency but free additional memory. This is an advanced micro-optimization setting that should be used with caution.

Defaults to `2048`

##### [`strategy`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#strategy "Click to copy link to strategy")

Available when using `client_max_rate`. Sets the strategy you will use to set client counters. Choose `ip` when the restrictions apply to the client’s IP address, or set it to `header` when there is a header that identifies a user uniquely. That header must be defined with the `key` entry.

Possible values are: `"ip"` , `"header"` , `"param"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json "JSON schema definition")

#### Example: Stateless Tiered Rate Limit at the Service level

The following configuration sets four different stateless tiers at the service level, which would apply to all endpoints defined in the configuration simultaneously:

```json
{
  "version": 4,
  "host": [
    "http://localhost:8080"
  ],
  "endpoints": [],
  "extra_config": {
    "qos/ratelimit/tiered": {
      "tier_key": "X-Plan",
      "tiers": [
        {
          "tier_value": "admin",
          "tier_value_as": "literal",
          "ratelimit": {
            "client_max_rate": 100,
            "client_capacity": 100,
            "every": "1m",
            "max_rate": 10000,
            "strategy": "header",
            "key": "X-Account-Id"
          }
        },
        {
          "tier_value": "user",
          "tier_value_as": "literal",
          "ratelimit": {
            "client_max_rate": 20,
            "client_capacity": 20,
            "every": "1m",
            "max_rate": 10000,
            "strategy": "header",
            "key": "X-Account-Id"
          }
        },
        {
          "tier_value": "value.matches('Account-[a-zA-Z]+')",
          "tier_value_as": "policy",
          "ratelimit": {
            "client_max_rate": 20,
            "client_capacity": 20,
            "every": "1m",
            "strategy": "header",
            "key": "X-USER-ID"
          }
        },
        {
          "tier_value": "",
          "tier_value_as": "*",
          "ratelimit": {
            "client_max_rate": 2,
            "client_capacity": 2,
            "every": "1m",
            "strategy": "ip"
          }
        }
      ]
    }
  }
}
```

In the configuration above, we have defined the following behavior:

- When a request comes with an `X-Plan` header with the value `admin`, each user can do 100 reqs per minute. The user uniqueness comes in the `X-Account-Id` header. In addition, all users of the admin tier can make up to 10000 requests together.
- When a request comes with an `X-Plan` header with the value `user`, each user can do 20 reqs per minute.
- When a request comes with an `X-Plan`, its value is matched against the policy `Account-[a-zA-Z]+` , e.g., if it contains `Account-abcdef`, then it rates to 20 per minute.
- A final special tier `*` (which you must place at the end) matches the remaining cases and sets to 2 req/s based on their IP address. This would rate limit unknown accounts.

### Stateful Redis-backed tiered rate limit

The stateful `ratelimit_redis` object accepts the following properties:

##### Configuration for each \`ratelimit\_redis\` in the tier

\* required fields

Minimum configuration needs **any of**: `connection_pool` + `max_rate` , or `connection_pool` + `client_max_rate` , or `connection_name` + `max_rate` , or `connection_name` + `client_max_rate`

##### [`capacity`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#capacity "Click to copy link to capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **all users together** at **any given instant**. When the gateway starts, the bucket is full. As requests from users come, the remaining tokens in the bucket decrease. At the same time, the `max_rate` refills the bucket at the desired rate until its maximum capacity is reached. The default value for the `capacity` is the `max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `max_rate`.

Defaults to `1`

##### [`client_capacity`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#client_capacity "Click to copy link to client_capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **each individual user** at **any given instant**. Works just as `capacity`, but instead of having one bucket for all users, keeps a counter for every connected client and endpoint, and refills from `client_max_rate` instead of `max_rate`. The client is recognized using the `strategy` field (an IP address, a token, a header, etc.). The default value for the `client_capacity` is the `client_max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `client_max_rate`.

Defaults to `1`

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#client_max_rate "Click to copy link to client_max_rate") number

Number of tokens you add to the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) for each individual user (*user quota*) in the time interval you want (`every`). The remaining tokens in the bucket are the requests a specific user can do. It keeps a counter for every client and endpoint. Keep in mind that every KrakenD instance keeps its counters in memory for **every single client**.

##### [`connection_name`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#connection_name "Click to copy link to connection_name") string

The connection pool name or cluster name that is used by this ratelimit. The value must match what you configured in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/)

##### [`connection_pool`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#connection_pool "Click to copy link to connection_pool") string Deprecated

The connection pool name that is used by this ratelimit. The value must match what you configured in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/)

##### [`every`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`key`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#key "Click to copy link to key") string

Available when using `client_max_rate` and you have set a `strategy` equal to `header` or `param`. It makes no sense in other contexts. For `header` it is the header name containing the user identification (e.g., `Authorization` on tokens, or `X-Original-Forwarded-For` for IPs). When they contain a list of space-separated IPs, it will take the IP from the client that hit the first trusted proxy. For `param` it is the name of the placeholder used in the endpoint, like `id_user` for an endpoint `/user/{id_user}`.

Examples: `"X-Tenant"` , `"Authorization"` , `"id_user"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#max_rate "Click to copy link to max_rate") number

Sets the maximum number of requests all users can do in the given time frame. Internally uses the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) algorithm. The absence of `max_rate` in the configuration or a `0` is the equivalent to no limitation. You can use decimals if needed.

##### [`on_failure_allow`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#on_failure_allow "Click to copy link to on_failure_allow") boolean

Whether you want to allow a request to continue when the Redis connection is failing or not. The default behavior blocks the request if Redis is not responding correctly

Defaults to `false`

##### [`strategy`](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/#strategy "Click to copy link to strategy")

Available when using `client_max_rate`. Sets the strategy you will use to set client counters. Choose `ip` when the restrictions apply to the client’s IP address, or set it to `header` when there is a header that identifies a user uniquely. That header must be defined with the `key` entry.

Possible values are: `"ip"` , `"header"` , `"param"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/redis.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/redis.json "JSON schema definition")

#### Example: Redis-based tiered rate limit ant the Service level

As we have seen, two of the different variants of this Rate Limit are stateful and support Redis. The only difference is that instead of using the `ratelimit` entry, you use `ratelimit_redis`. But remember, you can use both at the same time if needed! Here’s an example configuration using Redis:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "shared_instance",
          "host": "shared.redis.example.com"
        }
      ]
    },
    "qos/ratelimit/tiered": {
      "tier_key": "X-Rate-Tier",
      "tiers": [
        {
          "tier_value": "admin",
          "tier_value_as": "literal",
          "ratelimit_redis": {
            "connection_pool": "default",
            "on_failure_allow": true,
            "client_max_rate": 10,
            "client_capacity": 10,
            "max_rate": 10000,
            "every": "1s",
            "strategy": "header",
            "key": "X-Rate-Client-Id"
          }
        }
      ]
    }
  },
  "endpoints": []
}
```

## Tier evaluation

When there are [multiple rate limits in the configuration](https://www.krakend.io/docs/enterprise/throttling/) (tiered rate limit is just one of them), the `qos/ratelimit/tiered` evaluates in the first place. If the user has not reached the usage limit, the rest are checked, having a behavior of consistently applying the most restrictive rate limit.

Speaking of the tiered rate limit alone, when the tiers evaluate, it’s done sequentially. The first tier matching its definition applies, and no additional tiers are checked. Be careful when using the special tier `*` that matches any request, and always set it in the **last position of the array**.

Pay attention to similar attributes like `tier_key` and the inner `ratelimit` attribute `key`. The `tier_key` tells which header contains the **tier name** (or plan), while the `key` sets which element are we going to use to count hits to the user.

## Extracting the tier from a JWT token

As the tiers work with a header, if you want to extract them from a JWT, you must use the `propagate_headers` attribute to specify which claim contains the tier. As JWT validation is only available at the endpoint level, the tier definition must go inside each endpoint. We recommend using Flexible Configuration to reduce the repeat code in your configuration.

For instance, a JWT token containing a claim `plan`, and the identity of the user under the `sub` claim could be configured as this (in this example, we have an endpoint tiered rate limit):

```json
{
  "endpoint": "/foo",
  "extra_config": {
    "auth/validator": {
      "propagate_claims": [
        [
          "plan",
          "X-Plan"
        ],
        [
          "sub",
          "X-Account-Id"
        ]
      ]
    },
    "qos/ratelimit/tiered": {
      "tier_key": "X-Plan",
      "tiers": [
        {
          "tier_value": "admin",
          "tier_value_as": "literal",
          "ratelimit": {
            "client_max_rate": 100,
            "client_capacity": 100,
            "every": "1m",
            "max_rate": 10000,
            "strategy": "header",
            "key": "X-Account-Id"
          }
        }
      ]
    }
  }
}
```

As you can see, the JWT validator converts de JWT claims to the headers `X-Plan` and `X-Account-Id` using `propagate_claims`. Then, the component `qos/ratelimit/tiered` uses the first propagated header `X-Plan` to know which tier needs to use, and the second `X-Account-Id` header to know which user is being rate limited.

## Using the API Key role as tier definition

Similarly, [API Keys](https://www.krakend.io/docs/enterprise/authentication/api-keys/) work with propagated headers too. You can use the role of an API key as the tier definition, both at the service and endpoint levels. To do so, you only need to use the `propagate_role` attribute in the API keys:

```json
{
  "version": 4,
  "extra_config": {
    "auth/api-keys": {
      "strategy": "header",
      "identifier": "Authorization",
      "propagate_role": "X-Krakend-Role",
      "keys": [
        {
          "key": "4d2c61e1-34c4-e96c-9456-15bd983c5019",
          "roles": [
            "user"
          ],
          "@description": "ACME Inc."
        },
        {
          "key": "58427514-be32-0b52-b7c6-d01fada30497",
          "roles": [
            "admin",
            "user"
          ],
          "@description": "Administrators Inc."
        }
      ]
    },
    "qos/ratelimit/tiered": {
      "tier_key": "X-Krakend-Role",
      "tiers": [
        {
          "tier_value": "admin",
          "tier_value_as": "literal",
          "ratelimit": {
            "client_max_rate": 100,
            "client_capacity": 100,
            "every": "1m",
            "max_rate": 10000,
            "strategy": "header",
            "key": "Authorization"
          }
        },
        {
          "tier_value": "",
          "tier_value_as": "*",
          "ratelimit": {
            "client_max_rate": 1,
            "client_capacity": 1,
            "every": "1m",
            "max_rate": 10,
            "strategy": "header",
            "key": "Authorization"
          }
        }
      ]
    }
  }
}
```

Notice that the `key` used in the `ratelimit` of each plan matches the `identifier` of the API Key. Notice that there is also a special tier `*` for nonmatching tiers that is used as the default, but keep in mind that the API key component can pass as `tier_value` the string `ANY` when the endpoint does not require roles, so you might want to add a tier with this value as well.
