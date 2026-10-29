# Service Settings Configuration

> Service settings are optional flags that allow you to change how KrakenD behaves globally for all endpoints across configuration.

Source: https://www.krakend.io/docs/enterprise/service-settings/

We call **service settings** (or the service layer) those parameters that allow you to change how KrakenD behaves **globally** (and not to a specific call). They determine how you start the HTTP server, enforce security parameters, or define behavioral options like which reporting activities occur, to name a few examples.

Examples of service settings are, the [listening port](https://www.krakend.io/docs/enterprise/service-settings/http-server-settings/), [disabling keep alives](https://www.krakend.io/docs/enterprise/service-settings/http-transport-settings/), enabling [metrics and traces](https://www.krakend.io/docs/enterprise/telemetry/), [listening https](https://www.krakend.io/docs/enterprise/service-settings/tls/), or enabling [CORS](https://www.krakend.io/docs/enterprise/service-settings/cors/) to name a few.

If you haven’t done it yet, read [Understanding the configuration file](https://www.krakend.io/docs/enterprise/configuration/structure/).

All service settings are written directly in the root of the configuration file or its corresponding `extra_config`. So, for instance, here there is a configuration file describing a service listening on port 8080 with extended logging enabled:

```json
{
    "version": 4,
    "port": 8080,
    "output_encoding": "json",
    "host": ["http://myapi"],
    "timeout": "3s",
    "cache_ttl": "60s",
    "listen_ip": "192.168.1.3",
    "endpoints": [],
    "extra_config": {
      "telemetry/logging": {
        "level": "WARNING",
        "syslog": true,
        "stdout": true
      }
    }
}
```

The service accepts **numerous configuration options** that you’ll find explained through the rest of the documentation, but here is a preview of the most important ones:

##### Preview of important service configuration fields

\* required fields

##### [`cache_ttl`](https://www.krakend.io/docs/enterprise/service-settings/#cache_ttl "Click to copy link to cache_ttl") string

Sets a default `Cache-Control: public, max-age=%d` header to all endpoints where `%d` is the conversion to seconds of any duration you write, indicating for how long the client (or CDN) can cache the content of the request. You can override this value per endpoint, but setting an endpoint to 0 will use the default value instead. Notice that KrakenD does not cache the content with this parameter, but tells the client how to do it. Defaults to `0s` (no cache). **For KrakenD cache, see [backend caching](https://www.krakend.io/docs/backends/caching/)**.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0s"`

##### [`endpoints`](https://www.krakend.io/docs/enterprise/service-settings/#endpoints "Click to copy link to endpoints") array of objects

Your API contract, or the list of all paths recognized by this gateway. The paths `/__health/`, `/__debug/`, `/__echo/`, `/__catchall`, and `/__stats/` are reserved by the system and you cannot declare them. Their existence depends on their respective settings.

##### [`extra_config`](https://www.krakend.io/docs/enterprise/service-settings/#extra_config "Click to copy link to extra_config") object

The optional configuration that extends the core functionality of the gateway is specified here. The `extra_config` at this level enables service components, meaning that they apply globally to all endpoints or activity.

##### [`host`](https://www.krakend.io/docs/enterprise/service-settings/#host "Click to copy link to host") array of strings

The default host list for all backends if they specify none.

##### [`listen_ip`](https://www.krakend.io/docs/enterprise/service-settings/#listen_ip "Click to copy link to listen_ip") string

The IP address that KrakenD listens to in IPv4 or IPv6. An empty string, or no declaration at all means listening on all interfaces. The inclusion of `::` is meant for IPv6 format only (**this is not the port**). Examples of valid addresses are `192.0.2.1` (IPv4), `2001:db8::68` (IPv6). The values `::` and `0.0.0.0` listen to all addresses and both are valid for IPv4 and IPv6 simultaneously.

Examples: `"172.12.1.1"` , `"::1"`

Defaults to `"0.0.0.0"`

##### [`output_encoding`](https://www.krakend.io/docs/enterprise/service-settings/#output_encoding "Click to copy link to output_encoding")

The encoding used to display the content to the end-user. This setting is the default for all endpoints, unless they have another `output_encoding` overrinding this value.

Possible values are: `"json"` , `"fast-json"` , `"json-collection"` , `"xml"` , `"negotiate"` , `"string"` , `"no-op"`

Defaults to `"json"`

##### [`port`](https://www.krakend.io/docs/enterprise/service-settings/#port "Click to copy link to port") integer

The TCP port where KrakenD is listening to. Recommended value is in the range 1024-65535 to run as an unpriviliged user

Defaults to `8080`

##### [`timeout`](https://www.krakend.io/docs/enterprise/service-settings/#timeout "Click to copy link to timeout") string

Defines a default timeout for all endpoints. Can be overriden per endpoint.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"2s"`

##### [`version`](https://www.krakend.io/docs/enterprise/service-settings/#version "Click to copy link to version") *

The syntax version tells KrakenD how to read this configuration. This is not the KrakenD version, but the syntax version. From KrakenD v3.0 the version must be `4`.

Possible values are: `4`

Schema: [https://www.krakend.io/schema/v3.0/krakend.json](https://www.krakend.io/schema/v3.0/krakend.json "JSON schema definition")

Other service-level settings you can add:

- [HTTP server settings](https://www.krakend.io/docs/enterprise/service-settings/http-server-settings/)
- [HTTP transport settings](https://www.krakend.io/docs/enterprise/service-settings/http-transport-settings/)
- [Router settings](https://www.krakend.io/docs/enterprise/service-settings/router-options/)
- [SSL/TLS](https://www.krakend.io/docs/enterprise/service-settings/tls/)
