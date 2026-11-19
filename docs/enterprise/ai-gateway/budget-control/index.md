# LLM Token Budgets with Quotas

> Enforce LLM token budgets per user, plan, or tenant with KrakenD quotas that count the tokens of every response, including streamed ones.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/

A **token budget** caps how many LLM tokens a user, plan, or tenant can consume in a period of time, such as 100,000 tokens per day. KrakenD enforces it with the [Quota](https://www.krakend.io/docs/enterprise/governance/quota/) component: instead of counting one hit per request, the quota reads the number of tokens from each LLM response and adds it to a persistent counter in Redis. Use it to contain the spend of your AI endpoints, to sell plans with different allowances, or to share a vendor contract between teams. Because the counter lives in Redis, the budget holds across every KrakenD instance of your cluster.

## How Token Budgets Work

A token budget combines three pieces of the quota configuration:

1. A Redis connection pool, where KrakenD stores the counters.
2. A quota **processor** under `governance/processors`, with one rule per plan and the token limits of each rule, per hour, day, week, month, or year.
3. A `governance/quota` attached to the endpoint, which identifies the user and the plan of each request and reads the tokens from the response with `weight_strategy` set to `body` and `weight_key` pointing to the token count.

Before calling the LLM, KrakenD checks the counter of the user. When the counter has reached a limit, the client gets a `429` status code with a `Retry-After` header, and the LLM is not called. Otherwise, KrakenD calls the LLM and, once the response arrives, adds its tokens to the counter. A call that starts under the limit always completes, even when its tokens take the counter above the limit; the next call of that user is the one rejected.

## Token Budget for LLM Responses

The [unified response](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#response-format) of the `ai/llm` component carries the total tokens of the call in its `usage` field, whatever the vendor or provider behind the endpoint. Point `weight_key` to `usage` to count them. The quota reads the value although it is a string.

The following configuration gives `pro` users 500,000 tokens per day and everyone else 50,000. The JWT carries the plan and the user identifier, which KrakenD propagates as headers for the quota to read:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
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
          "name": "llm_tokens",
          "connection_name": "shared_redis_pool",
          "hash_keys": true,
          "rules": [
            {
              "name": "pro",
              "limits": [
                { "amount": 500000, "unit": "day" }
              ]
            },
            {
              "name": "free",
              "limits": [
                { "amount": 50000, "unit": "day" }
              ]
            }
          ]
        }
      ]
    },
    "ai/providers": {
      "providers": [
        {
          "name": "chat",
          "provider": "openai",
          "model": "gpt-5-nano",
          "credentials": "xxx"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/chat",
      "method": "POST",
      "input_headers": ["X-Plan", "X-User"],
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "https://idp.example.com/.well-known/jwks.json",
          "cache": true,
          "propagate_claims": [
            ["plan", "X-Plan"],
            ["sub", "X-User"]
          ]
        },
        "governance/quota": {
          "quota_name": "llm_tokens",
          "weight_strategy": "body",
          "weight_key": "usage",
          "tier_key": "X-Plan",
          "on_unmatched_tier_allow": false,
          "tiers": [
            {
              "rule_name": "pro",
              "tier_value": "pro",
              "tier_value_as": "literal",
              "strategy": "header",
              "key": "X-User"
            },
            {
              "rule_name": "free",
              "tier_value_as": "*",
              "strategy": "header",
              "key": "X-User"
            }
          ]
        }
      },
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "chat"
            }
          }
        }
      ]
    }
  ]
}
```

The `tier_key` reads the plan from the `X-Plan` header, and each tier counts the tokens of every user separately through the `X-User` header. Users whose plan is not `pro` fall into the `free` tier, marked with `*`. Clients call the endpoint as usual:

Call the endpoint with a user token 

```
$curl -i -XPOST -H'Authorization: Bearer YOUR_JWT' --json '{"contents": "What is an API gateway?"}' http://localhost:8080/chat
```

Each response adds its `usage` to the counter of the user. Once the counter reaches the daily limit, the following calls get a `429` status code without reaching the LLM, and the `Retry-After` header tells the client how many seconds remain until the budget refills:

```log
HTTP/1.1 429 Too Many Requests
Retry-After: 41520
```

When a custom [output template](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates) renames or removes `usage`, update `weight_key` to the new location of the token count. A response without a token count adds `1` to the counter.

## Token Budget for Streaming Responses

When the endpoint streams the response, the quota reads every event of the stream and adds the weight of each event that carries the `weight_key`. Choose a key that appears in a single event, so each call counts once.

With the [`format`](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/#normalizing-the-output-format-with-format) of the stream set to `openai`, the final `response.completed` event carries the total tokens of the call in `response.usage.total_tokens`, and no other event does. Set the endpoint’s `output_encoding` to `sse`, the wire format of OpenAI streams, so the quota reads the events as KrakenD sends them. The following configuration streams a Gemini model in the OpenAI format and applies the same plans as the previous example:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
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
          "name": "llm_tokens",
          "connection_name": "shared_redis_pool",
          "hash_keys": true,
          "rules": [
            {
              "name": "pro",
              "limits": [
                { "amount": 500000, "unit": "day" }
              ]
            },
            {
              "name": "free",
              "limits": [
                { "amount": 50000, "unit": "day" }
              ]
            }
          ]
        }
      ]
    },
    "ai/providers": {
      "providers": [
        {
          "name": "chat-stream",
          "provider": "gemini",
          "model": "gemini-2.5-flash",
          "credentials": "xxx",
          "streaming": true,
          "format": "openai"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/v1/responses",
      "method": "POST",
      "output_encoding": "sse",
      "input_headers": ["X-Plan", "X-User"],
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "https://idp.example.com/.well-known/jwks.json",
          "cache": true,
          "propagate_claims": [
            ["plan", "X-Plan"],
            ["sub", "X-User"]
          ]
        },
        "governance/quota": {
          "quota_name": "llm_tokens",
          "weight_strategy": "body",
          "weight_key": "response.usage.total_tokens",
          "tier_key": "X-Plan",
          "on_unmatched_tier_allow": false,
          "tiers": [
            {
              "rule_name": "pro",
              "tier_value": "pro",
              "tier_value_as": "literal",
              "strategy": "header",
              "key": "X-User"
            },
            {
              "rule_name": "free",
              "tier_value_as": "*",
              "strategy": "header",
              "key": "X-User"
            }
          ]
        }
      },
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "chat-stream"
            }
          }
        }
      ]
    }
  ]
}
```

Clients send OpenAI Responses requests and receive the stream as it is generated. When the stream ends, the quota adds the tokens of `response.completed` to the counter of the user. The check before the call works as in the non-streaming case, so a user over the limit gets a `429` status code before the stream starts.

## Reducing the Token Spend

A budget caps the spend, while other KrakenD features reduce it:

- The [Semantic Cache](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/) returns a stored response when a new prompt means the same as a previous one, without calling the LLM.
- The [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/) sends each request to the cheapest provider that fits it, by plan, use case, or with a classifier.
- [Prompt controls](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/#complementary-prompt-controls) limit the size of the prompts and the rate of requests before they consume tokens.

To follow the token consumption per provider and model in your observability stack, see [AI Monitoring](https://www.krakend.io/docs/enterprise/ai-gateway/usage-monitoring/).
