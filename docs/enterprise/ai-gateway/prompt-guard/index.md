# Prompt Guard for LLM and Agent Endpoints

> Block prompt injection, jailbreaks, and malicious payloads on any endpoint with KrakenD Prompt Guard, using regex, classifier, and policy guards.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/

**Prompt Guard** inspects the body payload of incoming requests and blocks content that matches known attack patterns, such as prompt injection, jailbreaks, or data exfiltration attempts. It applies one or more *guards* to the request and rejects the call when a guard flags the payload as malicious. Because it operates on the raw request body, you can add it to **any endpoint that accepts a body**, not only to those connected to an LLM backend. KrakenD ships with a set of default guards that protect your endpoints out of the box, and you can extend or restrict them through configuration.

Security notice

Prompt guards evaluate untrusted user input. The `policy` guard can additionally reference request metadata such as headers, query strings, and the URL. Review which guards you enable per endpoint and keep the default guards active unless you have a specific reason to disable them.

## How Prompt Guard Works

KrakenD maintains a global shared registry that holds both the default guards and the guards you define in your configuration. When a request reaches a protected endpoint, the gateway selects the guards that apply, combines them into a single guard, and evaluates the request body against it.

Three kinds of guards are available:

- **Regex**: matches the body against a list of regular expressions.
- **Classifier**: sends the body to an external service that returns a score.
- **Policy**: evaluates CEL expressions against the body and request metadata.

The default guards are a large set of regular expressions covering common attack categories. KrakenD merges all regex guards (defaults and your own) into a single set so it can test every pattern in one pass, which keeps evaluation fast even when the number of patterns is high.

## Enabling Prompt Guard

Prompt Guard uses the `ai/prompt-guard` namespace in the `extra_config`. The default guards are active on any endpoint or backend where you add the namespace, even with an empty object. To take full control, declare your own guards at the service level and then choose which guards apply on each endpoint or backend.

A configuration has two parts:

1. The **guard definitions**, placed in the root `extra_config`, where you describe each custom guard.
2. The **guard selection**, placed in the `extra_config` of each endpoint or backend, where you list the guards to apply by name.

## Defining Guards

You define each custom guard at the service level inside the `ai/prompt-guard` namespace, under the `guards` list. Every guard declaration has a `name` to reference it, a `kind` (`regex`, `classifier`, or `policy`), a `severity` from `critical` (highest) to `low` (lowest), and a `config` object whose fields depend on the kind.

