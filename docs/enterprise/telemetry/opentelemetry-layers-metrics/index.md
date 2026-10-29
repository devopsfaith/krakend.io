# Understanding OpenTelemetry layers and metrics

> Learn about the metrics available when activating OpenTelemetry on KrakenD API Gateway, enabling real-time visibility and analysis of API performance

Source: https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/

You can add several `exporters` to your [OpenTelemetry configuration](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#opentelemetry-configuration) (the more, the hungrier the gateway will be), and KrakenD will send data to all the declared exporters and layers by default.

While `exporters` define **where** you will have the metrics, the `layers` define **which** metrics you want to have. The layers contain the traces and metrics for a subset of the execution flow. These are the layers you can use:

![Diagram showing global, proxy, and backend sequence](https://www.krakend.io/images/documentation/diagrams/opentelemetry-layers.mmd.svg)

- `global`: The global layer contains everything that KrakenD saw in and out. It includes the total timings for a request hitting the service until it is delivered to the client.
- `proxy`: The proxy layer starts acting after processing the HTTP request and comprehends the internal work of dealing with the endpoint, including spawning multiple requests to the backends, aggregating their results, and manipulating the final response.
- `backend`: The backend layer monitors the activity of a single backend request and response with any additional components in its level. It contains mainly the timings between KrakenD and your service. It is the richest layer of all.

**It is vital to see that `backend` is a subset of `proxy`, and `proxy` is a subset of `global`** . Do not generate metrics for the layers you will not use.

CPU and memory consumption

As you will see below, the amount of telemetry data you can send for each request is massive. The more layers and details you add, the more resources KrakenD will consume and the more storage you will need to save metrics and traces. Choose carefully a balance between observability power and resource consumption to save money!

In production, **you should only enable a small sample rate of the traces** (e.g., 5%). The data generated in telemetry is usually more extensive than the responses of the services you expose.

Once you configure the OpenTelemetry component, KrakenD will start reporting metrics when there is activity. The section below describes different metrics in each layer, briefly explaining their meaning.

**The presence of the metrics and the traces described below depend on the [OpenTelemetry configuration](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/#opentelemetry-configuration).**

## How to access telemetry data

Once the OpenTelemetry configuration is in place, KrakenD will start to push metrics and traces as specified to the providers of your choice. The telemetry data is treated differently by each of the providers, and you might find slight differences depending on what you use. For instance, most OTEL integrations will use a dot in the metric name as a separator, while Prometheus will use an underscore instead.

In addition, for metrics that are an histogram, providers will add a suffix to the metric. For instance, on Prometheus you will find a metric documented as `http_server_duration` but in Prometheus **will add automatic suffixes** as follow:

- `http_server_duration_bucket`: Counts how many observations fall into each range.
- `http_server_duration_sum`: Tracks the total sum of all recorded values.
- `http_server_duration_count`: Counts the total number of recorded observations.

This is a sample of what you will find:

### Metrics of the `sample` layer

Description of what the metric is about

[`metric.name` `metric_name` datatype](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-example-metric.name "Permalink to metric.name")

The description of the metric goes here. Notice the metric format above for OTEL or Prometheus.

→ [`dimension.name`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-example-metric.name-dimension.name "Permalink to dimension.name") type

Description of the dimension and what it represents.

Below you’ll find all possible metrics and traces

## Data exposed in the global layer

The `global` layer reveals all timings in and out of KrakenD. If you have custom server plugins, their timings are also included here. Enable this layer when you want to see the complete picture of the gateway.

You will have metrics, traces, or both available depending on the exporter you use.

### Metrics of the `global` layer

Present when you have an exporter able to collect metrics and the `global` attribute configured inside `layers`

[`http.server.duration` `http_server_duration` float](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.duration "Permalink to http.server.duration")

Histogram of the time in seconds that it takes to produce the response

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.duration-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.duration-http.route "Permalink to http.route") string

The matched endpoint path

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.duration-http.request.method "Permalink to http.request.method") string

The method sent by the user (GET, POST, etc.)

[`http.server.response.size` `http_server_response_size` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.response.size "Permalink to http.server.response.size")

Histogram of the size of the body produced for the response in bytes

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.response.size-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.response.size-http.route "Permalink to http.route") string

The matched endpoint path

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-http.server.response.size-http.request.method "Permalink to http.request.method") string

The method sent by the user (GET, POST, etc.)

### Traces of the `global` layer

Present when you have an exporter able to collect traces and the `global` attribute configured inside `layers`. In case an error happens, the span will record the error and set the span status to error (value = 1), in case of success the span status is set to ok (value = 2) as per the OTEL definition.

[`/foo/123` string](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123 "Permalink to /foo/123")

A span is created with the name of the requested path and is depicted as `/foo/123` as an example.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-krakend.stage "Permalink to krakend.stage") string

