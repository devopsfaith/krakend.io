# LLM Provider Inventory

> Declare each LLM provider once with its vendor, model, and credentials using ai/providers, and reference it by name from any backend or the AI Router.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/

The **LLM provider inventory** is a service-level list of reusable LLM provider configurations declared under the `ai/providers` namespace. You define each provider once, giving it a unique `name` together with the vendor, model, and credentials it needs, and then reference that provider by name from the [`ai/llm` component](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/) or the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/) instead of repeating the full configuration on every backend. Use it whenever several endpoints connect to the same providers, so credentials, models, and endpoints live in a single place. A usable entry needs only two or three fields, and it is the recommended way to configure LLM connections in KrakenD.

Keep provider credentials out of the configuration file

The `credentials` of each provider live in your configuration. Inject them through environment variables with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) instead of writing the keys in plain text, and restrict access to the configuration file.

## Declaring Providers

You declare the inventory in the root `extra_config` using the `ai/providers` namespace. The namespace holds a single `providers` list, where each entry describes one provider configuration. The minimum a usable entry needs is a `name` and a `provider` (the vendor: `openai`, `gemini`, `anthropic`, `mistral`, `bedrock`, or `alibaba`). Set `credentials` to the API key of the vendor. When you leave it empty, KrakenD sends no authentication header, which only suits servers that require no key, such as a local [OpenAI-compatible server](https://www.krakend.io/docs/enterprise/ai-gateway/other-vendors/#openai-compatible-servers). When you omit `endpoint` or `model`, KrakenD uses the [vendor’s defaults](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/#default-endpoints-and-models).

The following configuration declares seven providers across five vendors:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "cheap-quick",
          "provider": "openai",
          "endpoint": "https://custom-self-hosted.example.com/v1/responses",
          "model": "gpt-4o-mini",
          "credentials": "xxx"
        },
        {
          "name": "gpt-default",
          "provider": "openai",
          "credentials": "xxx"
        },
        {
          "name": "gemini-flash",
          "provider": "gemini",
          "model": "gemini-2.5-flash",
          "credentials": "xxx"
        },
        {
          "name": "coding-basic",
          "provider": "anthropic",
          "model": "claude-haiku-4-5",
          "credentials": "xxx"
        },
        {
          "name": "coding-team",
          "provider": "anthropic",
          "model": "claude-sonnet-4-6",
          "credentials": "xxx"
        },
        {
          "name": "reasoning",
          "provider": "mistral",
          "credentials": "xxx"
        },
        {
          "name": "summaries",
          "provider": "bedrock",
          "model": "eu.amazon.nova-lite-v1:0",
          "credentials": "xxx",
          "debug": true,
          "variables": {
            "max_tokens": 1500
          }
        }
      ]
    }
  }
}
```

The `cheap-quick` entry points to a self-hosted OpenAI-compatible endpoint, while the rest rely on each vendor’s default endpoint. The `gpt-default` and `reasoning` entries set only a vendor and credentials, so they also use the vendor’s default model. Replace every `"xxx"` with your real credentials, preferably through an environment variable.

Besides the vendor, model, endpoint, and credentials, a provider entry accepts these options:

- `variables` carries provider-specific parameters such as `temperature` or `max_tokens`. The accepted keys depend on the `provider` and match the variables documented on each vendor’s page, such as [OpenAI](https://www.krakend.io/docs/enterprise/ai-gateway/openai/) or [Anthropic](https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/).
- `input_template` and `output_template` point to [Go template](https://pkg.go.dev/text/template) files that replace the default request payload and response transformation. See [Prompt Templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates).
- `streaming` and `format` turn the provider into a streaming one, as explained in [Streaming Providers](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/#streaming-providers).
- `debug` logs the provider activity for troubleshooting. Do not enable it in production, as it may log sensitive data.

These are all the fields of the `ai/providers` namespace:

##### Fields of AI Providers

\* required fields

##### [`providers`](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/#providers "Click to copy link to providers") * array of objects

The array of AI providers available for referencing from the backends. Each object is a different provider declaration.

Each item of providers accepts the following properties:

##### [`credentials`](#providers-credentials "Click to copy link to credentials") string

The API key used to authenticate against the provider. Inject it with an environment variable instead of writing it in the configuration.

##### [`debug`](#providers-debug "Click to copy link to debug") boolean

Enables the debug mode to log activity for troubleshooting. Do not set this value to `true` in production as it may log sensitive data.

Defaults to `false`

##### [`endpoint`](#providers-endpoint "Click to copy link to endpoint") string

Overrides the default API endpoint of the provider. Set it when you need to reach a proxy, a private deployment, or a region-specific host instead of the vendor’s public API. When you don’t set it, each provider uses its own default endpoint. Gemini and Bedrock build theirs from the `model` and `streaming` values, so their default shown here corresponds to the default `model` without streaming.

##### [`format`](#providers-format "Click to copy link to format")

Wire format KrakenD exposes to the client for streaming responses, when not defined, the request and response format is not modified. Only anthropic and openai stream formats are supported client-side, regardless of the upstream connector. When defined, KrakenD translates the client’s request into the upstream connector’s format, and translates the streamed response back into this format before returning it.

Possible values are: `"anthropic"` , `"openai"`

##### [`input_template`](#providers-input_template "Click to copy link to input_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets the payload format sent to the provider. You don’t need to set this value unless you want to override the default template making use of all the `variables` listed in this configuration.

##### [`model`](#providers-model "Click to copy link to model") string

The name of the model you want to use. The value you provide is passed as is to the provider and KrakenD does not check if the model is currently accepted by the vendor. Check the available models on the vendor documentation. When you don’t set it, each provider uses its own default model.

##### [`name`](#providers-name "Click to copy link to name") * string

A unique name for this provider declaration. This is the name you use to reference the provider from the backends, so you declare its settings once and reuse them everywhere.

Example: `"fast-chat"`

##### [`output_template`](#providers-output_template "Click to copy link to output_template") string

A path to a custom [Go template](https://pkg.go.dev/text/template) that sets how the response from the provider is transformed before being sent to the client. The default template extracts the text from the first choice returned by the provider so in most cases you don’t need to set a custom output template.

##### [`provider`](#providers-provider "Click to copy link to provider") *

The AI vendor this declaration connects to. The chosen vendor determines which `variables` are accepted.

Possible values are: `"anthropic"` , `"bedrock"` , `"gemini"` , `"mistral"` , `"openai"` , `"alibaba"`

##### [`streaming`](#providers-streaming "Click to copy link to streaming") boolean

Enables streaming responses, so the tokens generated by the model are forwarded to the client as they are produced instead of waiting for the complete response.

Defaults to `false`

##### [`variables`](#providers-variables "Click to copy link to variables") object

The variables KrakenD uses to build the payload for the chosen `provider`.

Schema: [https://www.krakend.io/schema/v3.0/ai/providers.json](https://www.krakend.io/schema/v3.0/ai/providers.json "JSON schema definition")

## Referencing a Provider from a Backend

Once a provider exists in the inventory, the `ai/llm` component references it by `name` with a single `provider` property, instead of an inline vendor block:

```json
{
  "endpoint": "/chat",
  "method": "POST",
  "backend": [
    {
      "extra_config": {
        "ai/llm": {
          "provider": "cheap-quick"
        }
      }
    }
  ]
}
```

The backend above resolves the `cheap-quick` provider from the inventory and sends the request to its `endpoint`, with its model and credentials, so it needs neither `host` nor `url_pattern`. Because you reference the provider by name, you can reuse it across many backends and change its definition in one place.

When `ai/llm` references a provider, it accepts no other option: every setting, including `format`, belongs to the inventory entry. To choose among several providers on each request, based on headers, policies, or a classifier, use the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), which references the same inventory.

## Streaming Providers

Set `streaming` to `true` in a provider entry to forward the tokens to the client as the model produces them. Add `format` to normalize the streamed output to the `openai` or `anthropic` wire format, regardless of the vendor behind the provider. [LLM Streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/) explains both options in detail.

The `streaming` flag of the provider must match the endpoint that uses it: a streaming provider requires an endpoint with a streaming `output_encoding`, and a non-streaming provider requires an endpoint without it. When they do not match, the endpoint answers every request with a `500` status code, and KrakenD logs an error like this one at startup:

```log
KRAKEND ERROR: [BACKEND: POST /chat -> POST /][AI/LLM] Failed to load provider: gemini-stream provider gemini-stream streaming flag true does not match backend encoding
```

Declare two entries for the same model when you need it both with and without streaming.

The following configuration streams Gemini responses in the OpenAI format:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "gemini-stream",
          "provider": "gemini",
          "model": "gemini-2.5-flash",
          "credentials": "xxx",
          "streaming": true,
          "format": "openai"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/v1/responses",
      "method": "POST",
      "output_encoding": "streaming",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "gemini-stream"
            }
          }
        }
      ]
    }
  ]
}
```

