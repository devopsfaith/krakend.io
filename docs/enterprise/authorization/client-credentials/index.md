# Client Credentials Authorization

> Learn how to implement OAuth 2.0 Client Credentials (2-legged flow) with KrakenD API Gateway to secure your APIs for machine-to-machine communication

Source: https://www.krakend.io/docs/enterprise/authorization/client-credentials/

Through the **OAuth 2.0 Client Credentials Grant**, KrakenD can do a **2-legged OAuth2 flow**, which means that the gateway requests to your authorization server an access token before reaching the backend’s protected resources. This token is passed in the “Authorization” header. The token refreshes when needed.

The client credentials **authorize KrakenD, as the client, to access the protected resources**.

Successfully setting the client credentials for a backend means that KrakenD can get the protected content. Still, the endpoint offered to the end-user will be public unless you protect it with [JWT](https://www.krakend.io/docs/enterprise/authorization/jwt-overview/) or another end-user authentication mechanism.

Does this feature generate a new token for each backend request?

**No way!** The token will be **automatically refreshed as necessary** (usually when it expires or the server is restarted).

## Configuring OAuth2 Client Credentials

To access a protected resource using client-credentials, add under every `backend` the appropriate `extra_config`.

The namespace used is `"auth/client-credentials"`. Sample configuration below:

```json
{
    "backend": [
        {
            "url_pattern": "/protected-resource",
            "extra_config": {
                "auth/client-credentials": {
                    "client_id": "YOUR-CLIENT-ID",
                    "client_secret": "YOUR-CLIENT-SECRET",
                    "token_url": "https://your.custom.identity.service.tld/token_endpoint",
                    "endpoint_params": {
                        "audience": ["YOUR-AUDIENCE"]
                    }
                }
            }
        }
    ]
}
```

The settings of this component are:

##### Fields of OAuth2 client-credentials

\* required fields

##### [`client_id`](https://www.krakend.io/docs/enterprise/authorization/client-credentials/#client_id "Click to copy link to client_id") * string

The Client ID provided to the Auth server

##### [`client_secret`](https://www.krakend.io/docs/enterprise/authorization/client-credentials/#client_secret "Click to copy link to client_secret") * string

The secret string provided to the Auth server.

Example: `"mys3cr3t"`

##### [`endpoint_params`](https://www.krakend.io/docs/enterprise/authorization/client-credentials/#endpoint_params "Click to copy link to endpoint_params") object

Any additional parameters you want to include **in the payload** when requesting the token. For instance, adding the `audience` request parameter may denote the target API for which the token should be issued.

Example: `{"audience":["YOUR-AUDIENCE"]}`

##### [`scopes`](https://www.krakend.io/docs/enterprise/authorization/client-credentials/#scopes "Click to copy link to scopes") string

A comma-separated list of scopes needed, e.g.: `scopeA,scopeB`

Example: `"scopeA,scopeB"`

##### [`token_url`](https://www.krakend.io/docs/enterprise/authorization/client-credentials/#token_url "Click to copy link to token_url") * string

The endpoint URL where the negotiation of the token happens

Example: `"https://your.custom.identity.service.tld/token_endpoint"`

Schema: [https://www.krakend.io/schema/v3.0/auth/client-credentials.json](https://www.krakend.io/schema/v3.0/auth/client-credentials.json "JSON schema definition")

## Token Refresh

When you add the client credentials component in a backend, when the first request comes in, KrakenD will send a request to the identity server asking for a new token using the `client_id` and `client_secret` provided in the configuration before reaching the backend. You will see the associated error log if the token exchange URL or credentials fail. For instance:

```
KRAKEND ERROR: [ENDPOINT: GET /test] Post "http://localhost:8080/test": oauth2: "invalid_client" "Bad client credentials"
```

If the token exchange succeeds, KrakenD stores the token in memory, which will be reused in future requests. The `expires_in` parameter in the response from an identity provider typically denotes **for how many seconds a token is valid before it expires** (as specified in the [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)).

KrakenD keeps the obtained token in the cache for the remaining time, updating it 10 seconds before its expiration, and won’t request a new one during this window. However, the specific scenario of a `0` value is worth mentioning:

Zero value of `expires_in`

When an identity provider returns an `expires_in=0`, or **does not return the field**, KrakenD treats such a token as a **“never expire”** token: the token is considered valid indefinitely and reused forever (or until the service is restarted).

While this offers more straightforward handling and reduces token renewal overhead, it is essential to consider the security implications of using non-expirable tokens, and is strongly recommended to always set a positive `expires_in`.

## Auth0 integration

The following example demonstrates a complete configuration to fulfill the requirements of [Auth0](https://auth0.com/). It is essentially the same configuration we have shown above, but with some additions, explained after the code:

```json
{
    "endpoint": "/endpoint",
    "backend": [{
        "url_pattern": "/backend",
        "extra_config": {
            "auth/client-credentials": {
                "client_id": "YOUR-CLIENT-ID",
                "client_secret": "YOUR-CLIENT-SECRET",
                "token_url": "https://custom.auth0.tld/token_endpoint",
                "endpoint_params": {
                    "client_id": ["YOUR-CLIENT-ID"],
                    "client_secret": ["YOUR-CLIENT-SECRET"],
                    "audience": ["YOUR-AUDIENCE"]
                }
            },
            "modifier/martian": {
                "fifo.Group": {
                    "scope": ["request", "response"],
                    "aggregateErrors": false,
                    "modifiers": [
                        {
                            "header.Modifier": {
                                "scope": ["request"],
                                "name" : "Accept",
                                "value" : "application/json"
                            }
                        }
                    ]
                }
            }
        }
    }]
}
```

The code above works with Auth0. The difference with the basic example is the way both the id and the secret are passed as `endpoint_params`, as auth0 ignores the auth header and expects the credentials sent as JSON data or form body.
