# Semantic Cache for LLM and Agent Responses

> Cache LLM and backend responses by the semantic meaning of the request with the ai/semantic-cache namespace to cut token cost and latency.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/

The **semantic cache** stores responses keyed by the meaning of the request rather than by an exact match. KrakenD turns the request content into an embedding vector and, when a new request is close enough in meaning to one it has already seen, returns the stored response instead of calling the backend again. Use it in front of LLMs and agents, where users phrase the same question in many different ways and every call costs tokens and time. The result is lower token spend and latency, and you can enable it on any endpoint or backend.

Not the same as HTTP response caching

The semantic cache matches requests by meaning. It is different from the [backend response caching](https://www.krakend.io/docs/enterprise/backends/caching/) (`qos/http-cache`), which caches backend responses verbatim based on HTTP cache headers. Use response caching for identical, cacheable HTTP responses, and the semantic cache for paraphrased requests to AI backends.

## How the Semantic Cache Works

For each request, KrakenD takes the content you choose with `req_content` and converts it into a vector using an **embedder** (an ONNX model). It then queries Redis for the nearest stored vector. When the cosine distance between the incoming vector and a stored one is within `max_distance`, KrakenD treats it as a hit and returns the cached response without contacting the backend. When no stored vector is close enough, it is a miss: KrakenD calls the backend, returns the response, and stores it together with its vector for future requests.

A `max_distance` of `0` only matches identical vectors. A lower value requires requests to be more similar before they match, so it produces fewer but more precise hits. A higher value returns more hits at the risk of matching less related requests.

The semantic cache needs three things in place: an embedding model in ONNX format, a Redis connection to store the vectors and responses, and an embedder definition that links the two. You can optionally add OpenTelemetry to collect hit and miss metrics.

## Downloading an Embedding Model

The embedding model is not included in the KrakenD distribution; you must provide it. Either add it manually to the models directory, or download it from Hugging Face with the built-in command. The model must be in ONNX format.

The krakend ai download-model command 

````
$krakend ai download-model -h

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2-ee

Download model from Hugging Face. Model needs to have onnx format

Usage:
  krakend ai download-model [flags]

Examples:
krakend ai download-model -model sentence-transformers/all-MiniLM-L6-v2

Flags:
  -h, --help               help for download-model
  -m, --model string       model to download (default "sentence-transformers/all-MiniLM-L6-v2")
  -o, --onnx-path string   model .onnx file (default "onnx/model.onnx")
  -p, --path string        path where to download models to (default "/etc/krakend/models")
  -v, --verbose            verbose mode
````

To download the default model into the default `/etc/krakend/models` directory:

Downloading an embedding model 

```
$krakend ai download-model -model sentence-transformers/all-MiniLM-L6-v2
```

### Model Download Cache Directory

The `download-model` command first downloads the model files into a local Hugging Face cache, and then copies them to the `--path` directory. The cache lives in `$XDG_CACHE_HOME/huggingface/hub`, or in `$HOME/.cache/huggingface/hub` when `XDG_CACHE_HOME` is not set. When the model is already in the cache, the command reuses it and skips the download.

The download fails when you run the command as a system user without a home directory and `XDG_CACHE_HOME` is not set. To choose the cache location, set the `XDG_CACHE_HOME` environment variable:

Setting the download cache directory 

```
$XDG_CACHE_HOME=/tmp/cache krakend ai download-model -model sentence-transformers/all-MiniLM-L6-v2
```

## Service Configuration

Declare the shared resources in the root `extra_config`. You need a [Redis connection pool](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/), which the semantic cache uses as its vector storage, and the embedders under the `ai/semantic-cache` namespace. The optional [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) block below exposes the cache hit and miss metrics through the [Prometheus](https://www.krakend.io/docs/enterprise/telemetry/prometheus/) exporter:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "default",
          "address": "localhost:6379"
        }
      ]
    },
    "ai/semantic-cache": {
      "embedders": [
        {
          "name": "default",
          "model_path": "/etc/krakend/models/sentence-transformers_all-MiniLM-L6-v2",
          "vector_dimension": 384
        }
      ]
    },
    "telemetry/opentelemetry": {
      "service_name": "krakend_prometheus_service",
      "metric_reporting_period": 1,
      "trace_sample_rate": 1,
      "exporters": {
        "prometheus": [
          {
            "name": "local_prometheus",
            "port": 9090,
            "process_metrics": true,
            "go_metrics": true
          }
        ]
      }
    }
  }
}
```

The configuration above defines a `default` Redis connection and a `default` embedder pointing to a downloaded model. Endpoints and backends reference these resources by name. The `vector_dimension` must match the output of the model, for example `384` for `all-MiniLM-L6-v2`.

These are the embedder options at the service level:

##### Fields of AI Semantic Cache

\* required fields

##### [`embedders`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#embedders "Click to copy link to embedders") array of objects

A list of embedding models available for use by AI Semantic Cache endpoints. Each object defines an embedder configuration.

Each item of embedders accepts the following properties:

##### [`model_path`](#embedders-model_path "Click to copy link to model_path") * string

The path to the model files

Example: `"/etc/krakend/models/sentence-transformers_all-MiniLM-L6-v2"`

##### [`name`](#embedders-name "Click to copy link to name") * string

A unique name that identifies this embedder configuration. This name is referenced by the `ai/semantic-cache` endpoint configuration.

Example: `"all-MiniLM"`

##### [`vector_dimension`](#embedders-vector_dimension "Click to copy link to vector_dimension") * integer

The number of dimensions in the vector produced by the embedding model.

Schema: [https://www.krakend.io/schema/v3.0/ai/semantic-cache-service.json](https://www.krakend.io/schema/v3.0/ai/semantic-cache-service.json "JSON schema definition")

If you don’t specify `embedders`, or it contains no embedder items, KrakenD defines a `default` embedder with default values instead. This makes the following configuration equivalent to declaring the `default` embedder of the example above:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/semantic-cache": {}
  }
}
```

