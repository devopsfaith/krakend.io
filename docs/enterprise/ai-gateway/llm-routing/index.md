# LLM Routing Strategies

> Choose how KrakenD routes AI traffic, from the AI Router and per-provider endpoints to vendor passthrough, multi-LLM aggregation, and conditional backends.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/

**LLM routing** decides which Large Language Model (LLM) serves each request that reaches your AI endpoints. In KrakenD, the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/) covers the most common case: it picks one provider from the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) on every request, based on headers, policies, JWT claims, or a classifier, with failover when a provider fails. Other needs, such as giving clients the vendor’s own API, asking several models at once, or mixing AI and non-AI backends, use other KrakenD features described on this page. Choosing the right strategy keeps model selection under your control instead of the client’s.

## Choosing a Routing Strategy

Pick the strategy that matches what you need:

| You need to                                                                                            | Use                                                                                             |
|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Choose one provider per request from headers, JWT claims, CEL policies, or a classifier, with failover | [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#routing-with-the-ai-router)                |
| Offer a fixed provider on each endpoint, such as `/llm/openai` and `/llm/anthropic`                    | [One endpoint per provider](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#one-endpoint-per-provider) |
| Let clients use the vendor’s own API, for example through its SDK                                      | [Vendor-native passthrough](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#vendor-native-passthrough) |
| Ask several LLMs at once and return all the answers                                                    | [Multi-LLM aggregation](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#multi-llm-aggregation)         |
| Send some requests to an LLM and the rest to a regular backend                                         | [Conditional routing](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#mixing-llm-and-non-llm-backends) |

## Routing with the AI Router

The [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/) evaluates an ordered list of routes in the `ai/router` namespace of a backend, and each route sends the request to a provider of the inventory when its **gates** pass. Clients call a single endpoint and never choose the model.

Route on values the client cannot forge. A JWT claim is a good example: the following configuration validates the token, [propagates](https://www.krakend.io/docs/enterprise/authorization/jwt-validation/#propagate-jwt-claims-as-request-headers) its `plan` claim as the `X-Plan` header, and sends `premium` users to a larger model:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "small",
          "provider": "openai",
          "model": "gpt-5-nano",
          "credentials": "xxx"
        },
        {
          "name": "large",
          "provider": "anthropic",
          "model": "claude-sonnet-4-6",
          "credentials": "xxx"
        }
      ]
    },
    "ai/classifiers": {
      "gates": [
        {
          "name": "plan_premium",
          "rule": "header",
          "header": {
            "name": "X-Plan",
            "value": "premium"
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/chat",
      "method": "POST",
      "input_headers": ["X-Plan"],
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "https://idp.example.com/.well-known/jwks.json",
          "cache": true,
          "propagate_claims": [
            ["plan", "X-Plan"]
          ]
        }
      },
      "backend": [
        {
          "extra_config": {
            "ai/router": {
              "routes": [
                {
                  "provider": "large",
                  "gates": ["plan_premium"]
                },
                {
                  "provider": "small"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

Users whose token carries `"plan": "premium"` reach the `large` provider, and everyone else falls through to `small`. Because the identity provider issues the claim and KrakenD sets the header from the validated token, users cannot pick the model themselves. The [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/) page covers policy gates, nested decision trees, classifiers, and failover.

## One Endpoint per Provider

The simplest strategy declares one endpoint for each provider and lets the client choose by calling one or the other. With the `small` and `large` providers of the previous example, each endpoint has a backend that references its provider:

```json
{
  "endpoints": [
    {
      "endpoint": "/llm/openai",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "small"
            }
          }
        }
      ]
    },
    {
      "endpoint": "/llm/anthropic",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "large"
            }
          }
        }
      ]
    }
  ]
}
```

Both endpoints accept the same [unified request format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format), so switching vendors is a matter of changing the path. Use it when the client legitimately decides the model, for example in an internal tool, and protect each endpoint with its own authorization or [quota](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) when the costs differ.

## Vendor-Native Passthrough

Some clients need the vendor’s own API, for instance an official SDK or a coding agent that uses features beyond a prompt, such as tools or file uploads. In that case, proxy the vendor API without any AI processing, using the [`no-op` encoding](https://www.krakend.io/docs/enterprise/endpoints/no-op/), and keep the API key on the gateway with a [Martian header modifier](https://www.krakend.io/docs/enterprise/backends/martian/#header-modifier):

```json
{
  "endpoint": "/v1/responses",
  "method": "POST",
  "output_encoding": "no-op",
  "extra_config": {
    "auth/validator": {
      "alg": "RS256",
      "jwk_url": "https://idp.example.com/.well-known/jwks.json",
      "cache": true
    }
  },
  "backend": [
    {
      "host": ["https://api.openai.com"],
      "url_pattern": "/v1/responses",
      "encoding": "no-op",
      "extra_config": {
        "modifier/martian": {
          "header.Modifier": {
            "scope": ["request"],
            "name": "Authorization",
            "value": "Bearer YOUR_OPENAI_API_KEY"
          }
        }
      }
    }
  ]
}
```

Clients point their OpenAI SDK at KrakenD and authenticate with their own JWT, while only the gateway knows the OpenAI key. KrakenD forwards the payload as is, so you lose what the `ai/llm` component adds: the payload stays under the client’s control, the response keeps the vendor format, and KrakenD does not report token metrics.

When your clients only need chat and streaming, consider the [`format` option of LLM streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/#normalizing-the-output-format-with-format) instead. It accepts requests in the OpenAI or Anthropic format and serves them from any vendor, keeping the token metrics and the provider inventory.

## Multi-LLM Aggregation

To ask several models the same question in a single call, add one backend per provider to the endpoint. KrakenD calls them in parallel and merges their responses, and the [`group`](https://www.krakend.io/docs/enterprise/backends/data-manipulation/#grouping) option keeps each answer under its own key:

```json
{
  "endpoint": "/compare",
  "method": "POST",
  "backend": [
    {
      "group": "openai",
      "extra_config": {
        "ai/llm": {
          "provider": "small"
        }
      }
    },
    {
      "group": "anthropic",
      "extra_config": {
        "ai/llm": {
          "provider": "large"
        }
      }
    }
  ]
}
```

The response contains an `openai` and an `anthropic` object, each with its own `ai_gateway_response` and `usage`. Use it to compare models, or to let the client pick the best answer. Every call consumes tokens from each provider.

## Mixing LLM and Non-LLM Backends

[Conditional Routing](https://www.krakend.io/docs/enterprise/backends/conditional/) decides which backend of an endpoint runs, with header or policy conditions and a `fallback` backend. Use it when only some requests need an LLM and the rest go to a regular service. For example, premium users get an answer generated by an LLM, while everyone else gets the results of the regular search service:

```json
{
  "endpoint": "/search",
  "method": "POST",
  "input_headers": ["X-Plan"],
  "extra_config": {
    "auth/validator": {
      "alg": "RS256",
      "jwk_url": "https://idp.example.com/.well-known/jwks.json",
      "cache": true,
      "propagate_claims": [
        ["plan", "X-Plan"]
      ]
    }
  },
  "backend": [
    {
      "extra_config": {
        "backend/conditional": {
          "strategy": "policy",
          "value": "getHeader('X-Plan') == 'premium'"
        },
        "ai/llm": {
          "provider": "large"
        }
      }
    },
    {
      "host": ["http://search.example.com"],
      "url_pattern": "/search",
      "extra_config": {
        "backend/conditional": {
          "strategy": "fallback"
        }
      }
    }
  ]
}
```

The policy reads the propagated claim, which is why `X-Plan` is in the `input_headers` list. When it evaluates to `false`, the `fallback` backend serves the request. To choose among several LLMs instead of between an LLM and a regular backend, prefer the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#routing-with-the-ai-router), which adds classifiers and failover.
