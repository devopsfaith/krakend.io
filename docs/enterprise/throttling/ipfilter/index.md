# IP Filtering

> Implement IP filtering for efficient API throttling with KrakenD Enterprise. Learn how to secure and optimize your API requests using our IP filtering configuration guide.

Source: https://www.krakend.io/docs/enterprise/throttling/ipfilter/

The IP filtering plugin allows you to restrict the traffic to your API gateway based on the IP address. It works in two different modes (allow or deny) where you define the list of IPs (CIDR blocks) that are authorized to use the API, or that are denied from using the API.

The filtering applies globally to all endpoints, or to only specific endpoints **depending on the placement of the configuration**.

When an IP is rejected, the consumer of the endpoint receives a **403 Forbidden** status code. When the functionality is at the endpoint level, the consumer receives a `500` unless you have enabled [returning the HTTP status code of a single backend](https://www.krakend.io/docs/backends/detailed-errors/#return-the-http-status-code-of-a-single-backend).

The basic plugin declaration looks like this, and goes inside the `plugins` list of a `plugin/http-server` or `plugin/req-resp-modifier` namespace (see the examples below):

```json
{
  "name": "ip-filter",
  "config": {
    "CIDR": [
      "192.168.0.0/24",
      "172.17.2.56/32",
      "10.0.0.0/16",
      "127.0.0.1"
    ],
    "allow": true
  }
}
```

The supported options inside the `config` of the plugin are:

- `CIDR` *list*: The [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) blocks (list of IPs) you want to allow or deny.
- `client_ip_headers` *list* (optional): A custom list of all headers that might contain the real IP of the client. The first matching IP in the list will be used. Default headers are (in order of checking): `X-Forwarded-For`, `X-Real-IP`, and `X-Appengine-Remote-Addr`.
- `trusted_proxies` *list* (optional): A custom list of all the recognized machines/balancers that proxy the client to your application. This list is used to avoid spoofing when trying to get the real IP of the client.
- `allow` *bool*: IP filtering mode. Defaults to `false` (deny mode).
  
  - `true`: **Allow mode**. Only the matching IPs are able to access the content.
  - `false`: **Deny mode**. All matching IPs are discarded.
  - In the rare case that the machine is unable to parse the given IP (couldn’t be parsed as an IPv4 or IPv6), in deny mode the request will pass, but the allow won’t.

## Filter IPs globally

The following configuration is used when you want to enable a common set of IP filtering rules for any request to the gateway. **All endpoints will enable IP based access** with this configuration:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    },
    "plugin/http-server": {
      "plugins": [
        {
          "name": "ip-filter",
          "config": {
            "allow": true,
            "CIDR": [
              "192.168.0.0/24",
              "172.17.2.56/32",
              "10.0.0.0/16",
              "127.0.0.1"
            ]
          }
        }
      ]
    }
  }
}
```

When the plugin is loaded as a `plugin/http-server` the configuration affects all endpoints.

Do not skip the IP filter on load errors

If the plugin fails to load and its [`on_load_error`](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#handling-plugin-load-errors) (or the service `on_load_default_error`) is `passthrough`, KrakenD serves traffic without filtering any IP. Keep the default `exit` for this plugin.

## Filter IPs by endpoint

To filter IPs on specific endpoints, or to write additional rules to the global IP configuration (having a second check), then you have to place the configuration inside the endpoint’s `extra_config`.

Custom location of the IP address

When filtering endpoints, the IP address is taken from the `X-Forwarded-For` header which is automatically calculated by KrakenD. If this header couldn’t retrieve the client IP, you might want to set both `client_ip_headers` in the plugin configuration, and `input_headers` in the endpoint configuration with the custom headers you need.

The following configuration is used to filter access to specific endpoints:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    }
  },
  "endpoints": [
    {
      "endpoint": "/filtered-endpoint",
      "extra_config": {
        "plugin/req-resp-modifier": {
          "plugins": [
            {
              "name": "ip-filter",
              "config": {
                "allow": true,
                "CIDR": [
                  "192.168.0.0/24",
                  "172.17.2.56/32",
                  "10.0.0.0/16",
                  "127.0.0.1"
                ]
              }
            }
          ]
        }
      },
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__debug/"
        }
      ]
    }
  ]
}
```

When the plugin is loaded as a `plugin/req-resp-modifier` the configuration affects that specific endpoint only.

## Filtered IPs logging

Whenever a request is denied by the IP filter plugin, the attempt is logged using an `INFO` level. Example:

IP filtering log 

```
$▶ INFO [PLUGIN: ip-filter] blocking access to endpoint /foo from IP 1.2.3.4
```

If you want to see these logs in production make sure to [enable logging](https://www.krakend.io/docs/enterprise/logging/) with the `INFO` level.

## Advanced calculation of IPs

There will be times when your PaaS provides the real IP in a specific custom header, or when you need to add a trusted proxy.

Here is an example of the configuration (set your custom values):

```json
{
  "name": "ip-filter",
  "config": {
    "CIDR": [
      "192.168.0.0/24",
      "172.17.2.56/32",
      "10.0.0.0/16",
      "127.0.0.1"
    ],
    "client_ip_headers": [
      "X-User-IP",
      "X-MyCompany-Client-IP"
    ],
    "trusted_proxies": [
      "10.0.0.0/16"
    ],
    "allow": true
  }
}
```
