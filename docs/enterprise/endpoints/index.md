# Endpoint Configuration

> Configure and manage API endpoints effectively with KrakenD Enterprise. Explore our documentation to learn how to define and optimize your API endpoints for better performance.

Source: https://www.krakend.io/docs/enterprise/endpoints/

**Endpoints** are the most important core concept in KrakenD. An oversimplification is that they define the **available routes and protocols the gateway supports**. For instance, you create a `/foo` route and this connects to a `foo.example.com` to fetch the data. If you are familiar with the *API or AI Gateway offering*, as you continue reading, you will quickly realize that **KrakenD is quite different from other products**.

Instead of acting as a mere proxy and coupling one sad route to one sad underlying service of the same type, in KrakenD you define **the API contract** you want to expose, and then you create the composite of services that fulfill the contract. Said otherwise, create whatever API definition you want, and plug it into your existing stack. It does not matter the protocols or encodings you have on each side, as KrakenD takes care of transforming the data for you.

For example, say you declare a route that offers REST API content on \`/foo, but you want to aggregate the results of querying a gRPC server, a regular REST API, a Lambda service, and an LLM Model altogether. Or maybe you want to offer all the latter under a gRPC server. Or maybe you have a twenty-year-old SOAP service and want to create an MPC Server instantly so your AI client can talk “naturally” to it. All that and more is available as an endpoint.

Because KrakenD treats users’ interactions with the gateway and the gateway’s interactions with services separate, endpoints are a piece of magic that can complete all kinds of use cases.

## The endpoint object

Deep dive into the configuration

If you are still getting familiar with KrakenD’s configuration structure, take a moment to read [Understanding the configuration file](https://www.krakend.io/docs/enterprise/configuration/structure/). This section explains what an `endpoint` looks like, but take a moment to understand the different pieces.

We refer to all routes as families, regardless of their transport nature (HTTP, WebSockets, SOAP, etc.), as `endpoints`. Each of these endpoints can retrieve data from one or more different upstream services, which we collectively call the `backend` array.

The `endpoints` array in the configuration contains the **API definition you are publishing**, and is a collection of **endpoint objects** that granularly define how each route behaves. Because everything is independent and highly configurable, the gateway can feed from a vast ecosystem and can add new functionality to your stack.

To create an endpoint, you only need to add an **endpoint object** under the `endpoints` collection of the configuration. An endpoint object should contain at least the `endpoint` name and a `backend` section (to which it connects). The defaults are taken if no further information is declared (e.g., `method` will be a `GET`, and `output_encoding` as `json`).

A simple`endpoints` section for a REST endpoint might look like this:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/v1/users/{user}",
      "method": "GET",
      "backend": [
        {
          "url_pattern": "/users/summary/{user}",
          "method": "GET",
          "host": [
            "https://api.example.com"
          ]
        }
      ]
    }
  ]
}
```

The previous example exposes a REST `GET /v1/users/{user}` endpoint to the clients and takes the data from your existing backend `GET https://api.example.com/users/summary/{user}`.

This is the most simple example of an endpoint definition, from here you can add manipulation options, transform the request or the response, and a lot more stuff. See the options below.

### Endpoint object configuration

When declaring `endpoints` objects in the configuration, the following fields are available for each one of them:

##### Fields of Endpoint Object

\* required fields

##### [`backend`](https://www.krakend.io/docs/enterprise/endpoints/#backend "Click to copy link to backend") * array of objects

