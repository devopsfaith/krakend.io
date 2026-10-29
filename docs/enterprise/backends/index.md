# Backend Configuration

> Explore the backend configuration options in KrakenD API Gateway, allowing you to connect and integrate with your microservices efficiently

Source: https://www.krakend.io/docs/enterprise/backends/

The concept of `backend` refers to the origin servers providing the necessary data to populate your endpoints. A backend can be something like your HTTP-based API, a Lambda function, or a Kafka queue, for example.

A `backend` can be any server inside or outside your network if it is reachable by KrakenD. For instance, you can create endpoints fetching data from your internal servers and enrich them by adding third-party data from an external API like Github, Facebook, or other services. You can also return everything aggregated in a single glorified response.

A `backend` object is an array of all the services that an [`endpoint`](https://www.krakend.io/docs/enterprise/endpoints/) connects to. It defines the list of hostnames connected to and the URL to send or receive the data. If a backend has more than one `host`, then the array is the [egress load balancing list](https://www.krakend.io/docs/enterprise/throttling/load-balancing/#balancing-egress-traffic-to-upstream).

When a KrakenD endpoint is hit, the engine requests **all defined backends in parallel** (unless a [sequential proxy](https://www.krakend.io/docs/enterprise/endpoints/sequential-proxy/) is used) and the content [merged and aggregated](https://www.krakend.io/docs/enterprise/endpoints/response-manipulation/#aggregation-and-merging) (unless you just proxy using the [`no-op` encoding](https://www.krakend.io/docs/enterprise/endpoints/no-op/)). The returned content is parsed according to its `encoding` or in some cases its `extra_config` configuration.

Returned status codes and headers

Because KrakenD is not a reverse proxy, the status code and headers returned depends on factors like the type of encoding and the configuration you have chosen. See [Status Codes](https://www.krakend.io/docs/enterprise/endpoints/status-codes/) and (Returning the backend headers and errors)\[/docs/backends/detailed-errors/] for more details.

## Backend/Upstream configuration

Inside the `backend` array, you need to create an object for each upstream service used by its declaring endpoint. The combination of `host` + `url_pattern`set the full URL that KrakenD will use to fetch your upstream services. Most of the backends will require a simple configuration like:

```json
{
    "host": ["http://your-api"],
    "url_pattern": "/url"
}
```

The `url_pattern` accepts `{variables}` from the endpoint definition, and on Enterprise you can also [inject headers](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/) with patterns like `/{input_headers.X-Tenant}/foo`

All the options relative to the **backend definition** are:

##### Fields of Backend Object

\* required fields

##### [`allow`](https://www.krakend.io/docs/enterprise/backends/#allow "Click to copy link to allow") array of strings

**Only return the fields in the list**. Only the matching fields (case-sensitive) are returned in the final response. Use a dot `.` separator to define nested attributes, e.g.: `a.b` returns `{"a":{"b": true}}`

Example: `["user_id","field1.subfield2"]`

##### [`deny`](https://www.krakend.io/docs/enterprise/backends/#deny "Click to copy link to deny") array of strings

**Don’t return the fields in the list**. All matching fields (case-sensitive) defined in the list, are removed from the response. Use a dot `.` separator to define nested attributes, e.g.: `a.b` removes `{"a":{"b": true}}`.

Example: `["token","CVV","password"]`

##### [`disable_host_sanitize`](https://www.krakend.io/docs/enterprise/backends/#disable_host_sanitize "Click to copy link to disable_host_sanitize") boolean

Set it to `true` when the host doesn’t need to be checked for an HTTP protocol. This is the case of `sd=dns` or when using other protocols like `amqp://`, `nats://`, `kafka://`, etc. When set to true, and the protocol is not HTTP, KrakenD fails with an `invalid host` error.

Defaults to `false`

##### [`encoding`](https://www.krakend.io/docs/enterprise/backends/#encoding "Click to copy link to encoding")

Defines your [needed encoding](https://www.krakend.io/docs/backends/supported-encodings/) to set how to parse the response. Defaults to the value of its endpoint’s `encoding`, or to `json` if not defined anywhere else. Notice that `fast-json` and `yaml` are for **Enterprise only.**

Possible values are: `"json"` , `"safejson"` , `"fast-json"` , `"xml"` , `"rss"` , `"string"` , `"no-op"` , `"yaml"`

Defaults to `"json"`

##### [`extra_config`](https://www.krakend.io/docs/enterprise/backends/#extra_config "Click to copy link to extra_config") object

When there is additional configuration related to a specific component or middleware (like a circuit breaker, rate limit, etc.), it is declared under this section.

##### [`group`](https://www.krakend.io/docs/enterprise/backends/#group "Click to copy link to group") string

Instead of placing all the response attributes in the root of the response, create a new key and encapsulate the response inside.

Defaults to `"backend1"`

##### [`host`](https://www.krakend.io/docs/enterprise/backends/#host "Click to copy link to host") array of strings

An array with all the available hosts to [load balance](https://www.krakend.io/docs/throttling/load-balancing/#balancing-egress-traffic-to-upstream) requests, including the schema (when possible) `schema://host:port`. E.g.: `https://my.users-ms.com`. If you are in a platform where hosts or services are balanced (e.g., a K8S service), write a single entry in the array with the service name/balancer address. Defaults to the `host` declaration at the configuration’s root level, and the service fails starting when there is none.

##### [`input_headers`](https://www.krakend.io/docs/enterprise/backends/#input_headers "Click to copy link to input_headers") array of strings

A second level of header filtering that defines the list of all headers allowed to reach this backend when different than the endpoint.

By default, all headers in the endpoint `input_headers` reach the backend, unless otherwise specified here. An empty list `[]` is considered a zero-value and allows all headers to pass. Use `[""]` to explicitly remove all headers. See [headers forwarding](https://www.krakend.io/docs/endpoints/parameter-forwarding/#headers-forwarding)

Examples: `[""]` , `["User-Agent","Accept"]`

Defaults to `[]`

##### [`input_query_strings`](https://www.krakend.io/docs/enterprise/backends/#input_query_strings "Click to copy link to input_query_strings") array of strings

A second level of query string filtering that defines the list of all query strings allowed to reach this backend when different than the endpoint.

By default, all query strings in the endpoint `input_query_strings` reach the backend, unless otherwise specified here. An empty list `[]` is considered a zero-value and allows all headers to pass. Use `[""]` to explicitly remove all query strings. See [query strings forwarding](https://www.krakend.io/docs/endpoints/parameter-forwarding/#query-string-forwarding)

Examples: `[""]` , `["page","limit"]`

Defaults to `[]`

##### [`is_collection`](https://www.krakend.io/docs/enterprise/backends/#is_collection "Click to copy link to is_collection") boolean

Set to true when your API does not return an object {} but a collection \[]

Defaults to `true`

##### [`mapping`](https://www.krakend.io/docs/enterprise/backends/#mapping "Click to copy link to mapping") object

Mapping, or also known as renaming, let you change the name of the fields of the generated responses, so your composed response would be as close to your use case as possible without changing a line on any backend.

Example: `{"from":"to"}`

##### [`method`](https://www.krakend.io/docs/enterprise/backends/#method "Click to copy link to method")

The method sent to this backend in **uppercase**. The method does not need to match the endpoint’s method. When the value is omitted, it uses the same endpoint’s method. Some special methods will require you to use no-op encoding (like HEAD or OPTIONS) when these return an empty body.

Possible values are: `"GET"` , `"POST"` , `"PUT"` , `"PATCH"` , `"DELETE"` , `"OPTIONS"` , `"HEAD"` , `"CONNECT"` , `"TRACE"`

Defaults to `"GET"`

##### [`sd`](https://www.krakend.io/docs/enterprise/backends/#sd "Click to copy link to sd")

The [Service Discovery](https://www.krakend.io/docs/backends/service-discovery/) system to resolve your backend services. Defaults to `static` (no external Service Discovery). Use `dns` to use DNS SRV records. Use `dns-shared` to share the DNS resolution between backends using the same hosts.

Possible values are: `"static"` , `"dns"` , `"dns-shared"`

Defaults to `"static"`

##### [`sd_scheme`](https://www.krakend.io/docs/enterprise/backends/#sd_scheme "Click to copy link to sd_scheme") string

The [Service Discovery](https://www.krakend.io/docs/backends/service-discovery/) scheme to connect to your backend services.

Examples: `"http"` , `"https"`

Defaults to `"http"`

##### [`target`](https://www.krakend.io/docs/enterprise/backends/#target "Click to copy link to target") string

Removes the matching object from the reponse and returns only its contents.

Examples: `"data"` , `"content"` , `"response"`

##### [`url_pattern`](https://www.krakend.io/docs/enterprise/backends/#url_pattern "Click to copy link to url_pattern") string

The path inside the service (no protocol, no host, no method). E.g: `/users`. Some functionalities under `extra_config` might drop the requirement of declaring a valid `url_pattern`, but they are exceptions. The URL must be RESTful, if it is not (e.g.: `/url.{some_variable}.json`), then see how to [disable RESTful checking](https://www.krakend.io/#disable-restful-checking).

Examples: `"/users"` , `"/user/{id_user}"`

Schema: [https://www.krakend.io/schema/v3.0/backend.json](https://www.krakend.io/schema/v3.0/backend.json "JSON schema definition")

Other configuration options such as the ones for [data manipulation](https://www.krakend.io/docs/enterprise/backends/data-manipulation/) are available. You will find them in each specific feature section.

## Backend configuration example

In the example below, KrakenD offers an endpoint `/v1/products` that merges the content from two different services using the URLs `/products` and `/offers`. The marketing (`marketing.myapi.com`) and the products (`products-XX.myapi.com`) API requests are fired simultaneously. KrakenD will load-balance among the listed hosts (here or in your [service discovery](https://www.krakend.io/docs/enterprise/backends/service-discovery/)) to pick one of the three hosts.

```json
{
    "endpoints": [
        {
            "endpoint": "/v1/products",
            "method": "GET",
            "backend": [
                {
                    "url_pattern": "/products",
                    "host": [
                        "https://products-01.myapi.com:8000",
                        "https://products-02.myapi.com:8000",
                        "https://products-03.myapi.com:8000"
                    ]
                },
                {
                    "url_pattern": "/offers",
                    "host": [
                        "https://marketing.myapi.com:8000"
                    ]
                }
            ]
        }
    ]
}
```

## Connecting to HTTPS backends with self-signed certificates

When using **self-signed certificates** in your backends, you must add the certificates to the local CA, or at least add them while developing the `allow_insecure_connections` setting to `true`. Example:

```json
{
  "version": 4,
  "client_tls": {
        "allow_insecure_connections": true
  },
  "endpoints": []
}
```
