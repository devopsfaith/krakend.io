# Granular OpenTelemetry by endpoint

> Set different metrics and traces settings per endpoint or per backend individually, overriding existing OpenTelemetry settings that are defined at the service level

Source: https://www.krakend.io/docs/telemetry/opentelemetry-by-endpoint/

The OpenTelemetry configuration is declared [at the service level](https://www.krakend.io/docs/telemetry/opentelemetry/), but you can override metrics and traces per endpoint and per backend as follows.

## Endpoint override of metrics and traces

The following example overrides properties that could be declared at the service level.

```json
{
    "endpoints": [
        {
            "endpoint": "/example",
            "backend": [
                {
                    "host": [
                        "example.com"
                    ],
                    "url_pattern": "/example"
                }
            ],
            "extra_config": {
                "telemetry/opentelemetry": {
                    "proxy": {
                        "disable_metrics": false,
                        "disable_traces": false,
                        "report_headers": true,
                        "traces_static_attributes": [
                          {
                            "key": "owner",
                            "value": "team-charlie"
                          }
                        ],
                        "metrics_static_attributes": [
                          {
                            "key": "owner",
                            "value": "team-charlie"
                          }
                        ]
                    }
                }
            }
        }
    ]
}
```

The full list of options is:

##### OpenTelemetry settings per endpoint

\* required fields

##### [`proxy`](https://www.krakend.io/docs/telemetry/opentelemetry-by-endpoint/#proxy "Click to copy link to proxy") object

Reports the activity at the beginning of the proxy layer, including spawning the required requests to multiple backends, merging, endpoint transformation and any other internals of the proxy between the request processing and the backend communication

##### [`disable_metrics`](#proxy-disable_metrics "Click to copy link to disable_metrics") boolean

Whether you want to disable all metrics in this endpoint or not.

Defaults to `false`

##### [`disable_traces`](#proxy-disable_traces "Click to copy link to disable_traces") boolean

Whether you want to disable all traces in this endpoint or not.

Defaults to `false`

##### [`metrics_static_attributes`](#proxy-metrics_static_attributes "Click to copy link to metrics_static_attributes") array

Static attributes you want to pass for metrics.

Each item of metrics\_static\_attributes accepts the following properties:

##### [`key`](#metrics_static_attributes-key "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#metrics_static_attributes-value "Click to copy link to value") string

The value of the static attribute you want to send

##### [`report_headers`](#proxy-report_headers "Click to copy link to report_headers") boolean

Whether you want to report all headers that passed from the request to the proxy layer (`input_headers` policy in the endpoint plus KrakenD’s headers).

Defaults to `false`

##### [`skip_headers`](#proxy-skip_headers "Click to copy link to skip_headers") array of strings

A list of headers you want to skip when reporting headers passed to the proxy layer. This is useful to avoid reporting sensitive data.

Example: `["X-Sensitive-Data","X-Signature"]`

##### [`traces_static_attributes`](#proxy-traces_static_attributes "Click to copy link to traces_static_attributes") array

Static attributes you want to pass for traces.

Each item of traces\_static\_attributes accepts the following properties:

##### [`key`](#traces_static_attributes-key "Click to copy link to key") string

The key of the static attribute you want to send

##### [`value`](#traces_static_attributes-value "Click to copy link to value") string

The value of the static attribute you want to send

Schema: [https://www.krakend.io/schema/v3.0/telemetry/opentelemetry-endpoint.json](https://www.krakend.io/schema/v3.0/telemetry/opentelemetry-endpoint.json "JSON schema definition")

In the Enterprise Edition you have more override options, like [override entirely the exporter you want to use](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-by-endpoint/).

## Backend override of metrics and traces

For instance, you have a specific backend that is adding noise to your dashboards and you’d like to disable all layers:

```json
{
    "backend": [
        {
            "extra_config": {
                "telemetry/opentelemetry": {
                    "proxy": {
                        "disable_metrics": true,
                        "disable_traces": true
                    },
                    "backend": {
                        "metrics": {
                            "disable_stage": true
                        },
                        "traces": {
                            "disable_stage": true
                        }
                    }
                }
            },
            "url_pattern": "/noise",
            "host": [
                "example.com"
            ]
        }
    ]
}
```

These are the options:

##### OpenTelemetry settings per backend

\* required fields

##### [`backend`](https://www.krakend.io/docs/telemetry/opentelemetry-by-endpoint/#backend "Click to copy link to backend") object

Reports the activity between KrakenD and each of your backend services. This is the more granular layer.

##### [`metrics`](#backend-metrics "Click to copy link to metrics") object

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

##### [`static_attributes`](#metrics-static_attributes "Click to copy link to static_attributes") array of objects Show properties

a list of tags or labels you want to associate with these metrics.

see: [https://www.krakend.io/docs/telemetry/opentelemetry/](https://www.krakend.io/docs/telemetry/opentelemetry/)

Example: `[{"key":"my_metric_attr","value":"my_metric_val"}]`

Each item of static\_attributes accepts the following properties:

##### [`key`](#static_attributes-key "Click to copy link to key") * string

the key, tag, or label name you want to use.

see: [https://www.krakend.io/docs/telemetry/opentelemetry/](https://www.krakend.io/docs/telemetry/opentelemetry/)

##### [`value`](#static_attributes-value "Click to copy link to value") * string

the static value you want to assign to this key.

see: [https://www.krakend.io/docs/telemetry/opentelemetry/](https://www.krakend.io/docs/telemetry/opentelemetry/)

##### [`traces`](#backend-traces "Click to copy link to traces") object

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

##### [`static_attributes`](#traces-static_attributes "Click to copy link to static_attributes") array of objects Show properties

a list of tags or labels you want to associate with these metrics.

see: [https://www.krakend.io/docs/telemetry/opentelemetry/](https://www.krakend.io/docs/telemetry/opentelemetry/)

Example: `[{"key":"my_metric_attr","value":"my_metric_val"}]`

Each item of static\_attributes accepts the following properties:

##### [`key`](#static_attributes-key-2 "Click to copy link to key") * string

the key, tag, or label name you want to use.

see: [https://www.krakend.io/docs/telemetry/opentelemetry/](https://www.krakend.io/docs/telemetry/opentelemetry/)

##### [`value`](#static_attributes-value-2 "Click to copy link to value") * string

the static value you want to assign to this key.

see: [https://www.krakend.io/docs/telemetry/opentelemetry/](https://www.krakend.io/docs/telemetry/opentelemetry/)

Schema: [https://www.krakend.io/schema/v3.0/telemetry/opentelemetry-backend.json](https://www.krakend.io/schema/v3.0/telemetry/opentelemetry-backend.json "JSON schema definition")
