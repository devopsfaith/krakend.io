# Telemetry and Monitoring through OpenTelemetry

> Learn about the telemetry and monitoring capabilities of KrakenD API Gateway using OTEL, enabling real-time visibility and analysis of API performance

Source: https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/

OpenTelemetry (for short **OTEL**) offers a comprehensive, unified, and **vendor-neutral** approach to collecting and managing telemetry data, providing enhanced observability and deeper insights into application performance and behavior. It’s particularly beneficial in complex, distributed, and cloud-native environments.

OpenTelemetry captures detailed, contextual information about the operation of your applications. This includes not only **metrics** but also **tracing data** that shows the full lifecycle of requests as they flow through your systems, providing insights into performance bottlenecks, latency issues, and error diagnostics. This OpenTelemetry **does not** support pushing logs. See [logging](https://www.krakend.io/docs/enterprise/logging/), [GELF](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/), or [Logstash](https://www.krakend.io/docs/enterprise/logging/logstash/) instead.

It supports auto-instrumentation and can be integrated seamlessly into cloud-native deployments, making it easier to monitor these dynamic environments.

Stability note on OpenTelemetry

KrakenD has traditionally offered part of its telemetry integration through the [OpenCensus integration](https://www.krakend.io/docs/enterprise/v2.13/telemetry/opencensus/), which has provided a reliable service for over six years. We are transitioning to the more modern and robust OpenTelemetry framework, and the OpenCensus integration does not receive further updates.

While the underlying protocol specification of OpenTelemetry is stable, you’ll find [mixed stability statuses](https://opentelemetry.io/docs/specs/status/) in the components lifecycle. While we cannot predict what changes there will be as the technology evolves, KrakenD will always do its best to maintain compatibility between versions. More information about the underlying exporter can be found [here](https://opentelemetry.io/docs/languages/go/exporters/).

## Collecting metrics and traces

The `telemetry/opentelemetry` component in KrakenD collects the activity generated for the enabled layers and pushes or exposes the data for pulling. There are two ways of publishing metrics:

- **OpenTelemetry protocol (OTLP)** - push
- **Prometheus** - pull

You can use both simultaneously if needed, and even multiple instances of each.

When you add OpenTelemetry in the configuration, you will have [different metrics available](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/).

## Prometheus exporter (pull)

Choose the `prometheus` exporter when you want KrakenD to **expose a new port offering a `/metrics` endpoint**. So, an external Prometheus job can connect to a URL like `http://krakend:9090/metrics` and retrieve all the data.

![Prometheus connecting to KrakenD and fetching metrics](https://www.krakend.io/images/documentation/diagrams/opentelemetry-prometheus.mmd.svg)

[See how to configure Prometheus](https://www.krakend.io/docs/enterprise/telemetry/prometheus/)

## OTLP exporter (push)

Choose the `otlp` exporter when you want to **push the metrics to a local or remote collector** or directly to a SaaS or storage system that supports native OTLP (there is a [large number of supported providers](https://www.krakend.io/docs/enterprise/telemetry/#opentelemetry-integrations)). The following diagram represents this idea:

![KrakenD to collector, collector to backend](https://www.krakend.io/images/documentation/diagrams/opentelemetry-otlp.mmd.svg)

The `host` where your collector lives can also point to an external load balancer between KrakenD and multiple collectors if needed: ![KrakenD to load balanced collectors, collectors to backend](https://www.krakend.io/images/documentation/diagrams/opentelemetry-otlp-lb.mmd.svg)

Enterprise users can push directly to external storage passing auth credentials using the [`telemetry/opentelemetry-security` component](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-security/), so the collector is not needed anymore:

![opentelemetry-otlp-auth.mmd diagram](https://www.krakend.io/images/documentation/diagrams/opentelemetry-otlp-auth.mmd.svg)

This strategy saves a lot of time during the setup of KrakenD.

## OpenTelemetry Configuration

To enable OpenTelemetry, you will need a Prometheus or an OTEL Collector (or both) and add the `telemetry/opentelemetry` namespace at the top level of your configuration.

The configuration of the `telemetry/opentelemetry` namespace is very extensive, but the two key entries are:

- `exporters`, defining the different technologies you will use
- `layers`, the amount of data you want to report

In addition the environment variable `OTEL_PROPAGATORS` (not a configuration option) can be set to modify the propagators. It accepts a comma separated list with the values `tracecontext`, `baggage`, `b3` and `b3multi`. For instance you can set `OTEL_PROPAGATORS="b3,baggage"`.

The entire configuration is as follows:

##### Fields of OpenTelemetry

\* required fields

##### [`deploy_env`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#deploy_env "Click to copy link to deploy_env") string

The environment you are deploying, this can be useful for deployment tracking. The string can have any value that makes sense to you to identify the running environment.

Examples: `"development"` , `"testing"` , `"staging"` , `"production"`

Defaults to `""`

##### [`exporters`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#exporters "Click to copy link to exporters") * object

The places where you will send telemetry data. You can declare multiple exporters even when they are of the same type. For instance, when you have a self-hosted Grafana and would like to migrate to its cloud version and check the double reporting during the transition. There are two families of exporters: `otlp` or `prometheus`.

##### [`otlp`](#exporters-otlp "Click to copy link to otlp") array

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

##### [`prometheus`](#exporters-prometheus "Click to copy link to prometheus") array

Set here at least the settings for one Prometheus exporter. Each exporter will start a local port that offers metrics to be pulled from KrakenD.

Each item of prometheus accepts the following properties:

##### [`custom_metric_reporting_period`](#prometheus-custom_metric_reporting_period "Click to copy link to custom_metric_reporting_period") integer

Whether you want to override the global `metric_reporting_period` attribute set for all exporters or not. Value in seconds. A missing attribute, or set to `0` means using whatever value was used in `metric_reporting_period` at the global level.

Defaults to `0`

##### [`disable_metrics`](#prometheus-disable_metrics "Click to copy link to disable_metrics") boolean

Leave this exporter declared but disabled (useful in development). It won’t report any metrics when the flag is `true`.

Defaults to `false`

##### [`go_metrics`](#prometheus-go_metrics "Click to copy link to go_metrics") boolean

Whether you want fine-grained details of Go language metrics or not.

##### [`listen_ip`](#prometheus-listen_ip "Click to copy link to listen_ip") string

The IP address that KrakenD listens to in IPv4 or IPv6. You can, for instance, expose the Prometheus metrics only in a private IP address. An empty string, or no declaration means listening on all interfaces. The inclusion of `::` is intended for IPv6 format only (**this is not the port**). Examples of valid addresses are `192.0.2.1` (IPv4), `2001:db8::68` (IPv6). The values `::` and `0.0.0.0` listen to all addresses, which are valid for IPv4 and IPv6 simultaneously.

Examples: `"172.12.1.1"` , `"::1"`

Defaults to `"0.0.0.0"`

##### [`name`](#prometheus-name "Click to copy link to name") * string

A unique name to identify this exporter.

Examples: `"local_prometheus"` , `"remote_grafana"`

##### [`port`](#prometheus-port "Click to copy link to port") integer

The port in KrakenD where Prometheus will connect to.

Defaults to `9090`

##### [`process_metrics`](#prometheus-process_metrics "Click to copy link to process_metrics") boolean

Whether this exporter shows detailed metrics about the running process like CPU or memory usage or not.

##### [`histograms`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#histograms "Click to copy link to histograms") object

Use an histogram bucket configuration different from the defaults to define the detail of histogram metrics (decrease or increase their size). You don’t need to set this attribute unless you want full control of the histogram definition.

##### [`size_buckets`](#histograms-size_buckets "Click to copy link to size_buckets") array of numbers

The size of the buckets in bytes you want to use for the histograms.

Defaults to `[128,256,512,1024,4096,8192,16384,32768,65536,262144,524288,1048576,4194304,16777216,67108864]`

##### [`time_buckets`](#histograms-time_buckets "Click to copy link to time_buckets") array of numbers

The duration of buckets in seconds you want to use for the histograms.

Defaults to `[0.01,0.02,0.05,0.075,0.1,0.125,0.15,0.175,0.2,0.25,0.3,0.35,0.5,0.75,1,1.5,2,3.5,5,10]`

##### [`layers`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#layers "Click to copy link to layers") object

A request and response flow passes through three different layers. This attribute lets you specify what data you want to export in each layer. All layers are enabled by default unless you declare this section.

##### [`backend`](#layers-backend "Click to copy link to backend") object

Reports the activity between KrakenD and each of your backend services. This is the more granular layer.

##### [`metrics`](#backend-metrics "Click to copy link to metrics") object Show properties

##### [`detailed_connection`](#metrics-detailed_connection "Click to copy link to detailed_connection") boolean

Whether you want to enable detailed metrics for the HTTP connection phase or not. Includes times to connect, DNS querying, and the TLS handshake.

Defaults to `false`

##### [`disable_stage`](#metrics-disable_stage "Click to copy link to disable_stage") boolean

Whether to turn off the metrics or not. Setting this to `true` means stop reporting any data.

Defaults to `false`

##### [`read_payload`](#metrics-read_payload "Click to copy link to read_payload") boolean

Whether you want to enable metrics for the response reading payload or not (HTTP connection not taken into account).

Defaults to `false`

##### [`round_trip`](#metrics-round_trip "Click to copy link to round_trip") boolean

Whether you want to enable metrics for the actual HTTP request for the backend or not (manipulation not taken into account). This is the time your backend needs to produce a result.

Defaults to `false`

##### [`static_attributes`](#metrics-static_attributes "Click to copy link to static_attributes") array of objects

A list of tags or labels you want to associate with these metrics.

Example: `[{"key":"my_metric_attr","value":"my_metric_val"}]`

Each item of static\_attributes accepts the following properties:

##### [`key`](#static_attributes-key "Click to copy link to key") * string

The key, tag, or label name you want to use.

##### [`value`](#static_attributes-value "Click to copy link to value") * string

The static value you want to assign to this key.

##### [`traces`](#backend-traces "Click to copy link to traces") object Show properties

##### [`detailed_connection`](#traces-detailed_connection "Click to copy link to detailed_connection") boolean

Whether you want to add detailed trace attributes for the HTTP connection phase or not. Includes times to connect, DNS querying, and the TLS handshake.

Defaults to `false`

##### [`disable_stage`](#traces-disable_stage "Click to copy link to disable_stage") boolean

Whether to turn off the traces or not. Setting this to `true` means stop reporting any data.

Defaults to `false`

##### [`read_payload`](#traces-read_payload "Click to copy link to read_payload") boolean

Whether you want to add trace attributes for the response reading payload or not (HTTP connection not taken into account).

Defaults to `false`

##### [`report_headers`](#traces-report_headers "Click to copy link to report_headers") boolean

Whether you want to report the final headers that reached the backend.

Defaults to `false`

##### [`round_trip`](#traces-round_trip "Click to copy link to round_trip") boolean

Whether you want to add trace attributes for the actual HTTP request for the backend or not (manipulation not taken into account). This is the time your backend needs to produce a result.

Defaults to `false`

##### [`skip_headers`](#traces-skip_headers "Click to copy link to skip_headers") array of strings

A list of headers you want to skip when reporting the headers that reached the backend. This is useful to avoid reporting sensitive data.

Example: `["X-Backend-Secret","X-All-Secret"]`

##### [`static_attributes`](#traces-static_attributes "Click to copy link to static_attributes") array of objects

A list of tags or labels you want to associate to these traces.

Example: `[{"key":"my_trace_attr","value":"my_trace_val"}]`

Each item of static\_attributes accepts the following properties:

##### [`key`](#static_attributes-key-2 "Click to copy link to key") * string

The key, tag, or label name you want to use.

##### [`value`](#static_attributes-value-2 "Click to copy link to value") * string

The static value you want to assign to this key.

##### [`global`](#layers-global "Click to copy link to global") object

Reports the activity between end-users and KrakenD

##### [`disable_metrics`](#global-disable_metrics "Click to copy link to disable_metrics") boolean

Whether you want to disable all metrics happening in the global layer or not.

Defaults to `false`

##### [`disable_propagation`](#global-disable_propagation "Click to copy link to disable_propagation") boolean

Whether you want to ignore previous propagation headers to KrakenD. When the flag is set to `true`, spans from a previous layer will never be linked to the KrakenD trace.

Defaults to `false`

##### [`disable_traces`](#global-disable_traces "Click to copy link to disable_traces") boolean

Whether you want to disable all traces happening in the global layer or not.

Defaults to `false`

##### [`metrics_static_attributes`](#global-metrics_static_attributes "Click to copy link to metrics_static_attributes") array Show properties

Static attributes you want to pass for metrics.

Each item of metrics\_static\_attributes accepts the following properties:

##### [`key`](#metrics_static_attributes-key "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#metrics_static_attributes-value "Click to copy link to value") string

The value of the static attribute you want to send

##### [`report_headers`](#global-report_headers "Click to copy link to report_headers") boolean

Whether you want to send all headers that the consumer passed in the request or not.

Defaults to `false`

##### [`semantic_convention`](#global-semantic_convention "Click to copy link to semantic_convention")

The semantic convention naming you want to use. The default is an empty string which uses the original naming convention prior to 1.27. For the semantic convention of 1.27 and higher, use `1.27`

Possible values are: `""` , `"1.27"`

##### [`skip_headers`](#global-skip_headers "Click to copy link to skip_headers") array of strings

A list of headers you want to skip when reporting the headers from the request. This is useful to avoid reporting sensitive data.

Example: `["X-Request-Api-Key","X-Signature"]`

##### [`traces_static_attributes`](#global-traces_static_attributes "Click to copy link to traces_static_attributes") array Show properties

Static attributes you want to pass for traces.

Each item of traces\_static\_attributes accepts the following properties:

##### [`key`](#traces_static_attributes-key "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#traces_static_attributes-value "Click to copy link to value") string

The value of the static attribute you want to send

##### [`proxy`](#layers-proxy "Click to copy link to proxy") object

Reports the activity at the beginning of the proxy layer, including spawning the required requests to multiple backends, merging, endpoint transformation and any other internals of the proxy between the request processing and the backend communication

##### [`disable_metrics`](#proxy-disable_metrics "Click to copy link to disable_metrics") boolean

Whether you want to disable all metrics happening in the proxy layer or not.

Defaults to `false`

##### [`disable_traces`](#proxy-disable_traces "Click to copy link to disable_traces") boolean

Whether you want to disable all traces happening in the proxy layer or not.

Defaults to `false`

##### [`metrics_static_attributes`](#proxy-metrics_static_attributes "Click to copy link to metrics_static_attributes") array Show properties

Static attributes you want to pass for metrics.

Each item of metrics\_static\_attributes accepts the following properties:

##### [`key`](#metrics_static_attributes-key-2 "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#metrics_static_attributes-value-2 "Click to copy link to value") string

The value of the static attribute you want to send

##### [`report_headers`](#proxy-report_headers "Click to copy link to report_headers") boolean

Whether you want to report all headers that passed from the request to the proxy layer (`input_headers` policy in the endpoint plus KrakenD’s headers).

Defaults to `false`

##### [`skip_headers`](#proxy-skip_headers "Click to copy link to skip_headers") array of strings

A list of headers you want to skip when reporting headers passed to the proxy layer. This is useful to avoid reporting sensitive data.

Example: `["X-Sensitive-Data","X-Signature"]`

##### [`traces_static_attributes`](#proxy-traces_static_attributes "Click to copy link to traces_static_attributes") array Show properties

Static attributes you want to pass for traces.

Each item of traces\_static\_attributes accepts the following properties:

##### [`key`](#traces_static_attributes-key-2 "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#traces_static_attributes-value-2 "Click to copy link to value") string

The value of the static attribute you want to send

##### [`metric_reporting_period`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#metric_reporting_period "Click to copy link to metric_reporting_period") integer

How often you want to report and flush the metrics in seconds. This setting is only used by `otlp` exporters.

Defaults to `30`

##### [`service_name`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#service_name "Click to copy link to service_name") string

A friendly name identifying metrics reported by this installation. When unset, it uses the `name` attribute in the root level of the configuration.

##### [`service_version`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#service_version "Click to copy link to service_version") string

The version you are deploying, this can be useful for deployment tracking.

##### [`skip_paths`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#skip_paths "Click to copy link to skip_paths") array of strings

The paths you don’t want to report. Use the literal value used in the `endpoint` definition, including any `{placeholders}`. In the `global` layer, this attribute works only on metrics, because traces are initiated before there is an endpoint to match against. If you do not want any path skipped, just add an array with an empty string `[""]`.

Example: `["/foo/{bar}"]`

Defaults to `["/__health","/__debug/","/__echo/","/__stats/"]`

##### [`trace_sample_rate`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#trace_sample_rate "Click to copy link to trace_sample_rate") number

The sample rate for traces defines the percentage of reported traces. This option is key to reduce the amount of data generated (and resource usage), while you still can debug and troubleshoot issues. For instance, a number of `0.25` will report a 25% of the traces seen in the system.

Example: `0.25`

Defaults to `1`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/opentelemetry.json](https://www.krakend.io/schema/v3.0/telemetry/opentelemetry.json "JSON schema definition")

Here’s an example with a Grafana Tempo and a Prometheus.

```json
{
    "version": 4,
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "extra_config": {
        "telemetry/opentelemetry": {
            "service_name": "krakend_middle_service",
            "service_version": "commit-sha-ACBDE1234",
            "deploy_env": "production",
            "exporters": {
                "prometheus": [
                    {
                        "name": "my_prometheus",
                        "port": 9092,
                        "listen_ip": "::1",
                        "process_metrics": false,
                        "go_metrics": false
                    }
                ],
                "otlp": [
                    {
                        "name": "local_tempo",
                        "host": "localhost",
                        "port": 4317,
                        "use_http": false
                    }
                ]
            },
            "layers": {
                "global": {
                    "disable_metrics": false,
                    "disable_traces": false,
                    "disable_propagation": false
                },
                "proxy": {
                    "disable_metrics": false,
                    "disable_traces": false
                },
                "backend": {
                    "metrics": {
                        "disable_stage": false,
                        "round_trip": true,
                        "read_payload": true,
                        "detailed_connection": true,
                        "static_attributes": [
                            {
                                "key": "my_metric_attr",
                                "value": "my_middle_metric"
                            }
                        ]
                    },
                    "traces": {
                        "disable_stage": false,
                        "round_trip": true,
                        "read_payload": true,
                        "detailed_connection": true,
                        "static_attributes": [
                            {
                                "key": "my_metric_attr",
                                "value": "my_middle_metric"
                            }
                        ]
                    }
                }
            },
            "skip_paths": [
                "/foo/{bar}"
            ]
        }
    }
}
```

## Examples of integrations

- Push metrics to [InfluxDB](https://www.krakend.io/docs/enterprise/telemetry/influxdb/)
- Pull metrics from [Prometheus](https://www.krakend.io/docs/enterprise/telemetry/prometheus/)
- Push metrics to [Datadog](https://www.krakend.io/docs/enterprise/telemetry/datadog/)
- Push metrics to [Zipkin](https://www.krakend.io/docs/enterprise/telemetry/zipkin/)
- Push metrics to [Jaeger](https://www.krakend.io/docs/enterprise/telemetry/jaeger/)
- Push metrics to [Azure Monitor](https://www.krakend.io/docs/enterprise/telemetry/azure/)