Severity levels matter when selecting or disabling guards: you can disable all default guards of a given severity (see [Disabling Default Guards](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/#disabling-default-guards)).

The following fields are available at the service level:

##### Fields of AI Prompt Guard

\* required fields

##### [`guards`](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/#guards "Click to copy link to guards") array of objects

The list of custom guards available to endpoints and backends. Each guard has a unique `name`, a `kind` that defines how it evaluates the request, a `severity`, and a `config` whose fields depend on the `kind`.

Each item of guards accepts the following properties:

##### [`config`](#guards-config "Click to copy link to config") * object

The settings of the guard. Its fields depend on the `kind`: `patterns` for a `regex` guard, `url` and `score_threshold` for a `classifier` guard, and `expressions` for a `policy` guard.

##### [`kind`](#guards-kind "Click to copy link to kind") *

How the guard evaluates the request. A `regex` guard matches the body against a list of regular expressions, a `classifier` guard sends the body to an external service that returns a score, and a `policy` guard evaluates CEL expressions against the body and the request metadata.

Possible values are: `"regex"` , `"classifier"` , `"policy"`

##### [`name`](#guards-name "Click to copy link to name") * string

A unique name for this guard. Endpoints and backends reference the guard through this value in their `guards` list.

Examples: `"block_jailbreak_terms"` , `"injection_classifier"`

##### [`severity`](#guards-severity "Click to copy link to severity") *

The severity level assigned to the guard, from `critical` (highest) to `low` (lowest). Endpoints and backends can disable all the default guards of a given severity by adding `!critical`, `!high`, `!medium`, or `!low` to their `guards` list.

Possible values are: `"critical"` , `"high"` , `"medium"` , `"low"`

Schema: [https://www.krakend.io/schema/v3.0/ai/prompt-guard.json](https://www.krakend.io/schema/v3.0/ai/prompt-guard.json "JSON schema definition")

### Regex Guards

A `regex` guard matches the request body against a list of regular expressions. If any pattern matches, the guard blocks the request. Define the patterns under `config.patterns`:

```json
{
  "name": "block_jailbreak_terms",
  "kind": "regex",
  "severity": "high",
  "config": {
    "patterns": [
      "(?i)ignore (all )?previous instructions",
      "(?i)disregard .*(system )?prompt"
    ]
  }
}
```

The guard above blocks any request whose body matches either pattern. KrakenD combines these patterns with the patterns of all other regex guards into a single set evaluated in one pass.

### Classifier Guards

A `classifier` guard delegates the decision to an external service. KrakenD sends the body to the configured `url`, and the service responds with a JSON payload that contains a `score` between `0.0` and `1.0`, both included. A score of `0.0` means “do not block”, and `1.0` is the maximum confidence that the payload should be blocked:

```json
{ "score": 0.23 }
```

You configure a classifier guard with the endpoint to call and the threshold that decides the outcome:

```json
{
  "name": "injection_classifier",
  "kind": "classifier",
  "severity": "high",
  "config": {
    "score_threshold": 0.6,
    "on_failure_block": false,
    "url": "https://example.com/classify"
  }
}
```

The guard blocks the request when the returned score is equal to or greater than `score_threshold`. The `on_failure_block` flag controls the behavior when the external service cannot be reached or returns an error: set it to `true` to block the request on failure, or `false` to let it through.

### Policy Guards

A `policy` guard evaluates a list of CEL `expressions` against the request. The body is exposed as a single `body` **string**, not as parsed JSON. A `meta` object exposes the request context with the same data available to other [Security Policies](https://www.krakend.io/docs/enterprise/security-policies/):

- `headers`
- `params`
- `method`
- `path`
- `query`
- `url`

```json
{
  "name": "payload_policy",
  "kind": "policy",
  "severity": "medium",
  "config": {
    "expressions": [
      "meta.method == 'POST'",
      "size(body) <= 8192"
    ]
  }
}
```

Each expression returns a boolean and decides whether the request is allowed to continue. The policy above only lets through `POST` requests whose body is 8 KB or smaller. Use `body` to inspect the raw payload and `meta` to reason about the request headers, parameters, method, path, query string, and URL.

## Selecting Guards per Endpoint or Backend

After defining guards at the service level, add the `ai/prompt-guard` namespace to the endpoint or backend you want to protect, and list the guards to apply by `name`. You can protect either the endpoint or an individual backend.

The following endpoint applies a regex guard and a classifier guard defined earlier:

```json
{
  "endpoint": "/guard/on/endpoint",
  "method": "POST",
  "input_headers": [
    "*"
  ],
  "backend": [
    {
      "url_pattern": "/v1/chat/completions",
      "method": "POST",
      "encoding": "json"
    }
  ],
  "extra_config": {
    "ai/prompt-guard": {
      "guards": [
        "block_jailbreak_terms",
        "injection_classifier"
      ]
    }
  }
}
```

To protect a specific backend instead of the whole endpoint, move the namespace into the backend’s `extra_config`:

```json
{
  "endpoint": "/guard/on/backend",
  "method": "POST",
  "input_headers": [
    "*"
  ],
  "backend": [
    {
      "url_pattern": "/v1/chat/completions",
      "method": "POST",
      "extra_config": {
        "ai/prompt-guard": {
          "guards": [
            "block_jailbreak_terms",
            "injection_classifier"
          ]
        }
      }
    }
  ]
}
```

Both examples keep the default guards active in addition to the named guards you selected. The following fields are available at the endpoint and backend levels:

##### Fields of AI Prompt Guard Selection

\* required fields

##### [`guards`](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/#guards "Click to copy link to guards") array of strings

The guards to apply, in addition to the default ones. Add the `name` of a guard declared at the service level to apply it, or prefix an entry with `!` to disable default guards: `!all_defaults` removes all of them, `!critical`, `!high`, `!medium`, and `!low` remove those of that severity, and `!` followed by a group name, such as `!unicode_steganography`, removes that group.

Schema: [https://www.krakend.io/schema/v3.0/ai/prompt-guard-endpoint.json](https://www.krakend.io/schema/v3.0/ai/prompt-guard-endpoint.json "JSON schema definition")

## Disabling Default Guards

The `guards` list also accepts negations to remove default guards for an endpoint or backend. Prefix the name with an exclamation mark `!` to disable it:

- `!all_defaults`: Removes all default guards. Only the guards you explicitly select remain. If this is the only entry, KrakenD applies an internal no-op guard, effectively disabling Prompt Guard for that endpoint.
- `!low`, `!medium`, `!high`, `!critical`: Disable all default guards of that severity level.
- `!group_name`: Disable a specific default guard group, for example `!unicode_steganography`.

For instance, the following selection applies two named guards while disabling every default guard with `medium` severity and the `unicode_steganography` group:

```json
{
  "ai/prompt-guard": {
    "guards": [
      "block_jailbreak_terms",
      "injection_classifier",
      "!medium",
      "!unicode_steganography"
    ]
  }
}
```

### Default Guard Groups

The default guards below are grouped by the kind of attack they detect, to make the list easier to scan. Disable an individual guard group with the `!` notation (for example, `!unicode_steganography`); the category headings are not configuration values.

**Prompt injection and instruction manipulation**

- `cascade_amplification`
- `context_hijacking`
- `few_shot_hijack`
- `indirect_injection`
- `instruction_override`
- `instruction_piggybacking`
- `multi_turn`
- `output_manipulation`
- `prompt_extraction`
- `repetition_bypass`
- `role_manipulation`

**Jailbreak and safety bypass**

- `bypass_coaching`
- `cognitive_manipulation`
- `emotional_manipulation`
- `jailbreak`
- `language_switch_evasion`
- `safety_bypass`
- `scenario_jailbreak`
- `urgency_manipulation`

**Social engineering and impersonation**

- `authority_impersonation`
- `dm_social_engineering`
- `phishing`
- `social_engineering`
- `system_impersonation`
- `system_mimicry`

**Agent, tool, and memory abuse**

- `action_gate_bypass`
- `agent_payment_hijack`
- `agent_sovereignty`
- `approval_expansion`
- `auto_approve_exploit`
- `cognitive_rootkit`
- `hooks_hijacking`
- `mcp_abuse`
- `memory_manipulation`
- `memory_poisoning`
- `recursive_delegation`
- `semantic_worm`
- `subagent_exploit`

**Code execution and system attacks**

- `code_injection`
- `fork_bomb`
- `gitignore_bypass`
- `remote_code_execution`
- `reverse_shell`
- `sql_injection`
- `ssh_key_injection`
- `supply_chain_injection`
- `system_destruction`
- `system_file_access`
- `xss`

**Data exfiltration**

- `covert_exfiltration`
- `data_exfiltration`

**Obfuscation and hidden content**

- `hidden_text`
- `obfuscated_payload`
- `token_smuggling`
- `unicode_steganography`
- `unicode_tag_injection`

## Prompt Guard Metrics and Traces

When you enable [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/), Prompt Guard reports the `krakend.promptguard.check` counter, which increases every time a prompt guard runs. It carries the following attributes:

- `blocker`: the category or name of the guard that blocked the request. It is empty when the request passes.
- `http_route`: the endpoint that received the request.
- `http_method`: the HTTP method of the request.
- `krakend_backend`: the `url_pattern` of the backend, when you set Prompt Guard at the backend level.

Prompt Guard also adds its result as an attribute of the current trace.

## Full Configuration Example

The following configuration defines four guards at the service level and applies a subset of them, together with some negations, on both an endpoint and a backend:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "name": "prompt-guard-example",
  "timeout": "5s",
  "cache_ttl": "300s",
  "host": [
    "http://llm_backend:9876"
  ],
  "extra_config": {
    "ai/prompt-guard": {
      "guards": [
        {
          "name": "block_jailbreak_terms",
          "kind": "regex",
          "severity": "high",
          "config": {
            "patterns": [
              "(?i)ignore (all )?previous instructions",
              "(?i)disregard .*(system )?prompt"
            ]
          }
        },
        {
          "name": "block_sensitive_terms",
          "kind": "regex",
          "severity": "medium",
          "config": {
            "patterns": [
              "(?i)reveal .*(system )?prompt",
              "(?i)you are now .*(DAN|jailbroken)"
            ]
          }
        },
        {
          "name": "injection_classifier",
          "kind": "classifier",
          "severity": "high",
          "config": {
            "score_threshold": 0.6,
            "on_failure_block": false,
            "url": "https://example.com/classify"
          }
        },
        {
          "name": "payload_policy",
          "kind": "policy",
          "severity": "medium",
          "config": {
            "expressions": [
              "meta.method == 'POST'",
              "size(body) <= 8192"
            ]
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/guard/on/endpoint",
      "method": "POST",
      "input_headers": [
        "*"
      ],
      "backend": [
        {
          "url_pattern": "/v1/chat/completions",
          "method": "POST",
          "encoding": "json"
        }
      ],
      "extra_config": {
        "ai/prompt-guard": {
          "guards": [
            "block_jailbreak_terms",
            "injection_classifier",
            "!medium",
            "!unicode_steganography"
          ]
        }
      }
    },
    {
      "endpoint": "/guard/on/backend",
      "method": "POST",
      "input_headers": [
        "*"
      ],
      "backend": [
        {
          "url_pattern": "/v1/chat/completions",
          "method": "POST",
          "extra_config": {
            "ai/prompt-guard": {
              "guards": [
                "block_jailbreak_terms",
                "injection_classifier",
                "!medium",
                "!unicode_steganography"
              ]
            }
          }
        }
      ]
    }
  ]
}
```

The root `extra_config` defines the guards `block_jailbreak_terms`, `block_sensitive_terms`, `injection_classifier`, and `payload_policy`. Each endpoint selects `block_jailbreak_terms` and `injection_classifier` by name, keeps the remaining default guards, and disables both the `medium`-severity defaults and the `unicode_steganography` group. The first endpoint guards the whole endpoint, while the second guards a single backend. This feature complements [AI Security](https://www.krakend.io/docs/enterprise/ai-gateway/security/) and [AI Governance](https://www.krakend.io/docs/enterprise/ai-gateway/governance/) to harden the requests reaching your LLMs and agents.
