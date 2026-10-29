# Cross-Origin Resource Sharing (CORS) Configuration

> Configure Cross-Origin Resource Sharing (CORS) in KrakenD API Gateway to enable secure communication between different domains and APIs.

Source: https://www.krakend.io/docs/enterprise/service-settings/cors/

When KrakenD endpoints are consumed from a browser, you should enable the **Cross-Origin Resource Sharing (CORS)** module, as browsers restrict cross-origin HTTP requests initiated from scripts.

When the Cross-Origin Resource Sharing (CORS) configuration is enabled, KrakenD uses additional HTTP headers to tell browsers that they can **use resources from a different origin** (domain, protocol, or port). For instance, you will need this configuration if your web page is hosted at [https://www.domain.com](https://www.domain.com) and the Javascript references the KrakenD API at [https://api.domain.com](https://api.domain.com).

## Configuration

CORS configuration lives in the root of the file, as it’s a service component. Add the namespace `security/cors` under the global `extra_config` as follows:

```json
{
  "version": 4,
  "extra_config": {
    "security/cors": {
      "allow_origins": [
        "*"
      ],
      "allow_methods": [
        "GET",
        "HEAD",
        "POST"
      ],
      "expose_headers": [
        "Content-Length",
        "Content-Type"
      ],
      "allow_headers": [
        "Accept-Language"
      ],
      "max_age": "12h",
      "allow_credentials": false,
      "debug": false
    }
  }
}
```

The configuration options of this component are as follows:

##### Fields of CORS

\* required fields

##### [`allow_credentials`](https://www.krakend.io/docs/enterprise/service-settings/cors/#allow_credentials "Click to copy link to allow_credentials") boolean

When requests can include user credentials like cookies, HTTP authentication or client side SSL certificates.

Defaults to `false`

##### [`allow_headers`](https://www.krakend.io/docs/enterprise/service-settings/cors/#allow_headers "Click to copy link to allow_headers") array of strings

An array with the headers allowed, but `Origin`is always appended to the list. Requests with headers not in this list are rejected.

Example: `["Accept-Language"]`

Defaults to `[]`

##### [`allow_methods`](https://www.krakend.io/docs/enterprise/service-settings/cors/#allow_methods "Click to copy link to allow_methods") array

An array with all the HTTP methods allowed, in uppercase. Possible values are `GET`, `HEAD`,`POST`,`PUT`,`PATCH`,`DELETE`, or `OPTIONS`

Defaults to `["GET","HEAD","POST"]`

##### [`allow_origins`](https://www.krakend.io/docs/enterprise/service-settings/cors/#allow_origins "Click to copy link to allow_origins") array of strings

An array with all the origins allowed, the use of one `*` is permitted to allow groups of hosts. Examples of values are `https://example.com`, `https://example.*`, `https://*.example.com` `or just`\*\` (any origin).

Defaults to `["*"]`

##### [`allow_private_network`](https://www.krakend.io/docs/enterprise/service-settings/cors/#allow_private_network "Click to copy link to allow_private_network") boolean

Indicates whether to accept cross-origin requests over a private network.

Defaults to `false`

##### [`debug`](https://www.krakend.io/docs/enterprise/service-settings/cors/#debug "Click to copy link to debug") boolean

Show debugging information in the logger, **use it only during development**.

Defaults to `false`

##### [`expose_headers`](https://www.krakend.io/docs/enterprise/service-settings/cors/#expose_headers "Click to copy link to expose_headers") array of strings

List of headers that are safe to expose to the API of a CORS API specification.

Defaults to `["Content-Length","Content-Type"]`

##### [`max_age`](https://www.krakend.io/docs/enterprise/service-settings/cors/#max_age "Click to copy link to max_age") string

For how long the response can be cached. For zero values the `Access-Control-Max-Age` header is not set.

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Defaults to `"0h"`

##### [`options_passthrough`](https://www.krakend.io/docs/enterprise/service-settings/cors/#options_passthrough "Click to copy link to options_passthrough") boolean

Instructs preflight to let other potential next handlers to process the OPTIONS method. Turn this on when you set the [`auto_opts` flag in the router to `true`](https://www.krakend.io/docs/service-settings/router-options/#auto_options).

Defaults to `false`

##### [`options_success_status`](https://www.krakend.io/docs/enterprise/service-settings/cors/#options_success_status "Click to copy link to options_success_status") integer

The HTTP status code that is considered a success.

Example: `200`

Defaults to `204`

Schema: [https://www.krakend.io/schema/v3.0/security/cors.json](https://www.krakend.io/schema/v3.0/security/cors.json "JSON schema definition")

Allow credentials and wildcards

According to the CORS specification, you are not allowed to use wildcards and credentials at the same time. If you need to do this, [check this workaround](https://github.com/krakend/krakend-cors/issues/9)

## Debugging configuration

The following configuration might help you debug your CORS configuration. Check the inline `@comments`:

```json
{
  "endpoints":[
        {
            "@comment": "this will fail due to double CORS validation",
            "endpoint":"/cors/no-op",
            "input_headers":["*"],
            "output_encoding": "no-op",
            "backend":[
                {
                    "url_pattern": "/__debug/cors",
                    "host": ["http://localhost:8080"],
                    "encoding": "no-op"
                }
            ]
        },
        {
            "@comment": "this won't fail because CORS preflight headers are removed from the request to the backend",
            "endpoint":"/cors/no-op/martian",
            "input_headers":["*"],
            "output_encoding": "no-op",
            "backend":[
                {
                    "url_pattern": "/__debug/cors/martian",
                    "host": ["http://localhost:8080"],
                    "encoding": "no-op",
                    "extra_config":{
                      "modifier/martian": {
                          "fifo.Group": {
                              "scope": ["request", "response"],
                              "aggregateErrors": true,
                              "modifiers": [
                                  {
                                    "header.Blacklist": {
                                      "scope": ["request"],
                                      "names": [
                                        "Access-Control-Request-Method",
                                        "Sec-Fetch-Dest",
                                        "Sec-Fetch-Mode",
                                        "Sec-Fetch-Site",
                                        "Origin"
                                      ]
                                    }
                                  }
                              ]
                          }
                      }
                    }
                }
            ]
        },
        {
            "@comment": "this won't fail because no headers are added to the request to the backend",
            "endpoint":"/cors/no-op/no-headers",
            "output_encoding": "no-op",
            "backend":[
                {
                    "url_pattern": "/__debug/cors/no-headers",
                    "host": ["http://localhost:8080"],
                    "encoding": "no-op"
                }
            ]
        }
]}
```

## Adding the OPTIONS method

When working in a SPA, you will usually receive `OPTIONS` calls to KrakenD; although this configuration is not related to CORS, it usually goes in hand.

To support `OPTIONS` in your endpoints, you only need to add the [flag `auto_options`](https://www.krakend.io/docs/enterprise/service-settings/router-options/#auto_options) as follows:

```json
{
  "version": 4,
  "extra_config": {
    "router": {
       "auto_options": true
    },
    "security/cors": {
      "@comment": "...CORS configuration inside this block..."
    }
  }
}
```

##### Fields of `"router"`

\* required fields

##### [`auto_options`](https://www.krakend.io/docs/enterprise/service-settings/cors/#auto_options "Click to copy link to auto_options") boolean

When true, enables the autogenerated OPTIONS endpoint for all the registered paths

Schema: [https://www.krakend.io/schema/v3.0/router.json](https://www.krakend.io/schema/v3.0/router.json "JSON schema definition")
