# API Key Authentication in KrakenD

> Implement API key authentication in KrakenD API Gateway for secure and controlled access to your APIs in enterprise environments

Source: https://www.krakend.io/docs/enterprise/authentication/api-keys/

API key authentication enables a **Role-Based Access Control (RBAC)** and a **rate-limiting** mechanism based on an API key passed by the client. For the desired endpoints, KrakenD rejects requests from users who do not provide a valid **key**, users trying to access a resource with insufficient permissions for their **role**, or exceeding the defined quota.

The authentication is granular and works **per endpoint**, meaning you can combine public endpoints (no API Key needed) and private endpoints in the same configuration.

The API Key component requires you to declare at least two different blocks of configuration:

1. The declaration of all known users and roles, placed at the root’s `extra_config` middleware section.
2. The association of which endpoints are protected, placed at each endpoint.

## Declaring API Key users and roles

The first block of configuration declares how KrakenD retrieves keys, which ones are available, and the roles recognized by the system. It requires at least the `keys` attribute with a list of objects declaring each client’s `key` and `roles`. It looks like this:

```json
{
  "version": 4,
  "extra_config": {
    "auth/api-keys": {
      "strategy": "header",
      "identifier": "Authorization",
      "keys": [
        {
          "key": "4d2c61e1-34c4-e96c-9456-15bd983c5019",
          "roles": ["role1", "role2"],
          "@description": "ACME Inc."
        },
        {
          "key": "58427514-be32-0b52-b7c6-d01fada30497",
          "roles": ["role1","role3"],
          "@description": "Administrators Inc."
        }
      ]
    }
  }
}
```

The configuration above is a simple implementation that stores API keys in plain text.

Hashing API keys instead of saving them in plain text

While the example above shows readable API keys, we recommend saving the hashed API keys in the configuration.

The list of possible configuration attributes is as follows:

##### Fields of API-key Authentication

\* required fields

##### [`hash`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#hash "Click to copy link to hash")

The hashing function used to store the value of the key. When you use `plain` the API key is written as it will passed by the user. The rest of the hashes require you to save the API key after applying the desired function.

Possible values are: `"plain"` , `"fnv128"` , `"sha256"` , `"sha1"`

Defaults to `"plain"`

##### [`identifier`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#identifier "Click to copy link to identifier") string

The header name or the query string name that contains the API key. Defaults to `key` when using the `query_string` strategy and to `Authorization` when using the `header` strategy. The identifier set here is used across all endpoints with API key authentication enabled, but they can override this entry individually.

Examples: `"Authorization"` , `"X-Key"`

Defaults to `"Authorization"`

##### [`keys`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#keys "Click to copy link to keys") * array of objects

A list of objects defining each API Key.

Each item of keys accepts the following properties:

##### [`key`](#keys-key "Click to copy link to key") string

The secret key used by the client to access the resources. Don’t have a key? Execute in a terminal `uuidgen` to generate a random one.

##### [`roles`](#keys-roles "Click to copy link to roles") array of strings

All the roles this user has. See roles as all the identifying labels that belong to this client.

##### [`propagate_role`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#propagate_role "Click to copy link to propagate_role") string

The name of a header that will propagate to the backend containing the matching role. The backend receives no header when the string is empty, or the attribute is not declared. Otherwise, the backend receives the declared header name containing **the first matching role of the user**. The header value will be `ANY` when the endpoint does not require roles. For instance, if an API key has roles `[A, B]`, and the endpoint demands roles `[B, C]`, the backend will receive a header with the value `B`.

Example: `"X-Krakend-Role"`

Defaults to `""`

##### [`salt`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#salt "Click to copy link to salt") string

A salt string for the desired hashing function. When provided, the API key is concatenated after the salt string and both hashed together.

Example: `"mySalt"`

Defaults to `""`

##### [`strategy`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#strategy "Click to copy link to strategy")

Specifies where to expect the user API key, whether inside a header or as part of the query string. The strategy set here is used across all endpoints with API key authentication enabled, but they can override this entry individually.

Possible values are: `"header"` , `"query_string"`

Defaults to `"header"`

