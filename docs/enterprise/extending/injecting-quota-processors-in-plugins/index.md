# Injecting Quota Processors in Plugins

> Inject KrakenD's built-in Quota Processor into any custom plugin to enforce usage limits without managing quota state, time windows, or storage.

Source: https://www.krakend.io/docs/enterprise/extending/injecting-quota-processors-in-plugins/

**Quota Processor injection** lets you use KrakenD’s built-in quota enforcement system inside any custom plugin. Instead of building your own rate-limiting logic, your plugin delegates quota state, time windows, and storage management to KrakenD and focuses on business logic. Use this when your plugin needs to enforce usage limits that align with or share counters from the service-level quota configuration.

KrakenD injects a Quota Processor selector into any plugin that implements the `QuotaProcessorRegisterer` interface. Once registered, the selector gives you access to any named quota processor declared in your configuration. The main advantages of this approach are:

- No need to manage quota state, time windows, or storage, KrakenD handles the processor lifecycle
- A performant, production-ready solution
- A simple interface to check and consume quotas
- Plug-and-play: select the processor by name and start enforcing limits

## Registering the Selector

During startup, KrakenD injects the Quota Processor selector into plugins that implement the `QuotaProcessorRegisterer` interface:

```go
type QuotaProcessorRegisterer interface {
	RegisterQuotaProcessorSelector(func(string) (interface{}, error))
}
```

The simplest implementation saves the incoming selector into a plugin-level variable:

```go
var quotaSelector func(string) (interface{}, error)

func (r registerer) RegisterQuotaProcessorSelector(s func(string) (interface{}, error)) {
	quotaSelector = s
	logger.Debug(fmt.Sprintf("[PLUGIN: %s] Quota Processor selector loaded", r))
}
```

## Quota Selector

After startup, the selector is ready to use. A selector is a helper function that retrieves a registered Quota Processor by name and returns it as an `interface{}`.

Retrieve a quota processor by name as follows:

```go
p, err := quotaSelector("my-quota-processor")
if err != nil {
	// handle error: the processor was not found or could not be loaded
}
```

Cast the returned `interface{}` to the `QuotaProcessor` interface before use:

```go
type QuotaProcessor interface {
	Close()
	WithRules(rules ...[2]string) error
	Process(tierValue string, key string, when time.Time, weight int64) (interface{}, error)
}
```

For example:

```go
quotaProcessor, ok := p.(QuotaProcessor)
if !ok {
	// handle error: the processor could not be properly loaded
}
```

## Interface Breakdown

The `QuotaProcessor` interface exposes three methods: `WithRules`, `Close`, and `Process`. Call `WithRules` during plugin registration and `Process` on every request.

### `WithRules`

Call `WithRules` during plugin registration to attach existing rulesets, defined in the configuration at `governance/processors.quotas`, to a tier value extracted from each request. This association determines which limit applies.

```go
errs := quotaProcessor.WithRules(
	[2]string{"gold", "admin"},
	[2]string{"gold", "developer"},
)
if errs != nil {
	quotaProcessor.Close()
	return nil, errs
}
```

### `Close`

Call `Close()` if registration fails after a successful quota selection. The call shuts down the processor only when no other component is using it.

### `Process`

Call `Process` inside your plugin’s handler or proxy on every request. The parameters are:

- **`tierValue`** : The tier value to match against the rules registered with `WithRules`
- **`key`** : A unique key identifying the consumer (e.g., user ID, API key, JWT sub claim)
- **`when`** : The time of the request (`time.Now()`)
- **`weight`** : The cost of the request. Pass `0` to check the quota without consuming it (pre-check), or a positive value to consume quota.

`Process` returns an `interface{}` with the quota status for the current hit. Cast it to `processResponseWrapper` to read the result:

```go
type processResponseWrapper interface {
	Allowed() bool
	BlockedFor() time.Duration
	Details() []interface{}
}
```

- **`Allowed()`** : Whether the request is within the quota limits
- **`BlockedFor()`** : How long until the quota resets if the request is blocked
- **`Details()`** : The status of each time window in the ruleset

Each element of the `Details()` slice is castable to:

```go
type windowStatusWrapper interface {
	Remaining() int64
	Consumed() int64
	NextRefill() time.Duration
	LevelValue() string
	WindowName() string
	Allowed() bool
}
```

- **`LevelValue()`** : The current rule name, e.g., `gold`
- **`WindowName()`** : A string representing the rule window, e.g., `hour` or `day`
- **`Allowed()`** : Whether the request is within the rule limits
- **`Consumed()`** : How much quota has been consumed for the current rule window
- **`Remaining()`** : How much quota remains for the current rule window
- **`NextRefill()`** : If the quota is exhausted, a `time.Duration` representing how long until the next reset

## Sharing Counters with Existing Quota Configurations

Quota Processor injection is compatible with existing service, endpoint, and backend quota configurations, so you can share quota counters and thresholds between plugin logic and built-in quota enforcement. Consider the following quota configuration:

