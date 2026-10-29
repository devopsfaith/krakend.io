# AI Token Cost Control & Quotas

> KrakenD lets you enforce LLM token quotas per user, tier, or endpoint, with dynamic routing to cost-efficient models.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/

AI workloads can quickly generate unpredictable and excessive costs. KrakenD’s AI Gateway provides granular token usage monitoring and enforcement to keep your AI expenses transparent and within budget. Features like token quotas, budget alerts, prompt caching, and intelligent routing enable you to optimize requests and avoid surprise bills while maintaining performance and scalability.

To avoid paying twice for the same answer, the [Semantic Cache](https://www.krakend.io/docs/enterprise/ai-gateway/semantic-cache/) returns a stored response when a new prompt means the same as a previous one.

## Token Quota and Budget Enforcement

KrakenD Enterprise includes a powerful persistent quota system that’s perfect for managing token-based usage quotas in LLM applications, designer for controlling cost, enforcing subscription tiers, and preventing overuse.

The quota system allows you to limit usage per user, client, or endpoint to prevent runaway costs.

**See the [Quota component](https://www.krakend.io/docs/enterprise/governance/quota/) for full details.**

Here’s a sample of the configuration (see the documentation for all necessary blocks):

```json
{
  "governance/quota": {
    "quota_name": "public_plans",
    "on_unmatched_tier_allow": false,
    "weight_key": "credits_consumed",
    "weight_strategy": "body",
    "tier_key": "X-Level",
    "disable_quota_headers": false,
    "tiers": [
      {
        "rule_name": "rule_gold",
        "tier_value": "gold",
        "tier_value_as": "literal",
        "strategy": "header",
        "key": "X-User-Id"
      },
      {
        "comment": "Special case * that catches any requests not falling into one of the tiers above",
        "rule_name": "rule_bronze",
        "tier_value_as": "*",
        "strategy": "ip"
      }
    ]
  }
}
```

## AI Metrics and reporting

Through [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) you can follow all the activity of the gateway, including connections to LLMs. If you want to follow internals like the models used, providers, etc. we recommend you to add tags to telemetry so you have a complete detail on what is going on.

In addition, while there is no API available to generate reporting yet, you can follow real-time token consumption if you connect to the internal Redis database that tracks usage.
