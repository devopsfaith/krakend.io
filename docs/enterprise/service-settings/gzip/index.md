# Automatic Gzip compression on responses

> Optimize API response sizes and reduce network traffic with Gzip compression in KrakenD Enterprise. Follow our documentation to enable and configure Gzip compression for your APIs.

Source: https://www.krakend.io/docs/enterprise/service-settings/gzip/

KrakenD Enterprise compresses with gzip **all traffic returned to the client** when the request contains an `Accept-Encoding: gzip` header.

This feature only talks about Gzipping responses

KrakenD understands gzipped responses from backends and decompresses them when it needs to manipulate the response. But this functionality talks about compressing all traffic back to the client.

The gzip response compression is not applied when the header is missing or when the `Accept-Encoding` header contains a `text/event-stream` value.

Gzip compression is unrelated to decompression when consuming content from your services. Decompression is also done automatically, but in all KrakenD flavors, not only Enterprise.

When the content is successfully compressed, the response contains a `"Content-Encoding: gzip"` header.

## Gzip configuration

The gzip is always on unless you disable it in the router section. The `gzip_profile` field, available since v3.0, lets you choose how aggressively KrakenD compresses:

```json
{
  "version": 4,
  "extra_config": {
    "router": {
      "disable_gzip": false,
      "gzip_profile": "balanced"
    }
  }
}
```

##### Fields of `"router"`

\* required fields

##### [`disable_gzip`](https://www.krakend.io/docs/enterprise/service-settings/gzip/#disable_gzip "Click to copy link to disable_gzip") boolean

**Enterprise only.** All the output to the end user on the Enterprise Edition uses gzip when accepted by the client. Use this flag to remove gzip compression.

Defaults to `false`

##### [`gzip_profile`](https://www.krakend.io/docs/enterprise/service-settings/gzip/#gzip_profile "Click to copy link to gzip_profile")

**Enterprise only.** Chooses the trade-off between compression ratio and CPU usage when gzipping the response to the end user. `speed` uses the fastest compression level, spending the least CPU per response and adding the least latency, but sending the largest payloads over the wire. `compression` uses the maximum level, producing the smallest payloads at the cost of noticeably more CPU and time per response, which pays off on large and highly repetitive bodies. `balanced` sits in between and is the right choice for most traffic. All three profiles emit standard gzip that any client decompresses the same way, so the profile only affects the size of the response and the resources needed to produce it. The setting has no effect when `disable_gzip` is `true`.

Possible values are: `"balanced"` , `"speed"` , `"compression"`

Defaults to `"balanced"`

Schema: [https://www.krakend.io/schema/v3.0/router.json](https://www.krakend.io/schema/v3.0/router.json "JSON schema definition")

Both settings live at the service level and apply to every endpoint. You cannot use a different profile per endpoint.

## Compression profiles

A **compression profile** picks the gzip compression level KrakenD uses when writing the response. Every profile emits standard gzip, so clients decompress all three identically and you can change the profile at any time without coordinating with API consumers. The only thing that changes is the size of the payload on the wire and the resources KrakenD spends producing it.

| Profile              | Payload size          | CPU and latency per response |
|----------------------|-----------------------|------------------------------|
| `speed`              | Largest               | Lowest                       |
| `balanced` (default) | Between the other two | Moderate                     |
| `compression`        | Smallest              | Highest                      |

If you are unsure which profile suits your traffic, use `balanced`. It is the default because it matches most workloads, and you only need to move away from it when you have measured that bandwidth or CPU is the constraint you want to optimize for.

The `gzip_profile` field has no effect when `disable_gzip` is `true`, as KrakenD does not compress anything in that case.

## Speed versus bandwidth trade-off

Gzip gives diminishing returns as you raise the compression level. Moving from `speed` to `compression` usually shaves only a few additional percentage points off the payload, while the CPU time spent on each response grows several times over. The gateway compresses on the hot path of every request, so that extra CPU shows up as added latency and as less headroom to absorb traffic peaks.

What you gain also depends on the payload. Large JSON responses with repetitive structures, such as the aggregation of several backends or long collections, compress well and reward a higher level. Small responses of a few hundred bytes compress poorly at any level, and the difference between profiles is negligible.

Use these criteria to decide:

- Choose `speed` when KrakenD is CPU-bound, when you run at high requests per second, or when latency is your primary concern and bandwidth is cheap.
- Keep `balanced` for general-purpose traffic. It captures most of the size reduction without paying the CPU cost of the maximum level.
- Choose `compression` when egress bandwidth is the expensive part of your bill, when clients sit on slow or metered networks such as mobile apps, or when you return large bodies and have CPU to spare.

Measure with your own payloads

The size reduction and the CPU cost depend entirely on the content your API returns. Before switching away from `balanced`, compare the `Content-Length` of a few representative responses under each profile and watch the gateway’s CPU usage and latency percentiles.
