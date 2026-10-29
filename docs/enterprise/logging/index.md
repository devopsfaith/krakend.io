# Advanced Logging

> Configure and customize logging in KrakenD Enterprise, including log destinations (stdout, syslog), formats, levels, and advanced options.

Source: https://www.krakend.io/docs/enterprise/logging/

The logging component is an essential configuration block for any installation that lets you choose **where** and **how** to log the gateway activity. It also opens the door to integrating other components for more advanced usage.

The Enterprise version of the logging component is much more extensible as it supports **custom formatting and additional placements**.

The `telemetry/logging` has the following logging capabilities:

- Access Log details
- Application Log
- Backend Log (upstream)
- Write to the **Stdout (the console)**
- Write to the **Syslog (local file or remote server)**
- Set different reporting levels
- Use custom layouts

## Types of log messages

The content that KrakenD writes in its log represents three types of logging:

- **Access Log**, declared by `access_log_format`, is set by default. It shows traffic activity.
- **Application Log**, declared by `format`, is set by default. It shows gateway events.
- **Backend Log**, declared by `backend`, is optional. It shows the interaction with backend services.

## Logging Configuration

To add ample logging capabilities, you need to place the `telemetry/logging` namespace under the `extra_config`. When added at the service level (root of your configuration), you define the logging properties for the entire gateway. When added in a specific `backend` (Backend Log only), you choose what gets printed when talking to that specific service.

You can **customize the format** of the logs and send them both to the *stdout* and the *syslog*. However, if you don’t use this component, then KrakenD uses the basic capabilities of the [Lura Project](https://luraproject.org): standard output only and a fixed `DEBUG` level.

The different log types support independent formats and types of fields to output. For instance, you can have one log in plain text and another in JSON, or have the same field outputted with different precisions. When you do this, you must parse logs accordingly in your log ingestion.

When customized, all log types support **variables along with formats** to print the information in a specific way. For instance, a configuration using the default options and no variables for Access and Application Logs would be:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "stdout": true
    }
  }
}
```

While another configuration customizing the different Log types using variables could be:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "stdout": true,
      "format": "default",
      "access_log_format": "custom",
      "access_log_custom_format": "[AccessLog] %{prefix} %{time} | %{statusCode} | %{latencyMs} | %{clientIP} | %{method} %{scheme}://%{host}%{path}?%{query} %{query.bar} %{header.Authorization} %{jwt.sub}\n",
      "backend": {
        "prefix": ">>> ",
        "custom_format": "%{prefix}%{time} | %{statusCode} | %{latencyMs} | %{method} %{host} %{path}\n"
      }
    }
  }
}
```

Remember:

- `format` defines the Application Log
- `access_log_format` defines the Access Log
- `backend` defines the Backend Log

## Customizing Log formats

Below are the different options to customize each of the different log types. Each has a list of available variables.

All the variables are specified as a `%{verb}` and you must write them precisely as documented in each section. However, you can inject into them a format using the syntax `%{verb:format}` (unless otherwise indicated) where the `verb` contains the information available for printing, and `:format` is an optional string that you can use to fine-tune even more the final content.

The `:format` part can be one of:

