# API Governance using Quota

Source: https://www.krakend.io/docs/enterprise/governance/quota/

The Quota feature allows teams to enforce quota limits by tier, enabling API monetization strategies such as freemium plans, usage-based tiers, and differentiated service levels, but also helps you **contain the expenses** when using external APIs or AI providers.

The Quota system is equally powerful in **egress and ingress scenarios**:

- On the **egress side**, organizations can enforce internal consumption controls. For instance, when KrakenD acts as an **AI Gateway** proxying to LLM models or metered third-party APIs. By applying quotas per team, product, etc, you can **prevent runaway spend**, cap daily/weekly/monthly/yearly usage, or restrict access to premium services, keeping your operational budget under control.
- On the **ingress side**, when exposing public APIs, quotas become the foundation of **monetization models**. You can define consumption tiers (e.g., Free, Pro, Enterprise), enforce usage ceilings based on subscription level, and enable freemium or trial plans with precision. This protects your backend infrastructure from abuse and creates opportunities to align API usage with business value, enabling pay-per-use, overage billing, and developer self-service models, all driven by configuration.

Quotas use **persistence backed by Redis**, which survives deployments and restarts, and serves as a central point for tracking activity.

## Quotas vs Rate Limiting

There are [8 types of rate-limiting](https://www.krakend.io/docs/enterprise/throttling/#rate-limiting), but here we are talking about something close but not the same. It is important to understand that although quotas and rate-limits seem similar, they serve different purposes. Traditional [throttling and rate-limiting](https://www.krakend.io/docs/enterprise/throttling/) in KrakenD (like the [service](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/), [endpoint](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/), [tiered](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/), or [proxy](https://www.krakend.io/docs/enterprise/backends/rate-limit/) rate-limits) operate in-memory per-node, and they are **stateless and fast**.

Difference between Quotas and Rate Limits

The purpose of a rate limit is to **prevent abuse** because it monitors a short period (like a second or minute). In contrast, the purpose of a quota is more closely related to **usage control** as it monitors a longer period (a day, month, etc.).

A rate limit will cut traffic when there are many connections per second, while the quota might cut you when you spend your monthly plan.

They might be used together and are complementary.

### Architectural differences

If you want to limit the API’s usage alone, a stateless rate-limiting is the best design architectural pattern you can choose. But if you need more, a rate limit has the following **business limitations**:

- You don’t have a long-term global state.
- Limit exhaustion does not survive service restarts or redeployments.
- Complicated monetization or **contractual enforcement**.
- It is not designed to track usage over long periods (but close to a second).

In contrast, the persistent **quota system**:

- Shares state across all KrakenD nodes via Redis, making all nodes aware of the global counting in a cluster.
- Supports long-term with low-use definitions, e.g., 1000 calls/month (in contrast to 10 calls/second).
- Allows custom weighting of requests (e.g., based on LLM token cost, or API cost).
- Enables parallel multi-interval policies (hourly, daily, monthly, yearly), counting all at once.
- It is the foundation for API monetization, freemium models, and service-level enforcement.

It’s not that one is better than the other; they serve very different goals.

## Quota Configuration

The quota system requires at least three configuration blocks:

1. A `redis` entry with the [**connection details**](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/) at the `extra_config` of the service level. The minimum supported Redis version is `7.4` (as quotas use the `HEXPIRE` command).
2. A `governance/processors` entry that defines the **global declaration of quota processors** that are responsible for keeping track of counters and rejecting requests.
3. A `governance/quota` entry that **attaches a processor and enforces the quota**. You can attach this namespace to the service (root of the configuration), or inside endpoints and backends.

The differences and nuances are explained below.

### 1. Redis connection details

As quotas are stateful, they require storage. The counters are kept in a shared `redis` configuration that you need to place at the root of the configuration. Here’s an example configuration:

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
        }
      ]
    }
  }
}
```

Redis connection pools and clusters are fully explained in the [Redis Connection Pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/) section. Visit the link for more parameters and customization. What is important here is that the `name` you choose here, which is internal for KrakenD and can be anything human-readable for you, is the one you use later on when defining the processor.

### 2. Global declaration of quota processors

The second thing you need at the service level is to define a **processor of quota**. The `governance/processors` property is an object under the global `extra_config` that defines the available processors and rulesets you will have. You can declare multiple quotas (e.g., a quota for internal LLM usage and another for your customers), and they can be connected to different Redis pools. Each quota defines multiple `rules` to enforce; you can see them as your “plans”, like “gold”, “silver”, “bronze”, etc. Each rule or plan can have multiple limits, because you might want to set limitations per hour, day, month, etc.

The processors take care of **bookkeeping hits and denying access** when a threshold is met. Still, they don’t know anything about requests or how to identify a user, which will be the job of our last component, the `governance/quota`. The gateway can keep multiple processors working simultaneously, even when they are of the same type.

See the following example:

```json
{
  "version": 4,
  "extra_config": {
    "governance/processors": {
      "quotas": [
        {
          "name": "public_plans",
          "connection_name": "shared_redis_pool",
          "hash_keys": true,
          "on_failure_allow": false,
          "rejecter_cache": {
            "N": 10000000,
            "P": 1e-8,
            "hash_name": "optimal"
          },
          "rules": [
            {
              "name": "gold",
              "limits": [
                { "amount": 10, "unit": "hour" },
                { "amount": 200, "unit": "day" }
              ]
            },
            {
              "name": "bronze",
              "limits": [
                  { "amount": 5, "unit": "hour" },
                  { "amount": 100, "unit": "day" }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

The configuration above defines a processor that will connect to a Redis service defined as `shared_redis_pool`, and will prefix all keys with `public_plans`. There is one rule for the gold plan and another for the bronze plan, which is limited to half of the requests. In addition, it has a `rejecter_cache` where a local memory cache keeps track of rejections by Redis, so it is not queried that often, and a known overuser is kicked without needing to query Redis and avoid the network roundtrip.

At this point, the quotas are not in place yet; they are only declared, and we need to attach them to specific places.

The list of possible properties to declare quotas is:

##### Fields of Governance processors

\* required fields

##### [`quotas`](https://www.krakend.io/docs/enterprise/governance/quota/#quotas "Click to copy link to quotas") * array of objects

The list of quota processors available for attachment. You can have multiple processors with different configurations.

Each item of quotas accepts the following properties:

##### [`connection_name`](#quotas-connection_name "Click to copy link to connection_name") * string

The name of the [Redis connection](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/) to use, it must exist under the `redis` namespace at the service level and written exactly as declared.

##### [`deny_queue_flush_interval`](#quotas-deny_queue_flush_interval "Click to copy link to deny_queue_flush_interval") string

When you have a `rejecter_cache`, the time interval to write the events stored in the buffer in the bloom filter. This is the maximum time that can elapse before the events are written to the bloom filter.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`deny_queue_flush_threshold`](#quotas-deny_queue_flush_threshold "Click to copy link to deny_queue_flush_threshold") integer

When you have a `rejecter_cache`, the maximum number of events in the buffer that will force a write to the bloom filter event when the flush interval has not kicked in yet.

Defaults to `10`

##### [`deny_queue_size`](#quotas-deny_queue_size "Click to copy link to deny_queue_size") integer

When you have a `rejecter_cache`, the size of the buffer (number of events stored) to write in the bloomfilter. It defaults to the number of cores on the machine. This is the maximum number of events that can be stored in memory before being written to the bloom filter. You should not set this value unless you are seeing increased latencies on very high-concurrency scenarios; ask support for help.

##### [`hash_keys`](#quotas-hash_keys "Click to copy link to hash_keys") boolean

Whether to hash the keys used for quota consumption. If you have PII (Personal Identifiable Information) in the keys (like an email), enable this option to `true` to avoid Redis containing clear text keys with PII. This is a setting for privacy, enabling it may affect performance because of the extra hashing, and makes data exploration difficult.

Defaults to `false`

##### [`name`](#quotas-name "Click to copy link to name") * string

Name of the quota. The exact name you type here is the one you need to reference when you attach a quota under the `governance/quota` namespace, and is also part of the key name on the persistence layer.

Examples: `"public_api"` , `"LLM"`

##### [`on_failure_allow`](#quotas-on_failure_allow "Click to copy link to on_failure_allow") boolean

What to do with the user request if Redis is down. When `true`, allows continuing to perform requests even when Redis is unreachable, but the quota won’t be counted. When `false`, the request is rejected and the user receives a 500 error. This is a fail-safe option, but it may lead to quota overconsumption.

##### [`on_failure_backoff_strategy`](#quotas-on_failure_backoff_strategy "Click to copy link to on_failure_backoff_strategy")

The backoff strategy to use when Redis is unreachable. The default is `exponential`, which means that the time between retries will increase exponentially. The other option is `linear`, which means that the time between retries will be constant.

Possible values are: `"linear"` , `"exponential"`

Defaults to `"exponential"`

##### [`on_failure_max_retries`](#quotas-on_failure_max_retries "Click to copy link to on_failure_max_retries") integer

Maximum number of retries to Redis when it is unreachable. Once the retries are exhausted, the processor is no longer usable and the quota stops working until the Redis connection is restored and the service restarted. The users will be able to consume content depending on the `on_failure_allow` option. A zero value means no retries.

Defaults to `0`

##### [`rejecter_cache`](#quotas-rejecter_cache "Click to copy link to rejecter_cache") object

The bloom filter configuration that you use to cache rejections. The bloom filter is used to store the events that are rejected by the quota processor. This is useful to avoid rejecting the same event multiple times.

##### [`N`](#rejecter_cache-N "Click to copy link to N") * integer

The maximum `N`umber of elements you want to keep in the bloom filter. Tens of millions work fine on machines with low resources.

Example: `10000000`

##### [`P`](#rejecter_cache-P "Click to copy link to P") * number

The `P`robability of returning a false positive. E.g.,`1e-7` for one false positive every 10 million different tokens. The values `N` and `P` determine the size of the resulting bloom filter to fulfill your expectations. E.g: 0.0000001

See: [https://www.krakend.io/docs/authorization/revoking-tokens/](https://www.krakend.io/docs/authorization/revoking-tokens/)

Example: `1e-7`

##### [`cleanup_interval`](#rejecter_cache-cleanup_interval "Click to copy link to cleanup_interval") string

The time interval to clean up the bloom filter. This is the maximum time that can elapse before the bloom filter is cleaned up.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"30m"`

##### [`hash_name`](#rejecter_cache-hash_name "Click to copy link to hash_name")

Either `optimal` (recommended) or `default`. The `optimal` consumes less CPU but has less entropy when generating the hash, although the loss is negligible.

See: [https://www.krakend.io/docs/authorization/revoking-tokens/](https://www.krakend.io/docs/authorization/revoking-tokens/)

Possible values are: `"optimal"` , `"default"`

Defaults to `"optimal"`

##### [`rules`](#quotas-rules "Click to copy link to rules") * array of objects

The rules to use for the quota processor.

Each item of rules accepts the following properties:

##### [`limits`](#rules-limits "Click to copy link to limits") * array of objects Show properties

The limits for the rule. The limits are defined as an array of objects, each object containing an amount and a unit.

Example: `[{"amount":10,"unit":"hour"},{"amount":250,"unit":"day"}]`

Each item of limits accepts the following properties:

##### [`amount`](#limits-amount "Click to copy link to amount") * number

The amount of the limit. This is the maximum number of requests that can be made in the given time unit.

##### [`unit`](#limits-unit "Click to copy link to unit") *

The time unit for the limit.

Possible values are: `"second"` , `"minute"` , `"hour"` , `"day"` , `"week"` , `"month"` , `"year"`

##### [`name`](#rules-name "Click to copy link to name") * string

The name of the rule. This is the name that will be used to identify the rule in the logs and metrics. It is also the plan name.

Examples: `"gold"` , `"silver"`

Schema: [https://www.krakend.io/schema/v3.0/governance/processors.json](https://www.krakend.io/schema/v3.0/governance/processors.json "JSON schema definition")

### 3. Attach a quota

Once the quotas are declared at a global level, it’s time to attach them. The `governance/quota` namespace is the quota enforcer that you can add to the service globally, on endpoints, or backends. As you can see below, it reuses the `quota_name` and the `rule_name` you declared previously, but also adds bits of behaviour, like how to count requests and what to do with unknown requests.

Here is an example of the full configuration with steps 1 to 3:

```json
{
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "shared_redis_pool",
          "address": "192.168.1.45:6379"
        }
      ]
    },
    "governance/processors": {
      "quotas": [
        {
          "name": "public_plans",
          "connection_name": "shared_redis_pool",
          "hash_keys": true,
          "on_failure_allow": false,
          "rejecter_cache": {
            "N": 10000000,
            "P": 1e-8,
            "hash_name": "optimal"
          },
          "rules": [
            {
              "name": "rule_gold",
              "limits": [
                { "amount": 10, "unit": "hour" },
                { "amount": 200, "unit": "day" }
              ]
            },
            {
              "name": "rule_bronze",
              "limits": [
                  { "amount": 5, "unit": "hour" },
                  { "amount": 100, "unit": "day" }
              ]
            }
          ]
        }
      ]
    },
    "governance/quota": {
      "quota_name": "public_plans",
      "on_unmatched_tier_allow": false,
      "weight_key": "credits_consumed",
      "weight_strategy": "body",
      "tier_key": "X-Level",
      "disable_quota_headers": false,
      "tiers": [
        {
          "rule_name": "rule_gold",
          "tier_value": "gold",
          "tier_value_as": "literal",
          "strategy": "header",
          "key": "X-User-Id"
        },
        {
          "comment": "Special case * that catches any requests not falling into one of the tiers above",
          "rule_name": "rule_bronze",
          "tier_value_as": "*",
          "strategy": "ip"
        }
      ]
    }
  }
}
```

This example is for the service level, but you can put the `governance/quota` namespace in an endpoint or in a `backend` as well. You will probably want to add a `governance/quota` in the following scope when:

- `service`: You don’t need to identify tiers based on JWT and want a single configuration for all the endpoints, no exceptions. At the service level, **everything is inspected for quota**, even a single `/__health` request.
- `endpoint`: In most cases, you want to add **ingress quota** to your API contract. Use [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) to avoid repeating code on every endpoint needing quota.
- `backend`: In cases where you want to put a quota between the gateway and upstream services or LLM (**egress quota**)

Notice that the concepts of ingress and egress are for illustration, but they are open to interpretation. Having an external user limited to consuming an external LLM through KrakenD could be both ingress and egress.

If a referenced processor or rule is missing, the config fails, and affected endpoints return `500` status codes.

The attributes you can see here are:

##### Fields of Attachment of a quota

\* required fields

##### [`disable_quota_headers`](https://www.krakend.io/docs/enterprise/governance/quota/#disable_quota_headers "Click to copy link to disable_quota_headers") boolean

When set to `true`, the quota headers `X-Quota-Limit`, `X-Quota-Remaining`, and `Retry-After` will not be added to the response. This is useful when you want to hide the quota information from the client.

Defaults to `false`

##### [`on_unmatched_tier_allow`](https://www.krakend.io/docs/enterprise/governance/quota/#on_unmatched_tier_allow "Click to copy link to on_unmatched_tier_allow") boolean

When a tier cannot be infered from the request, whether to allow the request to continue or not. In case a request does not match any of the tiers, the request will be rejected with a 400 error unless you set this to `true`.

Defaults to `false`

##### [`quota_name`](https://www.krakend.io/docs/enterprise/governance/quota/#quota_name "Click to copy link to quota_name") * string

Name of the quota you want to reuse, written exactly as declared under the `processors` list.

Example: `"my_quota"`

##### [`tier_key`](https://www.krakend.io/docs/enterprise/governance/quota/#tier_key "Click to copy link to tier_key") * string

Header used to determine the tier. Use `tier_value` and `tier_value_as` on each tier to determine how to match the value.

Examples: `"X-User-Tier"` , `"X-User-ID"`

##### [`tiers`](https://www.krakend.io/docs/enterprise/governance/quota/#tiers "Click to copy link to tiers") * array of objects

List of tiers to match against the request. The first tier that matches will be used to determine the quota to consume.

Each item of tiers accepts the following properties:

##### [`key`](#tiers-key "Click to copy link to key") string

The key (e.g., header name, IP, claim name) that contains the identity of the caller, like the user ID of who is doing the request. The key must be present in the request.

##### [`rule_name`](#tiers-rule_name "Click to copy link to rule_name") * string

Tier limit defined in the global `processor`. It must be within the defined `limits` of the quota\_name processor. If it’s not found, the system will complain at startup and affected endpoints will be degraded with a 500 error

##### [`strategy`](#tiers-strategy "Click to copy link to strategy")

Where to find the key containing the identity of the caller. Use `header` for headers, `ip` for the IP address of the caller, and `param` for an endpoint {parameter}.

Possible values are: `"header"` , `"ip"` , `"param"`

Defaults to `"header"`

##### [`tier_value`](#tiers-tier_value "Click to copy link to tier_value") string

Literal value or CEL expression to match.

##### [`tier_value_as`](#tiers-tier_value_as "Click to copy link to tier_value_as")

How to treat the value. In most cases the tier value contains the plan name, like `gold`, so you will choose `literal`. But you can also set in the value a security policy (CEL) that will evaluate to resolve the tier policy accordingly, or put an asterisk `*` to always match and use as your last and default tier.

Possible values are: `"literal"` , `"policy"` , `"*"`

Defaults to `"literal"`

##### [`weight_key`](https://www.krakend.io/docs/enterprise/governance/quota/#weight_key "Click to copy link to weight_key") string

Instead of incrementing the quota counter by one unit, use the value provided in a field or header with its dynamic value. For instance, an LLM can return how many tokens it consumed, and you can use that value to increment the quota counter. The value must be a parseable number, and the field or header must be present in the backend response. The `weight_key` is only used in the `endpoint` and `backend` scopes, and it is ignored in the service level.

##### [`weight_strategy`](https://www.krakend.io/docs/enterprise/governance/quota/#weight_strategy "Click to copy link to weight_strategy")

Where to find the key containing the counter value to increment. Use `body` for any type of encoding different than `no-op` and `header` for `no-op`.

Possible values are: `"body"` , `"header"`

Defaults to `"body"`

Schema: [https://www.krakend.io/schema/v3.0/governance/quota.json](https://www.krakend.io/schema/v3.0/governance/quota.json "JSON schema definition")

## Redis keys format

The storage of counters in Redis uses a [*Redis hash* type](https://redis.io/docs/latest/develop/data-types/hashes/) that stores an attribute for each dimension (current day, hour, month…). The key name follows the format `quota_name:tier_value_as:tier_value:key`.

If the setting `hash_keys` is set, the Redis key ending`...:key` is hashed. This will prevent the tracked key from being stored clearly in the database if it contains personal information (such as an email).

The Redis Hash will contain one property per dimension, using a letter plus a number. The letters and possible ranges are:

- `hX` Hour (where `X` is in the range 0-23)
- `dX` Day (`X` in the range 1-31)
- `wX` Week (range 1-53)
- `mX` Month (range 1-12)
- `yX` Current year (four digits)

For instance, if a request comes at `13:25` on 2025/01/04, the dimensions that could be computed are `h13`, `d4`, `w1`, `m1`, and `y2025`.

Here’s an example interacting with Redis for a quota named `public_plans` identified by a header that contains the `literal` value `gold`, when accessed by the user ID `1234`:

```
# redis-cli
127.0.0.1:6379> keys public_plans*
1) "public_plans:literal:gold:1234"
127.0.0.1:6379> hkeys public_plans:literal:gold:1234
1) "h13"
2) "d4"
127.0.0.1:6379> hget public_plans:literal:gold:1234 d4
"125"
```

From the example above, we can deduce that user 1234 made 125 calls on the fourth day at the 13th hour.

## How much quota is left?

When you place a `governance/quota` at the service or endpoint levels, **clients receive usage headers** unless you set the flag `disable_quota_headers` to `true` or use the `weight_key` property. These headers are: being:

- `Retry-After`: This header is set only when the limit is surpassed and the clients receive `429` status codes. It contains the number of seconds until the next quota refill. It is a standard header implemented in browsers for retrying.
- `X-Quota-Limit: "hour";n=10`: When the request is successful, it contains the total quota limit the user has within a time window (e.g., `hour`, `day`, etc.), and an `n=` which is the number of total hits permitted.
- `X-Quota-Remaining: "hour";n=9`: Similarly, the number of remaining hits in the time window, the quota left.

Clients might receive **multiple entries** of the `X-Quota-` headers, as you can set quotas that work in different time windows.

```
curl -i -H 'X-Level: MyPlan' http://localhost:8080/test
HTTP/1.1 200 OK
X-Quota-Limit: "hour";n=50
X-Quota-Limit: "day";n=250
X-Quota-Limit: "week";n=1000
X-Quota-Limit: "month";n=10000
X-Quota-Limit: "year";n=100000
X-Quota-Remaining: "hour";n=0
X-Quota-Remaining: "day";n=200
X-Quota-Remaining: "week";n=950
X-Quota-Remaining: "month";n=950
X-Quota-Remaining: "year";n=997050
Date: Fri, 4 May 2025 08:57:55 GMT
Content-Length: 250
```

The user will be able to make 200 more requests today, 950 more in the week, etc. although not in the current hour because they exhausted the hourly limit and this was the last one (remaining = 0).

On the other side, users with an exceeding quota will see a response like this:

```
curl -i -H 'X-Level: MyPlan' http://localhost:8080/test
HTTP/1.1 429 Too Many Requests
Retry-After: 5
Date: Fri, 4 May 2025 08:59:55 GMT
Content-Length: 0
```

The example above tells the user that there won’t be more quota for the next 5 seconds (when the hourly limit will be refiled).

## Quota over usage edge case

There is an edge case when you use the `weight_key` (you increment the usage counter based on the response), where any user with remaining quota credits could spend more than the configured amount.

The weight number in the response might be higher than the total amount of quota left. In that case, the gateway returns the service response to the user. Although they won’t be able to make more requests until the next refill, you must be aware that consuming above the quota in this scenario is possible.

Practical example:

You have configured a weekly quota of 1000 LLM tokens. A user has already spent 999 tokens and sends a new request (still within the limits), and the LLM spends 50 more tokens. The response is returned to the user, but the total spent tokens in that week is 1049 tokens.

You must remember that KrakenD **cannot predict the weight**, so as long as there is a remaining quota, it will allow users to make requests.

## Example use case of a monetization plan

Suppose you want to establish the following plans:

```
Gold users: 250 req/day
Bronze users: 100 req/day
Anonymous users: 10 req/day
```

Gold and Bronze users are known to you, and they set a header name `X-User-ID` (that could be [propagated by a JWT token](https://www.krakend.io/docs/authorization/jwt-validation/#propagate-jwt-claims-as-request-headers)) containing their identifier. Anonymous users on the other side, use the API without an identificator and you will limit based on the IP address they are using.

This idea is expressed with the following configuration `tiers` for the `governance/quota`:

```json
{
  "governance/quota": {
    "quota_name": "public_plans",
    "on_unmatched_tier_allow": false,
    "tier_key": "X-Plan",
    "tiers": [
      {
        "rule_name": "rule_gold",
        "tier_value": "gold",
        "tier_value_as": "literal",
        "strategy": "header",
        "key": "X-User-ID"
      },
      {
        "rule_name": "rule_bronze",
        "tier_value": "bronze",
        "tier_value_as": "literal",
        "strategy": "header",
        "key": "X-User-ID"
      },
      {
        "rule_name": "rule_anonymous",
        "tier_value_as": "*",
        "strategy": "ip"
      }
    ]
  }
}
```
