# gRPC Server

> KrakenD's gRPC server support for gRPC to HTTP/JSON transcoding, advanced routing, and API management for efficient microservices communication

Source: https://www.krakend.io/docs/enterprise/grpc/server/

The gRPC server integration allows you to expose an additional gRPC service under the same HTTP port. The gRPC service can consume data from mixed upstream services, whether they are also gRPC, HTTP, Lambdas, queues, or any other supported type.

![Diagram of gRPC server to many](https://www.krakend.io/images/documentation/diagrams/grpc-server.mmd.svg)

Due to its nature, when you access the gateway through gRPC, you cannot use HTTP components in the user request (but you can work with the HTTP layer when connecting to your services). With this in mind, HTTP-specific components like [CORS](https://www.krakend.io/docs/enterprise/service-settings/cors/) or [HTTP Security](https://www.krakend.io/docs/enterprise/service-settings/security/) aren’t loaded in this context.

## gRPC server configuration

To configure a gRPC server, you must define the services available and which methods you want to offer. The services and methods are defined in the [`catalog` definition](https://www.krakend.io/docs/enterprise/grpc/#catalog-definition), and in the `services` section, you decide which ones to expose and where to connect them.

Each method is connected to one or more backends, which do not need to be gRPC.

The example below reads Protobuff definitions from the local folder `./grpc/definitions` and decides to expose the method `FindFlight` service that belongs to the `flight_finder.Flights` service:

```json
{
  "version": 4,
  "extra_config": {
    "grpc": {
      "catalog": [
        "./grpc/definitions"
      ],
      "server": {
        "services": [
          {
            "name": "flight_finder.Flights",
            "methods": [
              {
                "name": "FindFlight",
                "input_headers": [
                  "*"
                ],
                "payload_params": {
                  "page.cursor": "cursor"
                },
                "backend": [
                  {
                    "host": [
                      "example.com:4242"
                    ],
                    "url_pattern": "/flight_finder.Flights/FindFlight",
                    "extra_config": {
                      "backend/grpc": {
                        "use_request_body": true
                      }
                    }
                  },
                  {
                    "method": "GET",
                    "host": [
                      "http://example.com:8000"
                    ],
                    "url_pattern": "/articles.json?q={cursor}"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }
}
```

As you can see in the example above, this gRPC server fetches content from one HTTP service and one gRPC service (the flight finder). The upstream gRPC service uses a [gRPC Client configuration](https://www.krakend.io/docs/enterprise/backends/grpc/).

The accepted parameters are as follows:

##### Fields of gRPC server

\* required fields

##### [`catalog`](https://www.krakend.io/docs/enterprise/grpc/server/#catalog "Click to copy link to catalog") * array of strings

The paths to the different `.pb` files you want to load, or the paths to directories containing `.pb` files. All content is scanned in the order of the list, and after fetching all files it resolves the dependencies of their imports. The order you use here is not important to resolve imports, but it matters when there are conflicts (different files using the same namespace and package type).

Example: `["./grpc/flights.pb","./grpc/definitions","/etc/krakend/grpc"]`

##### [`server`](https://www.krakend.io/docs/enterprise/grpc/server/#server "Click to copy link to server") object

Defines the gRPC server properties.

##### [`opentelemetry`](#server-opentelemetry "Click to copy link to opentelemetry") object

Overrides [OpenTelemetry settings](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/) for the gRPC server.

##### [`disable_metrics`](#opentelemetry-disable_metrics "Click to copy link to disable_metrics") boolean

Whether you want to disable all metrics happening in the gRPC server.

Defaults to `false`

##### [`disable_traces`](#opentelemetry-disable_traces "Click to copy link to disable_traces") boolean

Whether you want to disable all traces happening in the gRPC server.

Defaults to `false`

##### [`services`](#server-services "Click to copy link to services") array of objects

Defines one object per available gRPC service.

Each item of services accepts the following properties:

##### [`methods`](#services-methods "Click to copy link to methods") array of objects Show properties

The gRPC methods available for this service. The `methods` entry is the gRPC equivalent of the HTTP `endpoints`, meaning that the `backend` object under `methods` can use the same configuration as HTTP, including all its `extra_config` parameters.

Each item of methods accepts the following properties:

##### [`backend`](#methods-backend "Click to copy link to backend") array of objects

An array with all the [backend objects](https://www.krakend.io/docs/backends/) mapped to this method

##### [`extra_config`](#methods-extra_config "Click to copy link to extra_config") object

Extra configuration for this method

##### [`auth/validator`](#extra_config-auth%2fvalidator "Click to copy link to auth/validator") object

The JWT validation for this method. The configuration underneath is exactly as in the [JWT validator](https://www.krakend.io/docs/enterprise/authorization/jwt-validation/)

##### [`input_headers`](#methods-input_headers "Click to copy link to input_headers") array of strings

Defines the list of all client headers that you can use as gRPC metadata.

By default, KrakenD won’t pass any header from the client to the backend. This list is **case-insensitive**. You can declare headers in lowercase, uppercase, or mixed.

An entry `["X-Something"]` forwards a single `X-Something` header to the backend, ignoring everything else. A single star element `["*"]` as value forwards everything to the backend (**it’s safer to avoid this option**).

Examples: `["X-Custom-Trace"]` , `["*"]`

Defaults to `[]`

##### [`name`](#methods-name "Click to copy link to name") string

The name of the published gRPC method.

Example: `"FindFlight"`

##### [`payload_params`](#methods-payload_params "Click to copy link to payload_params") object

Maps a property of the gRPC incoming payload to a `{parameter}` that you can inject and reuse in a `url_pattern`. It supports dot nation to access nested objects.

Example: `{"some.grpc.object":"param1"}`

##### [`name`](#services-name "Click to copy link to name") string

The name of the published gRPC service.

Example: `"flight_finder.Flights"`

Schema: [https://www.krakend.io/schema/v3.0/grpc.json](https://www.krakend.io/schema/v3.0/grpc.json "JSON schema definition")

## gRPC server authorization

If your gRPC server requires authenticated users using JWT, then you need to add the information to the gRPC server under the `extra_config` of the method, exactly as you do for [JWT validation in endpoints](https://www.krakend.io/docs/enterprise/authorization/jwt-validation/).

Here is an example, notide the placement of the `auth/validator` namespace:

```json
{
  "version": 4,
  "extra_config": {
    "grpc": {
      "catalog": [
        "./grpc/definitions"
      ],
      "server": {
        "services": [
          {
            "name": "flight_finder.Flights",
            "methods": [
              {
                "name": "FindFlight",
                "input_headers": [
                  "*"
                ],
                "extra_config": {
                  "auth/validator": {
                    "alg": "RS256",
                    "audience": [
                      "http://api.example.com"
                    ],
                    "roles_key": "http://api.example.com/custom/roles",
                    "roles": [
                      "user",
                      "admin"
                    ],
                    "jwk_url": "https://identity.example.com/.well-known/jwks.json",
                    "cache": true
                  }
                },
                "payload_params": {
                  "page.cursor": "cursor"
                },
                "backend": [
                  {
                    "host": [
                      "example.com:4242"
                    ],
                    "url_pattern": "/flight_finder.Flights/FindFlight",
                    "extra_config": {
                      "backend/grpc": {
                        "use_request_body": true
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }
}
```

## gRPC server introspection

Reflection is a protocol that allows gRPC servers to expose their Protobuf-defined APIs over a standardized RPC service and is available automatically when using the gRPC server. While Protobuf accelerates communication, it complicates debugging or manual server interaction. For instance, without reflection (before v2.8), users would need to:

- Understand the server’s exposed RPC services.
- Decode the Protobuf definitions of request and response messages, including all nested types.
- Craft binary request payloads manually and decode responses.

Now, with the introspection, you can query the gRPC server to understand the available services and their definitions, and it simplifies the debugging process because popular tools use reflection to interact with servers dynamically, making it easier to test and troubleshoot APIs.

You don’t need to set anything in the configuration to enable reflection.

Read the [gRPC reflection documentation](https://grpc.io/docs/guides/reflection/)
