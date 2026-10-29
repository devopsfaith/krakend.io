# Datadog Telemetry Integration

> Integrate Datadog telemetry with KrakenD API Gateway for advanced monitoring, visualization, and analysis of your API ecosystem

Source: https://www.krakend.io/docs/enterprise/telemetry/datadog/

[Datadog](https://www.datadoghq.com/) is a cloud monitoring and security platform for developers, IT operations teams, and businesses.

The [OpenTelemetry integration](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) allows you to send **metrics and traces** to Datadog using their collector.

## Datadog configuration

Datadog uses the standard OTLP exporter, here is a configuration example:

```json
{
    "version": 4,
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "host": [
        "http://localhost:8080"
    ],
    "debug_endpoint": true,
    "echo_endpoint": true,
    "extra_config": {
        "telemetry/opentelemetry": {
            "exporters": {
                "otlp": [
                    {
                        "use_http": false,
                        "port": 4317,
                        "host": "ddagent",
                        "name": "my_dd_exporter",
                        "disable_metrics": false,
                        "disable_traces": false
                    }
                ]
            },
            "trace_sample_rate": 1,
            "service_name": "krakend_dd_telemetry",
            "metric_reporting_period": 1
        }
    }
}
```

The important part of the configuration is the `otlp` exporter, which accepts the following fields:

##### Fields of `"telemetry/opentelemetry": { "exporters":{} }`

\* required fields

##### [`otlp`](https://www.krakend.io/docs/enterprise/telemetry/datadog/#otlp "Click to copy link to otlp") array

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

In addition, you can configure how the `layers` behave ([see all options](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#layers)).

## Datadog agent

You must set your Datadog API key in the agent. The exporter communicates with the agent and is the agent the one reporting to Datadog.

Here’s an example of how to run the Datadog agent together with KrakenD in a docker compose file:

```yml
version: '3'
services:
  krakend:
    image: krakend/krakend-ee:3.0.2
    volumes:
      - "./:/etc/krakend"
    command: ["run", "-c", "krakend.json"]
    ports:
      - "8080:8080"
  datadog:
    image: gcr.io/datadoghq/agent:7
    pid: host
    environment:
     - DD_API_KEY=XXXXXXXXXXXXXXX
     - DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_GRPC_ENDPOINT=0.0.0.0:4317
     - DD_OTLP_CONFIG_RECEIVER_PROTOCOLS_HTTP_ENDPOINT=0.0.0.0:4318
     - DD_SITE=datadoghq.com
    volumes:
     - /var/run/docker.sock:/var/run/docker.sock
     - /proc/:/host/proc/:ro
     - /sys/fs/cgroup:/host/sys/fs/cgroup:ro
```

Notice that we are naming the service `ddagent` in Docker compose, and this matches our `host` field in the configuration.

## Migrating from OpenCensus

Prior to v2.6, telemetry sent to Datadog used the OpenCensus exporter. Enabling required adding the `datadog` exporter in the [opencensus module](https://www.krakend.io/docs/enterprise/v2.13/telemetry/opencensus/), and the configurations looked like this:

```json
{
      "version": 4,
      "extra_config": {
        "telemetry/opencensus": {
          "sample_rate": 100,
          "reporting_period": 0,
          "exporters": {
            "datadog": {
              "tags": [
                "gw"
              ],
              "global_tags": {
                "env": "prod"
              },
              "disable_count_per_buckets": true,
              "trace_address": "localhost:8126",
              "stats_address": "localhost:8125",
              "namespace": "krakend",
              "service": "gateway"
            }
          }
        }
      }
}
```

You can migrate to OpenTelemetry doing the following changes:

- Rename `telemetry/opencensus` to `telemetry/opentelemetry`.
- `sample_rate` -&gt; Delete this field
- `reporting_period` -&gt; Rename to `metric_reporting_period`
- `datadog` -&gt; Rename to `otlp`, and add an array surrounding the object, so it becomes `"otlp": [{...}]`
- `namespace` -&gt; Rename to `name`
- `tag_host`, `tag_path`,`tag_method`,`tag_statuscode` -&gt; Delete them
