# HTTP Global Client settings

Source: https://www.krakend.io/docs/service-settings/http-transport-settings/

When KrakenD communicates using HTTP **with all your upstream services**, it implements a concurrent-safe round tripper that supports HTTP, HTTPS, and HTTP proxies, and it caches connections for future re-use. This may leave many open connections when accessing many hosts. You can change the behavior of the transport layer using several settings presented below.

The following settings affect **all connections from KrakenD to your services**.

If you want to customize any of the settings below, they must be written at the top level of the configuration.

##### Settings for KrakenD to your service communication

\* required fields

##### [`client_tls`](https://www.krakend.io/docs/service-settings/http-transport-settings/#client_tls "Click to copy link to client_tls")

Allows to set specific transport settings when using TLS in your upstream services. See [TLS Client](https://www.krakend.io/docs/service-settings/tls/) for more settings

##### [`dialer_fallback_delay`](https://www.krakend.io/docs/service-settings/http-transport-settings/#dialer_fallback_delay "Click to copy link to dialer_fallback_delay") string

Specifies the length of time to wait before spawning a RFC 6555 Fast Fallback connection. If zero, a default delay of 300ms is used.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"300ms"`

##### [`dialer_keep_alive`](https://www.krakend.io/docs/service-settings/http-transport-settings/#dialer_keep_alive "Click to copy link to dialer_keep_alive") string

The interval between keep-alive probes for an active network connection. If zero, keep-alive probes are sent with a default value (currently 15 seconds), if supported by the protocol and operating system. Network protocols or operating systems that do not support keep-alives ignore this field. If negative, keep-alive probes are disabled.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"15s"`

##### [`dialer_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#dialer_timeout "Click to copy link to dialer_timeout") string

The timeout of the dial function for creating connections.The default is no timeout. With or without a timeout, the operating system may impose its own earlier timeout.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`disable_compression`](https://www.krakend.io/docs/service-settings/http-transport-settings/#disable_compression "Click to copy link to disable_compression") boolean

When true prevents requesting compression with an `Accept-Encoding: gzip` request header when the Request contains no existing Accept-Encoding value. If the Transport requests gzip on its own and gets a gzipped response, it’s transparently decoded. However, if the user explicitly requested gzip it is not automatically uncompressed.

Defaults to `false`

##### [`disable_keep_alives`](https://www.krakend.io/docs/service-settings/http-transport-settings/#disable_keep_alives "Click to copy link to disable_keep_alives") boolean

When true it disables HTTP keep-alives and will only use the connection to the server for a single HTTP request.

Defaults to `false`

##### [`expect_continue_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#expect_continue_timeout "Click to copy link to expect_continue_timeout") string

If non-zero, specifies the amount of time to wait for a server’s first response headers after fully writing the request headers if the request has an `Expect: 100-continue` header. Zero means no timeout and causes the body to be sent immediately, without waiting for the server to approve. This time does not include the time to send the request header.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`idle_connection_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#idle_connection_timeout "Click to copy link to idle_connection_timeout") string

The maximum number of idle (keep-alive) connections across all hosts. Zero means no limit.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`max_idle_connections`](https://www.krakend.io/docs/service-settings/http-transport-settings/#max_idle_connections "Click to copy link to max_idle_connections") integer

The maximum number of idle (keep-alive) connections across all hosts. Zero means no limit.

Defaults to `0`

##### [`max_idle_connections_per_host`](https://www.krakend.io/docs/service-settings/http-transport-settings/#max_idle_connections_per_host "Click to copy link to max_idle_connections_per_host") integer

If non-zero, controls the maximum idle (keep-alive) connections to keep per-host. If zero, `250` is used instead.

Defaults to `250`

##### [`response_header_timeout`](https://www.krakend.io/docs/service-settings/http-transport-settings/#response_header_timeout "Click to copy link to response_header_timeout") string

If non-zero, specifies the amount of time to wait for a server’s response headers after fully writing the request (including its body, if any). This time does not include the time to read the response body.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

Schema: [https://www.krakend.io/schema/v3.0/krakend.json](https://www.krakend.io/schema/v3.0/krakend.json "JSON schema definition")

Finally, the **TLS Handshake Timeout** is hardcoded to 10 seconds and cannot be changed.

## Override settings using environment vars

When you declare in the configuration file any of the HTTP server or transport settings declared above, you can [override its value through environment variables](https://www.krakend.io/docs/configuration/environment-vars/) when starting the server.

All the environment variables have the same name as the settings above in uppercase and with the `KRAKEND_` prefix. The following env vars are available:

- `KRAKEND_DIALER_TIMEOUT`
- `KRAKEND_DIALER_KEEP_ALIVE`
- `KRAKEND_DIALER_FALLBACK_DELAY`
- `KRAKEND_DISABLE_COMPRESSION`
- `KRAKEND_DISABLE_KEEP_ALIVES`
- `KRAKEND_MAX_IDLE_CONNECTIONS`
- `KRAKEND_MAX_IDLE_CONNECTIONS_PER_HOST`
- `KRAKEND_IDLE_CONNECTION_TIMEOUT`
- `KRAKEND_RESPONSE_HEADER_TIMEOUT`
- `KRAKEND_EXPECT_CONTINUE_TIMEOUT`

You can start KrakenD with the desired variables to override what you have in the configuration:

Term 

```
$KRAKEND_MAX_IDLE_CONNECTIONS_PER_HOST=200 krakend run -c krakend.json
```

## Max IDLE connections

Having a high number of IDLE connections to every backend affects directly to the performance of the proxy layer. This is why you can control the number using the `max_idle_connections` setting. For instance:

```json
{
	"version": 4,
	"max_idle_connections": 150
}
```

KrakenD will close connections sitting idle in a “keep-alive” state when `max_idle_connections` is reached. If no value is set in the configuration file, KrakenD will use `250` by default.

Every ecosystem needs its own setting, have this in mind:

- If you set a number very high for `max_idle_connections` you might exhaust your system’s port limit.
- If you set a number very low, new connections will be frequently created and a low rate of connection reuse will take place.