```json
{
  "extra_config": {
    "redis": {
      "connection_pools": [
        {
          "name": "shared_redis_pool",
          "address": "192.168.1.45:6379"
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
            "P": 1e-8,
            "hash_name": "optimal"
          },
          "rules": [
            {
              "name": "rule_gold",
              "limits": [
                { "amount": 10, "unit": "hour" },
                { "amount": 200, "unit": "day" }
              ]
            },
            {
              "name": "rule_bronze",
              "limits": [
                { "amount": 5, "unit": "hour" },
                { "amount": 100, "unit": "day" }
              ]
            }
          ]
        }
      ]
    },
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
          "@comment": "Wildcard tier that catches all requests not matched by tiers above",
          "rule_name": "rule_bronze",
          "tier_value_as": "*",
          "strategy": "ip"
        }
      ]
    }
  }
}
```

This configuration enables quota management for all endpoints using different thresholds and rules based on the `X-Level` header. From a plugin, you are not restricted to header values as selectors, you can apply any business logic as long as you enable the correct rules and pass the matching `tier_value` to `quota.Process()`.

Counter sharing limitation

As of v3.0, counter sharing only works when `tier_value_as` is set to `literal`. The wildcard matcher `*` is not currently supported.

The following handler plugin reuses the configured quota processor and rules:

```go
func (r registerer) registerHandlers(_ context.Context, extra map[string]interface{}, h http.Handler) (http.Handler, error) {
	p, err := quotaSelector("my-quota-processor")
	if err != nil {
		return nil, err
	}
	quotaProcessor, ok := p.(QuotaProcessor)
	if !ok {
		return nil, fmt.Errorf("invalid quota processor type")
	}

	quotaProcessor.WithRules(
		[2]string{"rule_gold", "gold"}, // matches "rule_name" and "tier_value" of the first tier in "governance/quota", shares counters
		[2]string{"rule_gold", "admin"},
		[2]string{"rule_bronze", "guest"},
	)

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.URL.Path != "/" {
			h.ServeHTTP(w, req)
			return
		}

		n := time.Now()

		// extract these values from the current request
		tierValue := "gold"
		userId := "user-id"

		preCheck, _ := quotaProcessor.Process(tierValue, userId, n, 0)
		s, ok := preCheck.(processResponseWrapper)
		if !ok {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !s.Allowed() {
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte("Quota exceeded\n"))
			return
		}

		h.ServeHTTP(w, req)

		quotaProcessor.Process(tierValue, userId, n, 1)
	}), nil
}
```

## Example: Using Quota Processors in a Handler Plugin

The following complete handler plugin enforces quotas using a pre-check (with `weight` set to `0`) before serving the request, then consumes quota (with `weight` set to `2`) after serving:

```go
func (r registerer) registerHandlers(_ context.Context, extra map[string]interface{}, h http.Handler) (http.Handler, error) {
	p, err := quotaSelector("my-quota-processor")
	if err != nil {
		return nil, err
	}
	quotaProcessor, ok := p.(QuotaProcessor)
	if !ok {
		return nil, fmt.Errorf("invalid quota processor type")
	}

	errs := quotaProcessor.WithRules(
		[2]string{"gold", "admin"},
		[2]string{"gold", "developer"},
	)
	if errs != nil {
		quotaProcessor.Close()
		return nil, errs
	}

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.URL.Path != "/" {
			h.ServeHTTP(w, req)
			return
		}

		n := time.Now()

		// extract these values from the current request
		tierValue := "admin"
		userId := "user-id"

		preCheck, _ := quotaProcessor.Process(tierValue, userId, n, 0)
		s, ok := preCheck.(processResponseWrapper)
		if !ok {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !s.Allowed() {
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte("Quota exceeded\n"))
			return
		}

		h.ServeHTTP(w, req)

		quotaProcessor.Process(tierValue, userId, n, 2)
	}), nil
}

var quotaSelector func(string) (interface{}, error)

type QuotaProcessor interface {
	Close()
	WithRules(rules ...[2]string) error
	Process(tierValue string, key string, when time.Time, weight int64) (interface{}, error)
}

func (r registerer) RegisterQuotaProcessorSelector(s func(string) (interface{}, error)) {
	quotaSelector = s
}

type processResponseWrapper interface {
	Allowed() bool
	BlockedFor() time.Duration
	Details() []interface{}
}

type windowStatusWrapper interface {
	Remaining() int64
	Consumed() int64
	NextRefill() time.Duration
	LevelValue() string
	WindowName() string
	Allowed() bool
}
```

## Example: Using Quota Processors in a Real Use Case

The `examples` repository contains a full stack showcasing quota processor injection at work. It focuses on applying quotas to `no-op` streaming responses.

[Check example](https://github.com/krakend/examples/tree/main/12.plugins-and-quotas "Check example")
