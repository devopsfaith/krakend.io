# Jaeger Telemetry Integration - KrakenD API Gateway

> Integrate Jaeger telemetry with KrakenD API Gateway for distributed tracing and monitoring of your microservices architecture

Source: https://www.krakend.io/docs/enterprise/telemetry/jaeger/

The KrakenD exporter to [Jaeger](https://www.jaegertracing.io/) allows you to submit spans to an OpenTelemetry Collector (HTTP or gRPC) automatically.

Jaeger is an open-source, end-to-end distributed tracing system that allows you to monitor and troubleshoot transactions in complex distributed systems. Use Jaeger when you want to see the complete flow of a user request through KrakenD and its connected services.

## Jaeger configuration

To add Jaeger, configure a new exporter to the [OpenTelemetry settings](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/). For instance:

```json
{
    "version": 4,
    "extra_config": {
        "telemetry/opentelemetry": {
            "service_name": "my_krakend_service",
            "metric_reporting_period": 1,
            "trace_sample_rate": 0.15,
            "layers": {
                "global": {
                    "report_headers": true
                },
                "proxy": {
                    "report_headers": true
                },
                "backend": {
                    "metrics": {
                        "disable_stage": true
                    },
                    "traces": {
                        "disable_stage": false,
                        "round_trip": true,
                        "read_payload": true,
                        "detailed_connection": true,
                        "report_headers": true
                    }
                }
            },
            "exporters": {
                "otlp": [
                    {
                        "name": "local_jaeger",
                        "host": "jaeger",
                        "port": 4317,
                        "use_http": false,
                        "disable_metrics": true
                    }
                ]
            }
        }
    }
}
```

The fields relative to the exporter are:

##### Fields of `"telemetry/opentelemetry": { "exporters":{} }`

\* required fields

##### [`otlp`](https://www.krakend.io/docs/enterprise/telemetry/jaeger/#otlp "Click to copy link to otlp") array

The list of OTLP exporters you want to use. Set at least one object to push metrics and traces to an external collector using OTLP.

Each item of otlp accepts the following properties:

##### [`custom_metric_reporting_period`](#otlp-custom_metric_reporting_period "Click to copy link to custom_metric_reporting_period") integer

Whether you want to override the global `metric_reporting_period` attribute set for all exporters or not. Value in seconds. A missing attribute, or set to `0` means using whatever value was used in `metric_reporting_period` at the global level.

Defaults to `0`

##### [`disable_metrics`](#otlp-disable_metrics "Click to copy link to disable_metrics") boolean

Disable metrics in this exporter (leaving only traces if any). It won’t report any metrics when the flag is `true`.

Defaults to `false`

##### [`disable_traces`](#otlp-disable_traces "Click to copy link to disable_traces") boolean

Disable traces in this exporter (leaving only metrics if any). It won’t report any metrics when the flag is `true`.

Defaults to `false`

##### [`host`](#otlp-host "Click to copy link to host") * string

The host where you want to push the data. It can be a sidecar or a remote collector.

##### [`name`](#otlp-name "Click to copy link to name") * string

A unique name to identify this exporter.

Examples: `"local_prometheus"` , `"remote_grafana"`

##### [`port`](#otlp-port "Click to copy link to port") integer

A custom port to send the data. The port defaults to 4317 for gRPC unless you enable `use_http`, which defaults to 4318.

Defaults to `4317`

##### [`use_http`](#otlp-use_http "Click to copy link to use_http") boolean

Whether this exporter uses HTTP instead of gRPC.

Schema: [https://www.krakend.io/schema/v3.0/telemetry/opentelemetry.json](https://www.krakend.io/schema/v3.0/telemetry/opentelemetry.json "JSON schema definition")

But as you can see there is a `layers` attribute in the example configuration that defines settings for all exporters (not only Jaeger). See the [layers options](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#layers).

Also notice that port `4317` and `"use_http": false` are set, meaning that gRPC communication is used. Change to `4318` and the flag to `true` for HTTP communication.

## Jaeger demo environment

You can test this setup by running the **All in One** official Jaeger image and opening the necessary ports. For instance:

```yaml
version: "3"
services:
  krakend:
    image: krakend/krakend-ee:3.0.2
    volumes:
      - "./:/etc/krakend"
    ports:
      - "8080:8080"
  jaeger:
    image: jaegertracing/all-in-one:1.54
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ":9411"
    ports:
      - "5778:5778" # serve configs
      - "16686:16686" # serve frontend UI
      - "4317:4317"   # otlp grpc: we remap this to be able to run other envs
      - "4318:4318"   # otlp http: we remap this to be able to run other envs
    deploy:
      resources:
        limits:
          memory: 4096M # Adjust according to your setup
```
