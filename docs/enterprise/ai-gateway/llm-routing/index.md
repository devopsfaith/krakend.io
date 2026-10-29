# LLM Routing

> Simplify multi-LLM integration by exposing a single, consistent API through KrakenD’s unified LLM interface.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/

KrakenD’s AI Proxy and LLM routing feature enables you to distribute AI requests across one or multiple Large Language Model providers or instances.

LLM Routing on KrakenD supports both single-provider and multi-provider. You can configure endpoints that can connect to a specific LLM model, or based on policies, change the model on the fly, or they even make simultaneous requests to different providers to aggregate their responses.

To implement single or multi-LLM routing in KrakenD, like dynamically selecting between different Large Language Model (LLM) providers like OpenAI, Mistral, Anthropic, or custom models, there are several clean, scalable strategies depending on how you want to choose the provider:

- Just proxy to the AI vendor
- Conditional routing
- Header-based routing
- JWT claim-based routing
- Path-based routing
- Other non-standard routing logic

To pick a provider from the [provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#llm-provider-inventory) on every request, using gates, an external classifier, and failover, see the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/).

## AI Proxy

Not a recommended option, but in case you want to couple your application to the LLM vendor, and let the user to use directly the LLM vendor API with no transformation or adaptation on KrakenD, you can treat the provider as a regular `no-op` backend with no specific AI configuration. In addition to the proxying, you might want to hide the authentication part on KrakenD, and for that you can use [Martian headers](https://www.krakend.io/docs/enterprise/backends/martian/).

The following example is a direct consumption of OpenAI API through KrakenD with no modification other than doing the auto-authentication (caution, this endpoint would be public as there is no auth validation):

```json
{
  "endpoint": "/chat",
  "output_encoding": "no-op",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://api.openai.com"
      ],
      "url_pattern": "/v1/chat/completions",
      "encoding": "no-op",
      "extra_config": {
        "modifier/martian": {
          "header.Modifier": {
            "scope": [
              "request"
            ],
            "name": "Authorization",
            "value": "Bearer YOUR_OPENI_API_KEY"
          }
        }
      }
    }
  ]
}
```

## Conditional Routing

The [Conditional Routing](https://www.krakend.io/docs/enterprise/backends/conditional/) allows you to set simple or complex policies defining which backend should the gateway hit and fallback to an alternative when policies do not evaluate to true.

The idea is that you define multiple backends on a single endpoint, and set the policies that will satisfy the usage of a specific backend. If your policies are not mutually exclusive, you can connect to multiple LLMs too.

The **optional** `fallback` option allows you to connect to a default backend when the rest of the conditions failed.

Here’s a practical example of conditional routing, that based on a request header `X-Model` decides whether to get content from Gemini, OpenAI, or fallback to Anthropic for any other case:

```json
{
  "endpoint": "/llm",
  "input_headers": [
    "X-Model"
  ],
  "backend": [
    {
      "host": [
        "https://generativelanguage.googleapis.com"
      ],
      "url_pattern": "/v1beta/models/gemini-2.5-flash:generateContent",
      "method": "POST",
      "extra_config": {
        "backend/conditional": {
          "strategy": "header",
          "name": "X-Model",
          "value": "gemini"
        },
        "ai/llm": {
          "gemini": {
            "v1beta": {
              "credentials": "XXX_YYY_ZZZ",
              "debug": true,
              "variables": {
                "candidates": 3
              }
            }
          }
        }
      }
    },
    {
      "host": [
        "https://api.openai.com"
      ],
      "url_pattern": "/v1/responses",
      "method": "POST",
      "extra_config": {
        "backend/conditional": {
          "strategy": "header",
          "name": "X-Model",
          "value": "openai"
        },
        "ai/llm": {
          "openai": {
            "v1": {
              "credentials": "xx-yy-zz",
              "debug": false,
              "variables": {
                "model": "gpt-5-nano"
              }
            }
          }
        }
      }
    },
    {
      "url_pattern": "/v1/messages",
      "host": [
        "https://api.anthropic.com"
      ],
      "extra_config": {
        "backend/conditional": {
          "strategy": "fallback"
        },
        "ai/llm": {
          "anthropic": {
            "v1": {
              "credentials": "xxxxx",
              "debug": false,
              "variables": {
                "model": "claude-3-7-sonnet-latest"
              }
            }
          }
        }
      }
    }
  ]
}
```

For more information on how to do conditions, including writing custom policies (the example only checks literals on headers), see the [Conditional Routing documentation](https://www.krakend.io/docs/enterprise/backends/conditional/)

With the example above (and setting your credentials in the config) you could interact with the three different models like this:

Routing to the right LLM 

```
$curl -XPOST -H'X-Model' --json '{"instructions": "Act as a 1000 dollar consultant", "input": "Tell me a consultant joke"}' http://localhost:8080/llm
```

### Header-based LLM routing

While this can be done with the Conditional Routing too, you can use [Dynamic Routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/) as another approach to allow end-users set a specific header with the desired model to use, and from here, the gateway chooses the route. For instance, say you want to integrate with two providers and let the consumer of the API Gateway decide which one to use based on a header:

![ai-gateway-proxy-header.mmd diagram](https://www.krakend.io/images/documentation/diagrams/ai-gateway-proxy-header.mmd.svg)

The consumer would send a request like this:

```
POST /multi-llm
X-LLM: openai
```

And the gateway uses the header’s value to route to the appropriate backend.

### JWT claim-based LLM routing

Similarly to header routing, you can use data in claims to route to the proper LLM. For instance, when you issue a JWT token, you could add a claim that specifies what LLM to use based on role, business policies, etc.

As opposed to header-based routing, this method is transparent to the user, who does not have any control over the model used, because it is enforced by a policy in the Identity Provider.

It would work with the same configuration you use in the header-based routing, only that you use the JWT instead:

```json
{
  "url_pattern": "/_llm/{jwt.preferred_ai_model}"
}
```

Another more sophisticated way of JWT routing, would be using a policy. As the policies do not have direct access to JWT data, you need to propagate the desired claims as headers and then apply the policy.

For instance, notice the `propagate_claims` that is later used on the `backend/conditional`’s policy:

```json
{
      "endpoint": "/jwt-routing-policy",
      "method": "POST",
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "https://some-domain.example.com/.well-known/jwks.json",
          "cache": true,
          "@comment": "Take the claim ai_model from the JWT and send it as header.",
          "propagate_claims": [
            [ "ai_model", "X-Ai-Model" ],
            [ "ai_enable", "X-Ai-Enable" ]
          ]
        }
      },
      "input_headers": [
        "X-Ai-Model"
      ],
      "backend": [
        {
          "method": "POST",
          "host": ["https://api.openai.com"],
          "url_pattern": "/v1/responses",
          "extra_config": {
            "backend/conditional": {
              "strategy": "policy",
              "value": "req_header('X-Ai-Model') == 'openai' && req_header('X-Ai-Enable') == 'yes'"
            },
            "ai/llm": {
              "openai": {
                "credentials": "xxxx",
                "version": "v1",
                "debug": false,
                "variables": {
                  "model": "gpt-5-nano"
                }
              }
            }
          }
        },
        {
          "url_pattern": "/condition-B-non-AI",
          "host": ["http://localhost:8080"],
          "method": "POST",
          "extra_config": {
            "backend/conditional": {
              "strategy": "fallback"
            }
          }
        }
      ]
    }
```

### Path-based LLM routing

This type of routing is delegated to the end-user, and is the simplest way of routing because you directly declare the endpoints you want to use, e.g.:

- `/llm/openai`
- `/llm/mistral`

Then the user calls one endpoint or the other, and the API offers one endpoint per provider.
