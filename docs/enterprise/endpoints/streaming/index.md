# HTTP Streaming and Server-Sent Events (SSE)

> Stream HTTP responses to clients with no-op, SSE, NDJSON, or AWS event-stream encodings, with optional per-message filtering, redaction, and quota metering.

Source: https://www.krakend.io/docs/enterprise/endpoints/streaming/

KrakenD supports HTTP streaming to enable real-time data delivery between servers and clients through persistent HTTP connections. This page covers how to implement generic **HTTP streaming** and its supported wire formats: **Server-Sent Events (SSE)**, **NDJSON**, and the **AWS event-stream** binary framing.

HTTP streaming is a technique where **a server sends data chunks to the client as they become available**. To do that, unlike regular REST endpoints that close the connection after delivering the payload, the streaming connection between the client and server remains open for as long as the session makes sense. Streaming is usually applied to real-time logs, video (streaming), continuous data feeds, multipart responses (such as progressive image loading), LLM interaction, and other long-polling style APIs, to name a few examples.

KrakenD offers two ways to handle a stream. The `no-op` output encoding proxies the connection without ever looking at its content. The `sse`, `ndjson`, and `eventstream` encodings, available since v3.0, parse each individual message in the stream as it flows through, so a small set of manipulation components can act on it before it reaches the client.

No-op streams are opaque

