# Mistral Integration

> KrakenD integration to connect to Mistral without setting the full payload of the API interaction.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/mistral/

The Mistral integration enables KrakenD to talk to Mistral’s AI services, allowing you to embed powerful language model capabilities into your API workflows without custom coding. Use this interface when you want to connect Mistral for tasks like intelligent automation, conversational AI, content generation, or other LLM-driven functionalities inside your existing API infrastructure.

This component abstracts the complexities of communicating with [Mistral’s AI API](https://docs.mistral.ai/api/). When an API request hits your KrakenD endpoint configured with the Mistral interface, KrakenD automatically constructs the necessary Mistral API payload, handles authentication, and processes the responses uniformly. This consistent integration also allows if needed to switch between different LLM vendors without changing client-facing interfaces.

In essence, the user sends the textual content or instructions, and KrakenD manages the complete interaction with Mistral behind the scenes.

## Configuration of the Mistral integration

To enable the Mistral interface, you add a backend configuration in KrakenD with the `extra_config` key under the `ai/llm` namespace. Example:

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
      "method": "POST",
      "extra_config": {
        "ai/llm": {
          "mistral": {
            "v1": {
              "credentials": "xxxxxxxxx",
              "debug": false,
              "variables": {
                "model": "mistral-small-latest"
              }
            }
          }
        }
      }
    }
  ]
}
```

To interact with the LLM, the user can send in the request:

- `instructions` (optional): If you want to add a system prompt
- `contents`: The content you want to send to the template

Like this:

Using the endpoint 

```
$curl -XPOST --json '{"instructions": "Act as a 1000 dollar consultant", "contents": "Tell me a consultant joke"}' http://localhost:8080/mistral
```

The configuration options are:

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

This design keeps user input clean and focused only on content, while KrakenD handles building the full API request.

## Customizing the payload sent and received from Mistral

As it happens with all LLM interfaces of KrakenD, you can completely replace the request and the response so you have a custom interaction with the LLM. While the default template should allow you to accomplish any day to day job, you might need to extend it using your own template.

You may override the input and output Go templates by specifying:

- `input_template`: Path to a custom template controlling how the request data is formatted before sending to Mistral.
- `output_template`: Path to a custom template to transform and extract the desired pieces from Mistral’s response.

See below how to change this interaction

### Default input\_template for Mistral v1

When you don’t set any `input_template`, KrakenD will create the JSON payload sent to Mistral using the following template:

```gotmpl
{
	"model": {{ .variables.model | toJson }},
	{{ $temperature :=  .variables.temperature }}{{ if ge $temperature 0.0 }}"temperature": {{ $temperature }},{{ end }}
	{{ $top_p := .variables.top_p }}{{ if ge $top_p 0.0 }}"top_p": {{ $top_p }},{{ end }}
	{{ $max_tokens := .variables.max_tokens }}{{ if ge $max_tokens 0 }}"max_tokens": {{ $max_tokens }},{{ end }}
	{{ $random_seed := .variables.random_seed }}{{ if ge $random_seed 0 }}"random_seed": {{ $random_seed }},{{ end }}
	"n":  {{ .variables.n }},
	"stream": false,
	"stop":  {{ .variables.stop | toJson }},
	"safe_prompt":  {{ .variables.safe_prompt }},
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

### Default output\_template for Mistral v1

When you don’t declare an `output_template`, the response from the AI is transformed to have the following format:

```gotmpl
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

If you are not confortable receiveing the response in the `ai_gateway_response` field, you can add to the backend a mapping attribute to use another name, without changing the template:

```json
{
	"url_pattern": "...",
	"mapping": {
		"ai_gateway_response": "my_response"
	}
}
```
