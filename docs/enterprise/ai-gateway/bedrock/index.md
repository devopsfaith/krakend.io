# Amazon Bedrock Integration

> Connect KrakenD to the models of Amazon Bedrock through the unified LLM interface, from the provider inventory or an inline backend configuration.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/

The **Amazon Bedrock integration** connects KrakenD to the [Bedrock Converse API](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-call.html) through the `ai/llm` component of the [unified LLM interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/). Clients send only the prompt in the [unified request format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format), and KrakenD builds the Amazon Bedrock payload, authenticates with your credentials, and returns the [unified response](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#response-format). Use it to offer Amazon Bedrock models behind your own API without sharing your credentials with clients. Because clients never see the Amazon Bedrock API, you can move them to another model or vendor later without changing a line of their code.

Keep the Amazon Bedrock credentials out of the configuration file

Inject the `credentials` through an environment variable with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) instead of writing them in plain text, and restrict access to the configuration file.

## Declaring Amazon Bedrock in the Provider Inventory

The recommended way to connect to Amazon Bedrock is to declare it once in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) and reference it by name from every backend that needs it. The following configuration declares a `nova` provider and exposes it on `/bedrock`:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "nova",
          "provider": "bedrock",
          "model": "eu.amazon.nova-lite-v1:0",
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
      "endpoint": "/bedrock",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "nova"
            }
          }
        }
      ]
    }
  ]
}
```

The backend needs neither `host` nor `url_pattern`, because the inventory knows the Amazon Bedrock endpoint. Any other backend, or the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), can reuse the `nova` provider by name. Clients call the endpoint like this:

Send a prompt to Amazon Bedrock through KrakenD 

```
$curl -XPOST --json '{"instructions": "Answer in one sentence", "contents": "What is an API gateway?"}' http://localhost:8080/bedrock
```

## Inline Amazon Bedrock Configuration

Instead of a provider reference, you can write the Amazon Bedrock configuration in the backend itself, under the `bedrock` key of the `ai/llm` namespace and the `v1` API version. In this case, the backend sets the `host` and `url_pattern` of the Amazon Bedrock API:

```json
{
  "endpoint": "/bedrock",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://bedrock-runtime.eu-west-1.amazonaws.com"
      ],
      "url_pattern": "/model/eu.amazon.nova-lite-v1:0/converse",
      "extra_config": {
        "ai/llm": {
          "bedrock": {
            "v1": {
              "credentials": "xxx",
              "variables": {
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

## Amazon Bedrock Configuration Options

The provider entry of the inventory and the inline block accept the same `credentials`, `variables`, `input_template`, `output_template`, and `debug` options. KrakenD sends the `credentials`, a [Bedrock API key](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html), as a bearer token in the `Authorization` header. Keep in mind:

- Bedrock selects the model and the region in the URL, not in the payload. In the inventory, KrakenD builds the URL from `model`, which defaults to `eu.amazon.nova-lite-v1:0`, and targets the `eu-west-1` region; set `endpoint` to use another region. In an inline block, write the region in `host` and the model in `url_pattern`.

These are the fields of the inline `bedrock` block. The keys of its `variables` object are also the ones a provider entry accepts:

##### Fields of Bedrock integration

\* required fields

##### [`v1`](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/#v1 "Click to copy link to v1")

All settings depend on a specific version, as the vendor might change the API over time.

##### [`credentials`](#v1-credentials "Click to copy link to credentials") * string

Your Bedrock API key. You can set it as an environment variable for better security.

##### [`debug`](#v1-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to true in production as it may log sensitive data.

Defaults to `false`

##### [`input_template`](#v1-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to Bedrock. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`output_template`](#v1-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from Bedrock is transformed before being sent to the client. The default template extracts the text from the first choice returned by Bedrock so in most cases you don’t need to set a custom output template.

##### [`variables`](#v1-variables "Click to copy link to variables") * object

The variables specific to the Bedrock usage that are used to construct the payload.

##### [`extra_payload`](#variables-extra_payload "Click to copy link to extra_payload") object

A map of additional payload attributes you want to use in your custom `input_template` (this payload is not used in the default template). The attributes set here are accessible in your custom template as `{{ .variables.extra_payload.yourchosenkey }}`. This option helps adding rare customization and future attributes.

##### [`max_tokens`](#variables-max_tokens "Click to copy link to max_tokens") integer

An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.

##### [`stop_sequences`](#variables-stop_sequences "Click to copy link to stop_sequences") array of strings

An array of sequences where the model will stop generating further tokens if found. This can be useful to control the length and content of the output.

##### [`temperature`](#variables-temperature "Click to copy link to temperature") number

What sampling temperature to use, recommended between 0.0 and 0.7. Higher values like 0.7 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. Change this or top\_p but not both.

##### [`top_k`](#variables-top_k "Click to copy link to top_k") integer

Top-K changes how the model selects tokens for output. A top-K of 1 means the next selected token is the most probable among all tokens in the model’s vocabulary (also called greedy decoding), while a top-K of 3 means that the next token is selected from among the three most probable tokens by using temperature.

##### [`top_p`](#variables-top_p "Click to copy link to top_p") number

A float value between 0 and 1 that controls the nucleus sampling for text generation. It represents the cumulative probability threshold for token selection, where only the most probable tokens that add up to this threshold are considered. A higher value (closer to 1) allows for more diverse outputs, while a lower value (closer to 0) makes the output more focused and deterministic. Change this or temperature but not both.

Schema: [https://www.krakend.io/schema/v3.0/ai/bedrock.json](https://www.krakend.io/schema/v3.0/ai/bedrock.json "JSON schema definition")

## Streaming Amazon Bedrock Responses

To forward the tokens as Amazon Bedrock produces them, set the endpoint’s `output_encoding` to `streaming`. When the backend references a provider, also set `streaming` to `true` in the provider entry. Bedrock streams through a different method, `converse-stream`, and uses the binary `eventstream` framing instead of Server-Sent Events. A streaming provider in the inventory switches to it automatically. An inline backend must set it in `url_pattern`, as in `/model/eu.amazon.nova-lite-v1:0/converse-stream`. With `format` set to `openai` or `anthropic`, clients receive Server-Sent Events. [LLM Streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/) explains the `format` option, which presents the stream in the OpenAI or Anthropic format.

## Default Amazon Bedrock Prompt Templates

KrakenD talks to Amazon Bedrock through a pair of default [prompt templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates). Replace either of them with your own [Go template](https://pkg.go.dev/text/template) file through `input_template` or `output_template` when you need a different payload or response. Use the defaults below as the starting point.

### Default Input Template

KrakenD builds the input template when it starts, writing the values of your `variables` into it. It only writes the `maxTokens`, `temperature`, `topP`, and `topK` lines when they have a value. With the configuration of the examples above, the payload sent to Amazon Bedrock comes from this template:

```go-text-template
{
	"inferenceConfig": {
		"maxTokens": 500,
		"stopSequences": []
	},
	{{- if hasKey .req_body "instructions" }}
	"system": [
		{
			"text": {{ .req_body.instructions | toJson }}
		}
	],
	{{ end }}
	"messages": [
		{
			"content": [
				{
					"text": {{ .req_body.contents | toJson }}
				}
			],
			"role": "user"
		}
	]
}
```

When you write your own input template, read your values from `.variables`, for example `{{ .variables.temperature }}`, and the extra attributes from `.variables.extra_payload`.

### Default Output Template

The default output template returns the generated text in `ai_gateway_response` and the token count of `usage.totalTokens` in `usage`:

```go-text-template
{
	"ai_gateway_response":
	[
		{{ if gt (len .resp_body.output.message.content) 0 }}
		{
			"contents": [
			{{ range $ci, $content := .resp_body.output.message.content }}
				{{ if $ci }},{{ end }}
				{{ $content.text | toJson }}
			{{ end }}
			]
		}
		{{ end }}
	],
	"usage": "{{ .resp_body.usage.totalTokens }}"
}
```

If your own output template drops the `usage` field, the [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) can no longer count the tokens of the response.
