# Logging

> Learn how to implement Syslog and Stdout logging in KrakenD API Gateway, enabling effective monitoring and troubleshooting of your API gateway and microservices

Source: https://www.krakend.io/docs/logging/

The logging component is an essential configuration block for any installation that lets you choose **where** and **how** to log the gateway activity. It also opens the door to integrating other components for more advanced usage.

When you add the logging component, you can customize the format of the logs and send them both to the *stdout* and the *syslog*. However, if you don’t use this component, then KrakenD uses the basic capabilities of [Lura](https://luraproject.org) (standard output only and a `DEBUG` level).

The `telemetry/logging` has the following logging capabilities:

- Write to the **Stdout (the console)**
- Write to the **Syslog (local file or remote server)**
- Add a prefix to log lines
- Select the reporting level
- Option to use a predefined or custom format
- Use custom layouts and define logged fields ([Enterprise version](https://www.krakend.io/docs/enterprise/logging/))

## Types of log messages

The content that KrakenD writes in its log represents two types of logging:

- **Access log**
- **Application log**

The access log and the application log can have different formats. For instance, you can have one in text plain and the other in JSON if needed. When you do this, you must parse them accordingly in your log ingestion.

### Access log

The access log shows **users’ activity** and prints: which endpoints are requested, when, the status code, the duration, the requesting IP, and the method. The default format of the access log is as follows:

```log
[GIN] yyyy/mm/dd - hh:mm:ss | 200 |       4.529µs |      172.17.0.1 | GET      "/user/foo"
[GIN] yyyy/mm/dd - hh:mm:ss | 200 |       3.647µs |      172.17.0.1 | GET      "/category/bar"
```

**Access logs are never written in the syslog**, regardless of their configuration, and they show only in **stdout**.

While the access log is not customizable in the Open Source edition, Enterprise allows you to write the format you want to output using the attribute `access_log_format` (see below).

#### Disabling the access log

You can also disable the access log setting the flag `disable_access_log`, or you can [remove specific requests from logs](https://www.krakend.io/docs/service-settings/router-options/#remove-requests-from-logs) , like when you don’t want to see the health checks.

### Application log

The application log messages are the errors, warnings, debugging information, and other messages shown by the gateway while it operates.

The application logs are customizable as you can extend the functionality, such as sending the events to the **syslog**, using JSON format, choosing the verbosity level, or using the [Graylog Extended Log Format](https://www.krakend.io/docs/logging/graylog-gelf/) (GELF).

In addition to this, a lot of **exporters** are available to send your logs out to third parties (see [Telemetry](https://www.krakend.io/docs/telemetry/))

Application logs might look different on each application, but this is an example:

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

## Logging Configuration

To add ample logging capabilities, you need to add the component at the service level of your `krakend.json` configuration under the `extra_config` key:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/logging": {
      "level": "INFO",
      "prefix": "[KRAKEND]",
      "syslog": false,
      "stdout": true
    }
  }
}
```

These are the different supported configuration options:

##### Fields of Logging

\* required fields

##### [`access_log_custom_format`](https://www.krakend.io/docs/logging/#access_log_custom_format "Click to copy link to access_log_custom_format") string

**Enterprise only.** You can write the access log pattern you would like to use. Add a newline `\n` at the end of the pattern. See the variables you can use.

Example: `"%{prefix} %{time} [AccessLog] |%{statusCode}| %{latencyMs} | %{clientIP} | %{method} %{path}\n"`

Defaults to `""`

##### [`access_log_format`](https://www.krakend.io/docs/logging/#access_log_format "Click to copy link to access_log_format")

**Enterprise only.** Enable a formatter for the access log. You can write your own pattern using the `custom` value, or you can use one of the predefined ones.

Possible values are: `""` , `"default"` , `"httpdCommon"` , `"httpdCombine"` , `"json"` , `"custom"`

Defaults to `""`

##### [`access_log_missing_key_marker`](https://www.krakend.io/docs/logging/#access_log_missing_key_marker "Click to copy link to access_log_missing_key_marker") string

**Enterprise only.** When you use a custom access log format, the variable you are trying to print could be empty. For instance, you have added in the format `%{header.Authorization}` but the header is missing in the request. In this case, the printed value is what you configure here. If the string is set to an empty value, a dash `-` is printed.

Examples: `"%{default}"` , `"%{httpdCommon}"` , `"%{prefix} %{time} [AccessLog] |%{statusCode}| %{latencyMs} | %{clientIP} | %{method} %{path}\n"`

Defaults to `"-"`

##### [`backend`](https://www.krakend.io/docs/logging/#backend "Click to copy link to backend") object

**Enterprise only.** Add a specific [Backend Log](https://www.krakend.io/docs/enterprise/logging/#backend-log). Useful to see status codes, headers, and other information that come from your backends.

##### [`custom_format`](https://www.krakend.io/docs/logging/#custom_format "Click to copy link to custom_format") string

Lets you write a custom logging pattern using variables, e.g: `%{message}`.

##### [`format`](https://www.krakend.io/docs/logging/#format "Click to copy link to format") string

Specify the format of the application logs: default, logstash, or custom.

The custom format needs an additional key “custom\_format”.

Examples: `"default"` , `"logstash"` , `"custom"`

Defaults to `"default"`

##### [`level`](https://www.krakend.io/docs/logging/#level "Click to copy link to level") *

What type of **reporting level** do you expect from the application? The options below go from more verbose to least. Use the `DEBUG` level in the development stages but not in production. Some components can add extra verbosity while in DEBUG mode and send **multiline content**, which is not always suitable for automated log parsing.

Possible values are: `"DEBUG"` , `"INFO"` , `"WARNING"` , `"ERROR"` , `"CRITICAL"`

##### [`prefix`](https://www.krakend.io/docs/logging/#prefix "Click to copy link to prefix") string

Adds the defined string at the beginning of every logged line, so you can quickly filter messages with external tools later on. It’s recommended to always add a prefix `[INSIDE BRACKETS]` to make use of predefined dashboards.

##### [`stdout`](https://www.krakend.io/docs/logging/#stdout "Click to copy link to stdout") boolean

Set to true to send logs to stdout.

Defaults to `false`

##### [`syslog`](https://www.krakend.io/docs/logging/#syslog "Click to copy link to syslog") boolean

Set to true to send logs to syslog.

Defaults to `false`

##### [`syslog_facility`](https://www.krakend.io/docs/logging/#syslog_facility "Click to copy link to syslog_facility")

When using syslog, the facility tells KrakenD where to send the messages as set by the locals of the [syslog standard](https://www.rfc-editor.org/rfc/rfc5424.html).

Possible values are: `"local0"` , `"local1"` , `"local2"` , `"local3"` , `"local4"` , `"local5"` , `"local6"` , `"local7"`

Defaults to `"local3"`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/logging.json](https://www.krakend.io/schema/v3.0/telemetry/logging.json "JSON schema definition")

### Customizing the application log

The attribute `format` allows you to set a formatter for the application log. The following values are available:

- `default`: Uses the pattern `%{time:2006/01/02 - 15:04:05.000} %{color}▶ %{level:.6s}%{color:reset} %{message}`
- `logstash`: **Logs in JSON format** using the logstash format. See [Logstash](https://www.krakend.io/docs/logging/logstash/) for more information. E.g.: `{"@timestamp":"%{time:2006-01-02T15:04:05.000+00:00}", "@version": 1, "level": "%{level}", "message": "%{message}", "module": "%{module}"}`.
- `custom`: Write the pattern from scratch, as defined in the `custom_format` attribute.

#### Variables available under custom\_format

You can use these variables when defining the `custom_format`:

- `%{id}`: Prints the sequence number for log message (uint64).
- `%{pid}`: Prints the process id (int)
- `%{time}`: Prints the time when log occurred. It uses the [Go time format](https://pkg.go.dev/time). For instance `%{time:2006/01/02 - 15:04:05.000}`
- `%{level}`: Prints the log level
- `%{program}`: Prints the command running
- `%{message}`: Prints the application log message
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

### Customizing the access log

Similarly, only on Enterprise you can customize how the access log prints. The following `access_log_format` values are available:

- `default`: Uses `%{prefix} %{time} [AccessLog] |%{statusCode}| %{latencyMs} | %{clientIP} | %{method} %{path}\n` as pattern.
- `httpdCommon`: Uses `%{clientIP} - - [%{time}] \"%{method} %{uri} %{proto}\" %{statusCode} -\n` as in the Apache HTTPd log format
- `httpdCombined`: The Apache HTTPd Combined log format `%{clientIP} - - [%{time}] \"%{method} %{uri} %{proto}\" %{statusCode} - \"%{header.Referer}\" \"%{header.User-Agent}\"\n`
- `json`: Uses `{\"prefix\":\"%{prefix}\", \"time\":\"%{time}\", \"status_code\":%{statusCode}, \"latency\":\"%{latency}\", \"client_ip\":\"%{clientIP}\", \"method\":\"%{method}\", \"path\":\"%{path}\"}\n`
- `custom`: Write your own pattern, as defined in the `access_log_custom_format` attribute.

#### Variables available to `access_log_custom_format`

When the `access_log_format` is set to `custom`, you can use these variables under `access_log_custom_format` to specify your format:

- `%{prefix}`: The value you have set under the `prefix` attribute.
- `%{time}`: The time when the the access finished. The layout prints a format like 2006/01/02 - 15:04:05.000
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
- `%{header.xxx}`: The value of a specific header, where `xxx` is the header name.
- `%{scheme}`: The scheme used (e.g., `http`, `https`, `ws`)
- `%{jwt.xxx}`: The value of a specific claim in the token, where `xxx` is the claim name (only first level, non-nested, claims).
- `%{query}`: The query strings passed in the request
- `%{proto}`: The protocol used (e.g., `HTTP/1.0`, `HTTP/2`, etc.)

For instance, you could **print the access log in JSON format** as follows:

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

Or you could have a log that includes the JWT subject, the authorization header and query strings as follows:

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
      "access_log_custom_format": "[AccessLog] %{prefix} %{time} | %{statusCode} | %{latencyMs} | %{clientIP} | %{method} %{scheme}://%{host}%{path}?%{query} %{query.bar} %{header.Authorization} %{jwt.sub}\n"
    }
  }
}
```

## Writing the log on a file

Although logging on disk might impact software performance and is discouraged in high-throughput systems, you can still store the logs in a file.

**Avoid redirecting the output** (e.g.: `krakend run > krakend.log`) and **use the *syslog* of your machine instead**.

To setup logs on disk, you should consider the following steps:

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

### 2. Add an entry to `rsyslog`

The folder `/etc/rsyslog.d/` shows the different configurations of the system. We will create a new file `/etc/rsyslog.d/krakend.conf` and place this content inside:

```
local3.*    -/var/log/krakend.log
```

If you are familiar with *syslog*, you change the `syslog_facility` to any other (local) value and adjust it in the file above.

### 3. KrakenD log rotation

The syslog will take care of populating the log and can be used conveniently with the default system tools like **rotating the logs** with `logrotate`. Add a new configuration file `/logrotate.d/krakend` and add the content below:

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
