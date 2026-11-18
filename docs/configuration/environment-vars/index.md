# Environment variables in the configuration

> Learn how to leverage environment variables in KrakenD API Gateway configuration for flexible and dynamic configuration management

Source: https://www.krakend.io/docs/configuration/environment-vars/

When KrakenD runs (whether with `run` or `check`), all the behavior is loaded from the [configuration file](https://www.krakend.io/docs/configuration/structure/). Through environment variables, you can also set values. There are two different ways of injecting environment vars:

- **Use a `KRAKEND_`-like reserved environment variable**: To override values set in the configuration.
- **Set your own environment variables** when using the `{{env}}` function in [flexible configuration](https://www.krakend.io/docs/configuration/flexible-config/) templates.

## Use a reserved environment variable

There are a group of reserved environment variables that are automatically recognized by KrakenD when set.

Examples are when you want to replace the `port`, the default `timeout`, or the configuration `name` (sent to your telemetry) that already exists in the configuration.

In essence, you can replace any value in the configuration that lives in the root level, and is a string, an integer, or a boolean. To do it you only need to capitalize the property name and add a prefix `KRAKEND_`.

Reserved variables are ignored unless the key exists in the configuration

The following list of variables only set the desired values when you have its associated value in the configuration. They are meant to **override** settings **already present** in the configuration, but if you set one of them and there is no value in the configuration, it won’t have any effect.

`KRAKEND_CACHE_TTL`string

Overrides `cache_ttl` in the configuration. Sets a default `Cache-Control: public, max-age=%d` header to all endpoints where `%d` is the conversion to seconds of any duration you write, indicating for how long the client (or CDN) can cache the content of the request. You can override this value per endpoint, but setting an endpoint to 0 will use the default value instead. Notice that KrakenD does not cache the content with this parameter, but tells the client how to do it. Defaults to `0s` (no cache). **For KrakenD cache, see [backend caching](https://www.krakend.io/docs/backends/caching/)**.

`KRAKEND_DEBUG_ENDPOINT`boolean

Overrides `debug_endpoint` in the configuration. Enables the `/__debug/` endpoint for this configuration. You can safely enable it in production.

`KRAKEND_DIALER_FALLBACK_DELAY`string

Overrides [`dialer_fallback_delay`](https://www.krakend.io/docs/service-settings/http-transport-settings/#dialer_fallback_delay) in the configuration. Specifies the length of time to wait before spawning a RFC 6555 Fast Fallback connection. If zero, a default delay of 300ms is used.

`KRAKEND_DIALER_KEEP_ALIVE`string

Overrides [`dialer_keep_alive`](https://www.krakend.io/docs/service-settings/http-transport-settings/#dialer_keep_alive) in the configuration. The interval between keep-alive probes for an active network connection. If zero, keep-alive probes are sent with a default value (currently 15 seconds), if supported by the protocol and operating system. Network protocols or operating systems that do not support keep-alives ignore this field. If negative, keep-alive probes are disabled.

`KRAKEND_DIALER_TIMEOUT`string

Overrides [`dialer_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#dialer_timeout) in the configuration. The timeout of the dial function for creating connections.The default is no timeout. With or without a timeout, the operating system may impose its own earlier timeout.

`KRAKEND_DISABLE_COMPRESSION`boolean

Overrides [`disable_compression`](https://www.krakend.io/docs/service-settings/http-transport-settings/#disable_compression) in the configuration. When true prevents requesting compression with an `Accept-Encoding: gzip` request header when the Request contains no existing Accept-Encoding value. If the Transport requests gzip on its own and gets a gzipped response, it’s transparently decoded. However, if the user explicitly requested gzip it is not automatically uncompressed.

`KRAKEND_DISABLE_KEEP_ALIVES`boolean

Overrides [`disable_keep_alives`](https://www.krakend.io/docs/service-settings/http-transport-settings/#disable_keep_alives) in the configuration. When true it disables HTTP keep-alives and will only use the connection to the server for a single HTTP request.

`KRAKEND_DISABLE_REST`boolean

Overrides `disable_rest` in the configuration. Endpoints require in its `endpoint` definition the usage of a RESTful pattern. If you require unrestful patterns, like `/file.{ext}` (instead of its RESTful counterpart `/file/{ext}`), then you must set this parameter to `true`. You can use multiple variables if needed, but only one can be in an unrestful position, and when you do, it must be in the last position of the definition. E.g.: you can declare an endpoint `/file/{name}/base.{ext}` but you cannot do `/file.{ext}.json` because the variable `{ext}` is not in the last position of the definitino, and therefore the remaining path after `{ext}` is ignored by the router.

`KRAKEND_DNS_CACHE_TTL`string

Overrides [`dns_cache_ttl`](https://www.krakend.io/docs/backends/service-discovery/#dns_cache_ttl) in the configuration. Sets the maximum time KrakenD can store the results of a query to the configured Service Discovery returning the available hosts list. For values under `1s` this setting is ignored.

`KRAKEND_ECHO_ENDPOINT`boolean

Overrides `echo_endpoint` in the configuration. Enables the `/__echo/` endpoint for this configuration, that returns information about the incoming request. When using /\_\_echo as a backend you can check the actual headers and content a backend receives after all the zero-trust filtering.

`KRAKEND_EXPECT_CONTINUE_TIMEOUT`string

Overrides [`expect_continue_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#expect_continue_timeout) in the configuration. If non-zero, specifies the amount of time to wait for a server’s first response headers after fully writing the request headers if the request has an `Expect: 100-continue` header. Zero means no timeout and causes the body to be sent immediately, without waiting for the server to approve. This time does not include the time to send the request header.

`KRAKEND_IDLE_CONNECTION_TIMEOUT`string

Overrides [`idle_connection_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#idle_connection_timeout) in the configuration. The maximum number of idle (keep-alive) connections across all hosts. Zero means no limit.

`KRAKEND_IDLE_TIMEOUT`string

Overrides [`idle_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#idle_timeout) in the configuration. The maximum amount of time to wait for the next request when keep-alives are enabled. If `idle_timeout` is zero, the value of `read_timeout` is used. If both are zero, there is no timeout.

`KRAKEND_LISTEN_IP`string

Overrides `listen_ip` in the configuration. The IP address that KrakenD listens to in IPv4 or IPv6. An empty string, or no declaration at all means listening on all interfaces. The inclusion of `::` is meant for IPv6 format only (**this is not the port**). Examples of valid addresses are `192.0.2.1` (IPv4), `2001:db8::68` (IPv6). The values `::` and `0.0.0.0` listen to all addresses and both are valid for IPv4 and IPv6 simultaneously.

`KRAKEND_MAX_HEADER_BYTES`integer

Overrides [`max_header_bytes`](https://www.krakend.io/docs/service-settings/http-transport-settings/#max_header_bytes) in the configuration. Allows overriding the maximum size of headers sent in bytes. It does not limit the request body. When the value is zero, the default is used instead (1MB)

`KRAKEND_MAX_IDLE_CONNECTIONS`integer

Overrides [`max_idle_connections`](https://www.krakend.io/docs/service-settings/http-transport-settings/#max_idle_connections) in the configuration. The maximum number of idle (keep-alive) connections across all hosts. Zero means no limit.

`KRAKEND_MAX_IDLE_CONNECTIONS_PER_HOST`integer

Overrides [`max_idle_connections_per_host`](https://www.krakend.io/docs/service-settings/http-transport-settings/#max_idle_connections_per_host) in the configuration. If non-zero, controls the maximum idle (keep-alive) connections to keep per-host. If zero, `250` is used instead.

`KRAKEND_MAX_SHUTDOWN_WAIT_TIME`string

Overrides [`max_shutdown_wait_time`](https://www.krakend.io/docs/service-settings/http-server-settings/#max_shutdown_wait_time) in the configuration. The gateway gracefully shuts down, waiting for all active connections to drain. Nevertheless, persistent connections or long timeouts may leave the shutdown process running for an extended period. Set the maximum time to wait for all the remaining requests to finish when shutting down the service. After this time, the service will force a shutdown. Defaults to `0s` (wait indefinitely).

`KRAKEND_NAME`string

Overrides `name` in the configuration. Used in telemetry. A friendly name, title, date, version or any other short description that helps you recognize the configuration.

`KRAKEND_PORT`integer

Overrides `port` in the configuration. The TCP port where KrakenD is listening to. Recommended value is in the range 1024-65535 to run as an unpriviliged user

`KRAKEND_READ_HEADER_TIMEOUT`string

Overrides [`read_header_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#read_header_timeout) in the configuration. The amount of time allowed to read request headers. The connection’s read deadline is reset after reading the headers and the Handler can decide what is considered too slow for the body.

`KRAKEND_READ_TIMEOUT`string

Overrides [`read_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#read_timeout) in the configuration. Is the maximum duration for reading the entire request, including the body. Because `read_timeout` does not let Handlers make per-request decisions on each request body’s acceptable deadline or upload rate, most users will prefer to use `read_header_timeout`. It is valid to use them both.

`KRAKEND_RESPONSE_HEADER_TIMEOUT`string

Overrides [`response_header_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#response_header_timeout) in the configuration. If non-zero, specifies the amount of time to wait for a server’s response headers after fully writing the request (including its body, if any). This time does not include the time to read the response body.

`KRAKEND_SEQUENTIAL_START`boolean

Overrides [`sequential_start`](https://www.krakend.io/docs/service-settings/http-server-settings/#sequential_start) in the configuration. A sequential start registers all async agents in order, allowing you to have the starting logs in sequential order. A non-sequential start is much faster, but logs are harder to follow.

`KRAKEND_TIMEOUT`string

Overrides [`timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#global-timeout) in the configuration. Defines a default timeout for all endpoints. Can be overriden per endpoint.

`KRAKEND_USE_H2C`boolean

Overrides [`use_h2c`](https://www.krakend.io/docs/service-settings/router-options/#use_h2c) in the configuration. Enable the support for HTTP/2 with no TLS. This option is only advised when you have a load balancer in front of KrakenD doing SSL termination, and you have no option to enable SSL communication between the balancer and KrakenD (no internal certificates available either). Otherwise, enabling this flag is less secure and less performant.

`KRAKEND_WRITE_TIMEOUT`string

Overrides [`write_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#write_timeout) in the configuration. Maximum duration before timing out writes of the response.

`USAGE_DISABLE`boolean

Disables the usage telemetry: a request to our stats server during startup and every 12 hours with anonymous, non-sensitive information such as the version, operating system, architecture and uptime ([see the source code](https://github.com/krakend/krakend-usage)).

### Reserved variable example

For instance, take the following `krakend.json` configuration as an example:

```json
{
    "version": 4,
    "timeout": "3s",
    "name": "Example gateway.",
    "cache_ttl": "0s"
}
```

You could start the server with the following command which would allow you to override the values in the configuration:

Example: Override configuration with env vars 

```
$KRAKEND_NAME="Build ABC0123" \
KRAKEND_TIMEOUT="500ms" \
KRAKEND_PORT=9000 \
krakend run -c krakend.json
```

The resulting configuration will be:

```json
{
    "version": 4,
    "timeout": "500ms",
    "name": "Build ABC0123"
}
```

**Important**: Notice that the `port` attribute is not present in the configuration, despite passing a `KRAKEND_PORT` parameter. This is because the `port` didn’t exist previously in the configuration file, and the environment variables can only **override** values.

## Setting your environment variables

If you need to set content using environment variables at any level, you have can either use the [flexible configuration](https://www.krakend.io/docs/configuration/flexible-config/), which includes a series of [advanced functions](https://www.krakend.io/docs/configuration/templates/#sprig-functions) including an `env` function, or you can not use KrakenD at all and rely on the operating system `envsubst` command. Obviously you can also write your custom replacement process.

### Environment variables with Flexible Configuration

Here is an example with Flexible Configuration:

```go-text-template
{
    "version": 4,
    "name": "Configuration for {{ env "MY_POD_NAMESPACE" }}"
}
```

When you use the flexible configuration, you can start KrakenD from the template that uses them.

### Environment variables with envsubst

Another example is not to use any of the built-in features of KrakenD and rely on your operating system via the command `envusbst`.

For instance, you have a configuration file `krakend.template.json` like the following:

```json
{
    "version": 4,
    "name": "Configuration for $MY_POD_NAMESPACE"
}
```

Then you can generate the final configuration `krakend.json` like this:

Environment variable substitution 

```
$export MY_POD_NAMESPACE="my-namespace" && envsubst < krakend.template.json > krakend.json
```

The command, which is generally available in Linux distributions, takes a template file as input and outputs the same file with the environment variables replaced (you cannot override the same file). You have to be aware that missing variables are simply replaced by an empty string.

Note: on Alpine-based containers, like the KrakenD image, you need to do an `apk add envsubst` to use this command.
