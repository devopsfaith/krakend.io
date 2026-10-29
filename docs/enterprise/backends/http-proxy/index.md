# HTTP Proxy: Access to backends through a proxy

> Connect KrakenD to all your backends, or to a specific one, through an external HTTP proxy using the HTTP client options.

Source: https://www.krakend.io/docs/enterprise/backends/http-proxy/

The HTTP proxy adds an intermediate layer where the connection to the backend goes through an external proxy.

There are two different ways to connect to your backends through a corporate proxy:

- Connect to all backends using a proxy
- Connect to a specific backend using a proxy

No longer a plugin

Since KrakenD Enterprise v2.3 the HTTP proxy functionality is no longer offered as a plugin, but as a regular component to improve the connectivity options.

## Connecting to all backends using a proxy

Passing an environment variable `HTTP_PROXY` when starting the gateway ensures that all backend requests pass through the defined proxy. For instance:

Term 

```
$docker run --rm -v "$PWD:/etc/krakend" -e HTTP_PROXY=http://myproxy:8080 krakend/krakend-ee
```

## Connecting to a specific backend using a proxy

If instead, you want to route a single backend connection through a proxy, you must add in the `backend` the `proxy_address` attribute under the `backend/http/client` namespace:

```json
{
    "version": 4,
    "endpoints": [
        {
            "endpoint": "/health",
            "output_encoding": "no-op",
            "backend": [
                {
                    "url_pattern": "/__health",
                    "host": ["http://localhost:8080"],
                    "encoding": "no-op",
                    "extra_config": {
                        "backend/http/client": {
                            "proxy_address": "http://myproxy:8080"
                        }
                    }
                }
            ]
        }
    ]
}
```

The configuration flags relative to the proxy functionality is:

- `proxy_address` (*string*): The proxy address used to forward the traffic. The address must contain the protocol and the port.

The `backend/http/client` offers more options.

## Migration from old plugin

KrakenD Enterprise v2.3 deprecated the `http-proxy` plugin in favor of the native configuration explained above, and v3.0 removed it. If you used the plugin, apply the following change to your configuration files:

```diff
"extra_config": {
-   "plugin/http-client": {
-       "name": "http-proxy",
-       "proxy_address": "http://myproxy:8080"
+   "backend/http/client": {
+       "proxy_address": "http://myproxy:8080"
    }
```
