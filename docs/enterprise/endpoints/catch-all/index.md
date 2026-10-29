# Catchall (Fallback backend)

> The Catchall is a special type of endpoint that receives all the traffic other endpoint routes in the configuration cannot handle.

Source: https://www.krakend.io/docs/enterprise/endpoints/catch-all/

The catchall endpoint is a particular type of `endpoint` that, when added, receives all the traffic from routes and methods that do not resolve to any of the other existing `endpoints` in the configuration.

Its primary use case is for **initial stages of a migration**, when you want to test a small subset of endpoints on KrakenD and have **all the rest of the traffic** forwarded to a common backend.

The [wildcard endpoints](https://www.krakend.io/docs/enterprise/endpoints/wildcard/) are similar in functionality, but they only listen to a starting path, not everything, and they are a better option.

Catchall means forwarding the good and the bad

Although this endpoint might be super-useful, keep in mind that, generally speaking, you should **avoid having a catchall route**. All types of unknown requests will hit your fallback backend, opening the door for malicious users to test and scan it. From a security perspective, you are safer without this because you cut any traffic that you don’t explicitly declare.

## Catchall configuration

To enable the catchall endpoint, all it takes is to create a [regular endpoint](https://www.krakend.io/docs/enterprise/endpoints/) with the reserved `endpoint` name `/__catchall`.

As with any other endpoint, you must define the `url_pattern` and the `host` in its `backend` section, but in this case, it is acting as the **fallback backend**. Like this:

```json
{
    "endpoint": "/__catchall",
    "output_encoding": "no-op",
    "input_headers": ["*"],
    "input_query_strings": ["*"],
    "backend": [{
        "encoding": "no-op",
        "url_pattern": "/",
        "host":["http://mybackend:1234"]
    }]
}
```

The catchall endpoint acts as a reverse proxy and internally works using a [no-op endpoint](https://www.krakend.io/docs/enterprise/endpoints/no-op/). The route name `/__catchall` is not registered during startup, it is our convention to mark the fallback route. But effectively it makes little difference for the end-user as all unregistered routes (including `/__callback`) will fall here anyway.

In connection with working as a no-op endpoint, a few remarks worth noticing:

- You cannot change this endpoint’s `output_encoding` or `encoding`. If you do, it will be automatically reverted during startup to `no-op` and an error log will be shown in the console.
- All query strings and headers sent by the consumer of your API are forwarded to the fallback backend. Regardless of your `input_query_strings` and `input_headers` settings, it will revert your settings to behave with a wildcard `["*"]`, passing everything to the backend.
- As the response is a no-op, the client will get all the headers, encodings, content and status codes of the fallback backend as originally received.
- You can still use components loaded under the `extra_config` of your `backend` that are compatible with `no-op`, or endpoint functionality that acts at the proxy level.

## Catchall limitations

All functionality that is declared at the `extra_config` of the service level (config’s root) and all functionality inside a `backend` works normally.

Components loaded in the `endpoint`’s `extra_config` or related with endpoint’s HTTP functionality are **not loaded**, including [Dynamic Routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/) evaluation. The following list are the **exceptions that still work**:

- Security Policies (except for HTTP)
- JMESpath
- Body generators
- Observability (New Relic, OpenCensus, OpenTelemetry)
- Shadow proxy
- JSON schema validation
- CEL
- LUA (except for HTTP)
- Request and Response modifiers
- Flatmap
- Static responses

Any other HTTP-related components loaded in the `extra_config` are ignored. For instance, you cannot apply JWT validation to all connections intercepted by a catchall, so you should move this logic to a [wildcard](https://www.krakend.io/docs/enterprise/endpoints/wildcard/) instead.

Catchall and Dynamic Routing

Catchall functionality doesn’t execute endpoint’s HTTP-related components, meaning that **declaring Dynamic Routing patterns within a catchall endpoint won’t work** and might produce errors.