- A Go [formatting verb](https://pkg.go.dev/fmt)
- A Go [Time layout](https://pkg.go.dev/time#Layout) for the `%{time}` variables, or a string with one of the following predefined formats:
  
  - `ansic` returns time in ANSIC format. Example: `Tue Nov 10 23:00:00 2009`
  - `unixdate` returns time in UnixDate format. Example: `Tue Nov 10 23:00:00 UTC 2009`
  - `rfc822` returns time in RFC822 format. Example: `10 Nov 09 23:00 UTC`
  - `rfc822z` returns time in RFC822Z format. Example: `10 Nov 09 23:00 +0000`
  - `rfc850` returns time in RFC850 format. Example: `Tuesday, 10-Nov-09 23:00:00 UTC`
  - `rfc1123` returns time in RFC1123 format. Example: `Tue, 10 Nov 2009 23:00:00 UTC`
  - `rfc1123z` returns time in RFC1123Z format. Example: `Tue, 10 Nov 2009 23:00:00 +0000`
  - `rfc3339` returns time in RFC3339 format. Example: `2009-11-10T23:00:00Z`
  - `rfc3339nano` returns time in RFC3339Nano format. Example:`2009-11-10T23:00:00.999999999Z07:00`
  - `kitchen` returns time in Kitchen format. Example: `11:00PM`

For instance, in a **Backend Log**, you could have the formats specified like this:

- `%{time:kitchen}` –&gt; Prints time like `11:00PM`
- `%{time:2006-01-02 15:04:05}` –&gt; Prints a date time. Notice that Go uses an **exact date an time** to specify formats `¯\_(ツ)_/¯`.
- `%{host:q}` –&gt; Prints the host with a single-`q`uoted character literal safely escaped
- `%{resp.stats.consumedTokens:d}` –&gt; Prints the value `723` when the response is `{"stats": { "consumedTokens": 723 } }`, as an integer (`d`)

## Access Log

The Access Log shows **users’ traffic** and prints: which endpoints are requested, when, the status code, the response duration, the requesting IP, and the method. The default format of the Access Log is as follows:

```log
[GIN] yyyy/mm/dd - hh:mm:ss | 200 | 0.019ms | 172.17.0.1 | GET "/user/foo"
[GIN] yyyy/mm/dd - hh:mm:ss | 200 | 0.551ms | 172.17.0.1 | GET "/category/bar"
```

The duration is printed uniformly in milliseconds `ms` with a three-digit precision (for microsecond resolution).

Customizations of the Access Log usually add information in tokens or headers for use cases where you want to identify a specific user in the logs to trace it back.

To customize the Access Log you can use a predefined format, or use your own pattern. The Access Log is configured like this:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "stdout": true,
      "access_log_format": "httpdCommon"
    }
  }
}
```

The example above prints the Access Log as in the Apache Web server. The following options are involved:

##### Logging options related with the Access Log

\* required fields

##### [`access_log_custom_format`](https://www.krakend.io/docs/enterprise/logging/#access_log_custom_format "Click to copy link to access_log_custom_format") string

**Enterprise only.** You can write the access log pattern you would like to use. Add a newline `\n` at the end of the pattern. See the variables you can use.

Example: `"%{prefix} %{time} [AccessLog] |%{statusCode}| %{latencyMs} | %{clientIP} | %{method} %{path}\n"`

Defaults to `""`

##### [`access_log_format`](https://www.krakend.io/docs/enterprise/logging/#access_log_format "Click to copy link to access_log_format")

**Enterprise only.** Enable a formatter for the access log. You can write your own pattern using the `custom` value, or you can use one of the predefined ones.

Possible values are: `""` , `"default"` , `"httpdCommon"` , `"httpdCombine"` , `"json"` , `"custom"`

Defaults to `""`

##### [`level`](https://www.krakend.io/docs/enterprise/logging/#level "Click to copy link to level") *

What type of **reporting level** do you expect from the application? The options below go from more verbose to least. Use the `DEBUG` level in the development stages but not in production. Some components can add extra verbosity while in DEBUG mode and send **multiline content**, which is not always suitable for automated log parsing.

Possible values are: `"DEBUG"` , `"INFO"` , `"WARNING"` , `"ERROR"` , `"CRITICAL"`

##### [`prefix`](https://www.krakend.io/docs/enterprise/logging/#prefix "Click to copy link to prefix") string

Adds the defined string at the beginning of every logged line, so you can quickly filter messages with external tools later on. It’s recommended to always add a prefix `[INSIDE BRACKETS]` to make use of predefined dashboards.

##### [`stdout`](https://www.krakend.io/docs/enterprise/logging/#stdout "Click to copy link to stdout") boolean

Set to true to send logs to stdout.

Defaults to `false`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/logging.json](https://www.krakend.io/schema/v3.0/telemetry/logging.json "JSON schema definition")

These are the predefined patterns for the `access_log_format`:

- `default`: Uses `%{prefix} %{time} [AccessLog] |%{statusCode}| %{latencyMs} | %{clientIP} | %{method} %{path}\n` as pattern.
- `httpdCommon`: Uses `%{clientIP} - - [%{time}] \"%{method} %{uri} %{proto}\" %{statusCode} -\n` as in the Apache HTTPd log format
- `httpdCombined`: The Apache HTTPd Combined log format `%{clientIP} - - [%{time}] \"%{method} %{uri} %{proto}\" %{statusCode} - \"%{header.Referer}\" \"%{header.User-Agent}\"\n`
- `json`: Uses `{\"prefix\":\"%{prefix}\", \"time\":\"%{time}\", \"status_code\":%{statusCode}, \"latency\":\"%{latency}\", \"client_ip\":\"%{clientIP}\", \"method\":\"%{method}\", \"path\":\"%{path}\"}\n`
- `custom`: Write your own pattern, as defined in the `access_log_custom_format` attribute.

