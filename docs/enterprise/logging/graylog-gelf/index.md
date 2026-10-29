# Graylog GELF Logging Integration

> Integrate Graylog GELF logging with KrakenD API Gateway for centralized log management and analysis of API logs

Source: https://www.krakend.io/docs/enterprise/logging/graylog-gelf/

KrakenD supports sending structured events in GELF format to your Graylog Cluster thanks to the [krakend-gelf](https://github.com/krakend/krakend-gelf) integration.

The setup of GELF is straightforward and requires to add **two components** in the configuration:

- `telemetry/logging` to capture the logs
- `telemetry/gelf` to format the logs

The configuration you need to add is this, and explained below:

```json
{
    "extra_config": {
      "telemetry/gelf": {
        "address": "myGraylogInstance:12201",
        "enable_tcp": false
      },
      "telemetry/logging": {
          "level": "INFO",
          "prefix": "[KRAKEND]",
          "syslog": false,
          "stdout": false
      }
    }
}
```

The GELF configuration parameters for `telemetry/gelf` are:

##### Fields of GELF

\* required fields

##### [`address`](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/#address "Click to copy link to address") * string

The address (including the port) of your Graylog cluster (or any other service that receives GELF inputs). E.g., `myGraylogInstance:12201`

##### [`enable_tcp`](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/#enable_tcp "Click to copy link to enable_tcp") * boolean

Set to false (recommended) to use UDP, or true to use TCP. TCP performance is worst than UDP under heavy load.

Schema: [https://www.krakend.io/schema/v3.0/telemetry/gelf.json](https://www.krakend.io/schema/v3.0/telemetry/gelf.json "JSON schema definition")

In addition, you must also add the `telemetry/logging`:

##### Fields of `"telemetry/logging"`

\* required fields

##### [`level`](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/#level "Click to copy link to level") *

What type of **reporting level** do you expect from the application? The options below go from more verbose to least. Use the `DEBUG` level in the development stages but not in production. Some components can add extra verbosity while in DEBUG mode and send **multiline content**, which is not always suitable for automated log parsing.

Possible values are: `"DEBUG"` , `"INFO"` , `"WARNING"` , `"ERROR"` , `"CRITICAL"`

##### [`prefix`](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/#prefix "Click to copy link to prefix") string

Adds the defined string at the beginning of every logged line, so you can quickly filter messages with external tools later on. It’s recommended to always add a prefix `[INSIDE BRACKETS]` to make use of predefined dashboards.

##### [`stdout`](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/#stdout "Click to copy link to stdout") boolean

Set to true to send logs to stdout.

Defaults to `false`

##### [`syslog`](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/#syslog "Click to copy link to syslog") boolean

Set to true to send logs to syslog.

Defaults to `false`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/logging.json](https://www.krakend.io/schema/v3.0/telemetry/logging.json "JSON schema definition")
