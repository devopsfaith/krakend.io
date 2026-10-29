# Static modification of requests and responses with Martian

> Learn how to integrate the Martian component into KrakenD API Gateway, enabling static request and response transformations for your APIs

Source: https://www.krakend.io/docs/backends/martian/

The Martian component allows you to **modify requests and responses with static data** through a simple DSL definition in the configuration file.

Martian works perfectly in combination with other components, such as [CEL verifications](https://www.krakend.io/docs/endpoints/common-expression-language-cel/) or [Caching](https://www.krakend.io/docs/backends/caching/), as it acts before other components start processing.

As it acts at HTTP level, it can change requests and responses even using the `no-op` encoding.

Use Martian when you want to make modifications before passing the content to the backends (`request`) or when returning from them (`response`).

## When to use Martian

Martian is a static component

You can inject data in requests and responses using the Martian component as long as it’s static data, **hardcoded in the configuration**. It does not allow you to place `{variables}` inside the modifiers.

Use Martian whenever you need to alter the request or response based on criteria with static values.

Some **examples of typical Martian scenarios** are:

- Set a new cookie during gateway processing
- Flag requests with query strings or headers when specific criteria is met
- Add, remove, or change specific headers
- Do basic authentication between KrakenD and the backend
- Add query strings before making the backend request (e.g., set an API key)

## Martian configuration

Add martian modifiers in your configuration under the `extra_config` of any `backend` using the namespace `modifier/martian`.

Inside the configuration, you must write a single component using the notation `package.Type` using the available ones described in this page. If you need **multiple modifiers** use a group type. You cannot write `@comment`-like attributes directly under the `modifier/martian` namespace, but you can add them inside each modifier.

There are three main **types** of packages you can use in Martian:

- **Modifiers**: Change the state of a request or a response. For instance, you want to add a custom header or a query string in the request before sending it to a backend.
- **Filters**: Add a condition to execute a contained modifier
- **Groups**: Bundle multiple operations to execute in the order specified in the group

Your configuration has to look as follows:

```json
{
  "backend": [
    {
      "url_pattern": "/foo/{var}",
      "extra_config": {
        "modifier/martian": {
          "the package type key goes here" {
             "scope": ["request", "response"]
          }
        }
      }
    }
  ]
}
```

Each package has its configuration, but a commonality is that they all have a `scope` key indicating when to apply the modifier. It can be an array containing `request`, `response`, or both. It depends on the component.

## Martian Modifiers

All packages with keys like `package.Modifier` or `package.Header` change the state of a request or a response.

For instance, you want to add a custom header in the request before sending it to a backend.

See the list of available modifiers below.

### Body modifier

The `body.Modifier` changes or sets the body of a request or response. The body must be **uncompressed and Base64 encoded**.

Additionally, it will modify the following headers to ensure proper transport: `Content-Type`, `Content-Length`, `Content-Encoding`.

##### Fields of Body Modifier

\* required fields

##### [`body`](https://www.krakend.io/docs/backends/martian/#body "Click to copy link to body") * string

The body you want to set, formatted in base64.

##### [`contentType`](https://www.krakend.io/docs/backends/martian/#contentType "Click to copy link to contentType") string

The content-type representing the body you are setting

Examples: `"application/x-www-form-urlencoded"` , `"text/plain"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The following modifier sets the body of the request and the response to `{"msg":"you rock!"}`. Notice that the `body` field is `base64` encoded (e.g., `echo "content" | base64 -w0`).

```json
{
  "endpoint": "/test/body.Modifier",
  "backend": [
    {
      "url_pattern": "/__debug/body.Modifier",
      "extra_config": {
        "modifier/martian": {
          "body.Modifier": {
            "scope": [
              "request",
              "response"
            ],
            "@comment": "Send a {'msg':'you rock!'}",
            "body": "eyJtc2ciOiJ5b3Ugcm9jayEifQ==",
            "contentType": "application/json"
          }
        }
      }
    }
  ]
}
```

#### Facilitating base64 content

The [Flexible Configuration](https://www.krakend.io/docs/configuration/flexible-config/) has a `b64enc` function that will allow you to have an easier-to-read configuration. For instance (notice the backticks as delimiters):

```go-text-template
"body": "{{- `{"msg":"you rock!"}` | b64enc -}}"
```

Or from an external file:

```go-text-template
"body": "{{- include "external_file.txt" | b64enc -}}"
```

### Cookie Modifier

The `cookie.Modifier` adds a cookie to a request or a response. If you set cookies in a response, the cookies are only set to the client when you use `no-op` encoding.

##### Fields of Cookie Modifier

\* required fields

##### [`domain`](https://www.krakend.io/docs/backends/martian/#domain "Click to copy link to domain") string

Domain of the Cookie you want to set

Example: `"example.com"`

##### [`expires`](https://www.krakend.io/docs/backends/martian/#expires "Click to copy link to expires") string

Date in RFC 3339 format and is absolute, not relative to the current time.

Example: `"2025-04-12T23:20:50.52Z"`

##### [`httpOnly`](https://www.krakend.io/docs/backends/martian/#httpOnly "Click to copy link to httpOnly") boolean

Create the Cookie with the httpOnly flag. When `true`, mitigates the risk of client side script accessing the protected cookie (if the browser supports it), mitigating the Most Common XSS

Defaults to `false`

##### [`maxAge`](https://www.krakend.io/docs/backends/martian/#maxAge "Click to copy link to maxAge") integer

For how long this Cookie is valid, in seconds. `0` means that the attribute is not set. `maxAge<0` means delete cookie now

Defaults to `0`

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

Name of the Cookie you want to set

##### [`path`](https://www.krakend.io/docs/backends/martian/#path "Click to copy link to path") string

Path of the Cookie you want to set

Example: `"/path/to"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

##### [`secure`](https://www.krakend.io/docs/backends/martian/#secure "Click to copy link to secure") boolean

Cookie secure flag. When `true`, the user agent will include the cookie in the request when using https only

Defaults to `false`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value") * string

Value of the Cookie you want to set

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

```json
{
  "endpoint": "/test/cookie.Modifier",
  "input_headers": [
    "X-Some"
  ],
  "output_encoding": "no-op",
  "backend": [
    {
      "url_pattern": "/__echo/cookie.Modifier",
      "encoding": "no-op",
      "extra_config": {
        "modifier/martian": {
          "cookie.Modifier": {
            "scope": [
              "request",
              "response"
            ],
            "name": "AcceptCookies",
            "value": "yes",
            "path": "/some/path",
            "domain": "example.com",
            "expires": "2025-04-12T23:20:50.52Z",
            "secure": true,
            "httpOnly": false,
            "maxAge": 86400
          }
        }
      }
    }
  ]
}
```

### URL Modifier

The `url.Modifier` allows you to change the URL despite what is set in the `host` and `url_pattern` combination. For instance, the following example calls a host and pattern that does not exist `https://does-not-exist/neither` but it ends up calling `http://localhost:8080/__echo/hello?flag=true`. It might be useful when used in combination with a Filter.

Except for `scope`, all the fields are optional. Set the ones you need.

##### Fields of URL Modifier

\* required fields

##### [`host`](https://www.krakend.io/docs/backends/martian/#host "Click to copy link to host") string

The hostname part of the URL including the port

Examples: `"example.com"` , `"localhost:8080"`

##### [`path`](https://www.krakend.io/docs/backends/martian/#path "Click to copy link to path") string

The path part of the URL

Example: `"/path/to"`

##### [`query`](https://www.krakend.io/docs/backends/martian/#query "Click to copy link to query") string

Sets the query string parameters you want to pass, overwriting anything passed in the request. Notice that if you set a `query`, if the user passes other query string parameters listed under `input_query_strings`, they will be lost, and only the values passed in the modifier will be sent. For such uses, see the `querystring.Modifier`

Examples: `"param=1"` , `"key1=val&key2=val"`

##### [`scheme`](https://www.krakend.io/docs/backends/martian/#scheme "Click to copy link to scheme") string

The scheme to apply

Examples: `"http"` , `"https"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

```json
{
  "endpoint": "/test/url.Modifier",
  "backend": [
    {
      "host": ["https://does-not-exist"],
      "url_pattern": "/neither",
      "extra_config": {
        "modifier/martian": {
          "url.Modifier": {
            "scope": ["request"],
            "scheme": "http",
            "host": "localhost:8080",
            "path": "/__echo/hello",
            "query": "flag=true"
          }
        }
      }
    }
  ]
}
```

Notice that the example above changes the URL used to query the backend, but the `Host` header remains `does-not-exist`.

### Query String modifier

The `querystring.Modifier` adds a new query string or modifies existing ones in the request.

##### Fields of Querystring Modifier

\* required fields

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

Name of the query string you want to set

Examples: `"page"` , `"limit"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request"]`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value") * string

