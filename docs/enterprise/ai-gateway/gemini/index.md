# Google Gemini integration

> Connect to Google Gemini APIs using an abstracted interface allowing you to concentrate on content rather than format

Source: https://www.krakend.io/docs/enterprise/ai-gateway/gemini/

The Gemini interface allows KrakenD to use [Gemini’s API](https://ai.google.dev/gemini-api/docs) **without writing custom integration code**, enabling intelligent automation, content generation, or any LLM-powered use case within your existing API infrastructure.

This component abstracts you from the Gemini API usage allowing the consumer to concentrate on the prompt only, as for each request to an endpoint, KrakenD will create the **Gemini request** with all the necessary elements in their API, and will return a **unified response**, so if you use other vendors you have a consitent use of LLM models.

In other words, the user sends the content, like “tell me a joke!”, and then KrakenD builds the API payload necessary to talk to Gemini.

This Gemini interface configures a backend within KrakenD that transparently forwards REST requests to Gemini’s API endpoints. It manages authentication, versioning, and payload formatting using its custom templating system. This way, you can easily call Gemini models without writing custom integration code.

A simple configuration looks like this:

```json
{
  "endpoint": "/gemini",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://generativelanguage.googleapis.com"
      ],
      "url_pattern": "/v1beta/models/gemini-2.5-flash:generateContent",
      "method": "POST",
      "extra_config": {
        "ai/llm": {
          "gemini": {
            "v1beta": {
              "credentials": "XXX_YYY_ZZZ",
              "debug": true,
              "variables": {
                "candidates": 3
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
$curl -XPOST --json '{"instructions": "Act as a 1000 dollar consultant", "contents": "Tell me a consultant joke"}' http://localhost:8080/gemini
```

## Configuration of Gemini

The configuration of Gemini requires you to add under your backend `extra_config` the `ai/llm` namespace with the `Gemini` vendor.

##### Fields of Google Gemini integration

\* required fields

##### [`v1beta`](https://www.krakend.io/docs/enterprise/ai-gateway/gemini/#v1beta "Click to copy link to v1beta") object

All settings depend on a specific version, as the vendor might change the API over time.

##### [`credentials`](#v1beta-credentials "Click to copy link to credentials") * string

Your Google Gemini API key. You can set it as an environment variable for better security.

##### [`debug`](#v1beta-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to true in production as it may log sensitive data.

Defaults to `false`

##### [`input_template`](#v1beta-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to Google Gemini. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`output_template`](#v1beta-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from Google Gemini is transformed before being sent to the client. The default template extracts the text from the first choice returned by Google Gemini so in most cases you don’t need to set a custom output template.

##### [`variables`](#v1beta-variables "Click to copy link to variables") object

The variables specific to the Google Gemini usage that are used to construct the payload.

##### [`candidate_count`](#variables-candidate_count "Click to copy link to candidate_count") integer

An integer value that specifies how many different completions (responses) the model should generate for a single input prompt. This can be useful for exploring multiple variations of the output.

Defaults to `1`

##### [`extra_payload`](#variables-extra_payload "Click to copy link to extra_payload") object

A map of additional payload attributes you want to use in your custom `input_template` (this payload is not used in the default template). The attributes set here are accessible in your custom template as `{{ .variables.extra_payload.yourchosenkey }}`. This option helps adding rare customization and future attributes.

##### [`max_output_tokens`](#variables-max_output_tokens "Click to copy link to max_output_tokens") integer

Maximum number of tokens that can be generated in the response. A token is approximately four characters. 100 tokens correspond to roughly 60-80 words.

##### [`stop_sequences`](#variables-stop_sequences "Click to copy link to stop_sequences") array of strings

An array of sequences where the model will stop generating further tokens if found. This can be useful to control the length and content of the output.

##### [`temperature`](#variables-temperature "Click to copy link to temperature") number

The temperature is used for sampling during response generation, which occurs when topP and topK are applied. Temperature controls the degree of randomness in token selection. Lower temperatures are good for prompts that require a less open-ended or creative response, while higher temperatures can lead to more diverse or creative results.

##### [`top_k`](#variables-top_k "Click to copy link to top_k") integer

Top-K changes how the model selects tokens for output. A top-K of 1 means the next selected token is the most probable among all tokens in the model’s vocabulary (also called greedy decoding), while a top-K of 3 means that the next token is selected from among the three most probable tokens by using temperature.

##### [`top_p`](#variables-top_p "Click to copy link to top_p") number

Top-P changes how the model selects tokens for output. Tokens are selected from the most probable to least probable until the sum of their probabilities equals the top-P value. For example, if tokens A, B, and C have a probability of 0.3, 0.2, and 0.1 and the top-P value is 0.5, then the model will select either A or B as the next token by using temperature and excludes C as a candidate.

Schema: [https://www.krakend.io/schema/v3.0/ai/gemini.json](https://www.krakend.io/schema/v3.0/ai/gemini.json "JSON schema definition")

## Customizing the payload sent and received from Gemini

As it happens with all LLM interfaces of KrakenD, you can completely replace the request and the response so you have a custom interaction with the LLM. While the default template should allow you to accomplish any day to day job, you might need to extend it using your own template.

You may override the input and output Go templates by specifying:

- `input_template`: Path to a custom template controlling how the request data is formatted before sending to Gemini.
- `output_template`: Path to a custom template to transform and extract the desired pieces from Gemini’s response.

See below how to change this interaction

### Default input\_template for Gemini v1beta

When you don’t set any `input_template`, KrakenD will create the JSON payload sent to Gemini using the following template:

```gotmpl
{
	"generationConfig": {
		{{ $max_tokens := .variables.max_tokens }}{{ if ge $max_tokens 0 }}"maxOutputTokens": {{ $max_tokens }},{{ end }}
		{{ $temperature := .variables.temperature }}{{ if ge $temperature 0.0 }}"temperature": {{ $temperature }},{{ end }}
		{{ $top_p := .variables.top_p }}{{ if ge $top_p 0.0 }}"topP": {{ $top_p }},{{ end }}
		{{ $top_k := .variables.top_k }}{{ if ge $top_k 0 }}"topK": {{ $top_k }},{{ end }}
		"candidateCount": {{ .variables.candidate_count | toJson }},
		"stopSequences": {{ .variables.stop_sequences | toJson }}
	},
	{{- if hasKey .req_body "instructions" }}
	"system_instruction": {
		"parts": [
			{
				"text": {{ .req_body.instructions | toJson }}
			}
		]
	},
	{{ end }}
	"contents": [
		{
			"parts": [
				{
					"text": {{ .req_body.contents | toJson }}
				}
			]
		}
	]
}
```

Remember you can access your own `variables` declared in the configuration using `{{ .variables.xxx }}`.

### Default output\_template for Gemini v1beta

When you don’t declare an `output_template`, the response from the AI is transformed to have the following format:

```gotmpl
{
	"ai_gateway_response":
	[
		{{ if gt (len .resp_body.candidates) 0 }}
		{
			"contents": [
			{{ range $ci, $candidate := .resp_body.candidates }}
				{{ range $index, $part := $candidate.content.parts }}
				{{ if $ci }},{{ end }}
				{{ $part.text | toJson }}
				{{ end }}
			{{ end }}
			]
		}
		{{ end }}
	],
	"usage": "{{ .resp_body.usageMetadata.totalTokenCount }}"
}
```
