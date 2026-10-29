# Rate Limiting  Backends

> Implement rate limiting in KrakenD API Gateway backends to control and manage API usage, preventing abuse and ensuring fair resource allocation

Source: https://www.krakend.io/docs/enterprise/backends/rate-limit/

No matter what amount of activity the users generate at the router level, you can limit KrakenD’s connections to your backends. The configuration is similar to the [router’s rate limit](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/), but it’s declared directly in the `backend` section instead of the `endpoint`.

The limit applies **per defined backend entry** and does not consider the activity other backends generate. Each `backend` entry handles its counters and does not share them with different backends or endpoints.

The proxy rate limit is defined in the `krakend.json` configuration file as follows:

```json
{
    "endpoint": "/products/{cat_id}",
    "backend": [{
        "host": ["http://some.api.com/"],
        "url_pattern": "/catalog/category/{cat_id}.rss",
        "encoding": "rss",
        "extra_config": {
            "qos/ratelimit/proxy": {
                "max_rate": 0.5,
                "every": "1s",
                "capacity": 1
            }
        }
    }]
}
```

These are the parameters you can set:

##### Fields of Backend Ratelimit

\* required fields

##### [`capacity`](https://www.krakend.io/docs/enterprise/backends/rate-limit/#capacity "Click to copy link to capacity") * integer

The capacity according to the [token bucket algorithm](https://www.krakend.io/docs/throttling/token-bucket/). Defines the maximum requests you can do in an instant (including the zero moment when you start the gateway), and can be larger or smaller than the `max_rate`. When unsure, use the same value of `max_rate`, so the maximum number of requests can be consumed at once.

Defaults to `1`

##### [`every`](https://www.krakend.io/docs/enterprise/backends/rate-limit/#every "Click to copy link to every") string

Time period in which the counter works. For instance, if you set an `every` of `10m` and a `max_rate` of `5`, you are allowing 5 requests every ten minutes.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"1s"`

##### [`max_rate`](https://www.krakend.io/docs/enterprise/backends/rate-limit/#max_rate "Click to copy link to max_rate") * number

Maximum requests per second you want to accept in this backend.

Example: `0.5`

Schema: [https://www.krakend.io/schema/v3.0/qos/ratelimit/proxy.json](https://www.krakend.io/schema/v3.0/qos/ratelimit/proxy.json "JSON schema definition")

## Comparison with router rate limit

In a nutshell:

- The [router rate limit](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/) controls the requests users do to KrakenD.
- The proxy rate limit controls KrakenD’s requests to your services.

You don’t have to choose one or the other; you can mix the different types as they cover additional use cases.