As explained below, you can use variables to fine-tune the output when you need a specific Access Log format.

### Variables for the Access Log

When the `access_log_format` is set to `custom`, you can write the final pattern in the field `access_log_custom_format` using your desired format.

These are the variables available:

- `%{prefix}`: The value you have set under the `prefix` attribute.
- `%{time}`: The time when the access finished. The default format prints dates like 2006/01/02 - 15:04:05.000
- `%{statusCode}`: The response status code as given to the consumer
- `%{latency}`: The latency in seconds. The default format is `.3fs` (3 decimal float + `s` for seconds). This computes the time of the request from beginning to end.
- `%{latencyMs}`: The latency in milliseconds. The default format is `.3fms` (3 decimal float + `ms` for milliseconds). This computes the time of the request from beginning to end.
- `%{latencyUs}`: The latency in microseconds. The default format is `.3fus` (3 decimal float + `us` for microseconds). This computes the time of the request from beginning to end.
- `%{latencyNs}`: The latency in nanoseconds. The default format is `dns` (integer + `ns` for nanoseconds). This computes the time of the request from beginning to end.
- `%{clientIP}`: The real IP of the client
- `%{method}`: The HTTP verb used
- `%{path}`: The endpoint path, does not include the query string (e.g., `/path/to/endpoint`)
- `%{uri}`: The endpoint path and query string (e.g., `/path/to/endpoint?foo=bar&doe=baz`)
- `%{host}`: The host of the URL
- `%{header.key[.index]}`: The value of a specific header, where `key` is the header name. On multiheader values, you can optionally add an index. For instance, `%{header.Cookie.1}` prints the second value of the Cookie, while `%{header.Cookie}` prints a unique header or the first match.
- `%{scheme}`: The scheme used (e.g., `http`, `https`, `ws`)
- `%{jwt.key}`: The value of a specific claim in the token, where `key` is the claim name (only first level, non-nested, claims).
- `%{query}`: The query strings passed in the request
- `%{proto}`: The protocol used (e.g., `HTTP/1.0`, `HTTP/2`, etc.)

Remember that as explained above, you can [add a `:format`](https://www.krakend.io/docs/enterprise/logging/#customizing-log-formats) to these variables.

For instance, you could **print the Access Log in JSON format** as follows:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "syslog": false,
      "stdout": true,
      "access_log_format": "json"
    }
  }
}
```

Or you could have a log that includes the JWT subject, the authorization header, and some query strings as follows:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "syslog": false,
      "stdout": true,
      "access_log_format": "custom",
      "access_log_custom_format": "[AccessLog] %{prefix} %{time} | %{statusCode} | %{latencyMs} | %{clientIP} | %{method} %{scheme}://%{host}%{path}?%{query} %{query.foo} %{header.Authorization} %{jwt.sub}\n"
    }
  }
}
```

### Disabling the Access Log

You can also disable the Access Log, but this option is **not** handled through this component, but from the `router` namespace and setting the flag `disable_access_log`.

For instance:

```json
{
  "version": 4,
  "extra_config": {
      "router":{
          "disable_access_log": true
      }
}
```

## Application Log

The Application Log messages are the errors, warnings, debugging information, and other events shown by the gateway while it operates.

