# OpenAI Integration

> Connect KrakenD to OpenAI models through the unified LLM interface, from the provider inventory or an inline backend configuration.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/openai/

The **OpenAI integration** connects KrakenD to the [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses) through the `ai/llm` component of the [unified LLM interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/). Clients send only the prompt in the [unified request format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format), and KrakenD builds the OpenAI payload, authenticates with your credentials, and returns the [unified response](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#response-format). Use it to offer OpenAI models behind your own API without sharing your credentials with clients. Because clients never see the OpenAI API, you can move them to another model or vendor later without changing a line of their code.

Keep the OpenAI credentials out of the configuration file

Inject the `credentials` through an environment variable with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) instead of writing them in plain text, and restrict access to the configuration file.

## Declaring OpenAI in the Provider Inventory

The recommended way to connect to OpenAI is to declare it once in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) and reference it by name from every backend that needs it. The following configuration declares a `gpt` provider and exposes it on `/openai`:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "gpt",
          "provider": "openai",
          "model": "gpt-5-nano",
          "credentials": "xxx",
          "variables": {
            "max_output_tokens": 500
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/openai",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "gpt"
            }
          }
        }
      ]
    }
  ]
}
```

The backend needs neither `host` nor `url_pattern`, because the inventory knows the OpenAI endpoint. Any other backend, or the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), can reuse the `gpt` provider by name. Clients call the endpoint like this:

Send a prompt to OpenAI through KrakenD 

```
$curl -XPOST --json '{"instructions": "Answer in one sentence", "contents": "What is an API gateway?"}' http://localhost:8080/openai
```

## Inline OpenAI Configuration

Instead of a provider reference, you can write the OpenAI configuration in the backend itself, under the `openai` key of the `ai/llm` namespace and the `v1` API version. In this case, the backend sets the `host` and `url_pattern` of the OpenAI API:

```json
{
  "endpoint": "/openai",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://api.openai.com"
      ],
      "url_pattern": "/v1/responses",
      "extra_config": {
        "ai/llm": {
          "openai": {
            "v1": {
              "credentials": "xxx",
              "variables": {
                "model": "gpt-5-nano",
                "max_output_tokens": 500
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

## OpenAI Configuration Options

The provider entry of the inventory and the inline block accept the same `credentials`, `variables`, `input_template`, `output_template`, and `debug` options. KrakenD sends the `credentials` as a bearer token in the `Authorization` header. Keep in mind:

- The inline block requires `variables.model`. In the inventory, `model` is optional and defaults to `gpt-5.4-mini`.
- `truncation` defaults to `disabled`, so OpenAI returns an error instead of silently dropping part of a long conversation.

These are the fields of the inline `openai` block. The keys of its `variables` object are also the ones a provider entry accepts:

##### Fields of OpenAI integration

\* required fields

##### [`v1`](https://www.krakend.io/docs/enterprise/ai-gateway/openai/#v1 "Click to copy link to v1")

All settings depend on a specific version, as the vendor might change the API over time.

##### [`credentials`](#v1-credentials "Click to copy link to credentials") * string

Your OpenAI API key. You can set it as an environment variable for better security.

Example: `"sk-xxxx"`

##### [`debug`](#v1-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to true in production as it may log sensitive data.

Defaults to `false`

##### [`input_template`](#v1-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to OpenAI. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`output_template`](#v1-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from OpenAI is transformed before being sent to the client. The default template extracts the text from the first choice returned by OpenAI so in most cases you don’t need to set a custom output template.

##### [`variables`](#v1-variables "Click to copy link to variables") * object

The variables specific to the OpenAI usage that are used to construct the payload.

##### [`extra_payload`](#variables-extra_payload "Click to copy link to extra_payload") object

A map of additional payload attributes you want to use in your custom `input_template` (this payload is not used in the default template). The attributes set here are accessible in your custom template as `{{ .variables.extra_payload.yourchosenkey }}`. This option helps adding rare customization and future attributes.

##### [`max_output_tokens`](#variables-max_output_tokens "Click to copy link to max_output_tokens") integer

An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens. Setting this value to `0` does not set any limit.

##### [`model`](#variables-model "Click to copy link to model") * string

The name of the OpenAI model you want to use. The value you provide is passed as is to OpenAI and KrakenD does not prove if the model is currently accepted by the vendor. Check the available models on OpenAI documentation.

Examples: `"gpt-5-nano"` , `"gpt-4"`

##### [`temperature`](#variables-temperature "Click to copy link to temperature") number

What sampling temperature to use, between `0` and `2`. Higher values like `0.8` will make the output more random, while lower values like `0.2` will make it more focused and deterministic.

##### [`top_p`](#variables-top_p "Click to copy link to top_p") number

The nucleus sampling, where the model considers the results of the tokens with top\_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.

##### [`truncation`](#variables-truncation "Click to copy link to truncation")

The strategy to use when truncating messages to fit within the model’s context length (, the model will truncate the response to fit the context window by dropping items from the beginning of the conversation.

Possible values are: `"auto"` , `"disabled"`

Defaults to `"disabled"`

Schema: [https://www.krakend.io/schema/v3.0/ai/openai.json](https://www.krakend.io/schema/v3.0/ai/openai.json "JSON schema definition")

## Streaming OpenAI Responses

To forward the tokens as OpenAI produces them, set the endpoint’s `output_encoding` to `streaming`. When the backend references a provider, also set `streaming` to `true` in the provider entry. OpenAI streams through the same `/v1/responses` endpoint, so nothing else changes. [LLM Streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/) explains the `format` option, which presents the stream in the OpenAI or Anthropic format.

## Default OpenAI Prompt Templates

KrakenD talks to OpenAI through a pair of default [prompt templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates). Replace either of them with your own [Go template](https://pkg.go.dev/text/template) file through `input_template` or `output_template` when you need a different payload or response. Use the defaults below as the starting point.

### Default Input Template

KrakenD builds the input template when it starts, writing the values of your `variables` into it. It only writes the `temperature`, `top_p`, `max_output_tokens`, and `model` lines when they have a value. With the configuration of the examples above, the payload sent to OpenAI comes from this template:

```go-text-template
{
	"max_output_tokens": 500,
	"model": "gpt-5-nano",
	"stream": false,
	"truncation": "disabled",
	{{ if hasKey .req_body "instructions" }}"instructions": {{ .req_body.instructions | toJson }},{{ end }}
	"input": {{ .req_body.contents | toJson }}
}
```

When you write your own input template, read your values from `.variables`, for example `{{ .variables.temperature }}`, and the extra attributes from `.variables.extra_payload`.

### Default Output Template

The default output template returns the generated text in `ai_gateway_response` and the token count of `usage.total_tokens` in `usage`:

```go-text-template
{
	"ai_gateway_response": [
		{{ if gt (len .resp_body.output) 0 }}
		{
			"contents": [
			{{ range $output := .resp_body.output }}
			{{ if hasKey $output "content" }}
				{{ range $index, $part := $output.content }}
				{{ if $index }},{{ end }}
				{{ $part.text | toJson }}
				{{ end }}
			{{ end }}
			{{ end }}
			]
		}
		{{ end }}
	],
	"usage": "{{ .resp_body.usage.total_tokens }}"
}
```

If your own output template drops the `usage` field, the [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) can no longer count the tokens of the response.