Contains the value `global`. It’s meant to filter traces of this stage.

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-http.route "Permalink to http.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`. In case no matching is made, for example in 404 results, it would be empty.

→ [`http.response.body.size`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-http.response.body.size "Permalink to http.response.body.size") integer

Histogram of the size in bytes of the body produced for the response.

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-http.request.method "Permalink to http.request.method") string

The method sent by the user (GET, POST, etc.)

→ [`http.request.header.xxx`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-http.request.header.xxx "Permalink to http.request.header.xxx") array

When the `report_headers` is set in the configuration, you will have one extra span for each incoming header (`xxx` represents here any header name in lower case).

→ [`http.connection.hijacked`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-global-%2ffoo%2f123-http.connection.hijacked "Permalink to http.connection.hijacked") bool

If an HTTP request is upgraded to WebSockets, gRPC, etc. and cannot be longer treated as HTTP.

## Data exposed in the proxy layer

The proxy layer starts counting **after processing the HTTP request** and comprehends the internal work of dealing with the endpoint, including spawning multiple requests to the backends, aggregating their results, and manipulating the final response.

### Metrics of the `proxy` layer

Present when you have an exporter able to collect metrics and the `proxy` attribute configured inside `layers`

[`krakend.proxy.duration` `krakend_proxy_duration` float](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration "Permalink to krakend.proxy.duration")

Histogram of the time in seconds that it takes to produce the response

→ [`error`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration-error "Permalink to error") bool

When the endpoint failed to fetch any data from the backend(s).

→ [`canceled`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration-canceled "Permalink to canceled") bool

When the client aborted the request

→ [`complete`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration-complete "Permalink to complete") bool

When all backends successfully returned their information. Matches the header `X-KrakenD-Complete`.

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response after aggregation

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration-http.route "Permalink to http.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-krakend.proxy.duration-http.request.method "Permalink to http.request.method") string

The method sent by the user (GET, POST, etc.)

### Traces of the `proxy` layer

Present when you have an exporter able to collect traces and the `proxy` attribute configured inside `layers`. The spans revealed here include aggregation.

[`/foo/123` string](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123 "Permalink to /foo/123")

A span is created with the name of the requested path and is depicted as `/foo/123` as an example.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-krakend.stage "Permalink to krakend.stage") string

Contains the value `proxy`. It’s meant to filter traces of this stage.

→ [`error`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-error "Permalink to error") string

When there is an error, the description

→ [`canceled`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-canceled "Permalink to canceled") bool

It appears with a `true` value when the request has been canceled (usually when `concurrent_calls` are used).

→ [`complete`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-complete "Permalink to complete") bool

When all backends successfully returned their information. Matches the header `X-KrakenD-Complete`.

→ [`http.request.header.xxx`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-http.request.header.xxx "Permalink to http.request.header.xxx") array

When the `report_headers` is set in the configuration, you will have one extra span for each incoming header (`xxx` represents here any header name in lower case).

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-http.request.method "Permalink to http.request.method") string

The method declared in the endpoint

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-http.route "Permalink to http.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`. In case no matching is made, for example in 404 results, it would be empty.

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-proxy-%2ffoo%2f123-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response after aggregation

## Data exposed in the backend layer

The backend layer monitors the activity of a single backend request and response with any additional components in its level. It contains mainly the timings between KrakenD and your service. It is the richest layer of all.

### Metrics of the `backend` layer

Present when you have an exporter able to collect metrics and the `backend` attribute configured inside `layers`. To see all `http.client` metrics you need to enable the `round_trip` in the backend layer. To see the `http.client.request.` header you must enable the `read_payload` flag

[`krakend.backend.duration` `krakend_backend_duration` float](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration "Permalink to krakend.backend.duration")

Histogram of the time in seconds that it takes to produce the response. The metric includes the whole timing, including any used to perform manipulations at the backend level.

→ [`error`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-error "Permalink to error") bool

When the backend request failed.

→ [`canceled`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-canceled "Permalink to canceled") bool

When the gateway aborted the request to the backend (e.g., got an answer from another thread using `concurrent_calls`)

→ [`complete`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-complete "Permalink to complete") bool

When the backend successfully returned the information.

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response after aggregation

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-http.route "Permalink to http.route") string

The associated `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend`. It’s meant to filter traces of this stage.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-krakend.backend.duration-server.address "Permalink to server.address") string

Targeted hosts. In case more than one is provided, these are joined with `_`.

[`http.client.request.started.count` `http_client_request_started_count` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.started.count "Permalink to http.client.request.started.count")

The number of requests started.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.started.count-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.started.count-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.started.count-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.failed.count` `http_client_request_failed_count` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.failed.count "Permalink to http.client.request.failed.count")

The number of requests that failed.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.failed.count-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.failed.count-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.failed.count-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.canceled.count` `http_client_request_canceled_count` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.canceled.count "Permalink to http.client.request.canceled.count")

