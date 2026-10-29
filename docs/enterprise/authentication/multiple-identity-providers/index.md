# Multiple Identity Providers

> Learn how to integrate and support multiple identity providers in KrakenD API Gateway, enabling flexible authentication options for API consumers

Source: https://www.krakend.io/docs/enterprise/authentication/multiple-identity-providers/

The JWK aggregator plugin allows KrakenD to validate tokens issued by numerous Identity Providers or multiple realms of the same Identity Server.

The default behavior of KrakenD allows you to validate JWT tokens using a single Identity Provider or tenant per endpoint. However, sometimes, tokens arriving at an endpoint originate in different providers or, tenants or realms. It might be because you have a multi-tenant scenario, an ongoing migration, or other systems that converge into the gateway. The KrakenD `jwk-aggregator` allows you to alleviate this issue.

The plugin generates a **virtual JWK URL** that can validate any token generated in the different identity providers (the `origins`) and hosts the URL locally, for instance, under the URL `http://localhost:9876` (you can choose the port).

All `origins` are fetched in parallel. If the `cache` is set to `true,` the Identity Server’s responses are cached in memory individually for the time specified in their `Cache-Control` header. **You must set a cache policy to avoid hammering the Identity Server on each request**.

In addition to the aggregator cache, you can also enable [shared caching](https://www.krakend.io/docs/authorization/jwk-caching/#shared-jwk-cache) for JWT validation.

## Configuration

The configuration is straightforward. You only need to include the following lines, where `origins` is the list of all possible **public keys** of your identity servers:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    },
    "plugin/http-server": {
      "plugins": [
        {
          "name": "jwk-aggregator",
          "config": {
            "port": 9876,
            "cache": true,
            "origins": [
              "https://provider1.tld/jwk.json",
              "http://provider2/public_keys",
              "https://keycloak/auth/realms/realm-first/protocol/openid-connect/certs",
              "https://keycloak/auth/realms/realm-second/protocol/openid-connect/certs"
            ]
          }
        }
      ]
    },
    "auth/validator": {
      "@comment": "Enable a JWK shared cache amongst all endpoints of 15 minutes",
      "shared_cache_duration": 900
    }
  },
  "endpoints": [
    {
      "endpoint": "/example",
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "http://localhost:9876",
          "disable_jwk_security": true,
          "cache": true
        }
      },
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/example"
        }
      ]
    }
  ]
}
```

The options below go inside the `config` of the `jwk-aggregator` plugin:

##### Fields of JWK aggregator

\* required fields

##### [`cache`](https://www.krakend.io/docs/enterprise/authentication/multiple-identity-providers/#cache "Click to copy link to cache") boolean

When `true`, it stores the response of the Identity provider for the time specified in its `Cache-Control` header.

##### [`origins`](https://www.krakend.io/docs/enterprise/authentication/multiple-identity-providers/#origins "Click to copy link to origins") * array of strings

The list of all JWK URLs recognized as valid Identity Providers by the gateway.

##### [`port`](https://www.krakend.io/docs/enterprise/authentication/multiple-identity-providers/#port "Click to copy link to port") * integer

The port of the local server doing the aggregation. The port is only accessible within the gateway machine using localhost, and it’s never exposed to the external network. Choose any port that is free in the system.

Example: `9876`

Schema: [https://www.krakend.io/schema/v3.0/plugin/jwk-aggregator.json](https://www.krakend.io/schema/v3.0/plugin/jwk-aggregator.json "JSON schema definition")

### Endpoint’s configuration

In addition to the configuration above, the endpoints must point to the new service instead of a particular JWK URL. To do that, you have to reference it in the `jwk_url` as follows and set the `disable_jwk_security` flag to `true` (as the connection is internal and does not use TLS validation). You also need to enable `cache` to true to avoid hammering the aggregator (and the aggregator the external identity providers) on each request:

```JSON
{
  "endpoint": "/protected/resource",
  "extra_config": {
    "auth/validator": {
      "alg": "RS256",
      "jwk_url": "http://localhost:9876",
      "disable_jwk_security": true,
      "cache": true
    }
  },
  "backend": [
    {
      "url_pattern": "/"
    }
  ]
}
```

And that’s all you need to support multiple identity providers’ origin! You can change the exposed port. There is no specific reason to keep the `9876`.

If you want even better caching, you can also enable the [global shared JWK cache](https://www.krakend.io/docs/authorization/jwk-caching/#shared-jwk-cache), which is reused between endpoints.

## Dealing with token differences

While the aggregation functionality allows the [JWT validator](https://www.krakend.io/docs/authorization/jwt-validation/) to accept tokens from several providers, you might need to go beyond simple validation and enforce additional business rules on tokens that have completely different structures, and they represent information like `scopes` using different fields and structures (e.g., string vs array). The [security policies](https://www.krakend.io/docs/enterprise/security-policies/) allow you to overcome any limitations of the validator options and provide more fine-grained control.

Let’s see an example below.

### Working with Ory and Auth0 tokens simultaneously

Let’s see how to deal with differences using two real-world examples. Suppose you have some users who are authenticated using [Auth0](https://auth0.com/) and others on [Ory](https://www.ory.sh/). The JWT standard does not set a rule for all the possible data you can store in the payload, so each identity provider represents the information differently.

For instance, the **payload** of an Auth0 token after decoding could contain the following fields:

```json
{
  "aud": "myaudience",
  "iss": "https://auth.example.auth0.com/",
  "sub": "subject",
  "exp": 1718717595,
  "scope": "read:consumers write:consumers"
}
```

Instead, an Ory token could represent the same information differently:

```json
{
  "aud": [
    "myaudience"
 ],
  "iss": "https://some.projects.oryapis.com",
  "sub": "subject",
  "exp": 1718717595,
  "scp": [
    "read:consumers",
    "write:consumers"
 ]
}
```

Scopes use different keys, and while one uses strings to represent data, the other uses arrays.

The JWT validator does not have any problem in validating any of the two formats, but it expects that the key holding the scopes, for instance, contains a unique name, so we cannot use the `scopes_key` attribute as in the configuration below if multiple providers have discrepancies:

```json
{
    "auth/validator": {
        "alg": "RS256",
        "jwk_url": "http://localhost:9876",
        "disable_jwk_security": true,
        "scopes_key": "scopes",
        "scopes": ["read:data","write:data"]
 }
}
```

When we cannot validate scopes inside the validator because the `scopes_key` is not unique, the **Security Policies** provide a more advanced way of dealing with this scenario.

The following is a complete example that validates tokens for both providers and enforces a set of scopes, even when the scope key is `scp` (array) or `scope`(string):

```json
{
    "version": 4,
    "$schema": "https://www.krakend.io/schema/krakend.json",
    "host": [
        "http://example.com"
    ],
    "extra_config": {
        "plugin": {
            "pattern": ".so",
            "folder": "/opt/krakend/plugins/"
        },
        "plugin/http-server": {
            "plugins": [
                {
                    "name": "jwk-aggregator",
                    "config": {
                        "port": 9876,
                        "cache": true,
                        "origins": [
                            "https://some.projects.oryapis.com/.well-known/jwks.json",
                            "https://auth.example.auth0.com/.well-known/jwks.json"
                        ]
                    }
                }
            ]
        },
        "auth/validator": {
            "@comment": "Enable a JWK shared cache amongst all endpoints of 15 minutes",
            "shared_cache_duration": 900
        }
    },
    "endpoints": [
        {
            "endpoint": "/test",
            "backend": [
                {
                    "url_pattern": "/test"
                }
            ],
            "extra_config": {
                "auth/validator": {
                    "alg": "RS256",
                    "jwk_url": "http://localhost:9876",
                    "disable_jwk_security": true
                },
                "security/policies": {
                    "jwt": {
                        "policies": [
                            "(has(JWT.scp) && ('read:data-access' in JWT.scp || 'data-access:all' in JWT.scp ) || (has(JWT.scope) && ('read:data-access' == JWT.scope || 'data-access:all' == JWT.scope) )"
                        ]
                    }
                }
            }
        }
    ]
}
```

As you can see, the security policy implements any needed logic, moving the responsibility out of the validator.
