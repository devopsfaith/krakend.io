# Amazon Web Services Bedrock integration

> Connect to AWS Bedrock APIs using an abstracted interface, allowing you to concentrate on content rather than format

Source: https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/

The Bedrock interface allows KrakenD to use [Bedrock’s Converse API](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-call.html) **without writing custom integration code**, enabling intelligent automation, content generation, or any LLM-powered use case within your existing API infrastructure.

This component abstracts you from the Bedrock API, allowing the consumer to focus solely on the prompt. For each request to an endpoint, KrakenD will create the **Bedrock request** with all the necessary elements in its API and return a **unified response**, so if you use other vendors, you have a consistent use of LLM models.

In other words, the user sends content, like “tell me a joke!”, and KrakenD builds the API payload needed to talk to Bedrock.

This Bedrock interface configures a backend within KrakenD that transparently forwards REST requests to Bedrock’s API endpoints. It manages authentication, versioning, and payload formatting using its custom templating system. This way, you can easily call Bedrock models without writing custom integration code.

A simple configuration looks like this:

```json
{
  "endpoint": "/bedrock",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://bedrock-runtime.eu-west-1.amazonaws.com"
      ],
      "url_pattern": "/model/eu.meta.llama3-2-1b-instruct-v1:0/converse",
      "method": "POST",
      "extra_config": {
        "ai/llm": {
          "bedrock": {
            "v1": {
              "credentials": "bedrock-api-key-xxx",
              "debug": true,
              "variables": {
                "max_tokens": 1500
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
$curl -XPOST --json '{"instructions": "Act as a 1000 dollar consultant", "contents": "Tell me a consultant joke"}' http://localhost:8080/bedrock
```

## Configuration of Bedrock

The Bedrock configuration requires you to add the `ai/llm` namespace under your backend’ extra\_config’, with the `Bedrock` vendor.

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

## Customizing the payload sent and received from Bedrock

As with all KrakenD LLM interfaces, you can completely replace the request and response to have a custom interaction with the LLM. While the default template should allow you to accomplish any day-to-day job, you might need to extend it using your own template.

You may override the input and output Go templates by specifying:

- `input_template`: Path to a custom template controlling how the request data is formatted before sending to Bedrock.
- `output_template`: Path to a custom template to transform and extract the desired pieces from Bedrock’s response.

See below how to change this interaction.

### Default input\_template for Bedrock v1

When you don’t set any `input_template`, KrakenD will create the JSON payload sent to Bedrock using the following template:

```gotmpl
{
	"inferenceConfig": {
		{{ $max_tokens := .variables.max_tokens }}{{ if ge $max_tokens 0 }}"maxTokens": {{ $max_tokens }},{{ end }}
		{{ $temperature := .variables.temperature }}{{ if ge $temperature 0.0 }}"temperature": {{ $temperature }},{{ end }}
		{{ $top_p := .variables.top_p }}{{ if ge $top_p 0.0 }}"topP": {{ $top_p }},{{ end }}
		{{ $top_k := .variables.top_k }}{{ if ge $top_k 0 }}"topK": {{ $top_k }},{{ end }}
		"stopSequences": {{ .variables.stop_sequences | toJson }}
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

Remember, you can access your own `variables` declared in the configuration using `{{ .variables.xxx }}`.

### Default output\_template for Bedrock v1

When you don’t declare an `output_template`, the response from the AI is transformed to have the following format:

```gotmpl
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
