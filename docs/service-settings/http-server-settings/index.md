# HTTP Server Settings

> Configure HTTP server settings in KrakenD API Gateway for optimal performance, security, and compatibility with your infrastructure

Source: https://www.krakend.io/docs/service-settings/http-server-settings/

KrakenD starts an HTTP server to offer the API Gateway server. You can personalize some of the settings used to start the service and also override the default settings of the underlying Go [standard library](https://pkg.go.dev/net/http#Server).

If you want to customize any of the settings below, they must be written at the top level of the configuration.

##### Fields of `"_root"`

\* required fields

##### [`cache_ttl`](https://www.krakend.io/docs/service-settings/http-server-settings/#cache_ttl "Click to copy link to cache_ttl") string

Sets a default `Cache-Control: public, max-age=%d` header to all endpoints where `%d` is the conversion to seconds of any duration you write, indicating for how long the client (or CDN) can cache the content of the request. You can override this value per endpoint, but setting an endpoint to 0 will use the default value instead. Notice that KrakenD does not cache the content with this parameter, but tells the client how to do it. Defaults to `0s` (no cache). **For KrakenD cache, see [backend caching](https://www.krakend.io/docs/backends/caching/)**.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`disable_rest`](https://www.krakend.io/docs/service-settings/http-server-settings/#disable_rest "Click to copy link to disable_rest") boolean

Endpoints require in its `endpoint` definition the usage of a RESTful pattern. If you require unrestful patterns, like `/file.{ext}` (instead of its RESTful counterpart `/file/{ext}`), then you must set this parameter to `true`.

You can use multiple variables if needed, but only one can be in an unrestful position, and when you do, it must be in the last position of the definition. E.g.: you can declare an endpoint `/file/{name}/base.{ext}` but you cannot do `/file.{ext}.json` because the variable `{ext}` is not in the last position of the definitino, and therefore the remaining path after `{ext}` is ignored by the router.

Defaults to `false`

##### [`idle_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#idle_timeout "Click to copy link to idle_timeout") string

The maximum amount of time to wait for the next request when keep-alives are enabled. If `idle_timeout` is zero, the value of `read_timeout` is used. If both are zero, there is no timeout.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`listen_ip`](https://www.krakend.io/docs/service-settings/http-server-settings/#listen_ip "Click to copy link to listen_ip") string

The IP address that KrakenD listens to in IPv4 or IPv6. An empty string, or no declaration at all means listening on all interfaces. The inclusion of `::` is meant for IPv6 format only (**this is not the port**). Examples of valid addresses are `192.0.2.1` (IPv4), `2001:db8::68` (IPv6). The values `::` and `0.0.0.0` listen to all addresses and both are valid for IPv4 and IPv6 simultaneously.

Examples: `"172.12.1.1"` , `"::1"`

Defaults to `"0.0.0.0"`

##### [`max_header_bytes`](https://www.krakend.io/docs/service-settings/http-server-settings/#max_header_bytes "Click to copy link to max_header_bytes") integer

Allows overriding the maximum size of headers sent in bytes. It does not limit the request body. When the value is zero, the default is used instead (1MB)

Defaults to `1000000`

##### [`max_shutdown_wait_time`](https://www.krakend.io/docs/service-settings/http-server-settings/#max_shutdown_wait_time "Click to copy link to max_shutdown_wait_time") string

The gateway gracefully shuts down, waiting for all active connections to drain. Nevertheless, persistent connections or long timeouts may leave the shutdown process running for an extended period. Set the maximum time to wait for all the remaining requests to finish when shutting down the service. After this time, the service will force a shutdown. Defaults to `0s` (wait indefinitely).

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`port`](https://www.krakend.io/docs/service-settings/http-server-settings/#port "Click to copy link to port") integer

The TCP port where KrakenD is listening to. Recommended value is in the range 1024-65535 to run as an unpriviliged user

Defaults to `8080`

##### [`read_header_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#read_header_timeout "Click to copy link to read_header_timeout") string

The amount of time allowed to read request headers. The connection’s read deadline is reset after reading the headers and the Handler can decide what is considered too slow for the body.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`read_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#read_timeout "Click to copy link to read_timeout") string

Is the maximum duration for reading the entire request, including the body. Because `read_timeout` does not let Handlers make per-request decisions on each request body’s acceptable deadline or upload rate, most users will prefer to use `read_header_timeout`. It is valid to use them both.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`sequential_start`](https://www.krakend.io/docs/service-settings/http-server-settings/#sequential_start "Click to copy link to sequential_start") boolean

A sequential start registers all async agents in order, allowing you to have the starting logs in sequential order. A non-sequential start is much faster, but logs are harder to follow.

Defaults to `false`

##### [`use_h2c`](https://www.krakend.io/docs/service-settings/http-server-settings/#use_h2c "Click to copy link to use_h2c") boolean

Enable the support for HTTP/2 with no TLS. This option is only advised when you have a load balancer in front of KrakenD doing SSL termination, and you have no option to enable SSL communication between the balancer and KrakenD (no internal certificates available either). Otherwise, enabling this flag is less secure and less performant.

Defaults to `false`

##### [`write_timeout`](https://www.krakend.io/docs/service-settings/http-server-settings/#write_timeout "Click to copy link to write_timeout") string

Maximum duration before timing out writes of the response.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

Schema: [https://www.krakend.io/schema/v3.0/\_root.json](https://www.krakend.io/schema/v3.0/_root.json "JSON schema definition")

## Override settings using environment vars

When you declare in the configuration file any of the HTTP server settings declared above, you can [override its value through environment variables](https://www.krakend.io/docs/configuration/environment-vars/) when starting the server.

All the environment variables have the same name are the same settings above in uppercase and with the `KRAKEND_` prefix. For instance, looking at the list of settings above, you could override:

- `KRAKEND_PORT`
- `KRAKEND_READ_TIMEOUT`
- `KRAKEND_READ_HEADER_TIMEOUT`
- `KRAKEND_WRITE_TIMEOUT`
- `KRAKEND_IDLE_TIMEOUT`
- `KRAKEND_USE_H2C`
- etc…

You can start KrakenD with the desired variables to override what you have in the configuration:

Term 

```
$KRAKEND_PORT=8000 KRAKEND_READ_TIMEOUT="1s" krakend run -c krakend.json
```
