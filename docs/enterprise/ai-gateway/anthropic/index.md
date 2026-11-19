# Anthropic Integration

> Connect KrakenD to Anthropic Claude models through the unified LLM interface, from the provider inventory or an inline backend configuration.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/

The **Anthropic integration** connects KrakenD to the [Anthropic Messages API](https://docs.claude.com/en/api/messages) through the `ai/llm` component of the [unified LLM interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/). Clients send only the prompt in the [unified request format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format), and KrakenD builds the Anthropic payload, authenticates with your credentials, and returns the [unified response](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#response-format). Use it to offer Anthropic models behind your own API without sharing your credentials with clients. Because clients never see the Anthropic API, you can move them to another model or vendor later without changing a line of their code.

Keep the Anthropic credentials out of the configuration file

Inject the `credentials` through an environment variable with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) instead of writing them in plain text, and restrict access to the configuration file.

## Declaring Anthropic in the Provider Inventory

The recommended way to connect to Anthropic is to declare it once in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) and reference it by name from every backend that needs it. The following configuration declares a `claude` provider and exposes it on `/anthropic`:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "claude",
          "provider": "anthropic",
          "model": "claude-haiku-4-5",
          "credentials": "xxx",
          "variables": {
            "max_tokens": 500
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/anthropic",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "claude"
            }
          }
        }
      ]
    }
  ]
}
```

The backend needs neither `host` nor `url_pattern`, because the inventory knows the Anthropic endpoint. Any other backend, or the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), can reuse the `claude` provider by name. Clients call the endpoint like this:

Send a prompt to Anthropic through KrakenD 

```
$curl -XPOST --json '{"instructions": "Answer in one sentence", "contents": "What is an API gateway?"}' http://localhost:8080/anthropic
```

## Inline Anthropic Configuration

Instead of a provider reference, you can write the Anthropic configuration in the backend itself, under the `anthropic` key of the `ai/llm` namespace and the `v1` API version. In this case, the backend sets the `host` and `url_pattern` of the Anthropic API:

```json
{
  "endpoint": "/anthropic",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://api.anthropic.com"
      ],
      "url_pattern": "/v1/messages",
      "extra_config": {
        "ai/llm": {
          "anthropic": {
            "v1": {
              "credentials": "xxx",
              "variables": {
                "model": "claude-haiku-4-5",
                "max_tokens": 500
              }
            }
          }
        }
      }
    }
  ]
}
```

This backend behaves like the previous example. Use the inline form when no other backend shares this configuration.

## Anthropic Configuration Options

The provider entry of the inventory and the inline block accept the same `credentials`, `variables`, `input_template`, `output_template`, and `debug` options. KrakenD sends the `credentials` in the `X-Api-Key` header, together with the `anthropic-version: 2023-06-01` header the API requires. Keep in mind:

- The inline block requires `variables.model`. In the inventory, `model` is optional and defaults to `claude-haiku-4-5`.
- `max_tokens` defaults to `1024`, because the Messages API requires it on every request.
- KrakenD sends `instructions` as a system prompt marked for Anthropic’s prompt caching, with a five-minute `ephemeral` cache. Requests that repeat the same system prompt can reuse the cached prefix.
- The token usage in the response adds up the input and output tokens.

These are the fields of the inline `anthropic` block. The keys of its `variables` object are also the ones a provider entry accepts:

##### Fields of Anthropic integration

\* required fields

##### [`v1`](https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/#v1 "Click to copy link to v1") object

All settings depend on a specific version, as the vendor might change the API over time.

##### [`credentials`](#v1-credentials "Click to copy link to credentials") * string

Your Anthropic API key. You can set it as an environment variable for better security.

##### [`debug`](#v1-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to true in production as it may log sensitive data.

Defaults to `false`

##### [`input_template`](#v1-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to Anthropic. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`output_template`](#v1-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from Anthropic is transformed before being sent to the client. The default template extracts the text from the first choice returned by Anthropic so in most cases you don’t need to set a custom output template.

##### [`variables`](#v1-variables "Click to copy link to variables") * object

The variables specific to the Anthropic usage that are used to construct the payload.

##### [`extra_payload`](#variables-extra_payload "Click to copy link to extra_payload") object

A map of additional payload attributes you want to use in your custom `input_template` (this payload is not used in the default template). The attributes set here are accessible in your custom template as `{{ .variables.extra_payload.yourchosenkey }}`. This option helps adding rare customization and future attributes.

##### [`max_tokens`](#variables-max_tokens "Click to copy link to max_tokens") integer

Maximum number of tokens that can be generated in the response. A token is approximately four characters. 100 tokens correspond to roughly 60-80 words.

Defaults to `1024`

##### [`model`](#variables-model "Click to copy link to model") * string

The name of the Anthropic model you want to use.

Examples: `"claude-opus-4-1-20250805"` , `"claude-sonnet-4-20250514"` , `"claude-3-7-sonnet-latest"` , `"claude-3-5-haiku-latest"`

##### [`stop_sequences`](#variables-stop_sequences "Click to copy link to stop_sequences") array of strings

An array of sequences where the model will stop generating further tokens if found. This can be useful to control the length and content of the output.

##### [`temperature`](#variables-temperature "Click to copy link to temperature") number

The temperature is used for sampling during response generation, which occurs when topP and topK are applied. Temperature controls the degree of randomness in token selection. Lower temperatures are good for prompts that require a less open-ended or creative response, while higher temperatures can lead to more diverse or creative results.

##### [`top_k`](#variables-top_k "Click to copy link to top_k") integer

Top-K changes how the model selects tokens for output. A top-K of 1 means the next selected token is the most probable among all tokens in the model’s vocabulary (also called greedy decoding), while a top-K of 3 means that the next token is selected from among the three most probable tokens by using temperature.

##### [`top_p`](#variables-top_p "Click to copy link to top_p") number

Top-P changes how the model selects tokens for output. Tokens are selected from the most probable to least probable until the sum of their probabilities equals the top-P value. For example, if tokens A, B, and C have a probability of 0.3, 0.2, and 0.1 and the top-P value is 0.5, then the model will select either A or B as the next token by using temperature and excludes C as a candidate.

Schema: [https://www.krakend.io/schema/v3.0/ai/anthropic.json](https://www.krakend.io/schema/v3.0/ai/anthropic.json "JSON schema definition")

## Streaming Anthropic Responses

To forward the tokens as Anthropic produces them, set the endpoint’s `output_encoding` to `streaming`. When the backend references a provider, also set `streaming` to `true` in the provider entry. Anthropic streams through the same `/v1/messages` endpoint, so nothing else changes. [LLM Streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/) explains the `format` option, which presents the stream in the OpenAI or Anthropic format.

## Default Anthropic Prompt Templates

KrakenD talks to Anthropic through a pair of default [prompt templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates). Replace either of them with your own [Go template](https://pkg.go.dev/text/template) file through `input_template` or `output_template` when you need a different payload or response. Use the defaults below as the starting point.

### Default Input Template

KrakenD builds the input template when it starts, writing the values of your `variables` into it. It only writes the `temperature`, `top_p`, `top_k`, and `model` lines when they have a value. With the configuration of the examples above, the payload sent to Anthropic comes from this template:

```go-text-template
{
	"model": "claude-haiku-4-5",
	"max_tokens": 500,
	"stream": false,
	"stop_sequences": [],
	{{- if hasKey .req_body "instructions" }}
	"system": [
		{
			"type": "text",
			"cache_control": {
				"type": "ephemeral",
				"ttl": "5m"
			},
			"text": {{ .req_body.instructions | toJson }}
		}
	],
	{{- end }}
	"messages": [
		{
			"role": "user",
			"content": {{ .req_body.contents | toJson }}
		}
	]
}
```

When you write your own input template, read your values from `.variables`, for example `{{ .variables.temperature }}`, and the extra attributes from `.variables.extra_payload`.

### Default Output Template

The default output template returns the generated text in `ai_gateway_response` and the token count of `usage.input_tokens` plus `usage.output_tokens` in `usage`:

```go-text-template
{
	"ai_gateway_response": [
		{
			"contents": [
				{{- range $index, $part := .resp_body.content }}
				{{- if $index }},{{ end }}
				{{ $part.text | toJson }}
				{{- end }}
			]
		}
	],
	"usage": "{{ add .resp_body.usage.output_tokens .resp_body.usage.input_tokens }}"
}
```

If your own output template drops the `usage` field, the [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) can no longer count the tokens of the response.
