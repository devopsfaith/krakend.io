# New Relic Telemetry Integration (native SDK)

> Integrate New Relic telemetry with KrakenD Enterprise for real-time monitoring and performance analysis of your APIs. Follow our documentation to set up seamless integration

Source: https://www.krakend.io/docs/enterprise/telemetry/newrelic/

The New Relic native integration lets you push KrakenD **metrics and distributed traces** to your New Relic dashboard. It uses internally the official New Relic SDK and brings its features to your **APM dashboard**.

How is the native SDK integration different from OpenTelemetry?

Open-source and Enterprise users can also report traces and metrics to New Relic using the [OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/) integration. Nevertheless, New Relic supports an OTLP specification dated from November 2021 (`v1.8.0`), which is two years behind the current OTLP protocol at the time of writing. The native SDK component in KrakenD uses their official toolset, and sends richer data and is easier to set up without needing an external collector.

Examples of the data you can see on New Relic:

[![NewRelic integration screenshot](https://www.krakend.io/images/documentation/nr/new-relic-1.png)](https://www.krakend.io/images/documentation/nr/new-relic-1.png)

[![NewRelic integration screenshot](https://www.krakend.io/images/documentation/nr/new-relic-2.png)](https://www.krakend.io/images/documentation/nr/new-relic-2.png)

[![NewRelic integration screenshot](https://www.krakend.io/images/documentation/nr/new-relic-3.png)](https://www.krakend.io/images/documentation/nr/new-relic-3.png)

[![NewRelic integration screenshot](https://www.krakend.io/images/documentation/nr/new-relic-4.png)](https://www.krakend.io/images/documentation/nr/new-relic-4.png)

[![NewRelic integration screenshot](https://www.krakend.io/images/documentation/nr/new-relic-5.png)](https://www.krakend.io/images/documentation/nr/new-relic-5.png)

[![NewRelic integration screenshot](https://www.krakend.io/images/documentation/nr/new-relic-6.png)](https://www.krakend.io/images/documentation/nr/new-relic-6.png)

## New Relic configuration

Logs are not part of this component

If you want to see your logs on NewRelic, you must [forward them](https://docs.newrelic.com/docs/logs/forward-logs/enable-log-management-new-relic/) using your preferred solution.

To add KrakenD telemetry reporting to New Relic, you only need add the following configuration with your API Key:

```json
{
    "version": 4,
    "name": "My KrakenD API gateway",
    "extra_config": {
        "telemetry/newrelic": {
            "license": "XXXX",
            "debug": true
        }
    }
}
```

This is all the configuration you need for New Relic, and **you don’t need to install anything else** to see metrics and traces, everything else is automatic, including choosing the region to push the data (which is linked to your license).

The service name in the New Relic dashboard will match the `name` attribute in the root of your KrakenD configuration.

##### Fields of NewRelic exporter

\* required fields

##### [`debug`](https://www.krakend.io/docs/enterprise/telemetry/newrelic/#debug "Click to copy link to debug") boolean

Set to true when configuring New Relic for the first time while in development, to see the activity in the logs. Set to false in production.

Defaults to `false`

##### [`headers_to_pass`](https://www.krakend.io/docs/enterprise/telemetry/newrelic/#headers_to_pass "Click to copy link to headers_to_pass") array of strings

Defines an explicit list of headers sent during the client request that will be reported to NewRelic, in addition to the default headers NewRelic sets. Setting the `["*"]` value will send all headers sent by the client to NewRelic. Whether you declare this setting or not, you will usually receive from the NewRelic SDK the `Accept`, `Content-Type`, `User-Agent`, and `Referer` headers.

Example: `["*"]`

##### [`license`](https://www.krakend.io/docs/enterprise/telemetry/newrelic/#license "Click to copy link to license") * string

The API key provided by New Relic to push data into your account.

Schema: [https://www.krakend.io/schema/v3.0/telemetry/newrelic.json](https://www.krakend.io/schema/v3.0/telemetry/newrelic.json "JSON schema definition")

## Troubleshooting

If you don’t see reports in your New Relic account after sending activity to KrakenD, enable the `debug` flag locally to see what is happening. The logs will show information to help you understand what is going on.

The [logger](https://www.krakend.io/docs/logging/) should be configured with a `DEBUG` level to see these messages.

## Getting your API Key from New Relic

To set the `license` attribute on KrakenD you need to:

1. Go to your account, and select *API keys* ![Setting an API Key](https://www.krakend.io/images/documentation/nr/getting_api_key.png)
2. In the *API keys* screen, select *Create a key* ![Setting an API Key](https://www.krakend.io/images/documentation/nr/getting_api_key2.png)
3. Select the *Key type* `Ingest - License` from the dropdown and create the key ![Setting an API Key](https://www.krakend.io/images/documentation/nr/getting_api_key3.png)
4. Copy the resulting API key into the configuration.

*The screenshots and options above might change as a result of NewRelic continuous improvement of their interfaces.*