The Application Logs are customizable as you can extend the functionality, such as sending the events to the **syslog**, using JSON format, choosing the verbosity level, or using the [Graylog Extended Log Format](https://www.krakend.io/docs/enterprise/logging/graylog-gelf/) (GELF).

Application Logs might look different on each application, but this is an example:

```
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [SERVICE: Gin] Debug enabled
yyyy/mm/dd hh:mm:ss KRAKEND INFO: Starting the KrakenD instance
yyyy/mm/dd hh:mm:ss KRAKEND INFO: [SERVICE: Gin] Building the router
yyyy/mm/dd hh:mm:ss KRAKEND INFO: [SERVICE: Gin] Listening on port: 8080
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [SERVICE: AsyncAgent][mkt-event] Starting the async agent
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [ENDPOINT: mkt-event] Building the proxy pipe
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [BACKEND: /__debug/some] Building the backend pipe
yyyy/mm/dd hh:mm:ss KRAKEND INFO: [SERVICE: AsyncAgent][AMQP][mkt-event] Starting the consumer
yyyy/mm/dd hh:mm:ss KRAKEND ERROR: [SERVICE: Asyncagent][mkt-event] building the amqp subscriber: dial tcp 192.168.2.223:5672: connect: connection refused
```

Here’s an example configuring the Application Log using Logstash format:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "stdout": true,
      "format": "logstash"
    }
  }
}
```

The following options are involved:

##### Logging options related with the Application Log

\* required fields

##### [`custom_format`](https://www.krakend.io/docs/enterprise/logging/#custom_format "Click to copy link to custom_format") string

Lets you write a custom logging pattern using variables, e.g: `%{message}`.

##### [`format`](https://www.krakend.io/docs/enterprise/logging/#format "Click to copy link to format") string

Specify the format of the application logs: default, logstash, or custom.

The custom format needs an additional key “custom\_format”.

Examples: `"default"` , `"logstash"` , `"custom"`

Defaults to `"default"`

##### [`level`](https://www.krakend.io/docs/enterprise/logging/#level "Click to copy link to level") *

What type of **reporting level** do you expect from the application? The options below go from more verbose to least. Use the `DEBUG` level in the development stages but not in production. Some components can add extra verbosity while in DEBUG mode and send **multiline content**, which is not always suitable for automated log parsing.

Possible values are: `"DEBUG"` , `"INFO"` , `"WARNING"` , `"ERROR"` , `"CRITICAL"`

##### [`prefix`](https://www.krakend.io/docs/enterprise/logging/#prefix "Click to copy link to prefix") string

Adds the defined string at the beginning of every logged line, so you can quickly filter messages with external tools later on. It’s recommended to always add a prefix `[INSIDE BRACKETS]` to make use of predefined dashboards.

##### [`stdout`](https://www.krakend.io/docs/enterprise/logging/#stdout "Click to copy link to stdout") boolean

Set to true to send logs to stdout.

Defaults to `false`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/logging.json](https://www.krakend.io/schema/v3.0/telemetry/logging.json "JSON schema definition")

The attribute `format` allows you to set a formatter for the Application Log. The following values are available:

- `default`: Uses the pattern `%{time:2006/01/02 - 15:04:05.000} %{color}▶ %{level:.6s}%{color:reset} %{message}`
- `logstash`: **Logs in JSON format** using the logstash format. See [Logstash](https://www.krakend.io/docs/enterprise/logging/logstash/) for more information. E.g.: `{"@timestamp":"%{time:2006-01-02T15:04:05.000+00:00}", "@version": 1, "level": "%{level}", "message": "%{message}", "module": "%{module}"}`.
- `custom`: Write the pattern from scratch, as defined in the `custom_format` attribute.

### Variables available in the Application Log

The variables available when defining the `custom_format` of the Application Log are:

- `%{id}`: Prints the sequence number for log message (uint64).
- `%{pid}`: Prints the process id (int)
- `%{time}`: Prints the time when log occurred. It uses the [Go time format](https://pkg.go.dev/time). For instance `%{time:2006/01/02 - 15:04:05.000}`
- `%{level}`: Prints the log level
- `%{program}`: Prints the command running
- `%{message}`: Prints the Application Log message
- `%{module}`: Prints the module
- `%{color}`: Prints the ANSI color based on log level, the output can be adjusted to either use bold colors, e.g, `%{color:bold}` or to reset the ANSI attributes `%{color:reset}`.

For example, you can customize your pattern like this:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "syslog": false,
      "stdout": true,
      "format": "custom",
      "custom_format": "[MY APP LOG] %{time:2006/01/02 - 15:04:05.000} %{color}▶ %{level:.6s}%{color:reset} %{message}"
    }
  }
}
```