## Enabling the Cache on Endpoints and Backends

Add the `ai/semantic-cache` namespace to the `extra_config` of the endpoint or backend you want to cache. Every field is optional, so the minimum valid configuration is an empty object, which uses the `default` Redis connection, the `default` embedder, and the default distance and TTL:

```json
{
  "extra_config": {
    "ai/semantic-cache": {}
  }
}
```

The following endpoint caches requests using the prompt in the body, scopes the cache per path parameter, and keeps entries for five minutes:

```json
{
  "endpoint": "/1/{ids}",
  "input_headers": ["x-user"],
  "input_query_strings": ["*"],
  "method": "POST",
  "extra_config": {
    "ai/semantic-cache": {
      "redis_connection": "default",
      "embedder": "default",
      "max_distance": 0.15,
      "req_content": "req_body.prompt",
      "key_variants": [
        "req_params.Ids"
      ],
      "ttl": "300s"
    }
  },
  "backend": [
    {
      "url_pattern": "/__echo/1/{ids}"
    }
  ]
}
```

This configuration uses the `default` Redis connection and embedder, vectorizes only the `prompt` field of the request body, and treats vectors within a cosine distance of `0.15` as a match. It also keys the cache on the `Ids` path parameter through `key_variants`, and expires entries after `300s`.

You can place the same configuration in a backend’s `extra_config` instead of the endpoint’s, to cache a single backend within the endpoint:

```json
{
  "endpoint": "/3/{ids}",
  "input_headers": ["x-user"],
  "input_query_strings": ["*"],
  "method": "POST",
  "backend": [
    {
      "url_pattern": "/__echo/3/{ids}",
      "extra_config": {
        "ai/semantic-cache": {
          "redis_connection": "default",
          "embedder": "default",
          "max_distance": 0.15,
          "req_content": "req_params.Ids",
          "key_variants": [
            "req_headers.x-user"
          ],
          "ttl": "300s"
        }
      }
    }
  ]
}
```