The number of requests canceled.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.canceled.count-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.canceled.count-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.canceled.count-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.timedout.count` `http_client_request_timedout_count` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.timedout.count "Permalink to http.client.request.timedout.count")

The number of requests that timed-out.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.timedout.count-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.timedout.count-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.timedout.count-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.content.length` `http_client_request_content_length` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.content.length "Permalink to http.client.request.content.length")

Counter with the sum of bytes in the `Content-Length` header.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.content.length-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.content.length-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.content.length-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.duration` `http_client_duration` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.duration "Permalink to http.client.duration")

Histogram with the seconds taken until receiving the first byte of the response.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.duration-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.duration-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.duration-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.response.size` `http_client_response_size` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.size "Permalink to http.client.response.size")

Histogram with the size of response bodies in bytes as reported in the `Content-Lenght` header. When the header is absent, the metric does not exist.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.size-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.size-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.size-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.response.no-content-length` `http_client_response_no-content-length` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.no-content-length "Permalink to http.client.response.no-content-length")

When the `Content-Length` is not set, this metric is created. If you sum the number of `http.client.response.size` and the value of `http.client.response.no-content-length` they represent the total responses.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.no-content-length-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.no-content-length-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.response.no-content-length-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.get-conn.duration` `http_client_request_get-conn_duration` float](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.get-conn.duration "Permalink to http.client.request.get-conn.duration")

Reports the duration of the connection with the backend in seconds, excluding any data processing time. Requires the flag `detailed_connection`

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.get-conn.duration-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.get-conn.duration-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.get-conn.duration-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.tls.duration` `http_client_request_tls_duration` float](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.tls.duration "Permalink to http.client.request.tls.duration")

Reports the duration of the TLS negotiation in seconds.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.tls.duration-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.tls.duration-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.tls.duration-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.dns.duration` `http_client_request_dns_duration` float](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.dns.duration "Permalink to http.client.request.dns.duration")

Reports the duration of the DNS retrieval in seconds.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.dns.duration-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.dns.duration-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.dns.duration-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

[`http.client.request.read.size` `http_client_request_read_size` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size "Permalink to http.client.request.read.size")

Number of read bytes.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-server.address "Permalink to server.address") string

Targeted host.

[`http.client.request.read.size-hist` `http_client_request_read_size-hist` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist "Permalink to http.client.request.read.size-hist")

Histogram with the read bytes.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.size-hist-server.address "Permalink to server.address") string

Targeted host.

[`http.client.request.read.time` `http_client_request_read_time` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time "Permalink to http.client.request.read.time")

Counter with seconds spent reading the body payload of the response.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-server.address "Permalink to server.address") string

Targeted host.

[`http.client.request.read.time-hist` `http_client_request_read_time-hist` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist "Permalink to http.client.request.read.time-hist")

Histogram with the seconds spent reading the body.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.time-hist-server.address "Permalink to server.address") string

Targeted host.

[`http.client.request.read.errors` `http_client_request_read_errors` integer](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors "Permalink to http.client.request.read.errors")

A counter with the number of errors that happened reading the response body.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors-http.request.method "Permalink to http.request.method") string

The method used to connect to the backend

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors-http.route "Permalink to http.route") string

The resolved `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.errors-server.address "Permalink to server.address") string

Targeted host.

### Traces of the `backend` layer

Present when you have an exporter able to collect traces and the `backend` attribute configured inside `layers`. There is a span for the `backend` part, which includes possible backend manipulations, and another span for the `backend-request`, which include the interaction with the backend.

[`/my-pattern` string](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern "Permalink to /my-pattern")

A span is created with the name of the resolved `url_pattern` is depicted as `/my-pattern` as an example.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend`. It’s meant to filter traces of this stage.

→ [`error`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-error "Permalink to error") string

When there is an error, the description

→ [`canceled`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-canceled "Permalink to canceled") bool

It appears with a `true` value when the request has been canceled (usually when `concurrent_calls` are used).

→ [`complete`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-complete "Permalink to complete") bool

When the backend successfully returned the information.

→ [`http.request.header.xxx`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.request.header.xxx "Permalink to http.request.header.xxx") array

When the `report_headers` is set in the configuration, you will have one extra span for each incoming header (`xxx` represents here any header name in lower case).

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.request.method "Permalink to http.request.method") string

The method declared in the endpoint

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.route "Permalink to http.route") string