The value of the query string you want to set

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The example below sets an `?amount=75` independently of the value the user passed. Any other input query strings declared under `input_query_strings` are preserved and reach the backend as passed.

```json
{
  "endpoint": "/test/querystring.Modifier",
  "input_query_strings": ["currency","amount"],
  "backend": [
    {
      "host": ["http://localhost:8080"],
      "url_pattern": "/__echo/querystring.Modifier",
      "allow": ["req_uri"],
      "extra_config": {
        "modifier/martian": {
          "querystring.Modifier": {
            "scope": ["request"],
            "name": "amount",
            "value": "75"
          }
        }
      }
    }
  ]
}
```

Example of querystring.Modifier output 

```
$curl -i http://localhost:8080/test/querystring.Modifier\?currency\=EUR\&amount\=55
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Krakend: Version 2.3.3
X-Krakend-Completed: true
Date: Sat, 03 Jun 2023 20:57:43 GMT
Content-Length: 70

{"req_uri":"/__echo/querystring.Modifier?amount=75\u0026currency=EUR"}
```

### Copy a header

Although not widely used, the `header.Copy` lets you duplicate a header using another name. If you want to return headers to the client, remember to use `no-op` encoding. Notice also that even though the modifier supports request and response, rarely the same headers are used in both directions.

