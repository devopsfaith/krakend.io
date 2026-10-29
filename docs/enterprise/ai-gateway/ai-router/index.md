# AI Router for LLM Provider Selection

> Route each request to an LLM provider using named gates, an external classifier, and a failover with the ai/router and ai/classifiers namespaces.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/

The **AI Router** selects which LLM provider from your [provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#llm-provider-inventory) handles each request. It matches requests with reusable **gates** (header or policy conditions), organizes them into an ordered decision tree, and can hand the final choice to a **classifier** that picks the best provider from a candidate list. A failover takes over when a classifier or the chosen provider fails, and a final route without gates catches the requests that match no other route. Because routes reference providers by name, the client sends its request to a single endpoint and never selects a model or vendor; the router decides.

Requires the provider inventory

Routes and classifiers reference providers by `name`, so define your providers first in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#llm-provider-inventory) (`ai/providers`). The router resolves the vendor, model, endpoint, and credentials from that inventory.

## How the AI Router Works

You configure routing in two places. Gates and classifiers are shared, reusable definitions declared once at the service level under the `ai/classifiers` namespace. The routing rules that use them live in a backend’s `extra_config` under the `ai/router` namespace, in an ordered `routes` list.

For each request, KrakenD evaluates the routes from top to bottom and uses the first one that matches. A route matches when all of its gates pass; a route with no gates always matches, so you can use it as an inline fallback. When no route matches and there is no such route, the request fails: the failover does not apply to requests that match no route. When the matching route names a `provider`, the router forwards the request to that provider from the inventory. When it names a `classifier` and a list of `providers`, the classifier chooses among them. Routes can also nest, forming a decision tree: a gated route holds its own `routes`, evaluated only when its gates pass.

Route on signals the client cannot forge

Header gates match on request headers, which clients control. Route on values your gateway sets, for example a plan or tier header injected after validating an API key or JWT, so a client cannot select a more expensive model by sending a header itself.

## Defining Gates

A **gate** is a named matching condition declared under `ai/classifiers.gates`. Routes reference gates by name, and you can reuse the same gate across many routes. Each gate has a `name`, a `rule` that selects the matching mechanism (`header` or `policy`), and the configuration for that rule.

### Header Gates

A `header` gate matches when a request header equals a value. Set `header.name` and `header.value`:

```json
{
  "name": "plan_enterprise",
  "rule": "header",
  "header": {
    "name": "X-Plan",
    "value": "enterprise"
  }
}
```

The gate above matches requests that carry `X-Plan: enterprise`.

### Policy Gates

A `policy` gate matches when a CEL expression evaluates to true. Set `policy.value` to the expression, using helper functions such as `hasHeader` and `getHeader` (see the [policy built-in functions](https://www.krakend.io/docs/enterprise/security-policies/built-in-functions/)):

```json
{
  "name": "enterprise_policy",
  "rule": "policy",
  "policy": {
    "value": "getHeader('X-Plan') == 'enterprise'"
  }
}
```

Policy gates handle conditions a header match cannot express, such as comparing values or combining several checks.

## Defining Classifiers

A **classifier** delegates the provider choice to an external engine that scores the request against a set of candidate providers and returns the best fit. Declare classifiers under `ai/classifiers.classifiers`. Each has a `name`, an `engine`, and the engine’s configuration. The supported engine is `notdiamond`, which calls the [Not Diamond](https://notdiamond.ai/) [model selection endpoint](https://docs.notdiamond.ai/reference/token_model_select_v2_modelrouter_modelselect_post) to pick the best provider:

```json
{
  "name": "smart",
  "engine": "notdiamond",
  "notdiamond": {
    "credentials": "xxx",
    "req_content": "req_body.messages"
  }
}
```

The `credentials` authenticate against the Not Diamond service; set them through an environment variable. The `req_content` field selects the request content sent to the classifier, and it works exactly like the same field in the [Semantic Cache](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/#selecting-the-content-to-match). It defaults to the full `req_body`, and you can point it at any request input source:

- `req_body`: the request body. Use [dot-notation](https://www.krakend.io/docs/enterprise/endpoints/request-body-extractor/) to reach nested fields, for example `req_body.messages`.
- `req_params`: a URL path parameter. The key is capitalized, so `{id}` is exposed as `req_params.Id`.
- `req_query_string`: a query string value, for example `req_query_string.user`.
- `req_headers`: a request header, for example `req_headers.x-user`.

The `tradeoff` option tells Not Diamond whether to favor `cost` (the default) or `latency`, while `cost_quality_tradeoff` balances cost against quality with an integer. They are mutually exclusive: set one or the other, not both.

The following fields are available under the service-level `ai/classifiers` namespace:

##### Fields of AI Router Gates and Classifiers

\* required fields

##### [`classifiers`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#classifiers "Click to copy link to classifiers") array of objects

The list of classifiers available to the routes. A classifier delegates the provider choice to an external engine that scores the request against the candidate `providers` of a route and returns the best fit.

Each item of classifiers accepts the following properties:

##### [`engine`](#classifiers-engine "Click to copy link to engine") *

The external engine that chooses the provider. The `notdiamond` engine calls the Not Diamond model selection endpoint, and requires you to add its configuration under the `notdiamond` key.

Possible values are: `"notdiamond"`

##### [`name`](#classifiers-name "Click to copy link to name") * string

A unique name for this classifier. Routes reference the classifier through this value in their `classifier` field.

Example: `"smart"`

##### [`notdiamond`](#classifiers-notdiamond "Click to copy link to notdiamond") object

The configuration of the `notdiamond` engine, which calls the Not Diamond model selection endpoint to pick the best provider from the candidates of the route. Set either `tradeoff` or `cost_quality_tradeoff`, but not both.

##### [`base_url`](#notdiamond-base_url "Click to copy link to base_url") string

The base URL of the Not Diamond API. Override it only when you target a custom or proxied deployment of the service.

Example: `"https://api.example.com"`

##### [`cost_quality_tradeoff`](#notdiamond-cost_quality_tradeoff "Click to copy link to cost_quality_tradeoff") integer

An integer that balances cost against quality in the model selection. You cannot use it together with `tradeoff`.

Defaults to `0`

##### [`credentials`](#notdiamond-credentials "Click to copy link to credentials") * string

The API key that authenticates KrakenD against the Not Diamond service. Set it through an environment variable instead of writing it in the configuration file.

##### [`disable_hash_content`](#notdiamond-disable_hash_content "Click to copy link to disable_hash_content") boolean

KrakenD asks the Not Diamond API to hash the request content it receives, for extra security. Set this flag to `true` to turn that option off, and Not Diamond uses its own default of not hashing the content.

Defaults to `false`

##### [`metric`](#notdiamond-metric "Click to copy link to metric")

The metric the engine optimizes for when it chooses the provider.

Possible values are: `"accuracy"`

Defaults to `"accuracy"`

##### [`req_content`](#notdiamond-req_content "Click to copy link to req_content") string

The part of the request that KrakenD sends to the classifier. It works like the same field in the semantic cache: use `req_body` with dot-notation to reach nested fields, or `req_params`, `req_query_string`, and `req_headers`. Path parameters are capitalized, so `{id}` becomes `req_params.Id`. When you don’t set it, KrakenD sends the entire request body.

Examples: `"req_body.messages"` , `"req_params.Id"` , `"req_headers.x-user"` , `"req_query_string.user"`

##### [`tradeoff`](#notdiamond-tradeoff "Click to copy link to tradeoff")

The optimization preference of the model selection. Use `cost` to favor cheaper providers or `latency` to favor faster ones. You cannot use it together with `cost_quality_tradeoff`.

Possible values are: `"cost"` , `"latency"`

Defaults to `"cost"`

##### [`gates`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#gates "Click to copy link to gates") array of objects

The list of gates available to the routes. A gate is a named matching condition, and a route matches only when all the gates it lists pass. Header gates match on values the client controls, so route on headers your gateway sets after validating an API key or a JWT.

Each item of gates accepts the following properties:

##### [`header`](#gates-header "Click to copy link to header") object

The configuration of a `header` rule. The gate passes when the request header `name` equals `value`. Add the header to the `input_headers` of the endpoint so the router can see it.

##### [`name`](#header-name "Click to copy link to name") * string

The name of the request header you want to inspect.

Example: `"X-Plan"`

##### [`value`](#header-value "Click to copy link to value") * string

The value the header must have for the gate to pass.

Example: `"enterprise"`

##### [`name`](#gates-name "Click to copy link to name") * string

A unique name for this gate. Routes reference the gate through this value in their `gates` list.

Example: `"plan_enterprise"`

##### [`policy`](#gates-policy "Click to copy link to policy") object

The configuration of a `policy` rule. The gate passes when the CEL expression in `value` evaluates to `true`.

##### [`value`](#policy-value "Click to copy link to value") * string

The CEL expression to evaluate. You can use the built-in functions of the security policies, such as `hasHeader` and `getHeader`, to compare values or combine several checks that a header rule cannot express.

Example: `"getHeader('X-Plan') == 'enterprise'"`

##### [`rule`](#gates-rule "Click to copy link to rule") *

The mechanism the gate uses to match the request. Use `header` to compare a request header with a value, or `policy` to evaluate a CEL expression. Each rule requires its configuration under the key with the same name.

Possible values are: `"header"` , `"policy"`

Schema: [https://www.krakend.io/schema/v3.0/ai/classifiers.json](https://www.krakend.io/schema/v3.0/ai/classifiers.json "JSON schema definition")

## Routing Requests

Add the `ai/router` namespace to a backend’s `extra_config`. It holds an ordered `routes` list and an optional `failover` provider.

### Matching with Gates

Each route lists the `gates` it requires, and matches only when all of them pass. A route with no `gates` always matches, so place it last as an inline fallback. A matching route forwards the request to its `provider`:

```json
{
  "ai/router": {
    "routes": [
      {
        "provider": "coding-basic",
        "gates": ["plan_pro"]
      },
      {
        "provider": "cheap-quick"
      }
    ]
  }
}
```

Pro-plan requests go to `coding-basic`; every other request falls through to `cheap-quick`.

### Nested Routes and Decision Trees

The `routes` field is recursive. A gated route can hold its own `routes`, evaluated only when its gates pass, and those can nest further to any depth, forming a decision tree. A route that only groups other routes needs no `provider`; the matching leaf route selects it:

```json
{
  "ai/router": {
    "routes": [
      {
        "gates": ["plan_enterprise"],
        "routes": [
          {
            "provider": "coding-team",
            "gates": ["usecase_code"]
          },
          {
            "provider": "gemini-flash"
          }
        ]
      },
      {
        "provider": "cheap-quick"
      }
    ]
  }
}
```

Enterprise-plan requests enter the branch and route to `coding-team` for code tasks (gate `usecase_code`), or to the branch fallback `gemini-flash`. Any other plan skips the branch and hits the top-level fallback `cheap-quick`.

### Classifier Routes

Instead of a single `provider`, a route can name a `classifier` and a list of candidate `providers`. The classifier chooses the best provider for each request from that list. A route cannot set both `provider` and `classifier`:

```json
{
  "ai/router": {
    "failover": "gpt-default",
    "routes": [
      {
        "gates": ["enterprise_policy"],
        "classifier": "smart",
        "providers": [
          "cheap-quick",
          "gemini-flash",
          "coding-basic"
        ],
        "failover": "coding-basic"
      },
      {
        "provider": "cheap-quick"
      }
    ]
  }
}
```

Enterprise requests are handed to the `smart` classifier, which picks among `cheap-quick`, `gemini-flash`, and `coding-basic`. If the classifier cannot return a choice, or the provider it picked fails, the route’s own `failover` sends the request to `coding-basic`. Every other request falls through to `cheap-quick`, the final route without gates; if `cheap-quick` fails, the router-level `failover` sends the request to `gpt-default`.

### Failover and Fallback

The router has two different safety nets.

**Failover** handles errors. It names the provider that serves the request when a classifier cannot return a choice, or when the provider a route chose fails (an error response from the provider). You can set it at two levels:

- **Route failover**: a `failover` inside a route covers that route. On a route with a `provider`, it serves the request when that provider fails. On a route with a `classifier`, it serves the request when the classifier cannot return a choice or the provider it chose fails. It takes precedence over the router-level failover.
- **Router failover**: the `failover` next to `routes` covers every route that sets no failover of its own, whether it names a `provider` or a `classifier`.

**Fallback** handles requests that match no route. Place a route without `gates` and without `classifier` last in `routes`: it always matches, so it catches every request the routes above it do not. The failover does not apply to requests that match no route. Without a fallback route, such a request fails with an error.

| Situation                                        | Who serves the request                                        |
|--------------------------------------------------|---------------------------------------------------------------|
| A route matches and its provider answers         | That provider                                                 |
| The classifier of a route cannot return a choice | The route failover, or else the router failover               |
| The provider a route chose fails                 | The route failover, or else the router failover               |
| No route matches                                 | The final route without gates; without one, the request fails |

The following fields are available under the backend-level `ai/router` namespace:

##### Fields of AI Router

\* required fields

##### [`failover`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#failover "Click to copy link to failover") string

The name of the provider in the `ai/providers` inventory that handles the request when a classifier cannot return a choice, or when the provider a route chose fails, and that route sets no `failover` of its own. It does not apply to requests that match no route: place a route without `gates` last in `routes` for those.

Example: `"gpt-default"`

##### [`routes`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#routes "Click to copy link to routes") * array

The ordered list of routes. KrakenD evaluates them from top to bottom and uses the first one that matches. A route without `gates` always matches, so place it last as the fallback for requests that match no other route; without it, such a request fails, even with a `failover`.

Schema: [https://www.krakend.io/schema/v3.0/ai/router.json](https://www.krakend.io/schema/v3.0/ai/router.json "JSON schema definition")

Each object in the `routes` list accepts the following fields:

##### Fields of Route

\* required fields

##### [`classifier`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#classifier "Click to copy link to classifier") string

The name of a classifier declared in `ai/classifiers` that chooses the best provider from the `providers` list. You cannot use it together with `provider`.

Example: `"smart"`

##### [`failover`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#failover "Click to copy link to failover") string

The provider to use when this route fails. A route fails when its provider returns an error or its classifier cannot pick one. It overrides the router-level `failover`. You cannot use it with `routes`.

Example: `"gpt-default"`

##### [`gates`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#gates "Click to copy link to gates") array of strings

The names of the gates declared in `ai/classifiers` that must all pass for the route to match. Omit it to create a route that always matches.

Example: `["plan_enterprise","usecase_code"]`

##### [`provider`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#provider "Click to copy link to provider") string

The name of the provider in the `ai/providers` inventory that handles the request when the route matches. You cannot use it together with `classifier`.

Example: `"cheap-quick"`

##### [`providers`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#providers "Click to copy link to providers") array of strings

The names of the providers in the `ai/providers` inventory that the `classifier` chooses from. It requires a `classifier`.

Example: `["cheap-quick","gemini-flash","coding-basic"]`

##### [`routes`](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/#routes "Click to copy link to routes") array

The ordered list of routes that KrakenD evaluates only when the gates of this route pass. Nested routes can go to any depth, forming a decision tree, and a route that only groups other routes needs no `provider`.

Schema: [https://www.krakend.io/schema/v3.0/ai/router.json](https://www.krakend.io/schema/v3.0/ai/router.json "JSON schema definition")

## Configuration Example

The following configuration defines the providers, gates, and a classifier once at the service level, then uses them across two backends. The first backend routes by plan and use case with a decision tree; the second delegates the choice to the classifier and sets a failover:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "cheap-quick",
          "provider": "openai",
          "model": "gpt-4o-mini",
          "credentials": "xxx"
        },
        {
          "name": "gpt-default",
          "provider": "openai",
          "credentials": "xxx"
        },
        {
          "name": "gemini-flash",
          "provider": "gemini",
          "model": "gemini-2.5-flash",
          "credentials": "xxx"
        },
        {
          "name": "coding-basic",
          "provider": "anthropic",
          "model": "claude-haiku-4-5",
          "credentials": "xxx"
        },
        {
          "name": "coding-team",
          "provider": "anthropic",
          "model": "claude-sonnet-4-6",
          "credentials": "xxx"
        }
      ]
    },
    "ai/classifiers": {
      "gates": [
        {
          "name": "plan_enterprise",
          "rule": "header",
          "header": {
            "name": "X-Plan",
            "value": "enterprise"
          }
        },
        {
          "name": "plan_pro",
          "rule": "header",
          "header": {
            "name": "X-Plan",
            "value": "pro"
          }
        },
        {
          "name": "usecase_code",
          "rule": "header",
          "header": {
            "name": "X-Use-Case",
            "value": "code"
          }
        },
        {
          "name": "enterprise_policy",
          "rule": "policy",
          "policy": {
            "value": "getHeader('X-Plan') == 'enterprise'"
          }
        }
      ],
      "classifiers": [
        {
          "name": "smart",
          "engine": "notdiamond",
          "notdiamond": {
            "credentials": "xxx",
            "req_content": "req_body.messages"
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/v1/chat",
      "method": "POST",
      "input_headers": [
        "X-Plan",
        "X-Use-Case"
      ],
      "backend": [
        {
          "extra_config": {
            "ai/router": {
              "routes": [
                {
                  "gates": ["plan_enterprise"],
                  "routes": [
                    {
                      "provider": "coding-team",
                      "gates": ["usecase_code"]
                    },
                    {
                      "provider": "gemini-flash"
                    }
                  ]
                },
                {
                  "provider": "coding-basic",
                  "gates": ["plan_pro"]
                },
                {
                  "provider": "cheap-quick"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "endpoint": "/v1/route",
      "method": "POST",
      "input_headers": [
        "*"
      ],
      "backend": [
        {
          "extra_config": {
            "ai/router": {
              "failover": "gpt-default",
              "routes": [
                {
                  "gates": ["enterprise_policy"],
                  "classifier": "smart",
                  "providers": [
                    "cheap-quick",
                    "gemini-flash",
                    "coding-basic"
                  ]
                },
                {
                  "provider": "cheap-quick"
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

On the `/v1/chat` endpoint, enterprise-plan requests enter the nested branch and route to `coding-team` for code tasks or to `gemini-flash` otherwise, pro-plan requests go to `coding-basic`, and any other request falls through to `cheap-quick`. On the `/v1/route` endpoint, enterprise requests are classified by `smart` across three candidate providers; when `smart` cannot decide or the provider it picked fails, `gpt-default` serves them as the failover. Any other request falls through to `cheap-quick`, the final route without gates, and `gpt-default` also takes over if `cheap-quick` fails.

The AI Router is the inventory-based way to choose a provider per request. For the other routing strategies, such as conditional or path-based routing, see [LLM Routing](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/).
