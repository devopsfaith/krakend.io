# Mistral Integration

> Connect KrakenD to Mistral models through the unified LLM interface, from the provider inventory or an inline backend configuration.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/mistral/

The **Mistral integration** connects KrakenD to the [Mistral Chat Completions API](https://docs.mistral.ai/api/) through the `ai/llm` component of the [unified LLM interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/). Clients send only the prompt in the [unified request format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format), and KrakenD builds the Mistral payload, authenticates with your credentials, and returns the [unified response](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#response-format). Use it to offer Mistral models behind your own API without sharing your credentials with clients. Because clients never see the Mistral API, you can move them to another model or vendor later without changing a line of their code.

Keep the Mistral credentials out of the configuration file

Inject the `credentials` through an environment variable with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) instead of writing them in plain text, and restrict access to the configuration file.

## Declaring Mistral in the Provider Inventory

The recommended way to connect to Mistral is to declare it once in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) and reference it by name from every backend that needs it. The following configuration declares a `mistral` provider and exposes it on `/mistral`:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "mistral",
          "provider": "mistral",
          "model": "mistral-small-latest",
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
      "endpoint": "/mistral",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "mistral"
            }
          }
        }
      ]
    }
  ]
}
```

The backend needs neither `host` nor `url_pattern`, because the inventory knows the Mistral endpoint. Any other backend, or the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), can reuse the `mistral` provider by name. Clients call the endpoint like this:

Send a prompt to Mistral through KrakenD 

```
$curl -XPOST --json '{"instructions": "Answer in one sentence", "contents": "What is an API gateway?"}' http://localhost:8080/mistral
```

## Inline Mistral Configuration

Instead of a provider reference, you can write the Mistral configuration in the backend itself, under the `mistral` key of the `ai/llm` namespace and the `v1` API version. In this case, the backend sets the `host` and `url_pattern` of the Mistral API:

```json
{
  "endpoint": "/mistral",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://api.mistral.ai"
      ],
      "url_pattern": "/v1/chat/completions",
      "extra_config": {
        "ai/llm": {
          "mistral": {
            "v1": {
              "credentials": "xxx",
              "variables": {
                "model": "mistral-small-latest",
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

## Mistral Configuration Options

The provider entry of the inventory and the inline block accept the same `credentials`, `variables`, `input_template`, `output_template`, and `debug` options. KrakenD sends the `credentials` as a bearer token in the `Authorization` header. Keep in mind:

- The inline block requires `variables.model`. In the inventory, `model` is optional and defaults to `mistral-small-latest`.
- `n` defaults to `1` and `safe_prompt` to `false`. Set `safe_prompt` to `true` to let Mistral prepend its safety prompt.

These are the fields of the inline `mistral` block. The keys of its `variables` object are also the ones a provider entry accepts:

##### Fields of Mistral integration

\* required fields

##### [`v1`](https://www.krakend.io/docs/enterprise/ai-gateway/mistral/#v1 "Click to copy link to v1")

All settings depend on a specific version, as the vendor might change the API over time.

##### [`credentials`](#v1-credentials "Click to copy link to credentials") * string

Your Mistral API key. You can set it as an environment variable for better security.

##### [`debug`](#v1-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to true in production as it may log sensitive data.

Defaults to `false`

##### [`input_template`](#v1-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to Mistral. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`output_template`](#v1-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from Mistral is transformed before being sent to the client. The default template extracts the text from the first choice returned by Mistral so in most cases you don’t need to set a custom output template.

##### [`variables`](#v1-variables "Click to copy link to variables") * object

The variables specific to the Mistral usage that are used to construct the payload.

##### [`extra_payload`](#variables-extra_payload "Click to copy link to extra_payload") object

A map of additional payload attributes you want to use in your custom `input_template` (this payload is not used in the default template). The attributes set here are accessible in your custom template as `{{ .variables.extra_payload.yourchosenkey }}`. This option helps adding rare customization and future attributes.

##### [`max_tokens`](#variables-max_tokens "Click to copy link to max_tokens") integer

An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.

##### [`model`](#variables-model "Click to copy link to model") * string

The name of the Mistral model you want to use. The value you provide is passed as is to Mistral and KrakenD does not prove if the model is currently accepted by the vendor. Check the available models on Mistral documentation.

Examples: `"mistral-small-latest"` , `"codestral-latest"`

##### [`n`](#variables-n "Click to copy link to n") integer

An integer value that specifies how many different completions (responses) the model should generate for a single input prompt. This can be useful for exploring multiple variations of the output.

Defaults to `1`

##### [`random_seed`](#variables-random_seed "Click to copy link to random_seed") integer

An integer value to seed the random number generator used by the model. Setting a specific seed can help produce reproducible results across different requests.

##### [`safe_prompt`](#variables-safe_prompt "Click to copy link to safe_prompt") boolean

A boolean flag to enable or disable Mistral’s safe prompt feature, which helps filter out inappropriate or harmful content from the model’s responses. By default, this feature is enabled to ensure safer interactions.

Defaults to `false`

##### [`stop`](#variables-stop "Click to copy link to stop") array of strings

An array of sequences where the model will stop generating further tokens if found. This can be useful to control the length and content of the output.

##### [`temperature`](#variables-temperature "Click to copy link to temperature") number

What sampling temperature to use, recommended between 0.0 and 0.7. Higher values like 0.7 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. Change this or top\_p but not both.

##### [`top_p`](#variables-top_p "Click to copy link to top_p") number

A float value between 0 and 1 that controls the nucleus sampling for text generation. It represents the cumulative probability threshold for token selection, where only the most probable tokens that add up to this threshold are considered. A higher value (closer to 1) allows for more diverse outputs, while a lower value (closer to 0) makes the output more focused and deterministic. Change this or temperature but not both.

Schema: [https://www.krakend.io/schema/v3.0/ai/mistral.json](https://www.krakend.io/schema/v3.0/ai/mistral.json "JSON schema definition")

## Streaming Mistral Responses

To forward the tokens as Mistral produces them, set the endpoint’s `output_encoding` to `streaming`. When the backend references a provider, also set `streaming` to `true` in the provider entry. Mistral streams through the same `/v1/chat/completions` endpoint, so nothing else changes. [LLM Streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/) explains the `format` option, which presents the stream in the OpenAI or Anthropic format.

## Default Mistral Prompt Templates

KrakenD talks to Mistral through a pair of default [prompt templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates). Replace either of them with your own [Go template](https://pkg.go.dev/text/template) file through `input_template` or `output_template` when you need a different payload or response. Use the defaults below as the starting point.

### Default Input Template

KrakenD builds the input template when it starts, writing the values of your `variables` into it. It only writes the `temperature`, `top_p`, `max_tokens`, `random_seed`, and `model` lines when they have a value. With the configuration of the examples above, the payload sent to Mistral comes from this template:

```go-text-template
{
	"max_tokens": 500,
	"model": "mistral-small-latest",
	"n": 1,
	"stream": false,
	"stop": [],
	"safe_prompt": false,
	"messages": [
	{{- if hasKey .req_body "instructions" }}
		{
			"role": "system",
			"content": {{ .req_body.instructions | toJson }}
		},
	{{- end }}
		{
			"role": "user",
			"content": {{ .req_body.contents | toJson }}
		}
	]
}
```

When you write your own input template, read your values from `.variables`, for example `{{ .variables.temperature }}`, and the extra attributes from `.variables.extra_payload`.

### Default Output Template

The default output template returns the generated text in `ai_gateway_response` and the token count of `usage.total_tokens` in `usage`:

```go-text-template
{
	"ai_gateway_response":
	[
		{{ if gt (len .resp_body.choices) 0 }}
		{
			"contents": [
				{{- range $index, $choice := .resp_body.choices }}
				{{- if $index }},{{ end }}
				{{ $choice.message.content | toJson }}
				{{- end }}
			]
		}
		{{ end }}
	],
	"usage": "{{ .resp_body.usage.total_tokens }}"
}
```

If your own output template drops the `usage` field, the [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) can no longer count the tokens of the response.