##### Fields of Header Copy

\* required fields

##### [`from`](https://www.krakend.io/docs/backends/martian/#from "Click to copy link to from") * string

The origin header you want to copy. When the header is provided by the user it must be included in the `input_headers` list.

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

##### [`to`](https://www.krakend.io/docs/backends/martian/#to "Click to copy link to to") * string

The destination header you want to create. If this header is returned to the end-user you must use `no-op` in the `output_encoding` of the endpoint.

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

```json
{
  "endpoint": "/test/header.Copy",
  "input_headers": ["X-Some"],
  "output_encoding": "no-op",
  "backend": [
    {
      "host": ["http://localhost:8080"],
      "url_pattern": "/__echo/header.Copy",
      "extra_config": {
        "modifier/martian": {
          "header.Copy": {
            "scope": ["request","response"],
            "from": "User-Agent",
            "to": "X-Browser"
          }
        }
      }
    }
  ]
}
```

### Stash modifier

The `stash.Modifier` creates a new header (or replaces an existing one with a matching name) containing the value of the original URL and all its query string parameters.

##### Fields of Stash Modifier

\* required fields

##### [`headerName`](https://www.krakend.io/docs/backends/martian/#headerName "Click to copy link to headerName") * string

The header you want to create. If this header is returned to the end-user you must use `no-op` in the `output_encoding` of the endpoint.

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The example below adds a header `X-Stash: http://localhost:8080/__echo/stash.Modifier?amount=1` both in the request and the response when the user calls `http://localhost:8080/test/stash.Modifier?amount=1`

```json
{
  "endpoint": "/test/stash.Modifier",
  "input_headers": ["X-Some"],
  "output_encoding": "no-op",
  "backend": [
    {
      "host": ["http://localhost:8080"],
      "url_pattern": "/__echo/stash.Modifier",
      "extra_config": {
        "modifier/martian": {
          "stash.Modifier": {
            "scope": ["request","response"],
            "headerName": "X-Stash"
          }
        }
      }
    }
  ]
}
```

### Header modifier

The `header.Modifier` adds a new header or changes the value of an existing one.

To change headers sent by the client, remember to add `input_headers` in the endpoint. Also, if the client needs to see the headers in the `response`, you must set the `output_encoding` to `no-op`.

##### Fields of Header Modifier

\* required fields

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

Name of the header you want to set

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value") * string

Value of the header you want to set

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

For instance, the following configuration changes the `User-Agent` (set internally by KrakenD) to `Late-Night-Commander v2.3` both in the request and the response.

