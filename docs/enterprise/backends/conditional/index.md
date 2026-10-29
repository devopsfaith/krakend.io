# Conditional Routing

> Conditional Routing in KrakenD enables dynamic backend selection based on request headers, JWT claims, or custom policies—perfect for AB testing, feature flags, AI/LLM orchestration, and multi-tenant APIs. Seamlessly route requests using flexible rules without triggering errors or relying on Security Policies. Supports fallback logic, header evaluation, and integration with workflows, making it ideal for advanced, production-ready API scenarios.

Source: https://www.krakend.io/docs/enterprise/backends/conditional/

The **Conditional Routing** feature enables **dynamic backend or multi-backend selection** based on request headers (including propagated JWT claims) or custom policy expressions. This functionality enhances flexibility and operational control for complex routing scenarios, including AI/LLM integrations, feature flags, and multi-tenant APIs, among others, without requiring the use of [Security Policies](https://www.krakend.io/docs/enterprise/security-policies/) or raising errors in the log.

![Conditional Routing diagram](https://www.krakend.io/images/documentation/diagrams/conditional-routing.mmd.svg)

The functionality **checks if a specific rule is met before executing a backend**, and if it is not, it is skipped from the list. The rules can have any nature, whether they are mutually exclusive within the backend set or complementary to each other. In addition, you can define a special type of **fallback backend** that evaluates only when **ALL rules fail**.

The Conditional Routing plays well with the [Sequential Proxy](https://www.krakend.io/docs/enterprise/endpoints/sequential-proxy/) and the [Workflows](https://www.krakend.io/docs/enterprise/endpoints/workflows/), so you can evaluate the response of a previous request and decide whether to execute a backend or not. You can also add backends that do not use Conditional Routing and are always executed.

## Configuration of the Conditional Routing

To set a `backend` as conditional, you must include in its `extra_config` the namespace `backend/conditional` with the rules that will allow reaching its destination. Here’s a very simple example:

```json
{
  "url_pattern": "/AB-option/1",
  "extra_config": {
    "backend/conditional": {
      "strategy": "policy",
      "value": "req_headers.containsCookie('ab-test-xyz', '1')"
    }
  }
}
```

In the configuration above, when the request reaches the backend and contains a Cookie `AB-TEST-XYZ: 1`, it will be directed to `/AB-option/1`. If the condition is not met, then this backend is not executed, and the flow continues (you would probably want an alternative condition or a fallback behavior). Notice that the example above would require `input_headers: ["Cookie"]` in the endpoint so the backend has access to the Cookie values.

The configuration options are:

##### Fields of Conditional Routing

\* required fields

##### [`name`](https://www.krakend.io/docs/enterprise/backends/conditional/#name "Click to copy link to name") string

Only used with the `header` strategy. It is the name of the header you want to use for the evaluation in the [canonical format of the MIME header](https://www.krakend.io/docs/endpoints/parameter-forwarding/#case-sensitive-and-case-insensitive-parameters). **Make sure to declare the header** in the `input_headers` list of the endpoint.

Example: `"X-Test"`

##### [`strategy`](https://www.krakend.io/docs/enterprise/backends/conditional/#strategy "Click to copy link to strategy") *

Choose `header` when you want to check the value of a specific header, `policy` when you want to write a more complex logical expression, or `fallback` when the backend will execute when all the rest of conditional backends have failed to evaluate to true. Only one fallback can be defined per endpoint.

Possible values are: `"header"` , `"policy"` , `"fallback"`

##### [`value`](https://www.krakend.io/docs/enterprise/backends/conditional/#value "Click to copy link to value") string

The value according to the strategy. With the `header` strategy, this is the literal value contained in the header (case sensitive). With the `policy` strategy, the [Security Policy expression](https://www.krakend.io/docs/enterprise/security-policies/policy-language/). When using policies you can access to the variables `req` and `req_params` (a previous backend response might be in the latter), and to [advanced macros](https://www.krakend.io/docs/enterprise/security-policies/advanced-policy-macros/). Access to headers require you to add the corresponding `input_headers` in the endpoint.

Examples: `"TestA"` , `"hasHeader('X-Test') && req_params.Resp0_message == '0 items left'"`

Schema: [https://www.krakend.io/schema/v3.0/backend/conditional.json](https://www.krakend.io/schema/v3.0/backend/conditional.json "JSON schema definition")

See the different use cases below for more examples.

Best Practices

- Keep policies simple and test them thoroughly before production use to avoid unexpected 500 errors.
- Remember to use the `fallback` to provide default handling or graceful degradation when no conditions match.
- Use `input_headers` to enable headers relevant for Conditional Routing to reduce attack surface and increase performance.

## Conditional Routing based on JWT claims

If you want the Conditional Routing to access JWT tokens, make sure to [propagate claims as headers](https://www.krakend.io/docs/authorization/jwt-validation/#propagate-jwt-claims-as-request-headers) and add them to the `input_headers` list of the endpoint.

Once this is done, you can access the claim values using their propagated header names.

## Fallback backend, no-routing, and non-conditionals

Depending on the configuration rules you use, when you don’t use a `fallback` conditional, it might happen that none of the backends are suitable to retrieve their content. In that case, the endpoint would return a `500` error as there is no possible response.

Use the `fallback` strategy to define a backend when none of the other rules have worked, being your go-to solution for impossible evaluations.

In addition, if you add backends that do not have any Conditional Routing, they are always executed (unless you add other policies preventing it). If you mix non-conditional with conditional routing, the `fallback` strategy applies when the conditionals evaluate all to `false`, and the non-conditionals are not taken into account.

## AB Testing and Feature Flags using Conditional Routing

The AB testing and Feature Flags enablement is one of the many possible use cases. You can use information in a request, like setting a header for the AB Test, a Cookie, or choosing a route based on who the user is (JWT) or even the current time.

Whether it’s AB testing or Feature Flags, you might have server-side functionality that flags a user (e.g., introducing a variant as a JWT claim), or client-side functionality like an SDK that sets a header for a specific variant. In any of the cases, you can use a rule to send users to a different backend, or treat the same backend differently (e.g., use the same backend but change the logging behavior)

Here’s a simple configuration for an AB test that reads the content of the `X-AB-TEST` headers to route:

```json
{
  "endpoint": "/AB-TESTING",
  "input_headers": [
    "X-Ab-Test"
  ],
  "backend": [
    {
      "url_pattern": "/AB-option/A",
      "extra_config": {
        "backend/conditional": {
          "strategy": "header",
          "name": "X-Ab-Test",
          "value": "A"
        }
      }
    },
    {
      "url_pattern": "/AB-option/B",
      "extra_config": {
        "backend/conditional": {
          "strategy": "header",
          "name": "X-Ab-Test",
          "value": "B"
        }
      }
    },
    {
      "url_pattern": "/default",
      "extra_config": {
        "backend/conditional": {
          "strategy": "fallback"
        }
      }
    }
  ]
}
```

Notice that this approach is similar to the one offered by the [Dynamic Routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/) but Dynamic does not offer the fallback option:

```json
{
  "@comment": "Dynamic routing alternative with no fallback possible",
  "host": ["http://host.example.com"],
  "url_pattern": "/AB-option/{input_headers.X-Ab-Test}",
  "disable_host_sanitize": true
}
```

In the case above, you would need an additional Security Policy to avoid errors when the header is not present.

## AI/LLM Routing

The conditional backend is particularly vital for scalable AI/LLM service orchestration and complex multi-backend routing where simple static backend assignments are insufficient. It integrates safely and predictably within KrakenD’s existing configuration schema and operational model.

For example, routing requests based on an X-Test header value allows targeting different AI model versions, while a policy checking hasHeader(‘X-Engine’) can gate experimental logic, complemented by fallback logic for any unmatched requests.

## Quota Routing

You can use the conditional backend fallback strategy with the [Governance quota](https://www.krakend.io/docs/enterprise/governance/quota/) by adding a quota check to the conditional backend policy. KrakenD then routes to the fallback backend once the quota runs out.

The quota macro format is: `quotaProcessor(PROCESSOR_NAME).check(TIER_VALUE_AS, TIER_VALUE, KEY)`. The `TIER_VALUE_AS` argument is optional — when you pass only two arguments to `check`, it defaults to `literal`.

For example, the following configuration routes requests to a premium backend while quota remains and falls back to the fallback backend when it runs out:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "name": "KrakenD Enterprise API Gateway",
  "port": 8080,
  "echo_endpoint": true,
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "shared_redis_pool",
          "address": "localhost:6379"
        }
      ]
    },
    "governance/processors": {
      "quotas": [
        {
          "name": "public_plans",
          "connection_name": "shared_redis_pool",
          "hash_keys": true,
          "on_failure_allow": false,
          "rejecter_cache": {
            "N": 10000000,
            "P": 1e-8
          },
          "rules": [
            {
              "name": "rule_gold",
              "limits": [
                { "amount": 20, "unit": "hour" },
                { "amount": 200, "unit": "day" }
              ]
            }
          ]
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/test",
      "input_headers": ["X-User-Id","X-Level"],
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__echo/gold",
          "extra_config": {
            "backend/conditional": {
              "strategy": "policy",
              "value": "hasHeader('X-Level') && hasHeader('X-User-Id') && getHeader('X-Level') == 'gold' && quotaProcessor('public_plans').check('literal', 'gold', getHeader('X-User-Id'))"
            },
            "governance/quota": {
              "quota_name": "public_plans",
              "tier_key": "X-Level",
              "tiers": [
                {
                  "rule_name": "rule_gold",
                  "tier_value": "gold",
                  "tier_value_as": "literal",
                  "strategy": "header",
                  "key": "X-User-Id"
                }
              ]
            }
          }
        },
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__echo/fallback",
          "extra_config": {
            "backend/conditional": {
              "strategy": "fallback"
            }
          }
        }
      ]
    }
  ]
}
```

The configuration defines a `public_plans` quota processor backed by Redis, with a `rule_gold` rule capping gold-tier users at 20 requests per hour and 200 per day. The `/test` endpoint routes to `/__echo/gold` when both the `X-Level: gold` header and the `X-User-Id` header are present and the user still has remaining quota. When any of those conditions fail — including quota exhaustion — KrakenD routes the request to the `/__echo/fallback` backend instead. This configuration uses the echo endpoint for demonstration purposes.

## Geographic Routing

Distribute requests to groups of backends based on request attributes like geographic headers or custom expressions. For instance, by enabling the [GeoIP plugin](https://www.krakend.io/docs/enterprise/endpoints/geoip/), you can change the backend datacenter depending on the origin of the request.

```json
{
  "endpoint": "/foo",
  "backend": [
    {
      "url_pattern": "/bar",
      "host":["europe.example.com"],
      "extra_config": {
        "backend/conditional": {
          "strategy": "policy",
          "value": "geoIP().RepresentedCountry.IsInEuropeanUnion"
        }
      }
    },
    {
      "url_pattern": "/bar",
      "host":["us.example.com"],
      "extra_config": {
        "backend/conditional": {
          "strategy": "fallback"
        }
      }
    }
  ]
}
```

Another useful policy in this example could be `geoIP().Country.IsoCode in ["US","UK","AU"]`

## Differences with similar functionality

A [Security Policy](https://www.krakend.io/docs/enterprise/security-policies/) or a [CEL expression](https://www.krakend.io/docs/enterprise/endpoints/common-expression-language-cel/) can abort the execution of an endpoint or the backend, and they allow you to set custom policies to do so. These two components have the mission to protect content from a security point of view. When the rule is met, the execution raises an error and stops.

On the other side, the Conditional Routing treats it as a “normal behavior” when a condition is not met and the backend is skipped, without raising an error in the other functionality. The Conditional Routing assimilates the rule into the regular flow of your application, not as an exception.

Another close functionality is the [Dynamic Routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/), which dynamically defines the host or URL. Still, here you choose a completely different set of backend definitions according to rules, not values.
