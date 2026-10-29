# Handling Client Redirects

> Integrate client redirect backend in KrakenD API Gateway to enable dynamic and conditional redirection of API requests

Source: https://www.krakend.io/docs/enterprise/backends/client-redirect/

When a backend returns a redirect, the default behavior of KrakenD is to follow the redirection and serve the final content to the user. When you don’t want this behavior and let the end client follow the redirect, you must enable the `no_redirect` **HTTP client option**.

## No redirect configuration

The `no_redirect` option is one in the list of [HTTP client options](https://www.krakend.io/docs/enterprise/backends/http-client/) in the backend.

By enabling the flag, you can stop KrakenD from following redirections like a `301`.

Enable no-op too

You must use the **no-op encoding** if you want the client to receive the status code 301 or 302. Otherwise, the gateway would return a 500 error because it does not get a success (`20x`) code.

Example of configuration:

```json
{
    "version": 4,
    "endpoints": [
        {
            "endpoint": "/redirect",
            "output_encoding": "no-op",
            "backend": [
                {
                    "url_pattern": "/__debug",
                    "encoding": "no-op",
                    "extra_config": {
                        "backend/http/client": {
                            "no_redirect": true
                        }
                    }
                }
            ]
        }
    ]
}
```

## Migration from old plugin

KrakenD Enterprise v2.3 deprecated the `no-redirect` plugin in favor of the native HTTP client options, and v3.0 removed it. If you used the plugin, apply the following change to your configuration:

```diff
"extra_config": {
-    "plugin/http-client": {
-        "name": "no-redirect"
+    "backend/http/client": {
+        "no_redirect": true
        }
    }
```
