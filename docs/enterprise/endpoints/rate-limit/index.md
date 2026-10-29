# Rate Limiting API Gateway Endpoints

> Implement rate-limiting strategies in KrakenD API Gateway to control the number of requests and prevent API abuse or overloading

Source: https://www.krakend.io/docs/enterprise/endpoints/rate-limit/

The router rate limit feature allows you to set the **maximum requests** a KrakenD endpoint (a route) will accept in a **given time window**. There are two different strategies to set limits that you can use separately or together:

- **Endpoint rate-limiting** (`max_rate`): applies simultaneously to all clients using the endpoint, sharing a unique counter.
- **User rate-limiting** (`client_max_rate`): sets a counter to each individual user.

Both types can coexist and they complement each other, and store the counters **in-memory**. On a cluster, each machine sees and counts only its passing traffic.

There are [additional types of rate-limiting](https://www.krakend.io/docs/enterprise/throttling/).

Token Bucket

The rate limiting is based internally on the [Token Bucket algorithm](https://www.krakend.io/docs/enterprise/throttling/token-bucket/). If you are unfamiliar with it, read the link to understand how it works.

## Comparing `max_rate` and `client_max_rate`

Imagine you have Mary and Fred using your API, and they connect to an endpoint `/v1/checkout/payment` that you want to rate-limit. If you add a `max_rate`, you limit the activity they generate together. It does not matter who is making more or fewer requests; the endpoint will be inaccessible for everyone once the throughput surpasses the limit you have set.

On the other hand, adding the `client_max_rate` monitors Fred and Mary’s activity separately. If one of them is an abuser, the access is cut, while the other can continue to use the endpoint.

The `max_rate` (also available as [proxy rate-limit](https://www.krakend.io/docs/enterprise/backends/rate-limit/)) is an absolute number that gives you exact control over how much traffic you allow to hit the backend or endpoint. In an eventual DDoS, the `max_rate` can help in a way since it won’t accept more traffic than allowed. On the other hand, a single host could abuse the system by taking a significant percentage of that quota.

The `client_max_rate` is a limit per client, and it won’t help you if you just want to control the total traffic, as the total traffic supported by the backend or endpoint depends on the number of different requesting clients. A DDoS will then happily pass through, but you can keep any particular abuser limited to its quota.

As we said, you can set the two limiting strategies individually or together. Have in mind the following considerations:

- Setting the **client rate limit alone** on a platform with many users can lead to a heavy load on your backends. For instance, if you have 200,000 active users in your platform at a given time and you allow each client ten requests per second (`client_max_rate: 10`, `every: 1s`), the permitted total traffic for the endpoint is 200,000 users x 10 req/s = 2M req/s
- Setting the **endpoint rate limit alone** can lead to a single abuser limiting all other users in the platform.

So, in most cases, it is better to play them together. Adding also a [Circuit Breaker](https://www.krakend.io/docs/enterprise/backends/circuit-breaker/) is even better.

## Configuration

The `max_rate` and `client_max_rate` configurations are under a common namespace, `qos/ratelimit/router` (QoS stands for Quality of Service).

For instance, let’s start with a simple and mixed example that sets two limits:

- `50` requests every `10m` (10 minutes) among all clients
- `5` requests per client every `10m`, identified by ip.

```json
{
    "endpoint": "/limited-endpoint",
    "extra_config": {
      "qos/ratelimit/router": {
          "max_rate": 50,
          "every": "10m",
          "client_max_rate": 5,
          "client_capacity": 5,
          "strategy": "ip"
      }
    }
}
```

An expanded and **more explicit configuration** that represents the same idea would be:

```json
{
    "endpoint": "/limited-endpoint",
    "extra_config": {
      "qos/ratelimit/router": {
          "max_rate": 50,
          "every": "10m",
          "client_max_rate": 5,

          "strategy": "ip",
          "capacity": 50,
          "client_capacity": 5
      }
    }
}
```

In this configuration, we have set the IP `strategy`, which considers that every IP accessing the gateway is a different client. However, a client could be a JWT token, a header, or even a parameter.

We have also set the `capacity` for the `max_rate` and the `client_capacity` for the `client_max_rate`, which sets the maximum buffer for any given instant. See below.

## Endpoint rate-limiting (`max_rate`)

The endpoint rate limit acts on the number of simultaneous transactions an endpoint can process. This type of limit protects the service for all customers. In addition, these limits mitigate abusive actions such as rapidly writing content, aggressive polling, or excessive API calls.

It consumes low memory as it only needs one counter per endpoint.

When the users connected to an endpoint together exceed the `max_rate`, KrakenD starts to reject connections with a status code `503 Service Unavailable` and enables a [Spike Arrest](https://www.krakend.io/docs/enterprise/throttling/spike-arrest/) policy.

Example:

```json
{
    "endpoint": "/endpoint",
    "extra_config": {
      "qos/ratelimit/router": {
          "@comment":"A thousand requests every hour",
          "max_rate": 1000,
          "every": "1h"
      }
    }
}
```

##### Endpoint rate limit options

\* required fields

##### [`capacity`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#capacity "Click to copy link to capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **all users together** at **any given instant**. When the gateway starts, the bucket is full. As requests from users come, the remaining tokens in the bucket decrease. At the same time, the `max_rate` refills the bucket at the desired rate until its maximum capacity is reached. The default value for the `capacity` is the `max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `max_rate`.

Defaults to `1`

##### [`every`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#max_rate "Click to copy link to max_rate") number

Sets the maximum number of requests all users can do in the given time frame. Internally uses the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) algorithm. The absence of `max_rate` in the configuration or a `0` is the equivalent to no limitation. You can use decimals if needed.

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json "JSON schema definition")

## Client rate-limiting (`client_max_rate`)

The client or user rate limit applies one counter to each individual user and endpoint. Each endpoint can have different limit rates, but all users are subject to the same rate.

A note on performance

Limiting endpoints per user makes KrakenD keep in-memory counters for the two dimensions: *endpoints x clients*.

The `client_max_rate` is more resource-consuming than the `max_rate` as every incoming client needs individual tracking. Even though counters are space-efficient and very small in data, many endpoints with many concurrent users will lead to higher memory consumption.

When a single user connected to an endpoint exceeds their `client_max_rate,` KrakenD starts rejecting connections with a status code `429 Too Many Requests` and enables a [Spike Arrest](https://www.krakend.io/docs/enterprise/throttling/spike-arrest/) policy.

Each client’s counter is stored in memory only for the time needed to deliver the traffic restriction properly. The needed time is calculated automatically based on your configuration, and we call this time the **TTL**. A specific routine (or more) deletes outdated counters during runtime. See micro-optimizations below for more details.

Example:

```json
{
    "endpoint": "/endpoint",
    "extra_config": {
      "qos/ratelimit/router": {
          "@comment":"20 requests every 5 minutes",
          "client_max_rate": 20,
          "client_capacity": 20,
          "every": "5m",
          "strategy": "ip"
    }
  }
}
```

The following configuration options are specific to the client rate limiting:

##### Client rate limit options

\* required fields

##### [`client_capacity`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#client_capacity "Click to copy link to client_capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **each individual user** at **any given instant**. Works just as `capacity`, but instead of having one bucket for all users, keeps a counter for every connected client and endpoint, and refills from `client_max_rate` instead of `max_rate`. The client is recognized using the `strategy` field (an IP address, a token, a header, etc.). The default value for the `client_capacity` is the `client_max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `client_max_rate`.

Defaults to `1`

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#client_max_rate "Click to copy link to client_max_rate") number

Number of tokens you add to the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) for each individual user (*user quota*) in the time interval you want (`every`). The remaining tokens in the bucket are the requests a specific user can do. It keeps a counter for every client and endpoint. Keep in mind that every KrakenD instance keeps its counters in memory for **every single client**.

##### [`every`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`key`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#key "Click to copy link to key") string

Available when using `client_max_rate` and you have set a `strategy` equal to `header` or `param`. It makes no sense in other contexts. For `header` it is the header name containing the user identification (e.g., `Authorization` on tokens, or `X-Original-Forwarded-For` for IPs). When they contain a list of space-separated IPs, it will take the IP from the client that hit the first trusted proxy. For `param` it is the name of the placeholder used in the endpoint, like `id_user` for an endpoint `/user/{id_user}`.

Examples: `"X-Tenant"` , `"Authorization"` , `"id_user"`

##### [`strategy`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#strategy "Click to copy link to strategy")

Available when using `client_max_rate`. Sets the strategy you will use to set client counters. Choose `ip` when the restrictions apply to the client’s IP address, or set it to `header` when there is a header that identifies a user uniquely. That header must be defined with the `key` entry.

Possible values are: `"ip"` , `"header"` , `"param"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json "JSON schema definition")

Below, you’ll see different interpretations of what a client is.

### Client rate-limiting by token claim

Setting a rate limit for every issued token could be as easy as:

```json
{
  "endpoint": "/foo",
  "extra_config": {
    "auth/validator": {
      "@comment": "Omitted for simplicity"
    },
    "qos/ratelimit/router": {
      "client_max_rate": 100,
      "client_capacity": 100,
      "every": "1h",
      "strategy": "header",
      "key": "Authorization"
    }
  }
}
```

The endpoint now limits to 100 requests per hour to every different valid token (valid because the [JWT validator](https://www.krakend.io/docs/enterprise/authorization/jwt-validation/) takes care of it).

But instead of rate limiting based on the whole token, you can also rate limit based on claims of the token by propagating claims as headers. For instance, let’s say you want to **rate-limit a specific department**, and your JWT token contains a claim `department`.

If you have token validation and use the client rate-limiting with a `strategy` of `header`, you can set an arbitrary header name for the counter identifier. Propagated headers are available at the endpoint and backend levels, allowing you to set limits based on JWT criteria.

You could have a configuration like this:

```json
{
  "endpoint": "/token-ratelimited",
  "input_headers": [
    "x-limit-department"
  ],
  "extra_config": {
    "auth/validator": {
      "propagate_claims": [
        ["department","x-limit-department"]
      ]
    },
    "qos/ratelimit/router": {
      "client_max_rate": 100,
      "client_capacity": 100,
      "every": "1h",
      "strategy": "header",
      "key": "x-limit-department"
    }
  }
}
```

Notice that the `propagate_claims` in the validator adds the claim `department` value into a new header, `x-limit-department`. The header is also added under `input_headers` because otherwise, the endpoint wouldn’t see it ([zero-trust security](https://www.krakend.io/docs/enterprise/design/zero-trust/)). Finally, the rate limit uses the new header as a strategy and specifies its name under `key`.

The department can now do `100` requests every `hour`. You can extrapolate this to any other claim, like the subject or anything else you need.

### Rate-limiting by URL parameter

A different case of the `client_max_rate` is when used with the `strategy` equal to `param`. Instead of limiting a specific user (through a token, a claim, or a header), you consider that the client comes in the URL as a parameter. For instance, you provide an API containing endpoints like `/api/{customer_id}/invoices`, and you want to consider that every different `customer_id` is a different client.

In that case, you can rate limit the parameter of the endpoint as follows:

```json
{
  "endpoint": "/api/{customer_id}/invoices",
  "extra_config": {
    "qos/ratelimit/router": {
      "client_max_rate": 5,
      "client_capacity": 5,
      "every": "1m",
      "strategy": "param",
      "key": "customer_id"
    }
  }
}
```

The configuration above would allow 5 requests to `/api/1234/invoices` every minute and another 5 to `/api/5678/invoices`. In a scenario like this, it would be advisable that you add a [security policy](https://www.krakend.io/docs/enterprise/security-policies/) Enterprise that makes sure clients cannot abuse the rate limits of others.

### Micro-optimizations of the client\_rate\_limit

There are a few advanced values that you can add to the rate limit if you want to fine-tune CPU and Memory consumption. These values are not needed in most of the cases, but the door is open to tune how the rate limit works internally.

##### Micro-optimization of rate limiting

\* required fields

##### [`cleanup_period`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#cleanup_period "Click to copy link to cleanup_period") string

The cleanup period is how often the routine(s) in charge of optimizing the memory dedicated will go iterate all counters looking for outdated TTL and remove them. A low value keeps the memory slightly decreasing, but as a trade-off, it will increase the CPU dedicated to achieving this optimization. This is an advanced micro-optimization setting that should be used with caution.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1m"`

##### [`cleanup_threads`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#cleanup_threads "Click to copy link to cleanup_threads") integer

These are the number of routines that search for and remove outdated rate limit counters. The more routine(s) you add, the faster the memory optimization is completed, but the more CPU it will consume. Generally speaking, a single thread is more than enough because the delete operation is very fast, even with a large number of counters. This is an advanced micro-optimization setting that you should use with caution.

Defaults to `1`

##### [`num_shards`](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/#num_shards "Click to copy link to num_shards") integer

All rate limit counters are stored in memory in groups (shards). All counters in the same shard share a mutex (which controls that one counter is modified at a time), and this helps with contention. Having, for instance, 2048 shards (default) and 1M users connected concurrently (same instant) means that each user will need to coordinate writes in their counter with an average of under 500 other users (1M/2048=489). Lowering the shards might increase contention and latency but free additional memory. This is an advanced micro-optimization setting that should be used with caution.

Defaults to `2048`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json "JSON schema definition")

Example:

```json
{
  "endpoint": "/api/invoices",
  "extra_config": {
    "qos/ratelimit/router": {
      "client_max_rate": 5,
      "client_capacity": 5,
      "every": "1m",
      "strategy": "ip",
      "num_shards": 2048,
      "cleanup_period": "60s",
      "cleanup_threads": 1
    }
  }
}
```

### Examples of per-second rate limiting

The following examples demonstrate a configuration with several endpoints, each one setting different limits. As they don’t set an `every` section, they will use the default of one second (`1s`):

- A `/happy-hour` endpoint with unlimited usage as it sets `max_rate = 0`
- A `/happy-hour-2` endpoint is equivalent to the previous one, as it has no rate limit configuration.
- A `/limited-endpoint` combines `client_max_rate` and `max_rate` together. It is capped at 50 reqs/s for all users, AND their users can make up to 5 reqs/s (where a user is a different IP)
- A `/user-limited-endpoint` is not limited globally, but every user (identified with `X-Auth-Token` can make up to 10 reqs/sec).

Configuration:

```json
{
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/happy-hour",
      "extra_config": {
        "qos/ratelimit/router": {
          "max_rate": 0,
          "client_max_rate": 0
        }
      },
      "backend": [
        {
          "url_pattern": "/__health",
          "host": [
            "http://localhost:8080"
          ]
        }
      ]
    },
    {
      "endpoint": "/happy-hour-2",
      "backend": [
        {
          "url_pattern": "/__health",
          "host": [
            "http://localhost:8080"
          ]
        }
      ]
    },
    {
      "endpoint": "/limited-endpoint",
      "extra_config": {
        "qos/ratelimit/router": {
          "max_rate": 50,
          "client_max_rate": 5,
          "client_capacity": 5,
          "strategy": "ip"
        }
      }
    },
    {
      "endpoint": "/user-limited-endpoint",
      "extra_config": {
        "qos/ratelimit/router": {
          "client_max_rate": 10,
          "client_capacity": 10,
          "strategy": "header",
          "key": "X-Auth-Token"
        }
      },
      "backend": [
        {
          "url_pattern": "/__health",
          "host": [
            "http://localhost:8080"
          ]
        }
      ]
    }
  ]
}
```

### Examples of per-minute or per-hour rate limiting

The rate limit component measures the router activity using the time window selected under `every`. You can use hours or minutes instead of seconds or you could even set daily or monthly rate-limiting, but taking into account that the counters reset every time you deploy the configuration.

To use units larger than an hour, just express the days by hours. Using large units is not convenient if you often deploy (unless you use the persisted [Redis rate limit Enterprise](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/) )

For example, let’s say you want the endpoint to cut the access at `30 reqs/day`. It means that within a day, whether the users exhaust the 30 requests in one second or gradually across the day, you won’t let them do more than `30` every day. So how do we apply this to the configuration?

The configuration would be:

```json
{
  "qos/ratelimit/router": {
    "@comment": "Client rate limit of 30 reqs/day",
    "client_max_rate": 30,
    "client_capacity": 30,
    "every": "24h",
    "strategy": "ip"
  }
}
```

Similarly, 30 requests every 5 minutes, could be set like this.

```json
{
  "qos/ratelimit/router": {
    "@comment": "Endpoint rate limit of 30 reqs/hour",
    "max_rate": 30,
    "every": "5m",
    "capacity": 30
  }
}
```

In summary, the `client_max_rate` and the `max_rate` set the speed at which you refill new usage tokens to the user. On the other hand, the `capacity` and `client_capacity` let you play with the buffer you give to the users and let them spend 30 requests in a single second (within the 5 minutes) or not.

For more information, see the [Token Bucket algorithm](https://www.krakend.io/docs/enterprise/throttling/token-bucket/).