An array with all the backend services you want to use in this endpoint. See [the backend object](https://www.krakend.io/docs/backends/) documentation to know all the available options, they are omitted here for brevity.

##### [`cache_ttl`](https://www.krakend.io/docs/enterprise/endpoints/#cache_ttl "Click to copy link to cache_ttl")

Sets or overrides the cache headers to inform how long the client or CDN can cache the request to this endpoint. Setting this value to a zero-value will use the `cache_ttl` in the root of the configuration if any. This attribute **does not cache** content but tells others how to do it. For caching, see [Caching Backend Responses](https://www.krakend.io/docs/backends/caching/).

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

##### [`concurrent_calls`](https://www.krakend.io/docs/enterprise/endpoints/#concurrent_calls "Click to copy link to concurrent_calls") integer

The concurrent requests are an excellent technique to improve the response times and decrease error rates by requesting in parallel the same information multiple times. Yes, you make the same request to several backends instead of asking to just one. When the first backend returns the information, the remaining requests are canceled.

Defaults to `1`

##### [`endpoint`](https://www.krakend.io/docs/enterprise/endpoints/#endpoint "Click to copy link to endpoint") * string

The path of the URL you want to expose. The path is **case-sensitive** and should start with a slash `/`. You can use `{placeholders}` to allow dynamic variables. For example: `/foo/{var}/baz`. You can also add an ending `/*` in the path to enable [wildcards](https://www.krakend.io/docs/enterprise/endpoints/wildcard/). **Enterprise only.**

The router will try to automatically redirect calls to endpoints with an incorrect case or incorrect trailing slash to its correct version offering a `301`. There are no guarantees that it will succeed and the request might even fail completely while trying (and log an ugly error with a trace). The **safest option** is to [disable automatic redirections](https://www.krakend.io/docs/service-settings/router-options/) by setting to true the flags `disable_redirect_fixed_path` and `disable_redirect_trailing_slash` in the `router` options.

**Limitations**: URLs do not support colons `:` in their definition. All `{vars}` are meant to be isolated in the path and not to be used to build words, like in `/file.{ext}` [See `disable_rest` for that usage](https://www.krakend.io/docs/service-settings/http-server-settings/#disable_rest).

Examples: `"/new-endpoint"` , `"/foo/{var}"` , `"/foo/{var1}/{var2}"`

##### [`extra_config`](https://www.krakend.io/docs/enterprise/endpoints/#extra_config "Click to copy link to extra_config") object

Besides the functionality ofered by the endpoint, you can load more functionalty into this endpoint by adding new entries under this extra configuration object. You will find across all documentation a lot of functionality that is designed to be placed here.

##### [`input_headers`](https://www.krakend.io/docs/enterprise/endpoints/#input_headers "Click to copy link to input_headers") array of strings

Defines the list of all headers allowed to reach the backend when passed.

By default, KrakenD won’t pass any header from the client to the backend. This list is **case-insensitive**. You can declare headers in lowercase, uppercase, or mixed.

An entry `["Cookie"]` forwards all cookies, and a single star element `["*"]` as value forwards everything to the backend (**it’s safer to avoid this option**), including cookies. See [headers forwarding](https://www.krakend.io/docs/endpoints/parameter-forwarding/#headers-forwarding)

Defaults to `[]`

##### [`input_query_strings`](https://www.krakend.io/docs/enterprise/endpoints/#input_query_strings "Click to copy link to input_query_strings") array of strings

Defines the exact list of quey strings parameters that are allowed to reach the backend. This list is **case-sensitive**.

By default, KrakenD won’t pass any query string to the backend.

A single star element `["*"]` as value forwards everything to the backend (**it’s safer to avoid this option**)

Defaults to `[]`

##### [`method`](https://www.krakend.io/docs/enterprise/endpoints/#method "Click to copy link to method")

The method supported by this endpoint. Create multiple endpoint entries if you need different methods.

Possible values are: `"GET"` , `"POST"` , `"PUT"` , `"PATCH"` , `"DELETE"`

Defaults to `"GET"`

##### [`output_encoding`](https://www.krakend.io/docs/enterprise/endpoints/#output_encoding "Click to copy link to output_encoding")

The gateway can work with several content types, even allowing your clients to choose how to consume the content. See the [supported encodings](https://www.krakend.io/docs/endpoints/content-types/)

Possible values are: `"json"` , `"json-collection"` , `"yaml"` , `"fast-json"` , `"xml"` , `"negotiate"` , `"string"` , `"no-op"` , `"streaming"` , `"sse"` , `"ndjson"` , `"eventstream"`

Defaults to `"json"`

##### [`timeout`](https://www.krakend.io/docs/enterprise/endpoints/#timeout "Click to copy link to timeout") string

The duration you write in the timeout represents the **whole duration of the pipe**, so it counts the time all your backends take to respond and the processing of all the components involved in the endpoint (the request, fetching data, manipulation, etc.). Usually specified in seconds (`s`) or milliseconds (`ms`. e.g.: `2000ms` or `2s`). If you don’t set any timeout, the timeout is taken from the entry in the service level, or to the system’s default

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Examples: `"2s"` , `"1500ms"`

Defaults to `"2s"`

Schema: [https://www.krakend.io/schema/v3.0/endpoint.json](https://www.krakend.io/schema/v3.0/endpoint.json "JSON schema definition")

### Endpoints with multiple nesting levels

You might have envisioned KrakenD as a proxy and expected its `endpoint` declaration to **work as a prefix** and listen to any path with an undetermined number of nesting levels. **But KrakenD does not work like this by default**. Instead, it expects you to declare every possible URL structure.

For instance, you declared an `"endpoint": "/user/{id}"` and you expected to resolve URLs like `/user/john/profile/preferences`, but you are getting a *404* instead. There are two solutions to this problem:

1. You can declare all possible endpoints: `/user/{id}`, `/user/{id}/{level2}`, `/user/{id}/{level2}/{level3}`, etc.
2. You use a [Wildcard](https://www.krakend.io/docs/enterprise/endpoints/wildcard/)

### Endpoints listening to multiple methods

The `method` attribute defines the HTTP verb you can use with the endpoint. If you need to support multiple methods (e.g., `GET`, `POST`, `DELETE`) in the same endpoint, you must declare **one endpoint object for each method**. So if you want the same endpoint to listen to `GET` and `POST` requests, you need the following configuration:

```json
{
  "endpoints": [
    {
      "endpoint": "/v1/users/{user}",
      "method": "GET",
      "backend": [
        {
          "url_pattern": "/users/summary/{user}",
          "method": "GET",
          "host": [
            "https://api.example.com"
          ]
        }
      ]
    },
    {
      "endpoint": "/v1/users/{user}",
      "method": "POST",
      "backend": [
        {
          "url_pattern": "/users/summary/{user}",
          "method": "POST",
          "host": [
            "https://api.example.com"
          ]
        }
      ]
    }

  ]
}
```

Notice that the `method` is declared both in the endpoint and in the backend (as they could be different).

### Endpoint variables

As you can see in the examples above, endpoints can define variables in their endpoint definition. To do so, encapsulate the variable name with curly braces, like `{var}`.

```json
{
  "endpoint": "/user/{id}"
}
```

The previous endpoint will accept requests like `/user/123` or `/user/A-B-C`. But **it won’t take** a request like `/user/1/2`, as there is an extra slash than the definition, and KrakenD considers this to be a different endpoint.

### Router rules to avoid collisions

When you declare multiple endpoints that **share common prefixes**, make sure that you do not declare the same route with different variable names.

For instance, you cannot have the following two endpoints coexisting:

- endpoint: `/user/{userid}`
- endpoint: `/user/{iduser}/some`

This will cause a `panic` on startup (that you can catch earlier if you run a `krakend check -t -c krakend.json` )

But you can have the same routes declared as:

- endpoint: `/user/{userid}`
- endpoint: `/user/{userid}/some`

And this will work.

Similarly you can’t do this:

- endpoint: `/v1/{domain}/user/{userid}`
- endpoint: `/v1/{domain}/user/{iduser}/some`

But you can declare the same route as:

- endpoint: `/v1/{domain}/user/{userid}`
- endpoint: `/v1/{domain}/user/{userid}/some`

Summarizing, on colliding routes, make sure to use the same variable names.

### Disable RESTful checking

By default KrakenD only works with **RESTful URL patterns** in its endpoint definition. Enable the option [`disable_rest`](https://www.krakend.io/docs/enterprise/service-settings/http-server-settings/#disable_rest) in the root of your configuration if need unrestful endpoints, e.g.: `/file.{extension}`

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "disable_rest": true,
  "endpoints": [
    {
      "endpoint": "/foo/{var}/file.{extension}",
      "backend": [
        {
          "host": [
            "http://example.com"
          ],
          "url_pattern": "/{var}.{extension}"
        }
      ]
    }
  ]
}
```

## Automatic protocol and encoding translation

The endpoints return HTTP content to the end-user in any of the [supported encodings](https://www.krakend.io/docs/enterprise/endpoints/content-types/), regardless of the type of backend you are connecting to.

If, for instance, one of the backends you are connecting to uses AMQP, Kafka, gRPC, or any other supported services, KrakenD will perform automatically for you both the protocol and the encoding translation.

## Additional endpoint functionality

The `extra_config` entry of any endpoint can include additional components that provide further functionality. The following is the list of all components accepted under `extra_config`, see the linked documentation of each for more information:

##### Available components of an endpoint

\* required fields

##### [`ai/mcp`](https://www.krakend.io/docs/enterprise/endpoints/#ai%2fmcp "Click to copy link to ai/mcp")

**Enterprise only.** Declares the endpoint as an [MCP server entrypoint](https://www.krakend.io/docs/enterprise/ai-gateway/mcp-server/)

##### [`ai/prompt-guard`](https://www.krakend.io/docs/enterprise/endpoints/#ai%2fprompt-guard "Click to copy link to ai/prompt-guard")

##### [`ai/semantic-cache`](https://www.krakend.io/docs/enterprise/endpoints/#ai%2fsemantic-cache "Click to copy link to ai/semantic-cache")

##### [`auth/api-keys`](https://www.krakend.io/docs/enterprise/endpoints/#auth%2fapi-keys "Click to copy link to auth/api-keys") object

**Enterprise only.** Validates that users of this endpoint pass a valid API-key containing one of the declared roles.

##### [`auth/basic`](https://www.krakend.io/docs/enterprise/endpoints/#auth%2fbasic "Click to copy link to auth/basic") object

**Enterprise only.** Validates the access to the endpoint using [Basic Authentication](https://www.krakend.io/docs/enterprise/authentication/basic-authentication/).

##### [`auth/signer`](https://www.krakend.io/docs/enterprise/endpoints/#auth%2fsigner "Click to copy link to auth/signer") object

A component that [cryptographically signs tokens](https://www.krakend.io/docs/authorization/jwt-signing/) generated by your legacy login system (without JWT signing) to be later validated by the `auth/validator` component.

##### [`auth/validator`](https://www.krakend.io/docs/enterprise/endpoints/#auth%2fvalidator "Click to copy link to auth/validator") object

Protect endpoints from public usage by [validating JWT tokens](https://www.krakend.io/docs/authorization/jwt-validation/) generated by any industry-standard OpenID Connect (OIDC) integration.

##### [`documentation/openapi`](https://www.krakend.io/docs/enterprise/endpoints/#documentation%2fopenapi "Click to copy link to documentation/openapi") object

**Enterprise only.** Documents the endpoint so you can [automatically generate OpenAPI documentation](https://www.krakend.io/docs/enterprise/developer/openapi/) through `krakend openapi export` command.

##### [`documentation/postman`](https://www.krakend.io/docs/enterprise/endpoints/#documentation%2fpostman "Click to copy link to documentation/postman") object

**Enterprise only.** Documents the endpoint so you can [generate postman documentation automatically](https://www.krakend.io/docs/enterprise/developer/postman/) through the `krakend postman export` command.

##### [`governance/quota`](https://www.krakend.io/docs/enterprise/endpoints/#governance%2fquota "Click to copy link to governance/quota") object

**Enterprise only.** [Attach a quota](https://www.krakend.io/docs/enterprise/governance/quota/) to the endpoint, backend, or service. The quota component allows you to limit the number of requests a user can do in a given time window.

##### [`modifier/jmespath`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2fjmespath "Click to copy link to modifier/jmespath") object

**Enterprise only.** The [JMESPath](https://www.krakend.io/docs/enterprise/endpoints/jmespath/) is a query language that allows you to select, slice, filter, map, project, flatten, sort, and all sorts of operations on data.

##### [`modifier/lua-endpoint`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2flua-endpoint "Click to copy link to modifier/lua-endpoint") object

[Scripting with Lua](https://www.krakend.io/docs/endpoints/lua/) is an additional choice to extend your business logic, and is compatible with the rest of options such as CEL, Martian, or other Go plugins and middlewares.

##### [`modifier/lua-proxy`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2flua-proxy "Click to copy link to modifier/lua-proxy") object

[Scripting with Lua](https://www.krakend.io/docs/endpoints/lua/) is an additional choice to extend your business logic, and is compatible with the rest of options such as CEL, Martian, or other Go plugins and middlewares.

##### [`modifier/request-body-extractor`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2frequest-body-extractor "Click to copy link to modifier/request-body-extractor") object

**Enterprise only.** [Extracts fields from the incoming request body](https://www.krakend.io/docs/enterprise/endpoints/request-body-extractor/) and promotes them to request headers or query strings. Runs in the proxy pipeline.

##### [`modifier/request-body-extractor/early`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2frequest-body-extractor%2fearly "Click to copy link to modifier/request-body-extractor/early") object

**Enterprise only.** [Extracts fields from the incoming request body](https://www.krakend.io/docs/enterprise/endpoints/request-body-extractor/) and promotes them to request headers or query strings. Runs at the HTTP handler level before authentication and all other handlers.

##### [`modifier/request-body-generator`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2frequest-body-generator "Click to copy link to modifier/request-body-generator") object

**Enterprise only.** Freely [transform the request body/payload](https://www.krakend.io/docs/enterprise/backends/body-generator/) you will send to your services using a templating system.

##### [`modifier/response-body`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2fresponse-body "Click to copy link to modifier/response-body") object

An alias of `modifier/response-body-generator`

##### [`modifier/response-body-generator`](https://www.krakend.io/docs/enterprise/endpoints/#modifier%2fresponse-body-generator "Click to copy link to modifier/response-body-generator") object

**Enterprise only.** Freely [transform the response body](https://www.krakend.io/docs/enterprise/backends/response-body-generator/) you get from your backends.

##### [`plugin/middleware`](https://www.krakend.io/docs/enterprise/endpoints/#plugin%2fmiddleware "Click to copy link to plugin/middleware") object

**Enterprise only.** Inject your own [Go middleware plugins](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/)

##### [`plugin/req-resp-modifier`](https://www.krakend.io/docs/enterprise/endpoints/#plugin%2freq-resp-modifier "Click to copy link to plugin/req-resp-modifier") object

**Enterprise only.** Inject your own [Go request and response modifier plugins](https://www.krakend.io/docs/enterprise/extending/plugin-modifiers/)

##### [`proxy`](https://www.krakend.io/docs/enterprise/endpoints/#proxy "Click to copy link to proxy") object

Fine tune different options for the proxy phase of the API request/response flow.

##### [`qos/ratelimit/router`](https://www.krakend.io/docs/enterprise/endpoints/#qos%2fratelimit%2frouter "Click to copy link to qos/ratelimit/router") object

The router rate limit feature allows you to set a [number of maximum requests per second a KrakenD endpoint will accept](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/).

##### [`qos/ratelimit/router/redis`](https://www.krakend.io/docs/enterprise/endpoints/#qos%2fratelimit%2frouter%2fredis "Click to copy link to qos/ratelimit/router/redis") object

**Enterprise only.** Stateful endpoint rate limit persisted on a [Redis database](https://www.krakend.io/docs/enterprise/throttling/endpoint-redis-rate-limit/)

##### [`qos/ratelimit/tiered`](https://www.krakend.io/docs/enterprise/endpoints/#qos%2fratelimit%2ftiered "Click to copy link to qos/ratelimit/tiered") object

**Enterprise only.** The [rate limit based on tiers](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/) allows you to have multiple sets of rate limits that apply differently to users depending on their tier or sometimes called subscription plans.

##### [`security/bot-detector`](https://www.krakend.io/docs/enterprise/endpoints/#security%2fbot-detector "Click to copy link to security/bot-detector") object

The [bot detector](https://www.krakend.io/docs/throttling/botdetector/) module checks incoming connections to the gateway to determine if a bot made them, helping you detect and reject bots carrying out scraping, content theft, and form spam.

##### [`security/cors`](https://www.krakend.io/docs/enterprise/endpoints/#security%2fcors "Click to copy link to security/cors") object

Define [Cross-Origin Resource Sharing (CORS)](https://www.krakend.io/docs/enterprise/service-settings/cors/) configuration to send additional HTTP headers to tell browsers if they can use resources from a different origin.

##### [`security/http`](https://www.krakend.io/docs/enterprise/endpoints/#security%2fhttp "Click to copy link to security/http") object

[Security HTTP headers](https://www.krakend.io/docs/service-settings/security/), including HSTS, HPKP, MIME-Sniffing prevention, Clickjacking protection, and others.

##### [`security/policies`](https://www.krakend.io/docs/enterprise/endpoints/#security%2fpolicies "Click to copy link to security/policies") object

**Enterprise only.** A [policies engine](https://www.krakend.io/docs/enterprise/security-policies/) that allows you to write custom sets of policies that are validated during requests, responses, or token validation.

##### [`telemetry/opentelemetry`](https://www.krakend.io/docs/enterprise/endpoints/#telemetry%2fopentelemetry "Click to copy link to telemetry/opentelemetry") object

Enables metrics and traces using [OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/).

##### [`validation/cel`](https://www.krakend.io/docs/enterprise/endpoints/#validation%2fcel "Click to copy link to validation/cel") array

The [Common Expression Language (CEL)](https://www.krakend.io/docs/endpoints/common-expression-language-cel/) middleware enables expression evaluation, when an expression returns false, KrakenD does not return the content as the condition has failed. Otherwise, if all expressions returned true, the content is served.

##### [`validation/json-schema`](https://www.krakend.io/docs/enterprise/endpoints/#validation%2fjson-schema "Click to copy link to validation/json-schema") object

Apply [automatic validations using a JSON Schema](https://www.krakend.io/docs/endpoints/json-schema/) definition before the content passes to the backends. The json schema component allows you to define validation rules on the body, type definition, or even validate the fields’ values.

##### [`validation/response-json-schema`](https://www.krakend.io/docs/enterprise/endpoints/#validation%2fresponse-json-schema "Click to copy link to validation/response-json-schema") object

**Enterprise only.** Applies a [JSON schema validation to the response](https://www.krakend.io/docs/enterprise/endpoints/response-schema-validator/) before is sent to the end-user or before it’s merged in the endpoint with the rest of the backends.

##### [`websocket`](https://www.krakend.io/docs/enterprise/endpoints/#websocket "Click to copy link to websocket") object

**Enterprise only.** Enables [websocket communication](https://www.krakend.io/docs/enterprise/websockets/)

Schema: [https://www.krakend.io/schema/v3.0/endpoint\_extra\_config.json](https://www.krakend.io/schema/v3.0/endpoint_extra_config.json "JSON schema definition")