```json
{
  "endpoint": "/test/header.Modifier",
  "output_encoding": "no-op",
  "backend": [
    {
      "host": ["http://localhost:8080"],
      "url_pattern": "/__echo/header.Modifier",
      "extra_config": {
        "modifier/martian": {
          "header.Modifier": {
            "scope": ["request","response"],
            "name": "User-Agent",
            "value": "Late-Night-Commander v2.3"
          }
        }
      }
    }
  ]
}
```

#### Connecting to Basic Auth (user/pass) backends

An application of this modifier is when you need KrakenD to provide a fixed user and password to connect to the backend, and the client does not need to know about it. The basic authentication requires you to provide a header with the form `Authorization: Basic <credentials>`. The credentials are the concatenation of the username and password using a colon `:` in base64.

For instance, if your username is `user` and your password `pa55w0rd`, you should generate the base64 as follows:

Term 

```
$echo -n "user:pa55w0rd" | base64
dXNlcjpwYTU1dzByZA==
```

When using `echo`, make sure to add the `-n` option to avoid the final line break from being encoded. You can test if the connection succeeds now with:

Term 

```
$curl -i https://yourapi --header 'Authorization: Basic dXNlcjpwYTU1dzByZA=='
```

If the connection works, it means that your credentials are correct, and you can add the resulting base64 string `dXNlcjpwYTU1dzByZA==` to the Martian modifier right before connecting to your `backend`:

```json
{
    "url_pattern": "/protected",
    "extra_config": {
        "modifier/martian": {
            "header.Modifier": {
              "scope": ["request"],
              "name": "Authorization",
              "value": "Basic dXNlcjpwYTU1dzByZA=="
            }
        }
    }
}
```

With the configuration above, whenever a request is made to the backend, the `Authorization` header is added automatically.

### Header ID

The `header.Id` is a modifier that sets a header with a **unique identifier (UUID)** for the request. The default name of the header is `X-Krakend-Id` but it can be changed by passing a “header” parameter as per the example below which names the header `X-Request-Id`. If for whatever reason, the header already exists, the header is not altered.

##### Fields of Header Id

\* required fields

##### [`header`](https://www.krakend.io/docs/backends/martian/#header "Click to copy link to header") string

The header name you want to use to save the ID. In the case the header is already set, the header is unmodified.

Defaults to `"X-Krakend-Id"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "host": ["http://localhost:8080"],
  "echo_endpoint": true,
  "endpoints": [
    {
      "endpoint": "/test",
      "backend": [
        {
          "url_pattern": "/__echo/header.Id",
          "extra_config": {
            "modifier/martian": {
              "header.Id": {
                "scope": [
                  "request"
                ],
                "header": "X-Request-Id"
              }
            }
          }
        }
      ]
    }
  ]
}
```

### Append a header

The `header.Append` adds a new header in the request or the response, or appends a new value to an existing one.

There are some headers that accept only one value, so you won’t be able to set multiple entries in one header, like `Accept-Encoding`, `User-Agent`, `X-Forwarded-For`, or `X-Forwarded-Host`.

##### Fields of Append a header

\* required fields

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

Name of the header you want to append a value. Add the same name under the `input_headers` list to append more values to an existing header passed by the client. In addition, to see the header in the response, you must use `no-op`.

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value") * string

The value you want to add or append.

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

```json
{
  "endpoint": "/test/header.Append",
  "input_headers": ["X-Some"],
  "output_encoding": "no-op",
  "backend": [
    {
      "url_pattern": "/__echo/header.Append",
      "encoding": "no-op",
      "extra_config": {
        "modifier/martian": {
          "header.Append": {
            "scope": [
              "request", "response"
            ],
            "name": "X-Some",
            "value": "I am"
          }
        }
      }
    }
  ]
}
```

### Header Blacklist

The `header.Blacklist` removes the listed headers under `names` in the request and response of the backend.

##### Fields of Blacklist headers

\* required fields

##### [`names`](https://www.krakend.io/docs/backends/martian/#names "Click to copy link to names") * array of strings

List of all the headers you want to supress from the request or the response. If you want to see the headers in the client, you must use the `output_encoding: no-op`, and if you want the client headers to propagate to the backend, you need to use `input_headers` too.

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The following example removes several headers from the request and the response.

