# HTTP Per-backend Client settings

> The HTTP client options allow you to configure the behavior to connect to your backends using HTTP

Source: https://www.krakend.io/docs/backends/http-client/

The HTTP client namespace allows you to set the behavior of the HTTP connections between KrakenD and your backend service.

### Send the payload on 307 and 308 redirects

KrakenD does not duplicate the body of the request when following a redirection because automatically doing it would affect the performance of all requests. In the unusual cases where your backend responds with a `307 Temporary Redirect` or a `308 Permanent Redirect`, enable the following flag to resend the original payload to the final redirected service:

##### Fields of `"backend/http_client"`

\* required fields

##### [`send_body_on_redirect`](https://www.krakend.io/docs/backends/http-client/#send_body_on_redirect "Click to copy link to send_body_on_redirect") boolean

Post the original body to the final URL after a 307 or a 308 redirection.

Defaults to `false`

Schema: [https://www.krakend.io/schema/v3.0/backend/http\_client.json](https://www.krakend.io/schema/v3.0/backend/http_client.json "JSON schema definition")

Here is a configuration example:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "endpoints": [
    {
      "endpoint": "/foo",
      "backend": [
        {
          "host": ["https://api"],
          "url_pattern": "/url-that-will-redirect-with-307",
          "extra_config": {
            "backend/http/client": {
              "send_body_on_redirect": true
            }
          }
        }
      ]
    }
  ]
}
```

## Avoid HTTP redirection and other options

To prevent KrakenD from following redirects, use specific TLS options, and utilize intermediate proxies and other options, refer to the [HTTP Client options in the Enterprise Edition](https://www.krakend.io/docs/enterprise/backends/http-client/).
