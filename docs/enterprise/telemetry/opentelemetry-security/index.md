# Authenticated metrics to SaaS providers using OTEL

> Push metrics and traces to any SaaS-based third party remote collectors directly, without needing to set up a local collector inside your infrastructure.

Source: https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-security/

The OpenTelemetry Security component allows your KrakenD nodes to push data to a remote collector over the Internet that needs authentication, usually adding a token header.

It allows you to run KrakenD without installing a collector in your infrastructure and push data directly to a SaaS provider, saving time by simplifying the infrastructure needed to monitor the activity.

It combines with the `telemetry/opentelemetry` configuration and separates the authentication data into a new namespace: `telemetry/opentelemetry-security`.

![Push metrics to SaaS](https://www.krakend.io/images/documentation/diagrams/opentelemetry-otlp-auth.mmd.svg)

To add authentication, you need a configuration like this:

```json
{
    "version": 4,
    "telemetry/opentelemetry": {
        "exporters": {
            "otlp": [
                {
                    "name": "newrelic",
                    "host": "https://otlp.eu01.nr-data.net",
                    "port": 4317,
                    "use_http": true
                }
            ]
        }
    },
    "telemetry/opentelemetry-security": {
        "otlp": [
            {
                "name": "newrelic",
                "headers": {
                    "api-key": "YOUR_NEWRELIC_LICENSE_KEY"
                }
            }
        ]
    }
}
```

In the example above, the `telemetry/opentelemetry` is simplified and does not contain all required fields, but notice the following:

- Both components use the same exporter `name`, which is a must.
- The flag `use_http` is set to `true` to send all data through HTTPS instead of gRPC, also a must.
- The example header is `api-key`, the header name New Relic expects, but each SaaS provider uses a different one.
- The value of the header is your license or API key as assigned by the SaaS provider

Here are the fields allowed by the component:

##### Fields of OpenTelemetry Security

\* required fields

##### [`otlp`](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-security/#otlp "Click to copy link to otlp") * array

The list of OTLP exporters that require authentication. Set at least one object to push metrics and traces to an external collector using OTLP.

Each item of otlp accepts the following properties:

##### [`headers`](#otlp-headers "Click to copy link to headers") * object

The custom headers you will send to authenticate requests. Each key is the header name you will add to all outgoing reports.

##### [`.*`](#headers-.%2a "Click to copy link to .*") string

The value of the header, usually an API token.

##### [`name`](#otlp-name "Click to copy link to name") * string

The **exact name** you used to define the exporter under `telemetry/opentelemetry`.

Examples: `"newrelic"` , `"remote_datadog"`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/opentelemetry-security.json](https://www.krakend.io/schema/v3.0/telemetry/opentelemetry-security.json "JSON schema definition")

When the credentials do not work, you’ll see failure messages in the log when pushing the metrics. These usually look like this:

```log
▶ ERROR [SERVICE: OpenTelemetry] failed to upload metrics: failed to send metrics to https://otlp.eu01.nr-data.net:4318/v1/metrics: 403 Forbidden
```