```json
{
  "endpoint": "/test/header.Blacklist",
  "output_encoding": "no-op",
  "input_headers": ["X-Some"],
  "backend": [
    {
      "host": ["http://localhost:8080"],
      "url_pattern": "/__echo/header.Blacklist",
      "extra_config": {
        "modifier/martian": {
          "header.Blacklist": {
            "scope": ["request","response"],
            "names": ["X-Some", "User-Agent", "X-Forwarded-Host", "X-Forwarded-For"]
          }
        }
      }
    }
  ]
}
```

### Port modifier

The `port.Modifier` alters the `request` URL and `Host` header to use the provided port. It accepts three different settings, but only one is accepted.

##### Fields of Port Modifier

\* required fields

Minimum configuration needs **one of**: `scope` + `port` , or `scope` + `defaultForScheme` , or `scope` + `remove`

##### [`defaultForScheme`](https://www.krakend.io/docs/backends/martian/#defaultForScheme "Click to copy link to defaultForScheme") boolean

Uses the default port of the schema. `80` for `http://` or `443` for `https://`. Other schemas are ignored.

##### [`port`](https://www.krakend.io/docs/backends/martian/#port "Click to copy link to port") integer

Defines which port will be used.

##### [`remove`](https://www.krakend.io/docs/backends/martian/#remove "Click to copy link to remove") boolean

Removes the port from the host string when `true`.

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope")

Scopes in which this modifier acts

Possible values are: `["request"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The example below connects to a backend to port 1234, but it’s switched back to 8080 by Martian.

```json
{
  "endpoint": "/test/port.Modifier",
  "output_encoding": "no-op",
  "input_headers": ["X-Some"],
  "backend": [
    {
      "host": ["http://localhost:1234"],
      "url_pattern": "/__echo/port.Modifier",
      "extra_config": {
        "modifier/martian": {
          "port.Modifier": {
            "scope": ["request"],
            "port": 8080
          }
        }
      }
    }
  ]
}
```

## Martian Filters

All packages with keys like `package.Filter` are modifiers, but **add a condition to execute them**. They allow you to do a check before modifying anything.

All filters have in their settings a key `modifier` which executes the declared one when the condition is met, and **optionally** an `else` key to execute another modifier when the condition is not met. Not all filters support an `else`.

### Cookie Filter

The `cookie.Filter` executes the contained `modifier` when a cookie with a `name` is found. Optionally it can check also if it has a specific `value`. When the condition(s) fail(s), it executes the modifier in the `else` clause when set.

##### Fields of Cookie Filter

\* required fields

##### [`else`](https://www.krakend.io/docs/backends/martian/#else "Click to copy link to else") object

The modifier you want to execute when the condition does not match

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the cookie name (and value if provided) matches

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

The name of the Cookie you want to check. Notice that the `input_headers` must contain `Cookie` in the list when you want to check cookies sent by the client.

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request"]`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value")

If besides the cookie name, you set this value, it ensures the cookie has a literal match.

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The example below inspects the Cookies in the request and looks for the one named `marketingCookies`. As there is a `value` set, too, it will make sure that it’s set to `yes`. Then it executes a `header.Modifier` that sets a new header `Accepts-Marketing-Cookies` to true or false depending on the value.

Test the cookie.Filter endpoint 

```
$curl -H 'Cookie: marketingCookies=no;' http://localhost:8080/test/cookie.Filter
{"req_headers":{"Accepts-Marketing-Cookies":["false"]}}
```

```json
{
  "endpoint": "/test/cookie.Filter",
  "input_headers": ["Cookie"],
  "backend": [
    {
      "url_pattern": "/__echo/cookie.Filter",
      "allow": ["req_headers.Accepts-Marketing-Cookies"],
      "extra_config": {
        "modifier/martian": {
          "cookie.Filter": {
            "scope": [
              "request"
            ],
            "name": "marketingCookies",
            "value": "yes",
            "modifier": {
              "header.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "Accepts-Marketing-Cookies",
                "value": "true"
              }
            },
            "else": {
              "header.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "Accepts-Marketing-Cookies",
                "value": "false"
              }
            }
          }
        }
      }
    }
  ]
}
```

### URL filter

The `url.Filter` executes its contained modifier if the `request` URL matches all of the provided parameters. Missing parameters are ignored.

##### Fields of URL Filter

\* required fields

##### [`else`](https://www.krakend.io/docs/backends/martian/#else "Click to copy link to else") object