When you use the `no-op` encoding, KrakenD **acts as a proxy only** and is not compatible with any component that performs response manipulation. Use `sse`, `ndjson`, or `eventstream` instead when you need [`modifier/jmespath`](https://www.krakend.io/docs/enterprise/endpoints/jmespath/), [`modifier/response-body`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/), or [`governance/quota`](https://www.krakend.io/docs/enterprise/governance/quota/) to inspect or transform the stream.

## Choosing a Streaming Encoding

The `output_encoding` (and the matching backend `encoding`) you pick determines how much KrakenD can see and do with the stream:

| Encoding      | Wire format                                 | Manipulation components                                           |
|---------------|---------------------------------------------|-------------------------------------------------------------------|
| `no-op`       | Any, untouched                              | None. Fully opaque proxy.                                         |
| `sse`         | Server-Sent Events (`text/event-stream`)    | `modifier/jmespath`, `modifier/response-body`, `governance/quota` |
| `ndjson`      | Newline-delimited JSON                      | `modifier/jmespath`, `modifier/response-body`, `governance/quota` |
| `eventstream` | AWS binary `vnd.amazon.eventstream` framing | `modifier/jmespath`, `modifier/response-body`, `governance/quota` |

Pick `no-op` for opaque or binary content, such as video. Pick `sse`, `ndjson`, or `eventstream` to match whatever text-based streaming protocol your backend already speaks, and gain the ability to inspect or transform each message; see [Manipulating Streamed Responses](https://www.krakend.io/docs/enterprise/endpoints/streaming/#manipulating-streamed-responses).

Manipulation requires a JSON payload per message

`modifier/jmespath`, `modifier/response-body`, and `governance/quota` all operate on a message parsed as JSON. This is implicit for `ndjson`, since each line is already a JSON object by definition. For `sse` and `eventstream`, it’s still a requirement: the `data:` payload of each SSE event, or the decoded payload of each event-stream frame, must itself be a JSON object, not plain text. Most LLM and structured-event APIs already stream JSON, but a plain-text SSE feed (for instance, raw log lines) is not compatible with these three components.

## Opaque Proxy Streaming with no-op

Use `no-op` when you don’t need to inspect, filter, or transform the stream at all, for instance, a video feed or any format KrakenD doesn’t need to understand. Streaming endpoints are declared as any other endpoint and do not require an additional namespace or configuration to function. At the configuration level, there are basically three things you need to take into account when writing the `endpoint` configuration:

1. `output_encoding`: Set it to [`no-op`](https://www.krakend.io/docs/endpoints/no-op/) (proxy only - no merging of responses possible, and no manipulation components apply).
2. `timeout`: The timeout you add in the endpoint must cover enough time to maintain the persistent connection between the client and backend alive without closing prematurely.
3. `input_headers`: If the server requires special headers, let them pass, or statically set them using a [Martian modifier](https://www.krakend.io/docs/backends/martian/)

That would be the important stuff to keep in mind in terms of configuration. The following example is for an endpoint that **streams videos** of a short duration (timeout set to max. 5 minutes) and serves it to the client as chunks become available:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "timeout": "5m",
      "endpoint": "/video/{id}",
      "method": "GET",
      "output_encoding": "no-op",
      "input_headers": [
        "Content-Type"
      ],
      "backend": [
        {
          "url_pattern": "/video/{id}.mkv",
          "encoding": "no-op",
          "host": [
            "https://videos.example.com/"
          ]
        }
      ]
    }
  ]
}
```

When you add streaming to your API, always **set the long timeout inside the streaming endpoint**. Never add long-pooled timeouts at the service level, affecting all endpoints.

## Server-Sent Events (SSE) with the sse Encoding

![streaming-sse.mmd diagram](https://www.krakend.io/images/documentation/diagrams/streaming-sse.mmd.svg)

SSE is a protocol that allows servers to push real-time updates to browsers or clients over a single HTTP connection, using a lightweight, text-based stream. SSE is designed to continuously send updates like notifications, live feeds, or real-time metrics without the overhead of [WebSockets](https://www.krakend.io/docs/enterprise/websockets/) complexity. Unlike WebSockets, SSE uses simple HTTP and is easier to implement for unidirectional real-time data flow.

Set `output_encoding` and the backend’s `encoding` to `sse` when you want KrakenD to parse each event of the stream, which is what makes [`modifier/jmespath`](https://www.krakend.io/docs/enterprise/endpoints/jmespath/), [`modifier/response-body`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/), and [`governance/quota`](https://www.krakend.io/docs/enterprise/governance/quota/) usable on the endpoint (see [Manipulating Streamed Responses](https://www.krakend.io/docs/enterprise/endpoints/streaming/#manipulating-streamed-responses)). If you don’t need any of those, `no-op` also proxies SSE traffic and requires one field less to configure. Either way, as SSE formats the content as `text/event-stream`, you will probably need to pass the `Content-Type` to your server to make it work (whether in `input_headers` or setting it using [Martian](https://www.krakend.io/docs/backends/martian/)) and also tune the `timeout` with the time you consider is necessary for the majority of your SSE sessions.

Here’s an example consuming SSE from a local weather service:

```json
{
  "$schema": "https://krakend.io/schema/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/weather-stream",
      "input_headers": [
        "Content-Type"
      ],
      "timeout": "300s",
      "method": "POST",
      "output_encoding": "sse",
      "backend": [
        {
          "host": ["https://weather.example.com"],
          "url_pattern": "/api/agents/weatherAgent/stream",
          "encoding": "sse"
        }
      ]
    }
  ]
}
```

With the approach above, KrakenD handles SSE streams by parsing them with the `sse` encoding, and:

- It keeps the HTTP connection open between the client and the backend SSE server.
- It forwards event messages as-is by default, without modifying or buffering them.
- You can layer [`modifier/jmespath`](https://www.krakend.io/docs/enterprise/endpoints/jmespath/), [`modifier/response-body`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/), or [`governance/quota`](https://www.krakend.io/docs/enterprise/governance/quota/) on top to manipulate each event; see [Manipulating Streamed Responses](https://www.krakend.io/docs/enterprise/endpoints/streaming/#manipulating-streamed-responses).

Another typical use case for SSE is the consumption of **AI generative models**. The following example connects to **Gemini using SSE** as a raw proxy, with no difference from the weather service above other than Gemini’s own requirement to append `?alt=sse` to the URL to switch its API into streaming mode:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "name": "KrakenD AI SSE support",
  "timeout": "60s",
  "endpoints": [
    {
      "endpoint": "/stream",
      "method": "POST",
      "output_encoding": "no-op",
      "input_headers": [
        "Content-Type"
      ],
      "backend": [
        {
          "url_pattern": "/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=xxx",
          "method": "POST",
          "encoding": "no-op",
          "host": [
            "https://generativelanguage.googleapis.com/"
          ]
        }
      ]
    }
  ]
}
```

