# HTTP Per-backend Client settings

> The HTTP client options allow you to set the client TLS settings for each backend, configure the no redirect behavior, or connect through a web proxy.

Source: https://www.krakend.io/docs/enterprise/backends/http-client/

The HTTP client options allow you to set the client TLS settings for each backend, configure the no-redirect behavior, or connect through an external proxy.

You can set the client TLS settings for all backends [as a global setting](https://www.krakend.io/docs/enterprise/service-settings/tls/#client-tls-settings). Nevertheless, you can decide to individually change the client TLS settings for a specific backend.

## HTTP client settings

To do so, include the `backend/http/client` namespace in the `backend`’s extra configuration. It accepts the following settings:

##### Fields of HTTP Client options

\* required fields

##### [`client_tls`](https://www.krakend.io/docs/enterprise/backends/http-client/#client_tls "Click to copy link to client_tls")

Allows to set specific transport settings when using TLS in your upstream services. See the global [Client TLS options](https://www.krakend.io/docs/service-settings/tls/#client-tls-settings) for the list of all supported options.

##### [`no_redirect`](https://www.krakend.io/docs/enterprise/backends/http-client/#no_redirect "Click to copy link to no_redirect") boolean

Set `no_redirect` to true if you don’t want KrakenD to follow redirects and let the consuming user to receive the `30x` status code.

Defaults to `false`

##### [`proxy_address`](https://www.krakend.io/docs/enterprise/backends/http-client/#proxy_address "Click to copy link to proxy_address")

The proxy address used to forward the traffic. The address must contain the protocol and the port.

Example: `"http://proxy.corp:9099"`

##### [`send_body_on_redirect`](https://www.krakend.io/docs/enterprise/backends/http-client/#send_body_on_redirect "Click to copy link to send_body_on_redirect") boolean

Post the original body to the final URL after a 307 or a 308 redirection.

Defaults to `false`

Schema: [https://www.krakend.io/schema/v3.0/backend/http\_client.json](https://www.krakend.io/schema/v3.0/backend/http_client.json "JSON schema definition")

### Example of Client TLS

The following configuration defines a custom certificate for any backend in the system through the `ca_certs`, but the `/foo` endpoint uses a different certificate instead.

It also prevents the gateway from following the redirections and returns the `302` codes as they are to the client, and finally, it connects using an overridden certificate and through a proxy.

```json
{
    "version": 4,
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "client_tls": {
        "ca_certs": [
            "custom.pem"
        ]
    },
    "endpoints": [
        {
            "endpoint": "/foo",
            "output_encoding": "no-op",
            "backend": [
                {
                    "host": ["https://api"],
                    "url_pattern": "/foo",
                    "encoding": "no-op",
                    "extra_config": {
                        "backend/http/client": {
                            "no_redirect": true,
                            "client_tls": {
                                "allow_insecure_connections": true,
                                "ca_certs": [
                                    "other_cert.pem"
                                ]
                            },
                            "proxy_address": "http://proxy.corporation.com:9099"
                        }
                    }
                }
            ]
        }
    ]
}
```