The modifier you want to execute when the condition does not match

##### [`host`](https://www.krakend.io/docs/backends/martian/#host "Click to copy link to host") string

The literal hostname that must match, including the port

Example: `"localhost:8080"`

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the condition matches

##### [`path`](https://www.krakend.io/docs/backends/martian/#path "Click to copy link to path") string

The `/path` of the URL, without query strings.

Example: `"/path/to"`

##### [`query`](https://www.krakend.io/docs/backends/martian/#query "Click to copy link to query") string

The query strings you want to check. Use `key1=value1&key2=value2` to check that the request has exactly these keys and values (order is irrelevant, but content not). Suppose the request has more query strings than declared here because the `input_query_strings` allowed them to pass. In that case, the evaluation will be `false`, and the `else` modifier will be executed.

Example: `"/path/to"`

##### [`scheme`](https://www.krakend.io/docs/backends/martian/#scheme "Click to copy link to scheme") string

The literal scheme it must match

Examples: `"http"` , `"https"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

Since the `host` and the `url_pattern` of the backend are set in the configuration, the `scheme`, `host`, and `path` parameters might provide little value. Yet, they make sense when you are copy/pasting the same modifiers across all endpoints or when you use multiple environments, and you want to mark those hosts somehow.

The following example allows the user to pass a `?legacy=1` query string parameter. Then it adds a new header, `X-Legacy`, with the evaluation result.

```json
{
      "endpoint": "/test/url.Filter",
      "input_query_strings": ["legacy"],
      "backend": [
        {
          "url_pattern": "/__echo/url.Filter",
          "allow": ["req_headers"],
          "extra_config": {
            "modifier/martian": {
              "url.Filter": {
                "scope": [
                  "request", "response"
                ],
                "query": "legacy=1",
                "modifier": {
                  "header.Modifier": {
                    "scope": [
                      "request"
                    ],
                    "name": "X-Legacy",
                    "value": "true"
                  }
                },
                "else": {
                  "header.Modifier": {
                    "scope": [
                      "request"
                    ],
                    "name": "X-Legacy",
                    "value": "false"
                  }
                }
              }
            }
          }
        }
      ]
    }
```

### Regex filter

The `url.RegexFilter` evaluates a regular expression ([RE2 syntax](https://golang.org/s/re2syntax)) and executes the `modifier` desired when it matches, and the modifier declared under `else` when it does not.

The URL evaluation does not take into account query strings.

##### Fields of URL RegexFilter

\* required fields

##### [`else`](https://www.krakend.io/docs/backends/martian/#else "Click to copy link to else") object

The modifier you want to execute when the condition does not match

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the condition matches

##### [`regex`](https://www.krakend.io/docs/backends/martian/#regex "Click to copy link to regex") * string

The regular expression you want to check against the URL

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

In the example below, we check that the URL matches with the regexp `.*localhost.*` and set the header `Is-Localhost` accordingly.

```json
{
  "endpoint": "/test/url.RegexFilter",
  "output_encoding": "no-op",
  "backend": [
    {
      "url_pattern": "/__echo/url.RegexFilter",
      "encoding": "no-op",
      "extra_config": {
        "modifier/martian": {
          "url.RegexFilter": {
            "scope": [
              "request"
            ],
            "regex": ".*localhost.*",
            "modifier": {
              "header.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "Is-Localhost",
                "value": "true"
              }
            },
            "else": {
              "header.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "Is-Localhost",
                "value": "false"
              }
            }
          }
        }
      }
    }
  ]
}
```

### QueryString filter

The `querystring.Filter` executes the `modifier` if the `request` contains a query string parameter that matches the defined name and value in the filter. You must set the `name` declared in the filter in the `input_query_strings`.

##### Fields of QueryString Filter

\* required fields

##### [`else`](https://www.krakend.io/docs/backends/martian/#else "Click to copy link to else") object

The modifier you want to execute when the condition does not match

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the condition matches

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

Name of the query string you want to check

Examples: `"page"` , `"limit"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value") string

Value of the query string you want to check

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

