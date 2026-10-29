# Dynamic Routing

> Implement dynamic routing in KrakenD API Gateway to dynamically route requests based on headers and query strings

Source: https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/

The **dynamic routing** extends the routing capabilities to add header, tokens, and query string processing to assemble the final upstream URL you want to reach. In addition, it allows you to convert headers to query strings and enforce the existence of parameters on the request.

To enable dynamic routing, **you don’t need to add any specific extra entry** in the configuration. Instead, write the variables that inject the content provided by the user directly in the `url_pattern` or inside a `host` entry. For instance:

```json
{
  "endpoint": "/foo",
  "backend":[
    {
      "host": ["http://{input_headers.X-Tenant}.example.com"],
      "url_pattern": "/{input_headers.X-Route}",
      "disable_host_sanitize": true
    }
  ]
}
```

The example above replaces the variable `{input_headers.X-Tenant}` with the value provided under a hypothetical `X-Tenant` header to construct the final DNS entry. It also uses a header `X-Route` to define the URL pattern. Notice that when using dynamic routing in the field `host` **, the flag `disable_host_sanitize` set to `true` is mandatory**. Also notice **the absence of a service discovery property (`sd`)** in the configuration, as the dynamic routing is incompatible with DNS-based service discovery strategies.

Security notice

Because the dynamic routing might take the user input to build the `host` string, you should always add a [Security Policy](https://www.krakend.io/docs/enterprise/security-policies/) that validates the user input.

## Dynamic routing declaration

REST-backends only

The Dynamic Routing is only available to **non-persistent backends** that use static resolution (e.g., REST). Any stateful connection such as WebSockets or gRPC does not support this pattern. If the Service Discovery is DNS-based (even in REST) the Dynamic Routing is not supported.

There are four different types of input injections you can do in the backend `url_pattern` or the `host` fields that are available with the following variables:

- `{input_headers}`: Header routing
- `{input_query_strings}`: Query string routing
- `{JWT}`: JWT-claim routing
- `{param}`: Parameter-based routing

To declare dynamic routes based on the strategies above, you need to write the variables inside curly braces `{}` and traverse the objects using a dot `.` separator, including the index of arrays (except for parameters).

Missing parameters?

When the user does not pass a required input header or query string, the gateway raises an error `400 Bad Request`, as the final URL can’t be generated. Missing JWT claims will pass the request, but you can enforce them with [security policies](https://www.krakend.io/docs/enterprise/security-policies/)

## Routing based on headers

The most typical scenario for dynamic routing is when you want to reach a service or a path based on an input header. To access header values, use the above-defined variable `{input_headers.xxx}`, where `xxx` is the header name.

As the **dynamic routing component executes before the endpoint evaluation**, you don’t need to add the headers you declare under `input_headers` unless you want these headers propagated to the backend.

For instance, let’s say that you want to pass an `X-Tenant` header and use it as part of the host you will contact:

```json
{
  "endpoints": [
    {
      "endpoint": "/user/{id}",
      "backend": [{
        "host": ["http://{input_headers.x-tenant}.example.com"],
        "url_pattern": "/user/{id}",
        "disable_host_sanitize": true
      }]
    }
  ]
}
```

With a configuration like the above, the user would pass the customer information in the header, for instance:

Using host routing based on headers 

```
$curl -H'X-Tenant: abcdef' http://krakend/user/1234
```

The upstream services a request to `http://abcdef.example.com/user/1234`. Notice the **mandatory requirement of `disable_host_sanitize`** . The protocol should also be present in the declaration, not in the header.

Similarly, you can do path routing based on a header like this:

```json
{
  "endpoints": [
    {
      "endpoint": "/user/{id}",
      "backend": [{
        "url_pattern": "/{input_headers.customer}/user/{id}"
      }]
    }
  ]
}
```

The upstream service receives, in this case, `/abcdef/user/1234`.

When multiple entries of the same header exist, you can specify the index of which one is in the variable. For instance, with `/foo/{input_headers.customer.1}`, the backend would receive the second value of the header (indexes are zero-based). Not specifying an index always defaults to the first element of an array, so `{input_headers.customer}` and `{input_headers.customer.0}` both return the same value.

In addition, you can do header validation and other sophisticated checks using the [security policies](https://www.krakend.io/docs/enterprise/security-policies/) component. For instance, you could make sure that the header adheres to a specific format expressed by a regex:

```json
{
  "endpoints": [
    {
      "endpoint": "/user/{id}",
      "backend": [
        {
          "url_pattern": "/{input_headers.customer}/user/{id_user}"
        }
      ],
      "extra_config": {
        "security/policies": {
          "req": {
            "policies": [
              "getHeader('Customer').matches('^/[a-zA-Z]{4}$')"
            ],
            "error": {
              "body": "Mailformed customer request",
              "status": 400
            }
          }
        }
      }
    }
  ]
}
```

An important observation on the example above is that Security Policies need to access header names in [canonical format](https://www.krakend.io/docs/enterprise/endpoints/parameter-forwarding/#case-sensitive-and-case-insensitive-parameters).

## Routing based on query strings

As with headers, you can also route a query string as a path following the same strategy. If you want to forward the query string to the backend as is, you only need to add it under the `input_query_strings` list. If, on the other side, you would like to convert a query string into a part of the path, then you can apply the variables as follows:

```json
{
  "endpoints": [
    {
      "endpoint": "/user",
      "backend": [
        {
          "url_pattern": "/user/{input_query_strings.id_user}"
        }
      ]
    }
  ]
}
```

The example above takes a request `/user?id_user=john` and converts it to `/user/john` towards the backend.

When there are multiple entries of the exact query string, for instance, `/foo?q=a&q=b`, you can specify the index in the variable. For example, with `/bar/{input_query_strings.q.1}`, the backend would receive `/bar/b` (zero-based indexes). Not specifying an index always defaults to the first element of an array, so `{input_query_strings.q}` and `{input_query_strings.q.0}` both evaluate to `/bar/a`.

As the dynamic routing component executes before the endpoint evaluation, you don’t need to add the accessed values under `input_query_strings` unless you want the query strings sent twice to the backend.

### Conversion of headers to query strings

You don’t need to use the variables in the `url_pattern` as part of the path, and you can use them freely as long you form a valid `url_pattern`. Yet, it is especially relevant when passing a header as a query string, where you would use the variable as a query string, not a path. E.g., `"url_pattern": "/foo?query={input_headers.query}"`. Any additional query strings you allow to pass using the `input_headers` list are appended to the URL pattern.

## Routing based on a JWT claim

You can inject claims to the backend’s final URL if you are using the [JWT validator](https://www.krakend.io/docs/authorization/jwt-validation/) in the same endpoint through the `{JWT.}` variable. For instance, you could declare a `url_pattern` making use of `{JWT.sub}`, where `sub` is a first-level claim of your JWT payload (you cannot traverse nested claims).

For instance, when your JWT payload is represented by something like this:

```json
{
    "sub": "1234567890",
    "name": "Mr. KrakenD"
}
```

Then, when you use an `"url_pattern": "/foo/{JWT.sub}"`, it translates into `/foo/1234567890`.

If KrakenD can’t replace the claim’s content for any reason, the backend receives a request to the literal URL `/foo/{JWT.sub}`, unlike the 400 error of the previous two variables.

## Routing based on parameters

When the endpoint definition adds a `{parameter}` you can also use this value to populate the `host` or `url_pattern` as well.

```json
{
  "endpoints": [
    {
      "endpoint": "/foo/{server}",
      "backend": [
        {
          "host": [ "http://{server}:8080" ],
          "url_pattern": "/__debug/dynamic"
        }
      ]
    }
  ]
}
```

As you can see, the request from the end-user would choose where to connect to. This has security implications that you should address with a Security Policy that validates the input received to see if it’s within the expected values. See below.

## Validating the user input with Security Policies

Given the nature of this feature, you should always add a [Security Policy](https://www.krakend.io/docs/enterprise/security-policies/) accompaning the usage of dynamic routing. For instance, if you allow in the configuration forming the host based on user input, validate the values to allow this:

```json
{
  "endpoints": [
    {
      "endpoint": "/foo/{server}",
      "extra_config": {
        "security/policies": {
          "req": {
            "policies": [
              "req_params.Server in ['a.example.com', 'b.example.com']"
            ]
          }
        }
      },
      "backend": [
        {
          "host": [
            "http://{server}:8080"
          ],
          "url_pattern": "/__debug/dynamic"
        }
      ]
    }
  ]
}
```

The example above would abort user requests that do not use `/foo/a.example.com` or `/foo/b.example.com`. Obviously, you can use any other type of expression that adjusts to your requirements.