## Backend Log

The Backend Log is a special type of Application Log between the gateway and the upstream service, regardless of what the consumer client could be doing.

It is inserted inside a `backend`’s `extra_config` or in the service directly, and allows you to **track detailed activity** with your backends, offering a flexible and powerful logging system using a custom formatter that injects dynamic verbs and custom layouts. It helps capture exactly the backend request/response data you need for monitoring, troubleshooting, or auditing, but it also sets a scenario for monetization and other exploitation of data.

### Global Backend Log

The following example sets a Backend Log for all backends across the configuration.

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "stdout": true,
      "backend": {
        "custom_format": "%{prefix}%{time:kitchen} ||| %{time:3PM} |%{statusCode}| %{method} %{host} %{path}",
        "prefix": ">>> "
      }
    }
  }
}
```

The important part here is everything under `backend`, and accepts the following parameters:

##### Logging options related with the Backend Log

\* required fields

##### [`custom_format`](https://www.krakend.io/docs/enterprise/logging/#custom_format "Click to copy link to custom_format") string

Specify the custom format of the Backend Logs.

Example: `"%{time:kitchen} | (╯°□°)╯( ┻━┻ %{statusCode} | %{method} %{host} %{path}\n"`

Defaults to `"%{prefix}%{time} |%{statusCode}| %{latencyMs} | %{method} %{host} %{path}\n"`

##### [`log_with_level`](https://www.krakend.io/docs/enterprise/logging/#log_with_level "Click to copy link to log_with_level")

What type of **reporting level** do you want to set at the backends? The options below go from more verbose to least. Use the `DEBUG` level in the development stages but not in production. Some components can add extra verbosity while in DEBUG mode and send **multiline content**, which is not always suitable for automated log parsing.

Possible values are: `"DEBUG"` , `"INFO"` , `"WARNING"` , `"ERROR"` , `"CRITICAL"`

##### [`no_value`](https://www.krakend.io/docs/enterprise/logging/#no_value "Click to copy link to no_value") string

When the variable does not resolve to any value, the string you want to write in the log. If the string is set to an empty value, a dash `-` is printed.

Examples: `"-"` , `"null"` , `"no_value"` , `""`

Defaults to `"-"`

##### [`prefix`](https://www.krakend.io/docs/enterprise/logging/#prefix "Click to copy link to prefix") string

Adds the defined string at the beginning of every logged line, so you can quickly filter messages with external tools later on.

Example: `">>> "`

Defaults to `""`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/backend\_log.json](https://www.krakend.io/schema/v3.0/telemetry/backend_log.json "JSON schema definition")

### Per-Service Backend Log

You can also set the Backend Log on specific backends by adding the configuration under a backend. If you have a Backend Log in the service, the backend one inherits and overrides properties. In this case, you need to use the `telemetry/logging` namespace, but directly adding the attributes of the `backend`. Like this:

```json
{
  "endpoint": "/test",
  "backend": [
    {
      "url_pattern": "/__debug/test",
      "host": ["http://api.example.com"],
      "extra_config": {
        "telemetry/logging": {
          "prefix": ">>> ",
          "@comment": "Table-flip all the things!",
          "custom_format": "%{time:kitchen} | (╯°□°)╯( ┻━┻ %{statusCode} | %{method} %{host} %{path}\n"
        }
      }
    }
  ]
}
```

### Variables available in the Backend Log

The `custom_format` accepts the following variables:

- `%{prefix}`: Prints the prefix defined in the config file. It does not allow formats.
- `%{time}`: Prints the current time, the format can be an alias or a Go time format ([check above](https://www.krakend.io/docs/enterprise/logging/#customizing-log-formats)). The default format is `rfc3339`
- `%{latency}`: The latency in seconds. The default format is `.3fs` (3 decimal float + `s` for seconds). This computes the time of the **backend** request from beginning to end.
- `%{latencyMs}`: The latency in milliseconds. The default format is `.3fms` (3 decimal float + `ms` for milliseconds). This computes the time of the **backend** request from beginning to end.
- `%{latencyUs}`: The latency in microseconds. The default format is `.3fus` (3 decimal float + `us` for microseconds). This computes the time of the **backend** request from beginning to end.
- `%{latencyNs}`: The latency in nanoseconds. The default format is `dns` (integer + `ns` for nanoseconds). This computes the time of the **backend** request from beginning to end.
- `%{host}`: The backend host address. The default format is `s` (string)
- `%{path}`: The request path. The default format is `s`
- `%{method}`: The request method (uppercase). The default format is `s`
- `%{query[.key]}`: The request query string. You can optionally add a `key`(e.g.,`%{query.foo}`). If there are multiple values of the query string (e.g., `?foo=bar&foo=baz`), only the first value is returned. The default format is `s`
- `%{reqHeader.key[.index]}`: The request header, an index can be specified in case there are multiple header values. The default format is `v` (value). Take into account that requests are filtered based on `input_headers` configuration and other components that could transform them. This MIGHT NOT match the original request of the user, but the one generated by KrakenD on backend communication.
- `%{respHeader.key[.index]}`: Requires `no-op`. The response header of the upstream service. The default format is `v` (as in value)
- `%{statusCode}`: Requires `no-op`. The original response status code. The default format is `d` (integer base 10)
- `%{resp.key[.key...]}`: A field of the response body. If nested, it can be accessed with dot notation. You can use the wildcard `*` to traverse arrays and objects, when multiple values are returned they will be printed as a comma separated string. This variable **does not work on `no-op`** . The default format is `v`
- `%{error}`: The error returned by the gateway as a string. For instance, on a timeout, you will get `context deadline exceeded`. The default format is `s`

Here are examples of variables that specify additional formatting:

- `%{statusCode:x}` –&gt; To return status codes in hexadecimal code, because your DevOps needs to spice their lives a little.
- `%{host:q}` –&gt; Prints the host single-quoted (`q`) and safely escaped
- `%{reqHeader.X-Test}` –&gt; Prints the value of the `X-Test` header
- `%{respHeader.Set-Cookie.1:6s}` –&gt; Prints the second cookie set by the backend (index starts at `0`), then adds spaces to the right to have a total of 6 characters. Requires `no-op`.
- `%{resp.gemini.consumedTokens:d}` –&gt; Prints the tokens consumed by Gemini (`31`) when the response is `{"gemini": { "consumedTokens": 31 },"chatgpt": { "consumedTokens": 33 } }`, as an integer (`d`)

## Writing the log to a file

Although logging on disk might impact software performance and is discouraged in high-throughput systems, you can still store the logs in a file.

**Avoid redirecting the output** (e.g.: `krakend run > krakend.log`) and **use the *syslog* of your machine instead**.

To set up logs on disk, you should consider the following steps:

1. Add the syslog configuration to yor `krakend.json`
2. Add a specific entry for krakend under `/etc/rsyslog.d/`
3. Optionally add log rotation

### 1. Syslog configuration

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "WARNING",
      "syslog": true,
      "stdout": true
    }
  }
}
```

You might set the `stdout` to `false` if you don’t want to check on the console but only on the logs.

SYSLOG contains Application Logs only

**Access Logs are never written in the syslog**, regardless of their configuration, and they show only in **stdout**.

### 2. Add an entry to `rsyslog`

The folder `/etc/rsyslog.d/` shows the different configurations of the system. We will create a new file `/etc/rsyslog.d/krakend.conf` and place this content inside:

```
local3.*    -/var/log/krakend.log
```

If you are familiar with *syslog*, you change the `syslog_facility` to any other (local) value and adjust it in the file above.

### 3. KrakenD log rotation

The syslog will populate the log and can be used conveniently with the default system tools like **rotating the logs** with `logrotate`. Add a new configuration file `/logrotate.d/krakend` and add the content below:

```
/var/log/krakend.log {
  rotate 7
  daily
  missingok
  delaycompress
  compress
  postrotate
    /usr/lib/rsyslog/rsyslog-rotate
  endscript
}
```
