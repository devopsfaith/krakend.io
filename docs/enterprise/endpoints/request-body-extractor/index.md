# Body to header and query string extractor

> Extract fields from the incoming request body and promote them to request headers or query strings at different stages of the KrakenD pipeline.

Source: https://www.krakend.io/docs/enterprise/endpoints/request-body-extractor/

The **Request Body Extractor reads one or more fields from an incoming request body and maps their values to request headers or query strings** before KrakenD forwards the request upstream. You can place this transformation at three points in the processing pipeline: globally at the service level, early at the endpoint handling level before authentication runs, or inside the proxy pipeline where async agents and workflows also execute. This enables the promotion of authentication credentials, tenant identifiers, or routing parameters that clients embed in a JSON body to the standard positions where KrakenD components expect to find them.

Header injection security notice

Extracting body fields and injecting them as request headers gives clients indirect control over header values. Limit which endpoints use this feature, define narrow `expression` values, and use `on_conflict: skip` when you do not want clients to override headers that are already present, especially security-sensitive headers like `Authorization`.

## Namespace and Pipeline Placement

The Request Body Extractor has two namespaces. Their placement in the `extra_config` configuration determines when extraction occurs relative to authentication and other pipeline stages:

![Possible placements of the Body Extractor in KrakenD pipes](https://www.krakend.io/images/documentation/diagrams/components-sequence-body-extractor.mmd.svg)

| Namespace                                       | Placement  | Description                                                 |
|-------------------------------------------------|------------|-------------------------------------------------------------|
| **(1)** `modifier/request-body-extractor`       | `service`  | `service` level. Applies to every incoming request          |
| **(2)** `modifier/request-body-extractor/early` | `endpoint` | Endpoint level. Runs **before** endpoint-related components |
| **(3)** `modifier/request-body-extractor`       | `endpoint` | Proxy pipeline. Runs **after** endpoint handling            |

When you place `modifier/request-body-extractor` at the **service level**, every request passes through the extractor regardless of which endpoint it targets. This is the right choice when all endpoints depend on the same body-derived parameter, for example, a global tenant identifier extracted into a query string.

At the **endpoint level**, the same namespace runs inside the proxy pipeline. This stage executes after the endpoint handling, so authentication has already occurred by the time extraction runs. Use this placement when the extracted value feeds into backend calls, sequential proxies, async agents, or workflow composition.

The **early variant** (`modifier/request-body-extractor/early`) runs at the endpoint handling level, before any other endpoint-related component, including `auth/api-keys`, `auth/validator`, and rate limiting. It is only available at the endpoint level and cannot participate in async agent pipelines. Use this namespace when the extracted value must be visible to an authentication or authorization component.

## Configuring Extraction Operations

Both namespaces share the same configuration structure: an `operations` array where each element defines one extraction rule. You can declare multiple operations to populate several headers or query strings from a single request body.

##### Fields of Request Body Extractor

\* required fields

##### [`operations`](https://www.krakend.io/docs/enterprise/endpoints/request-body-extractor/#operations "Click to copy link to operations") * array of objects

A list of extraction operations to apply. Each operation extracts a value from the request body and writes it to a header or query string parameter. Operations are evaluated in sequential order.

Each item of operations accepts the following properties:

##### [`expression`](#operations-expression "Click to copy link to expression") * string

The expression that selects the value from the request body. When using the `dotnotation` strategy, use period-separated field names (e.g., `user.id`). When using `jmespath`, provide a valid JMESPath expression.

Examples: `"user.id"` , `"auth.role_key"` , `"data.items[0].name"`

##### [`on_conflict`](#operations-on_conflict "Click to copy link to on_conflict") *

Controls behaviour when the destination header or query string parameter already has a value. `skip` preserves the existing value and discards the extracted one. `replace` overwrites the existing value. `append` adds the extracted value alongside the existing one.

Possible values are: `"skip"` , `"replace"` , `"append"`

##### [`strategy`](#operations-strategy "Click to copy link to strategy") *

The strategy used to navigate the request body and extract the value. Use `dotnotation` for straightforward field access using period-separated field names (e.g., `user.id`). Use `jmespath` to evaluate a JMESPath expression for more complex selections involving arrays, filtering, or projections.

Possible values are: `"dotnotation"` , `"jmespath"`

##### [`target`](#operations-target "Click to copy link to target") * string

The name of the destination header or query string parameter where the extracted value is written.

Examples: `"Authorization"` , `"uid"` , `"X-Tenant-Id"`

##### [`type`](#operations-type "Click to copy link to type") *

The destination where the extracted value is written. Use `header` to inject the value as a request header, or `query_string` to inject it as a query string parameter.

Possible values are: `"header"` , `"query_string"`

Schema: [https://www.krakend.io/schema/v3.0/modifier/request-body-extractor.json](https://www.krakend.io/schema/v3.0/modifier/request-body-extractor.json "JSON schema definition")

### Extraction Strategies

The `dotnotation` strategy navigates nested JSON objects using period-separated field names. For example, the expression `user.id` retrieves the `id` field nested inside a `user` object. Use `dotnotation` for straightforward field access without filtering or array traversal.

The `jmespath` strategy evaluates a [JMESPath expression](https://jmespath.org/tutorial.html) against the parsed request body. Use `jmespath` when the value is inside an array, requires conditional selection, aggregations, or involves more complex projections that dot notation cannot express.

### Conflict Resolution

The `on_conflict` field controls behaviour when the destination header or query string parameter already holds a value at the time extraction runs:

- `skip` preserves the existing value and discards the extracted one. Use this to avoid overwriting headers set directly by the client.
- `replace` overwrites the existing value with the value extracted from the body.
- `append` adds the extracted value alongside the existing one. This is relevant for headers that accept multiple values.

## Example: how to extract a body parameter as a header

When you place `modifier/request-body-extractor` at the endpoint level (without the `/early` suffix), the extraction runs inside the proxy pipeline. This is the correct placement when the extracted value feeds downstream components such as sequential proxies, async agents, or backend-level transformations:

```json
{
  "endpoint": "/secure/regular/",
  "method": "POST",
  "output_encoding": "no-op",
  "input_headers": ["Authorization"],
  "extra_config": {
    "modifier/request-body-extractor": {
      "operations": [
        {
          "type": "header",
          "strategy": "dotnotation",
          "expression": "auth.role_key",
          "target": "Authorization",
          "on_conflict": "skip"
        }
      ]
    }
  },
  "backend": [
    {
      "url_pattern": "/customer",
      "method": "GET",
      "host": ["http://backend:8080"]
    }
  ]
}
```

Because the proxy pipeline runs after HTTP-level authentication, any component configured in the endpoint’s `extra_config` that operates at the endpoint handling level, such as `auth/api-keys`, does **not** see the header value injected here. If the extracted value must influence endpoint-level authentication, use `modifier/request-body-extractor/early` instead, as shown in the previous example.

## Example: how to extract a body parameter for all requests

The following configuration extracts `user.id` from the request body globally and injects it as the query string parameter `uid` on every endpoint. If `uid` already exists in the request, it replaces it:

```json
{
  "version": 4,
  "extra_config": {
    "modifier/request-body-extractor": {
      "operations": [
        {
          "type": "query_string",
          "strategy": "dotnotation",
          "expression": "user.id",
          "target": "uid",
          "on_conflict": "replace"
        }
      ]
    }
  },
  "endpoints": []
}
```

Every endpoint in the gateway receives the `uid` query string parameter derived from the body. For the parameter to reach the backend, each endpoint must also declare `uid` in its `input_query_strings` list.

## Example: how to extract a body parameter before authentication

In this scenario, a client sends its API key inside the JSON body under `auth.role_key` instead of in an `Authorization` header. The `modifier/request-body-extractor/early` namespace extracts the field and writes it to `Authorization` before the API key validator runs:

```json
{
  "endpoint": "/secure/early/",
  "method": "POST",
  "output_encoding": "no-op",
  "input_headers": ["Authorization"],
  "extra_config": {
    "modifier/request-body-extractor/early": {
      "operations": [
        {
          "type": "header",
          "strategy": "dotnotation",
          "expression": "auth.role_key",
          "target": "Authorization",
          "on_conflict": "skip"
        }
      ]
    },
    "auth/api-keys": {
      "roles": ["role1"]
    }
  },
  "backend": [
    {
      "url_pattern": "/sales",
      "method": "GET",
      "host": ["http://backend:8080"]
    }
  ]
}
```

The `on_conflict: skip` setting ensures that a client providing the `Authorization` header directly takes precedence over the body field. When the header is absent, KrakenD populates it from `auth.role_key`, and the API key validator proceeds with that value. Because `modifier/request-body-extractor/early` executes at the endpoint handling level, the `auth/api-keys` component sees the injected header without any additional wiring.

## Example: how to extract an array field and place the values as query string

In this scenario, a client sends a list of users inside the JSON body. The `modifier/request-body-extractor` namespace extracts the id field of each user and writes it to the query string `user_id`:

```json
{
  "endpoint": "/extract-slice",
  "method": "POST",
  "output_encoding": "no-op",
  "input_query_strings": ["user_id"],
  "extra_config": {
    "modifier/request-body-extractor": {
      "operations": [
        {
          "type": "query_string",
          "strategy": "dotnotation",
          "expression": "users.*.id",
          "target": "user_id",
          "on_conflict": "replace"
        }
      ]
    }
  },
  "backend": [
    {
      "url_pattern": "/users",
      "method": "GET",
      "host": ["http://backend:8080"]
    }
  ]
}
```