Schema: [https://www.krakend.io/schema/v3.0/auth/api-keys.json](https://www.krakend.io/schema/v3.0/auth/api-keys.json "JSON schema definition")

It is also shown in the example a `@description` attribute to help you identify who this key belongs to. This attribute is metadata and unneeded by KrakenD, but it eases the administration of keys. Use keys starting with `@` to place comments in the file.

### Saving API keys hashed

When you declare the API keys in the list, if you don’t declare a hashing function, you write the `key` you want to pass when consuming endpoints as is.

When you declare a `hash` function (other than the default `plain` text), you must write the API key in the configuration after hashing it with the corresponding algorithm. These are the supported hashing functions:

- `plain`: No hashing. Key saved in plain text.
- `fnv128`: Hash the key using the non-cryptographic function [128-bit FNV-1](https://en.wikipedia.org/wiki/Fowler-Noll-Vo_hash_function).
- `sha256`: Hash the key using [SHA256](https://pkg.go.dev/crypto/sha256#New) ([RFC6234](https://www.rfc-editor.org/rfc/rfc6234.html))
- `sha1`: Hash the key using [SHA1](https://pkg.go.dev/crypto/sha1#New) ([RFC3174](https://www.rfc-editor.org/rfc/rfc3174.html))

In addition, you can pass a `salt` string, which will be prepended to the API key when resolving an API key:

```js
string_to_hash = salt + api_key
```

#### Example: Saving API keys hashed with SHA256

Let’s say you want to give a user the API key `abc`. To hash the key, you can add a salt string, like `mySalt`, to spice up the output hash. Then you could type in a terminal:

Generate SHA256 of an API Key 

```
$echo -n "mysaltabc" | sha256sum
2ad27678dd4fdf811ffe7f9c77801ab66e2cc62d08abb393451ddda48c1eba3f  -
```

Mac users might need to replace `sha256sum` with `shasum -a 256`. Then, the configuration needs to know the `salt` you chose to hash the key, and which `hash` function, so the gateway can produce the same output. It would look like this:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "debug_endpoint": true,
  "extra_config": {
    "auth/api-keys": {
      "salt": "mySalt",
      "hash": "sha256",
      "keys": [
        {
          "@description": "ACME Inc.",
          "key": "2ad27678dd4fdf811ffe7f9c77801ab66e2cc62d08abb393451ddda48c1eba3f",
          "@example": "echo -n 'mySaltabc' | sha256sum",
          "roles": [
            "user",
            "whitelabel"
          ]
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/foo",
      "backend": [
        {
          "url_pattern": "/__debug/user",
          "host": [
            "http://localhost:8080"
          ]
        }
      ],
      "extra_config": {
        "auth/api-keys": {
          "roles": [
            "user"
          ]
        }
      }
    }
  ]
}
```

Notice that the `key` in the configuration is the hashed value, not the API key. A leakage of the KrakenD configuration would not reveal the original API key `abc` that allows connecting to the endpoint.

#### Example: Saving API keys hashed with FNV-1

Here is another example with a small script in Go that generates the hash of an API key with a given salt in FNV-1 ([test it online here](https://go.dev/play/p/hHksLLCUJy3)):

```go
package main

import (
  "fmt"
  "hash/fnv"
)

func main() {
  hash := fnv.New128()
  api_key := "4d2c61e1-34c4-e96c-9456-15bd983c5019"
  salt := "mySalt"
  hash.Write([]byte(salt + api_key))
  fmt.Printf("%x", hash.Sum(nil))
}
```

The configuration for this case would be as follows:

```json
{
  "auth/api-keys": {
    "strategy": "header",
    "identifier": "X-Key",
    "hash": "fnv128",
    "salt": "mySalt",
    "@hashed-with": "https://go.dev/play/p/hHksLLCUJy3",
    "keys": [
        {
            "@key-plain": "4d2c61e1-34c4-e96c-9456-15bd983c5019",
            "key": "e0f7fce642685956791e58b835e26786",
            "roles": [
                "admin"
            ],
            "@description": "ACME Inc."
        }
    ]
  }
}
```

## Protecting endpoints by API Key

Now that all users and roles are declared, it’s time to reference them in the endpoints. You must include the namespace `auth/api-keys` in its `extra_config` for all the endpoints needing API Key validation. Any endpoints not having the namespace are not API Key protected. For example, the endpoints could look like this:

```json
{
  "endpoint": "/admin",
  "backend": [
    {
      "url_pattern": "/__debug/admin",
      "host": [
        "http://localhost:8080"
      ]
    }
  ],
  "extra_config": {
    "auth/api-keys": {
      "roles": [
        "admin"
      ],
      "client_max_rate": 5
    }
  }
}
```

The endpoint configuration accepts the following parameters:

##### Fields of API-key validation

\* required fields

##### [`client_max_rate`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#client_max_rate "Click to copy link to client_max_rate") number

If you want to limit the endpoint usage to this specific user at a number of requests per second. Exceeding the number of requests per second will give the client a `429 Too Many Requests` HTTP status code.

##### [`identifier`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#identifier "Click to copy link to identifier") string

The header name or the query string name that contains the API key. By default uses any value declared in the `auth/api-keys` component in the service level.

##### [`roles`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#roles "Click to copy link to roles") * array of strings

The list of roles allowed to access the endpoint. Values must match (case sensitive) definitions in the `keys` section at the service level of `auth/api-keys`. API Keys not having the right role, or unauthenticated requests, will receive a `401 Unauthorized`.

##### [`strategy`](https://www.krakend.io/docs/enterprise/authentication/api-keys/#strategy "Click to copy link to strategy")

Specifies where to expect the user API key, whether inside a header or as part of the query string. When you change the strategy at the endpoint level, **you should also set the identifier**, otherwise you could have for instance, a query string strategy expecting to have a URL like `/foo?Authorization=YOUR-KEY`.

Possible values are: `"header"` , `"query_string"`

Schema: [https://www.krakend.io/schema/v3.0/endpoint\_extra\_config.json](https://www.krakend.io/schema/v3.0/endpoint_extra_config.json "JSON schema definition")

Here is a full example of two different API Keys that can access three different endpoints:

```json
{
  "version": 4,
  "extra_config": {
    "auth/api-keys": {
      "keys": [
        {
          "@description": "ACME Inc.",
          "key": "4d2c61e1-34c4-e96c-9456-15bd983c5019",
          "roles": ["user", "whitelabel"]
        },
        {
          "@description": "Administrators Inc.",
          "key": "58427514-be32-0b52-b7c6-d01fada30497",
          "roles": ["admin", "user"]
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/public",
      "backend": [
        {
          "url_pattern": "/__debug/public",
          "host": [
            "http://localhost:8080"
          ]
        }
      ]
    },
    {
      "endpoint": "/admin",
      "backend": [
        {
          "url_pattern": "/__debug/admin",
          "host": [
            "http://localhost:8080"
          ]
        }
      ],
      "extra_config": {
        "auth/api-keys": {
          "roles": [
            "admin"
          ],
          "client_max_rate": 5
        }
      }
    },
    {
      "endpoint": "/user",
      "backend": [
        {
          "url_pattern": "/__debug/user",
          "host": [
            "http://localhost:8080"
          ]
        }
      ],
      "extra_config": {
        "auth/api-keys": {
          "roles": [
            "user"
          ]
        }
      }
    }
  ]
}
```

## Authenticating requests using API Key

When you don’t set any `strategy` in the configuration clients or use the `header` strategy, clients need to make requests to KrakenD adding the `Authorization: Bearer` or `Authorization: Basic`, but if you pass neither, the API Key is the whole content of the header value. Therefore, the value inside the header must strictly match the API key defined in the configuration after applying the selected procedure. See below.

### Using `Bearer`

The format of the header is as follows:

```
Authorization: Bearer YOUR-KEY
```

For instance, having declared in the configuration a key `4d2c61e1-34c4-e96c-9456-15bd983c5019` that should be capable of seeing `/foo`, you should make a call like this:

Passing the key with Bearer 

```
$curl -H'Authorization: Bearer 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/foo
{"message":"pong"}
```

You write the API key after the bearer precisely as declared.

### Using `Basic` authentication instead of `Bearer`

Another way of authenticating is using `Basic` authentication. However, it does not present any benefit compared to `Bearer` other than backward compatibility with legacy implementations.

The difference is that **clients must pass the key in `base64`** :

```
Authorization: Basic base64(YOUR-KEY:)
```

Notice that the encoding of the key contains an ending `:`. The final colon prevents your client from being asked for a password.

#### `Basic` authentication example

Repeating the previous `Bearer` example, let’s connect using `Basic` authentication now. The first step is to base64-encode:

Convert Key to base64 

```
$echo -n "4d2c61e1-34c4-e96c-9456-15bd983c5019:" | base64
NGQyYzYxZTEtMzRjNC1lOTZjLTk0NTYtMTViZDk4M2M1MDE5Ogo=
```

And then pass the header:

Basic authentication 

```
$curl -H"Authorization: Basic NGQyYzYxZTEtMzRjNC1lOTZjLTk0NTYtMTViZDk4M2M1MDE5Ogo=" http://localhost:8080/foo
{"message":"pong"}
```

You can also not do the base64 encoding if you use a client with regular basic auth implemented, which will encode automatically (again, notice the `:` at the end of the key):

Basic authentication 

```
$curl -i --user 4d2c61e1-34c4-e96c-9456-15bd983c5019: http://localhost:8080/foo
{"message":"pong"}
```

In case you forget the colon `:` you’ll be prompted for the password (when there isn’t):

Basic authentication 

```
$curl -i --user 4d2c61e1-34c4-e96c-9456-15bd983c5019 http://localhost:8080/user
Enter host password for user '4d2c61e1-34c4-e96c-9456-15bd983c5019':
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Krakend: Version
X-Krakend-Completed: true
Date: Tue, 10 Nov 2020 17:37:09 GMT
Content-Length: 18

{"message":"pong"}
```

### Using an API key directly as a value

Another way of authenticating is passing the API Key directly in a header, without the `Basic` or the `Bearer`. When this happens, the full value of the header is used as API key.

For instance, when your clients call the gateway as follows:

Passing the api key directly 

```
$curl -H'x-api-key: 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/foo
{"message":"pong"}
```

You must set an `identifier` such as `X-Api-Key`.

### Using a custom `Authorization` header

You can replace `Authorization` with any other header using the `identifier` option. But in all cases, the `Bearer`, the `Basic`, or no prefix are evaluated as described above.

For instance:

```json
{
  "auth/api-keys": {
    "strategy": "header",
    "identifier": "X-Key"
  }
}
```

Clients will need to make calls like

Passing the key with Bearer 

```
$curl -H'X-Key: Bearer 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/foo
{"message":"pong"}
```

Or

Passing the key without a Bearer 

```
$curl -H'X-Key: 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/foo
{"message":"pong"}
```

### Passing the API key using a query string

If you set the `strategy` to `query_string`, clients can directly pass the key on the URL using ’ ?key=xxxx\`. For instance:

Accessing the /user endpoint with an API key on the URL 

```
$curl http://localhost:8080/user?key=4d2c61e1-34c4-e96c-9456-15bd983c5019
{"message":"pong"}
```

You can set a different `identifier` section instead of `key` to something else. For instance, let’s use `?mycustomapikey=xxxx`:

```json
{
  "auth/api-keys": {
    "strategy": "query_string",
    "identifier": "mycustomapikey",
    "keys": [{}]
  }
}
```

A configuration like the above will require users to make calls like this:

Using custom query strings 

```
$curl http://localhost:8080/user?mycustomapikey=4d2c61e1-34c4-e96c-9456-15bd983c5019
{"message":"pong"}
```

## Complete API Key configuration example

The following configuration snippet is fully functional. Run KrakenD with the debug flag (`krakend run -d`) to test it locally, as it uses itself as a backend. Explanation below:

```json
{
    "version": 4,
    "extra_config": {
        "auth/api-keys": {
            "strategy": "header",
            "identifier": "Authorization",
            "propagate_role": "X-Krakend-Role",
            "keys": [
                {
                    "@description": "ACME Inc.",
                    "key": "4d2c61e1-34c4-e96c-9456-15bd983c5019",
                    "roles": [
                        "user",
                        "whitelabel"
                    ]
                },
                {
                    "@description": "Administrators Inc.",
                    "key": "58427514-be32-0b52-b7c6-d01fada30497",
                    "roles": [
                        "admin",
                        "user"
                    ]
                }
            ]
        }
    },
    "endpoints": [
        {
            "endpoint": "/public",
            "backend": [
                {
                    "url_pattern": "/__debug/public",
                    "host": [
                        "http://localhost:8080"
                    ]
                }
            ]
        },
        {
            "endpoint": "/admin",
            "backend": [
                {
                    "url_pattern": "/__debug/admin",
                    "host": [
                        "http://localhost:8080"
                    ]
                }
            ],
            "extra_config": {
                "auth/api-keys": {
                    "roles": [
                        "admin"
                    ]
                }
            }
        },
        {
            "endpoint": "/user",
            "backend": [
                {
                    "url_pattern": "/__debug/user",
                    "host": [
                        "http://localhost:8080"
                    ]
                }
            ],
            "extra_config": {
                "auth/api-keys": {
                    "roles": [
                        "user"
                    ]
                }
            }
        },
        {
            "endpoint": "/custom-header",
            "backend": [
                {
                    "url_pattern": "/__debug/custom-header",
                    "host": [
                        "http://localhost:8080"
                    ]
                }
            ],
            "extra_config": {
                "auth/api-keys": {
                    "roles": [
                        "admin"
                    ],
                    "@comment": "Instead of the Authorization header, we will use X-ADMIN-KEY",
                    "identifier": "X-User-Key",
                    "strategy": "header"
                }
            }
        }
    ]
}
```

In this example, we have enabled two different API users. One with key `4d2c61e1-34c4-e96c-9456-15bd983c5019` (let’s say a customer of *ACME Inc.*) and another one with the key `58427514-be32-0b52-b7c6-d01fada30497` (an administrator of my company).

Both users share the role `users`, and they can access all the protected endpoints as this role is included. Nevertheless, the `/admin` endpoint is reachable by the administrator only, as the role “admin” is required. The backend also receives a header `X-Krakend-Role` with the matching role.

The endpoint `/public` is always accessible, with or without the `Authorization` header, as it does not include the API key middleware configuration.

Finally, all endpoints expected the `Authorization` header, but in the endpoint `/custom-header`, we decided to use a different one and override it for this endpoint only. Therefore, we will use the `X-User-Key` header instead.

And now some sample interactions:

Accessing the /user endpoint with a valid user (Bearer) 

```
$curl -H'Authorization: Bearer 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/user
{"message":"pong"}
```

Accessing the /user endpoint (Basic) 

```
$curl -i --user 4d2c61e1-34c4-e96c-9456-15bd983c5019: http://localhost:8080/user
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Krakend: Version
X-Krakend-Completed: true
Date: Tue, 10 Nov 2020 17:07:46 GMT
Content-Length: 18

{"message":"pong"}
```

Accessing the /admin endpoint with a non-admin user 

```
$curl -iG -H'Authorization: Bearer 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/admin

HTTP/1.1 401 Unauthorized
Date: Tue, 10 Nov 2020 17:01:03 GMT
Content-Length: 0
```

Accessing the /user endpoint with an invalid key 

```
$curl -iG -H'Authorization: Bearer INVALID-API-KEY' http://localhost:8080/user

HTTP/1.1 401 Unauthorized
Date: Tue, 10 Nov 2020 16:59:35 GMT
Content-Length: 0
```

Accessing the /public endpoint 

```
$curl http://localhost:8080/public
{"message":"pong"}
```

Accessing the /custom-header endpoint 

```
$curl -iG -H'X-User-Key: Bearer 4d2c61e1-34c4-e96c-9456-15bd983c5019' http://localhost:8080/custom-header
{"message":"pong"}
```

## Rate limiting usage of API Keys

The attribute `client_max_rate` allows you to set the maximum requests per second you allow in an endpoint or in the service. The rate limit you set is the same for all the API Keys. For instance, given the following endpoint configuration:

```json
{
  "endpoint": "/members",
  "backend": [
    {
      "url_pattern": "/api/v1/members"
    }
  ],
  "extra_config": {
    "auth/api-keys": {
      "roles": [
        "admin",
        "user"
      ],
      "client_max_rate": 5
    }
  }
}
```

With this configuration, API Keys are limited to 5 requests per second. But what if you wanted to set different limits for the `admin` and the `user` role? In that case you can use instead the [rate limiting based on tiers](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/) and remove the `client_max_rate` from this configuration.

## Onboard new API key customers without restarts

As the KrakenD configuration is static and only changes once you restart the process or you do a deployment, you might find it inconvenient to onboard new customers with new API keys. The following advice can be handy.

Create a pool of available API keys instead of waiting for user registration in your system to insert a new API key. KrakenD has stable performance; it doesn’t change if you have 100 keys or 1 million.

An easy way to generate API keys could be as follows:

Creating an API key 

```
$uuidgen
```

If you want to generate several keys and write part of the configuration file, you could use something like:

Creating a pool of 50 API keys 

```
$for i in $(seq 50)
do
  key=$(uuidgen)
  echo "{ \"key\": \"$key\", \"roles\": [\"silver-plan\"], \"@status\": \"free\" },"
done
```

Then you would use the output above to create a partial file `api-keys.json` that would be used on KrakenD with [Flexible Configuration](https://www.krakend.io/docs/configuration/flexible-config/).

Finally, your backend should have this list somewhere, and when a new user registers, you assign one of the free keys to the new user. You can deploy from time to time when you are running out of API keys in the pool or if you want to write the assignment in the configuration.
