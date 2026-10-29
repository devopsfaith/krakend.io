# Alibaba Cloud Qwen Integration

> KrakenD integration to connect to Alibaba Cloud Qwen models without setting the full payload of the API interaction.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/alibaba/

The **Alibaba Cloud** integration enables KrakenD to talk to the Qwen family of models through [Alibaba Cloud Model Studio](https://www.alibabacloud.com/help/en/model-studio/), allowing you to embed language model capabilities into your API workflows without custom coding. Use it when you want to connect Qwen for tasks like intelligent automation, conversational AI, content generation, or other LLM-driven functionalities inside your existing API infrastructure.

This component abstracts the complexities of communicating with Alibaba’s API. When an API request hits your KrakenD endpoint configured with the Alibaba interface, KrakenD automatically constructs the necessary payload, handles authentication, and processes the responses uniformly. This consistent integration also allows you to switch between different LLM vendors without changing client-facing interfaces.

In essence, the user sends the textual content or instructions, and KrakenD manages the complete interaction with Alibaba behind the scenes.

## Configuration of the Alibaba Integration

To enable the Alibaba interface, add a backend in KrakenD with the `alibaba` vendor under the `ai/llm` namespace of its `extra_config`. For example:

```json
{
  "endpoint": "/qwen",
  "method": "POST",
  "backend": [
    {
      "host": [
        "https://token-plan.ap-southeast-1.maas.aliyuncs.com"
      ],
      "url_pattern": "/compatible-mode/v1/responses",
      "method": "POST",
      "extra_config": {
        "ai/llm": {
          "alibaba": {
            "v1": {
              "credentials": "sk-xxxx",
              "debug": false,
              "variables": {
                "model": "qwen3.8-flash"
              }
            }
          }
        }
      }
    }
  ]
}
```

The `host` and `url_pattern` above point to Alibaba’s default endpoint. Change the `host` to reach the region where your Model Studio account lives. The `credentials` hold your Alibaba API key; set them through an environment variable instead of writing the key in the configuration.

To interact with the LLM, the user can send in the request:

- `instructions` (optional): If you want to add a system prompt
- `contents`: The content you want to send to the template

Like this:

Using the endpoint 

```
$curl -XPOST --json '{"instructions": "Act as a 1000 dollar consultant", "contents": "Tell me a consultant joke"}' http://localhost:8080/qwen
```

The configuration options are:

##### Fields of Alibaba integration

\* required fields

##### [`v1`](https://www.krakend.io/docs/enterprise/ai-gateway/alibaba/#v1 "Click to copy link to v1")

All settings depend on a specific version, as the vendor might change the API over time.

##### [`credentials`](#v1-credentials "Click to copy link to credentials") * string

Your Alibaba API key. You can set it as an environment variable for better security.

Example: `"sk-xxxx"`

##### [`debug`](#v1-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to true in production as it may log sensitive data.

Defaults to `false`

##### [`input_template`](#v1-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to Alibaba. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`output_template`](#v1-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from Alibaba is transformed before being sent to the client. The default template extracts the text from the first choice returned by Alibaba so in most cases you don’t need to set a custom output template.

##### [`variables`](#v1-variables "Click to copy link to variables") * object

The variables specific to the Alibaba usage that are used to construct the payload.

##### [`extra_payload`](#variables-extra_payload "Click to copy link to extra_payload") object

A map of additional payload attributes you want to use in your custom `input_template` (this payload is not used in the default template). The attributes set here are accessible in your custom template as `{{ .variables.extra_payload.yourchosenkey }}`. This option helps adding rare customization and future attributes.

##### [`max_output_tokens`](#variables-max_output_tokens "Click to copy link to max_output_tokens") integer

An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens. Setting this value to `0` does not set any limit.

##### [`model`](#variables-model "Click to copy link to model") * string

The name of the Alibaba model you want to use. The value you provide is passed as is to Alibaba and KrakenD does not prove if the model is currently accepted by the vendor. Check the available models on Alibaba documentation.

Example: `"qwen3.8-flash"`

##### [`temperature`](#variables-temperature "Click to copy link to temperature") number

What sampling temperature to use, between `0` and `2`. Higher values like `0.8` will make the output more random, while lower values like `0.2` will make it more focused and deterministic.

##### [`top_p`](#variables-top_p "Click to copy link to top_p") number

The nucleus sampling, where the model considers the results of the tokens with top\_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.

##### [`truncation`](#variables-truncation "Click to copy link to truncation")

The strategy to use when truncating messages to fit within the model’s context length (, the model will truncate the response to fit the context window by dropping items from the beginning of the conversation.

Possible values are: `"auto"` , `"disabled"`

Defaults to `"disabled"`

Schema: [https://www.krakend.io/schema/v3.0/ai/alibaba.json](https://www.krakend.io/schema/v3.0/ai/alibaba.json "JSON schema definition")

This design keeps user input clean and focused only on content, while KrakenD handles building the full API request.

## Declaring Alibaba in the Provider Inventory

Instead of repeating the configuration in every backend, you can declare Alibaba once in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#llm-provider-inventory) and reference it by name from `ai/llm` or the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/). When you omit `endpoint` and `model`, the inventory uses Alibaba’s default endpoint and the `qwen3.8-flash` model:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "qwen",
          "provider": "alibaba",
          "credentials": "sk-xxxx"
        }
      ]
    }
  }
}
```

## Customizing the Payload Sent and Received from Alibaba

As it happens with all LLM interfaces of KrakenD, you can completely replace the request and the response so you have a custom interaction with the LLM. While the default template should allow you to accomplish any day to day job, you might need to extend it using your own template.

You may override the input and output Go templates by specifying:

- `input_template`: Path to a custom template controlling how the request data is formatted before sending it to Alibaba.
- `output_template`: Path to a custom template to transform and extract the desired pieces from Alibaba’s response.

Use `variables.extra_payload` to pass additional attributes to your custom `input_template`, accessible as `{{ .variables.extra_payload.yourchosenkey }}`.

When you don’t declare an `output_template`, the response from the AI is returned inside the `ai_gateway_response` field. If you prefer another name, add a `mapping` attribute to the backend without changing the template:

```json
{
  "url_pattern": "/compatible-mode/v1/responses",
  "mapping": {
    "ai_gateway_response": "my_response"
  }
}
```