These are the configuration options at the endpoint and backend levels:

##### Fields of AI Semantic Cache

\* required fields

##### [`embedder`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#embedder "Click to copy link to embedder") string

The name of the embedder to use, as defined in service extra\_config

Defaults to `"default"`

##### [`key_variants`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#key_variants "Click to copy link to key_variants") array of strings

Request fields used to create distinct cache entries. Requests with different values for these fields are stored and matched separately, even when their vectorized content is identical.

##### [`max_distance`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#max_distance "Click to copy link to max_distance") number

The maximum cosine distance allowed when searching for semantically similar vectors. A value of 0 represents identical vectors; larger values allow greater differences.

Defaults to `0.25`

##### [`redis_connection`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#redis_connection "Click to copy link to redis_connection") string

The name of the [Redis connection](https://www.krakend.io/docs/enterprise/service-settings/redis-connection-pools/) to use, it must exist under the `redis` namespace at the service level and written exactly as declared.

Defaults to `"default"`

##### [`req_content`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#req_content "Click to copy link to req_content") string

The part of the request to vectorize. Use this to focus semantic matching on the content that can vary between requests. For example, if requests contain a large system prompt shared across calls, you can select only the user prompt to focus vector search on the variable content. If not specified, the entire request body is vectorized.

Examples: `"req_params.Ids"` , `"req_headers.x-user"` , `"req_query_string.user"` , `"req_body.content.prompt"`

##### [`ttl`](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#ttl "Click to copy link to ttl") string

The time-to-live (TTL) for cached entries.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"600s"`

Schema: [https://www.krakend.io/schema/v3.0/ai/semantic-cache.json](https://www.krakend.io/schema/v3.0/ai/semantic-cache.json "JSON schema definition")

## Selecting the Content to Match

The `req_content` field decides what KrakenD vectorizes. Use it to focus the matching on the content that varies between requests: for example, if every request carries a large shared system prompt, select only the user prompt. By default it uses the full `req_body`, but you can point it at any of the request input sources:

- `req_body`: the request body. Use [dot-notation](https://www.krakend.io/docs/enterprise/endpoints/request-body-extractor/) to reach nested fields, for example `req_body.content.prompt`.
- `req_params`: a URL path parameter. The key is capitalized, so the endpoint `/1/{ids}` exposes its parameter as `req_params.Ids`.
- `req_query_string`: a query string value, for example `req_query_string.user`.
- `req_headers`: a request header, for example `req_headers.x-user`.

The `key_variants` field takes a list of selectors and uses them to partition the cache. Requests with different values for these fields are stored and matched separately, even when their vectorized content is identical, which lets you keep separate cache entries per user, tenant, or any other dimension. Unlike `req_content`, `key_variants` reads only from `req_params`, `req_query_string`, and `req_headers`; it does not support `req_body`. For example, caching per user with the `x-user` header:

```json
{
  "extra_config": {
    "ai/semantic-cache": {
      "req_content": "req_body.prompt",
      "key_variants": [
        "req_headers.x-user"
      ],
      "ttl": "300s"
    }
  }
}
```

## Sharing Cache Between Endpoints and Backends

Different endpoints never share cache between them. No configuration option enables it.

The same backend shared across different endpoints shares its cache when the HTTP method, host, and URL match, the vector dimension and key variants are the same, and the encoding is compatible.

## Hit and Miss Metrics

When you configure [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/), the semantic cache reports cache hit and miss metrics. Export them through the [Prometheus](https://www.krakend.io/docs/enterprise/telemetry/prometheus/) exporter, as shown in the service configuration above, to monitor the cache effectiveness and tune `max_distance` and `ttl`.
