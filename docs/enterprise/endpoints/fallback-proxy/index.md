# Fallback Proxy

> Explore the fallback proxy capability in KrakenD API Gateway, allowing you to perform fallback backend request when a request fails

Source: https://www.krakend.io/docs/enterprise/endpoints/fallback-proxy/

The Fallback Proxy enables performing an alternative backend request when the previous one has failed. Although calling a fallback will increase the latency, there are some cases where it is preferable to call a different service so the request isn’t lost instead of returning a failure that the client would need to handle.

## Fallback proxy configuration

To enable the fallback proxy, you need to add in the endpoint definition the following configuration:

```json
{
    "endpoint": "/hotels/{id}",
    "extra_config": {
          "proxy": {
              "strategy": "fallback"
          }
      }
}
```

##### Fields of endpoint's proxy property

\* required fields

##### [`strategy`](https://www.krakend.io/docs/enterprise/endpoints/fallback-proxy/#strategy "Click to copy link to strategy")

Chooses the strategy to use when there is more than 1 backend. Notice that `fallback` value is for **Enterprise only.**

Possible values are: `"parallel"` , `"sequential"` , `"fallback"`

Defaults to `"parallel"`

Schema: [https://www.krakend.io/schema/v3.0/endpoint\_extra\_config.json](https://www.krakend.io/schema/v3.0/endpoint_extra_config.json "JSON schema definition")

After doing this, the `backend` list is treated as a prioritized list, executed one by one, where the next backend will only be executed if the current one fails.

For example imagine you have a backend that handles your register flow, but instead of failing when that backend fails for whatever reason, you want to send the otherwise failed requests to a queue to be processed in the background by using [AMQP Producer](https://www.krakend.io/docs/enterprise/backends/amqp-producer/) component.

```json
{
  "endpoint": "/register",
  "extra_config": {
    "proxy": {
        "strategy": "fallback"
    }
  },
  "backend": [
    {
        "url_pattern": "/__echo/register",
        "method": "POST",
        "host": [ "http://unknown" ]
    },
    {
      "host": ["amqp://guest:guest@myqueue.host.com:5672"],
      "disable_host_sanitize": true,
      "extra_config": {
          "backend/amqp/producer": {
              "exchange": "some-exchange",
              "durable": true,
              "delete": false,
              "no_wait": true,
              "no_local": false,
              "routing_key": "register.error",
              "mandatory": false,
              "immediate": false,
              "backoff_strategy": "exponential-jitter"
          }
      }
    }
  ]
}
```