Notes on the example configuration:

- `endpoint`: Represents the public-facing path where clients connect to receive SSE.
- `method`: Usually POST for SSE requests, although this varies per implementation.
- `backend[].url_pattern`: Proxy route on the backend SSE server for event streaming.
- `backend[].host`: The HTTP server serving SSE events.

Streaming inside the AI Gateway

The example above proxies Gemini’s raw SSE output unchanged. To normalize the response into a single wire format across vendors, meter token usage, or apply prompt guarding, use the `ai/llm` component instead, as described in [Streaming LLM Responses with the AI Gateway](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/).

## NDJSON Streaming

Set `output_encoding` and the backend’s `encoding` to `ndjson` when the upstream emits **newline-delimited JSON**, one independent JSON object per line, instead of the `data:`-prefixed events of SSE. KrakenD parses each line individually, which enables the same manipulation components as `sse`.

For instance, the following endpoint proxies a log-tailing service that streams one JSON object per log line:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/logs/tail",
      "method": "GET",
      "timeout": "300s",
      "output_encoding": "ndjson",
      "backend": [
        {
          "host": ["https://logs.example.com"],
          "url_pattern": "/v1/tail",
          "encoding": "ndjson"
        }
      ]
    }
  ]
}
```

Each line the backend writes to the response body is forwarded to the client as it arrives, without waiting for the connection to close.

## AWS Event Stream Encoding

Set `output_encoding` and the backend’s `encoding` to `eventstream` when the upstream uses AWS’s binary `vnd.amazon.eventstream` framing instead of a text-based protocol. KrakenD decodes the binary frames into individual JSON messages, so the same manipulation components available to `sse` and `ndjson` also apply here.

Supported Bedrock API

`eventstream` targets [Bedrock’s `ConverseStream` API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ConverseStream.html), the streaming counterpart of the `Converse` API already used by the [Bedrock integration](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/). The older `InvokeModelWithResponseStream` API is not supported.

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/bedrock/stream",
      "method": "POST",
      "timeout": "60s",
      "output_encoding": "eventstream",
      "backend": [
        {
          "host": ["https://bedrock-runtime.eu-west-1.amazonaws.com"],
          "url_pattern": "/model/{model}/converse-stream",
          "encoding": "eventstream"
        }
      ]
    }
  ]
}
```

KrakenD forwards each decoded frame to the client re-encoded as an AWS event-stream message, the same framing the backend used.

## Manipulating Streamed Responses

