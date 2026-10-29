# Service Rate Limiting to Control API Usage

> Implement service rate limiting to control API usage and prevent abuse with KrakenD Enterprise. Follow our comprehensive guide to configure rate limits and ensure fair usage of your APIs.

Source: https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/

The service rate limit feature allows you to set the **maximum requests per second** a user or group of users can do to KrakenD and works analogously to the [endpoint rate limit](https://www.krakend.io/docs/endpoints/rate-limit/). There are two different strategies to set limits that you can use, simultaneously or individually:

- **Service rate-limit**: Defines the rate-limit that **all users** of your API can do together, sharing the same counter. For instance, you might want to limit the interaction from users to KrakenD to 10,000 requests/second to avoid a possible DDoS propagating to your backend services.
- **Client rate-limit**: Rate-limits what an individual user can do against all endpoints. For instance, a personal JWT token can make 100 requests/second to the API.

Both types keep **in-memory** an updated [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) expressing the remaining requests for a user or group of users.

For additional types of rate-limiting see the [Traffic management overview](https://www.krakend.io/docs/throttling/).

## Service rate-limiting (`max_rate`)

The service rate limit acts on the number of simultaneous transactions KrakenD allows to process. This type of limit protects the service from all customers. In addition, these limits mitigate abusive actions such as rapidly writing content, aggressive polling, or excessive API calls.

It consumes an insignificant amount of memory as it only needs **one counter for the whole system**.

When the users connected to an endpoint together exceed the `max_rate`, KrakenD starts to reject connections with a status code `503 Service Unavailable` and enables a [Spike Arrest](https://www.krakend.io/docs/throttling/spike-arrest/) policy

## Service client rate-limiting (`client_max_rate`)

The client or user rate limit applies to an individual user to all endpoints. Each endpoint can additionally have [sub-limit rates](https://www.krakend.io/docs/endpoints/rate-limit/), but all users are subject to the same rate.

The `client_max_rate` tracks one counter per different client.

When a single user connected to an endpoint exceeds their `client_max_rate`, KrakenD starts to reject connections with a status code `429 Too Many Requests` and enables a [Spike Arrest](https://www.krakend.io/docs/throttling/spike-arrest/) policy

## Service rate-limiting configuration

The configuration allows you to use both types of rate limits at the same time:

```json
{
    "version": 4,
    "extra_config": {
      "qos/ratelimit/service": {
          "max_rate": 50,
          "client_max_rate": 5,
          "strategy": "ip"
        }
    }
}
```

##### Fields of Endpoint ratelimit

\* required fields

Minimum configuration needs **any of**: `max_rate` , or `client_max_rate`

##### [`capacity`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#capacity "Click to copy link to capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **all users together** at **any given instant**. When the gateway starts, the bucket is full. As requests from users come, the remaining tokens in the bucket decrease. At the same time, the `max_rate` refills the bucket at the desired rate until its maximum capacity is reached. The default value for the `capacity` is the `max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `max_rate`.

Defaults to `1`

##### [`cleanup_period`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#cleanup_period "Click to copy link to cleanup_period") string

The cleanup period is how often the routine(s) in charge of optimizing the memory dedicated will go iterate all counters looking for outdated TTL and remove them. A low value keeps the memory slightly decreasing, but as a trade-off, it will increase the CPU dedicated to achieving this optimization. This is an advanced micro-optimization setting that should be used with caution.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1m"`

##### [`cleanup_threads`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#cleanup_threads "Click to copy link to cleanup_threads") integer

These are the number of routines that search for and remove outdated rate limit counters. The more routine(s) you add, the faster the memory optimization is completed, but the more CPU it will consume. Generally speaking, a single thread is more than enough because the delete operation is very fast, even with a large number of counters. This is an advanced micro-optimization setting that you should use with caution.

Defaults to `1`

##### [`client_capacity`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#client_capacity "Click to copy link to client_capacity") integer

Defines the maximum number of [tokens a bucket can hold](https://www.krakend.io/docs/throttling/token-bucket/), or said otherwise, how many requests will you accept from **each individual user** at **any given instant**. Works just as `capacity`, but instead of having one bucket for all users, keeps a counter for every connected client and endpoint, and refills from `client_max_rate` instead of `max_rate`. The client is recognized using the `strategy` field (an IP address, a token, a header, etc.). The default value for the `client_capacity` is the `client_max_rate` value expressed in seconds or 1 for smaller fractions. When unsure, use the same number as `client_max_rate`.

Defaults to `1`

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#client_max_rate "Click to copy link to client_max_rate") number

Number of tokens you add to the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) for each individual user (*user quota*) in the time interval you want (`every`). The remaining tokens in the bucket are the requests a specific user can do. It keeps a counter for every client and endpoint. Keep in mind that every KrakenD instance keeps its counters in memory for **every single client**.

##### [`every`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#every "Click to copy link to every") string

Time period in which the maximum rates operate. For instance, if you set an `every` of `10m` and a rate of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`key`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#key "Click to copy link to key") string

Available when using `client_max_rate` and you have set a `strategy` equal to `header` or `param`. It makes no sense in other contexts. For `header` it is the header name containing the user identification (e.g., `Authorization` on tokens, or `X-Original-Forwarded-For` for IPs). When they contain a list of space-separated IPs, it will take the IP from the client that hit the first trusted proxy. For `param` it is the name of the placeholder used in the endpoint, like `id_user` for an endpoint `/user/{id_user}`.

Examples: `"X-Tenant"` , `"Authorization"` , `"id_user"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#max_rate "Click to copy link to max_rate") number

Sets the maximum number of requests all users can do in the given time frame. Internally uses the [Token Bucket](https://www.krakend.io/docs/throttling/token-bucket/) algorithm. The absence of `max_rate` in the configuration or a `0` is the equivalent to no limitation. You can use decimals if needed.

##### [`num_shards`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#num_shards "Click to copy link to num_shards") integer

All rate limit counters are stored in memory in groups (shards). All counters in the same shard share a mutex (which controls that one counter is modified at a time), and this helps with contention. Having, for instance, 2048 shards (default) and 1M users connected concurrently (same instant) means that each user will need to coordinate writes in their counter with an average of under 500 other users (1M/2048=489). Lowering the shards might increase contention and latency but free additional memory. This is an advanced micro-optimization setting that should be used with caution.

Defaults to `2048`

##### [`strategy`](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/#strategy "Click to copy link to strategy")

Available when using `client_max_rate`. Sets the strategy you will use to set client counters. Choose `ip` when the restrictions apply to the client’s IP address, or set it to `header` when there is a header that identifies a user uniquely. That header must be defined with the `key` entry.

Possible values are: `"ip"` , `"header"` , `"param"`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/router.json "JSON schema definition")

A note on strategies:

- `"strategy": "ip"` When the restrictions apply to the client’s IP, and every IP is considered to be a different user. Optionally a `key` can be used to extract the IP from a custom header:
  
  - E.g, set `"key": "X-Original-Forwarded-For"` to extract the IP from a header containing a list of space-separated IPs (will take the first one).
- `"strategy": "header"` When the criteria for identifying a user comes from the value of a `key` inside the header. With this strategy, the `key` must also be present.
  
  - E.g., set `"key": "X-TOKEN"` to use the `X-TOKEN` header as the unique user identifier.