```json
{
  "endpoint": "/test/querystring.Filter",
  "input_query_strings": [
    "param"
  ],
  "backend": [
    {
      "url_pattern": "/__echo/querystring.Filter",
      "allow": ["req_headers"],
      "extra_config": {
        "modifier/martian": {
          "querystring.Filter": {
            "scope": [
              "request"
            ],
            "name": "param",
            "value": "true",
            "modifier": {
              "header.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "X-Passed-Param",
                "value": "true"
              }
            }
          }
        }
      }
    }
  ]
}
```

### Header Filter

The `header.Filter` executes its contained `modifier` if the `request` or `response` contain a header that matches the defined name and value. The `value` is optional, and only the header’s existence evaluates when undefined.

##### Fields of Header Filter

\* required fields

##### [`else`](https://www.krakend.io/docs/backends/martian/#else "Click to copy link to else") object

The modifier you want to execute when the condition does not match

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the condition matches

##### [`name`](https://www.krakend.io/docs/backends/martian/#name "Click to copy link to name") * string

Name of the header you want to check. You must add under `input_headers` the `name` included in the filter.

Examples: `"X-Some"` , `"Content-Type"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

##### [`value`](https://www.krakend.io/docs/backends/martian/#value "Click to copy link to value") string

Value of the header you want to check

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

Example configuration that adds the query string parameter `?legacy=1` when there is a header `X-Tenant: v1`.

```json
{
  "endpoint": "/test/header.Filter",
  "input_headers": [
    "X-Tenant"
  ],
  "backend": [
    {
      "url_pattern": "/__echo/header.Filter",
      "allow": ["req_uri"],
      "extra_config": {
        "modifier/martian": {
          "header.Filter": {
            "scope": [
              "request"
            ],
            "name": "X-Tenant",
            "value": "v1",
            "modifier": {
              "querystring.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "legacy",
                "value": "1"
              }
            }
          }
        }
      }
    }
  ]
}
```

The endpoint above produces the following output.

Example of header filter 

```
$curl -H 'X-Tenant: v1' http://localhost:8080/test/header.Filter
{"req_uri":"/__echo/header.Filter?legacy=1"}
```

### Header Regexp filter

The `header.RegexFilter` checks that a regular expression ([RE2 syntax](https://golang.org/s/re2syntax)) passes on the target header and, if it does, executes the `modifier`.

##### Fields of Header RegexFilter

\* required fields

##### [`header`](https://www.krakend.io/docs/backends/martian/#header "Click to copy link to header") * string

Name of the header you want to check. You must add under `input_headers` the `name` included in the filter.

Examples: `"X-Some"` , `"Content-Type"`

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the condition matches

##### [`regex`](https://www.krakend.io/docs/backends/martian/#regex "Click to copy link to regex") * string

The regular expression you want to check against the header value

Examples: `".*localhost.*"` , `"^foo-[a-z]+$"`

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The example below checks a header `X-App-Version` and if it contains the terminations `-alpha`, `-beta`, or `-preview`, adds to the backend request a query string `?testing=1`.

```json
{
  "endpoint": "/test/header.RegexFilter",
  "input_headers": [
    "X-App-Version"
  ],
  "backend": [
    {
      "url_pattern": "/__echo/header.RegexFilter",
      "allow": ["req_uri"],
      "extra_config": {
        "modifier/martian": {
          "header.RegexFilter": {
            "scope": [
              "request"
            ],
            "header": "X-App-Version",
            "regex": ".*-(alpha|beta|preview)$",
            "modifier": {
              "querystring.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "testing",
                "value": "1"
              }
            }
          }
        }
      }
    }
  ]
}
```

Example of output 

```
$curl -H 'X-App-Version: v1.2.3-alpha' http://localhost:8080/test/header.RegexFilter
{"req_uri":"/__echo/header.RegexFilter?testing=1"}
```

### Port filter

The `port.Filter` executes its `modifier` only when the port matches the one used in the request. It does not support `else`.

##### Fields of Port Filter

\* required fields

##### [`else`](https://www.krakend.io/docs/backends/martian/#else "Click to copy link to else") object

The modifier you want to execute when the condition does not match

##### [`modifier`](https://www.krakend.io/docs/backends/martian/#modifier "Click to copy link to modifier") * object

The modifier you want to execute when the condition matches

##### [`port`](https://www.krakend.io/docs/backends/martian/#port "Click to copy link to port") * integer

The port number you want to check

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

The following example defines a backend using port `1234`, but the modifier changes it back to `8080` when this happens.

```json
{
  "endpoint": "/test/port.Filter",
  "backend": [
    {
      "host": [
        "http://localhost:1234"
      ],
      "url_pattern": "/__echo/port.Filter",
      "extra_config": {
        "modifier/martian": {
          "port.Filter": {
            "scope": [
              "request"
            ],
            "port": 1234,
            "modifier": {
              "port.Modifier": {
                "scope": [
                  "request"
                ],
                "port": 8080
              }
            }
          }
        }
      }
    }
  ]
}
```

## Groups (Apply multiple modifiers)

All the modifiers perform a single modification in the request or the response. However, the `fifo.Group` and the `priority.Group` allow you to create a list of modifiers executed sequentially or in a specific order. The group is needed when using more than one modifier and encapsulates all the following actions to perform in the `modifiers` array.

### FIFO group

The `fifo.Group` holds a list of modifiers executed in first-in, first-out order.

##### Fields of FIFO group

\* required fields

##### [`aggregateErrors`](https://www.krakend.io/docs/backends/martian/#aggregateErrors "Click to copy link to aggregateErrors") boolean

When true, the group will continue to execute consecutive modifiers when a modifier in the group encounters an error. The Group will then return all errors returned by each modifier after all modifiers have been executed. When false, if an error is returned by a modifier, the error is returned by ModifyRequest/Response and no further modifiers are run.

Defaults to `false`

##### [`modifiers`](https://www.krakend.io/docs/backends/martian/#modifiers "Click to copy link to modifiers") * array

The list of modifiers you want to execute in the declared order

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

Example of usage (modify the body, and set a header):

```json
{
  "endpoint": "/test/fifo.Group",
  "output_encoding": "no-op",
  "backend": [
    {
      "url_pattern": "/__echo/fifo.Group",
      "extra_config": {
        "modifier/martian": {
          "fifo.Group": {
            "scope": [
              "request",
              "response"
            ],
            "aggregateErrors": true,
            "modifiers": [
              {
                "body.Modifier": {
                  "scope": [
                    "request"
                  ],
                  "body": "eyJtc2ciOiJ5b3Ugcm9jayEifQ=="
                }
              },
              {
                "header.Modifier": {
                  "scope": [
                    "request",
                    "response"
                  ],
                  "name": "X-Martian",
                  "value": "true"
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

### Priority Group

The `priority.Group` contains the modifiers you want to execute, but the order in which they are declared is unimportant. Instead, each modifier adds a `priority` attribute that defines the order in which they are run.

##### Fields of Priority group

\* required fields

##### [`modifiers`](https://www.krakend.io/docs/backends/martian/#modifiers "Click to copy link to modifiers") * array

The list of modifiers you want to execute, order specified in the items using `priority`.

Each item of modifiers accepts the following properties:

##### [`modifier`](#modifiers-modifier "Click to copy link to modifier") *

The modifier definition you want to execute

##### [`priority`](#modifiers-priority "Click to copy link to priority") * integer

The assigned priority number

##### [`scope`](https://www.krakend.io/docs/backends/martian/#scope "Click to copy link to scope") *

Scopes in which this modifier acts

Possible values are: `["request","response"]` , `["request"]` , `["response"]`

Schema: [https://www.krakend.io/schema/v3.0/modifier/martian.json](https://www.krakend.io/schema/v3.0/modifier/martian.json "JSON schema definition")

Example configuration that adds the query string `first` and later `last` of foo=bar and deletes any X-Martian headers on requests:

It is useful when you want to reorder them in the future, but instead of moving the whole block, you just change the priority number.

```json
{
  "endpoint": "/test/priority.Group",
  "output_encoding": "no-op",
  "backend": [
    {
      "url_pattern": "/__echo/priority.Group",
      "extra_config": {
        "modifier/martian": {
          "priority.Group": {
            "scope": [
              "request",
              "response"
            ],
            "modifiers": [
              {
                "priority": 0,
                "modifier" : {
                  "querystring.Modifier": {
                    "scope": ["request"],
                    "name": "first",
                    "value": "0"
                  }
                }
              },
              {
                "priority" : 100,
                "modifier" : {
                  "querystring.Modifier": {
                    "scope": ["request"],
                    "name": "last",
                    "value": "100"
                  }
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```