Clients send OpenAI Responses requests to `/v1/responses` and receive an OpenAI-formatted stream, while Gemini serves the request. Because `streaming` is `true`, KrakenD calls Gemini’s streaming endpoint automatically. For example:

Stream a Gemini response in the OpenAI format 

```
$curl -N -XPOST --json '{"input": "Tell me a joke", "stream": true}' http://localhost:8080/v1/responses
```

The response arrives as Server-Sent Events with the OpenAI Responses event types, such as `response.output_text.delta`, and ends with a `response.completed` event that carries the token usage.

## Default Endpoints and Models

When you omit `model` in a provider entry, KrakenD uses the default model of the vendor:

| Provider                                                          | Default model              |
|-------------------------------------------------------------------|----------------------------|
| [OpenAI](https://www.krakend.io/docs/enterprise/ai-gateway/openai/) (`openai`)          | `gpt-5.4-mini`             |
| [Google Gemini](https://www.krakend.io/docs/enterprise/ai-gateway/gemini/) (`gemini`)   | `gemini-3.5-flash`         |
| [Anthropic](https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/) (`anthropic`) | `claude-haiku-4-5`         |
| [Mistral](https://www.krakend.io/docs/enterprise/ai-gateway/mistral/) (`mistral`)       | `mistral-small-latest`     |
| [AWS Bedrock](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/) (`bedrock`)   | `eu.amazon.nova-lite-v1:0` |
| [Alibaba Cloud](https://www.krakend.io/docs/enterprise/ai-gateway/alibaba/) (`alibaba`) | `qwen3.8-flash`            |

When you omit `endpoint`, KrakenD sends the requests to the default endpoint of the `provider`:

```text
openai     https://api.openai.com/v1/responses
gemini     https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
anthropic  https://api.anthropic.com/v1/messages
mistral    https://api.mistral.ai/v1/chat/completions
bedrock    https://bedrock-runtime.eu-west-1.amazonaws.com/model/{model}/converse
alibaba    https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/responses
```

The Gemini and Bedrock default endpoints embed the selected `model` in the URL. With `streaming` enabled, they also switch to the vendor’s streaming method: Gemini uses `{model}:streamGenerateContent?alt=sse` and Bedrock uses `{model}/converse-stream`. The other vendors stream through the same endpoint. The Bedrock default targets the `eu-west-1` region; set `endpoint` to use a different region.