When an endpoint uses `sse`, `ndjson`, or `eventstream`, KrakenD parses every individual message of the stream as an independent JSON document before forwarding it, and re-emits it in the same framing once processed. See [Choosing a Streaming Encoding](https://www.krakend.io/docs/enterprise/endpoints/streaming/#choosing-a-streaming-encoding) for the JSON-per-message requirement this relies on. Three components can act on a live stream this way, instead of only on a complete, buffered response:

- [`modifier/jmespath`](https://www.krakend.io/docs/enterprise/endpoints/jmespath/): reshapes or filters the fields of each message with a JMESPath expression.
- [`modifier/response-body`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/): finds and replaces, upper/lower-cases, trims, or applies a regular expression to a field of each message.
- [`governance/quota`](https://www.krakend.io/docs/enterprise/governance/quota/): meters usage from a field inside each message rather than counting one hit per request.

Manipulation is not full response aggregation

These three components are the only ones adapted to run against a stream. Components designed for buffered responses, such as [response manipulation](https://www.krakend.io/docs/enterprise/endpoints/response-manipulation/) or [sequential proxy](https://www.krakend.io/docs/enterprise/endpoints/sequential-proxy/), still require a complete response and are not compatible with streaming encodings.

For instance, the following endpoint keeps only the `id` and `message` fields of every event coming from an SSE feed:

```json
{
  "endpoint": "/v1/events",
  "method": "GET",
  "output_encoding": "sse",
  "backend": [
    {
      "host": ["https://events.example.com"],
      "url_pattern": "/v1/stream",
      "encoding": "sse"
    }
  ],
  "extra_config": {
    "modifier/jmespath": {
      "expr": "{id: id, message: payload.message}"
    }
  }
}
```

KrakenD applies `expr` to the JSON payload of every event as it arrives and forwards only the resulting object, without waiting for the stream to end.

Redacting sensitive data works the same way with `modifier/response-body`. The following endpoint masks a card number field on an `ndjson` feed:

```json
{
  "endpoint": "/v1/events",
  "method": "GET",
  "output_encoding": "ndjson",
  "backend": [
    {
      "host": ["https://events.example.com"],
      "url_pattern": "/v1/stream",
      "encoding": "ndjson"
    }
  ],
  "extra_config": {
    "modifier/response-body": {
      "modifiers": [
        {
          "regexp": {
            "field": "payload.card_number",
            "find": "(^\\d{4})(.*)",
            "replace": "${1}-XXXX"
          }
        }
      ]
    }
  }
}
```

Every line of the stream that carries a `payload.card_number` field has it masked before reaching the client.

Metering by actual usage instead of by request count is a common need on LLM streams that report token counts inside their body. Set `weight_key` to the field that holds the counter, and `weight_strategy` to `body`, since none of the streaming encodings is `no-op`:

```json
{
  "endpoint": "/v1/chat",
  "method": "POST",
  "output_encoding": "sse",
  "backend": [
    {
      "host": ["https://llm.example.com"],
      "url_pattern": "/v1/stream",
      "encoding": "sse"
    }
  ],
  "extra_config": {
    "governance/quota": {
      "quota_name": "chat_tokens",
      "tier_key": "X-Plan",
      "weight_key": "usage.total_tokens",
      "weight_strategy": "body",
      "tiers": [
        {
          "rule_name": "rule_default",
          "tier_value_as": "*",
          "strategy": "ip"
        }
      ]
    }
  }
}
```

Instead of consuming one quota credit per request, KrakenD reads `usage.total_tokens` from the stream and decrements the quota by that amount. See [Quotas](https://www.krakend.io/docs/enterprise/governance/quota/) for the full list of tier and weight options.

## Operational considerations

When implementing streaming, the following considerations are worth noticing:

- Connection persistence: Streaming connections are long-lived. Ensure your KrakenD deployment and underlying infrastructure support stable, persistent HTTP connections. Do not unnecessarily set extremely high timeouts, as this can have unintended side effects.
- Payload processing: With `no-op`, KrakenD never alters or buffers streaming data, so backends are responsible for generating valid and properly formatted streams. With `sse`, `ndjson`, and `eventstream`, only [`modifier/jmespath`](https://www.krakend.io/docs/enterprise/endpoints/jmespath/), [`modifier/response-body`](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/), and [`governance/quota`](https://www.krakend.io/docs/enterprise/governance/quota/) can inspect or change the content; no other manipulation component runs against a stream.
- Scalability: Streaming connections consume resources continuously and keep the server busy at all times.
- Timeouts: Configure appropriate timeouts on clients, KrakenD, and backend services to avoid premature disconnections.
- Redeploys: If you have long sessions, a redeployment might wait a long time to drain connections. In that case, remember you can kill sessions once the draining has waited for a configured number of seconds using [`max_shutdown_wait_time`](https://www.krakend.io/docs/service-settings/http-server-settings/#max_shutdown_wait_time)
- Lost connections: if for whatever reason, the connection between the client and the server is lost, KrakenD does not have a mechanism to reach the client and reconnect automatically. Clients must deal this reconnection.