The associated `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-server.address "Permalink to server.address") string

Targeted hosts. In case more than one is provided, these are joined with `_`.

[`/my-pattern` string](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern "Permalink to /my-pattern")

A span is created with the name of the resolved `url_pattern` is depicted as `/my-pattern` as an example. Notice that this span shares the name with the previous but is for the `backend-request` instead of `backend`.

→ [`krakend.stage`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-krakend.stage "Permalink to krakend.stage") string

Contains the value `backend-request`. It’s meant to filter traces of this stage.

→ [`dns-duration`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-dns-duration "Permalink to dns-duration") integer

The duration in seconds of the DNS resolution. Requires the flag `detailed_connection`

→ [`get-conn-duration`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-get-conn-duration "Permalink to get-conn-duration") integer

The duration in seconds to establish the connection. Requires the flag `detailed_connection`

→ [`tls-duration`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-tls-duration "Permalink to tls-duration") integer

The duration in seconds to perform the TLS handshake. Requires the flag `detailed_connection`

→ [`http.request.body.size`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.request.body.size "Permalink to http.request.body.size") integer

Size of the request body (payload) in bytes.

→ [`http.request.header.xxx`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.request.header.xxx "Permalink to http.request.header.xxx") array

When the `report_headers` is set in the configuration, you will have one extra span for each incoming header (`xxx` represents here any header name in lower case).

→ [`http.response.status_code`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.response.status_code "Permalink to http.response.status_code") integer

Status code of the produced response after aggregation

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.route "Permalink to http.route") string

The associated `url_pattern` for this route.

→ [`krakend.endpoint.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-krakend.endpoint.route "Permalink to krakend.endpoint.route") string

The associated endpoint definition for this route. E.g., `/foo/{bar}`.

→ [`http.request.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.request.method "Permalink to http.request.method") string

The method declared in the endpoint

→ [`krakend.endpoint.method`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-krakend.endpoint.method "Permalink to krakend.endpoint.method") string

The associated method of the parent endpoint.

→ [`http.route`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-http.route "Permalink to http.route") string

The associated `url_pattern` for this route.

→ [`server.address`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-server.address "Permalink to server.address") string

Targeted host.

→ [`url.full`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-url.full "Permalink to url.full") string

The complete address used to retrieve the content, including protocol, port and path (e.g., `http://example.com:9876/path`)

→ [`user_agent.original`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-%2fmy-pattern-user_agent.original "Permalink to user_agent.original") string

The user agent used when connecting

[`http.client.request.read.tracker` `http_client_request_read_tracker` string](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.tracker "Permalink to http.client.request.read.tracker")

When the `read_payload` option is set to true in the configuration, the time spent to read the body. Enable only in debugging scenarios.

→ [`http.client.request.read.size`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.tracker-http.client.request.read.size "Permalink to http.client.request.read.size") integer

Number of read bytes.

→ [`http.client.request.read.size`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#layer-backend-http.client.request.read.tracker-http.client.request.read.size "Permalink to http.client.request.read.size") integer

Seconds spent to read the request

## Measuring added latency and similar metrics

A common metric developers like to measure is the gateway’s added latency and other similar metrics. In order to get coherent results you must take into account that:

- Having more than one backend in a single endpoint will produce more than one record for the `http.client.duration` metric.
- Requests handled by KrakenD might not reach backends.

So, to find the time spent in KrakenD, subtract the **sum** of `http.client.duration` from the **sum** of `http.server.duration` **only for successful responses** (200 OK) on **endpoints with a single backend**, and divide by the number of received requests. This yields an average per-request added latency attributable to KrakenD.

This is a restrictive scenario, so unless you want to continuously monitor that metric, you should enable traces (with sampling) and inspect a few requests to get a better idea of added latency per endpoint. Traces provide a tree view showing how much time is spent in each “stage” of the request and give more actionable insight than aggregated metrics alone.

Let’s deep dive a little…

Incoming requests are handled at the global layer first. There are many factors that determine whether they reach the backend or not. The gateway is meant to prematurely terminate illegitimate traffic, so **you will never have the same number of records in the global layer as in the other** layers. For example, a not-found 404 route, an invalid JWT token, a violated policy, or a server plugin raising an error, to name a few examples, are examples of records that you can see only in the global layer. As they do not succeed, the request does not produce a record for the proxy or backend layers and your upstream services were never reached in those cases.

In other words, **there is never a 1:1 relationship between the global and proxy layers**, because some requests will not pass through the global layer. Those requests are handled very quickly (under a millisecond), which will skew averages if mixed with normal proxy/backend timings.

Another aspect to have into account is that KrakenD is not a simple proxy, so an endpoint might have more than one backend request.

The interpretation of metrics can also be misleading when an endpoint spawns multiple parallel backend requests. For example, if you have two backend requests and one takes `10 ms` and the other `100 ms`, the naive average of those two backend durations is `55 ms`, but the proxy layer will report a single duration that is higher than `100 ms` (because it waits for all backends and aggregates). That could lead you to incorrectly assume the proxy layer is adding more latency than it actually is.

Traces and sampling are the best way to validate and understand these cases: a few sampled traces will show the timings for each backend call and the proxy’s aggregation time.
