# OpenAI Integration

> KrakenD integration to connect to OpenAI without setting the full payload of the API interaction.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/openai/

The OpenAI interface allows KrakenD to use [OpenAI’s API](https://platform.openai.com/docs/overview) **without writing custom integration code**, enabling intelligent automation, content generation, or any LLM-powered use case within your existing API infrastructure.

This component abstracts you from the OpenAI API usage allowing the consumer to concentrate on the prompt only, as for each request to an endpoint, KrakenD will create the **OpenAI request** with all the necessary elements in their API, and will return a **unified response**, so if you use other vendors you have a consitent use of LLM models.

In other words, the user sends the content, like “tell me a joke!”, and then KrakenD builds the API payload necessary to talk to OpenAI.

This OpenAI interface configures a backend within KrakenD that transparently forwards REST requests to OpenAI’s API endpoints. It manages authentication, versioning, and payload formatting using its custom templating system. This way, you can easily call OpenAI models without writing custom integration code.

A simple configuration looks like this:

```json
{
  "endpoint": "/openai",
  "method": "POST",
  "backend": [
    {
      "host": ["https://api.openai.com"],
      "url_pattern": "/v1/responses",
      "method": "POST",
      "extra_config": {
        "ai/llm": {
          "openai": {
            "v1": {
              "credentials": "xx-yy-zz",
              "debug": false,
              "variables": {
                "model": "gpt-5-nano"
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
$curl -XPOST --json '{"instructions": "Act as a 1000 dollar consultant", "contents": "Tell me a consultant joke"}' http://localhost:8080/openapi
```

## Configuration of OpenAI

The configuration of OpenAI requires you to add under your backend `extra_config` the `ai/llm` namespace with the `openai` vendor.

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

## Customizing the payload sent and received from OpenAI

As it happens with all LLM interfaces of KrakenD, you can completely replace the request and the response so you have a custom interaction with the LLM. While the default template should allow you to accomplish any day to day job, you might need to extend it using your own template.

You may override the input and output Go templates by specifying:

- `input_template`: Path to a custom template controlling how the request data is formatted before sending to OpenAI.
- `output_template`: Path to a custom template to transform and extract the desired pieces from OpenAI’s response.

See below how to change this interaction

### Default input\_template for v1

When you don’t set any `input_template`, KrakenD will create the JSON payload sent to OpenAI using the following template:

```gotmpl
{
	"model": {{ .variables.model | toJson }},
	{{ $max_output_tokens := .variables.max_output_tokens }}{{ if ge $max_output_tokens 0 }}"max_output_tokens": {{ $max_output_tokens }},{{ end }}
	{{ $temperature := .variables.temperature }}{{ if ge $temperature 0.0 }}"temperature": {{ $temperature }},{{ end }}
	{{ $top_p := .variables.top_p }}{{ if ge $top_p 0.0 }}"top_p": {{ $top_p }},{{ end }}
	"stream": false,
	"truncation": "disabled",
	{{ if hasKey .req_body "instructions" }}"instructions": {{ .req_body.instructions | toJson }},{{ end }}
	"input": {{ .req_body.contents | toJson }}
}
```

Remember you can access your own `variables` declared in the configuration using `{{ .variables.xxx }}`.

### Default output\_template for v1

When you don’t declare an `output_template`, the response from the AI is transformed to have the following format:

```gotmpl
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
