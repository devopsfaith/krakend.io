# Unified LLM Interface

> Simplify multi-LLM integration by exposing a single, consistent API through KrakenD's unified LLM interface.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/

The Unified LLM Interface of KrakenD allows you to interact with one or more LLMs, removing the complexity of dealing with LLMs for the end user. It allows you to set the grounds to communicate with LLMs, authenticate, and treat requests and responses back and forth.

The unified LLM interface helps you to:

- **Route to the right LLM**
- **Abstract the request interface**
- **Abstract the response interface**
- **Declare every provider once** in a central inventory

## Routing to the right LLM

KrakenD’s LLM Routing and AI Proxy feature enables the distribution of AI requests across one or multiple Large Language Model. It supports various routing strategies including direct proxying, conditional routing based on request headers or policies, JWT claim-based routing, and path-based routing.

Read more about [LLM Routing](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/), or use the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/) to select a provider from the inventory on every request.

## Abstracting the request and response interfaces

The namespace `ai/llm` makes communication with several AI providers simpler as each vendor will require a different payload and communication style. The `ai/llm` namespace is able to pre-generate **Prompt Templates** for a series of vendors:

- [Google Gemini](https://www.krakend.io/docs/enterprise/ai-gateway/gemini/)
- [OpenAI / ChatGPT](https://www.krakend.io/docs/enterprise/ai-gateway/openai/)
- [Mistral](https://www.krakend.io/docs/enterprise/ai-gateway/mistral/)
- [Anthropic](https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/)
- [Bedrock](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/)
- [Alibaba Cloud (Qwen)](https://www.krakend.io/docs/enterprise/ai-gateway/alibaba/)
- [Other vendors](https://www.krakend.io/docs/enterprise/ai-gateway/other-vendors/)

When talking to the LLM through KrakenD, the user can concentrate in the query rather than in the whole payload needed to interact with the vendor API. The gateway takes care of formatting the API request and response, and allows you to treat different LLMs using the same format, so switching a provider is an easy task.

To stream the response back to the client instead of waiting for the full completion, see [Streaming LLM Responses with the AI Gateway](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/).

### Prompt Templates

Prompt Templates define how the system talks to each individual LLM, respecting their format and payload characteristics, allowing the user to define only the prompt.

When you talk to an LLM you need to send a body in a format that is different for each vendor. We call Prompt Templates the skeleton used to build the payload you will sned to the LLM. Prompt Templates are predefined templates that contain the variables the user needs to pass. Instead of allowing the end-user to construct the full-body that the LLM will receive (and opening the door to injecting malicious system directives), we ask just for the prompt. This is not only writing a text that you send to the LLM, but actually have the opportunity to insert place holders, values that came in the request body, headers, parameters, etc. or even apply scripting over it.

The Prompt Templates offer more control on the types of requests sent to the AI and allow you to specify system and user input to ensure the final output.

See each vendor documentation.

## LLM Provider Inventory

The **LLM provider inventory** is a service-level list of reusable LLM provider configurations declared under the `ai/providers` namespace. You define each provider once, giving it a unique `name` together with the vendor, model, and credentials it needs, and then reference that provider by name from other components instead of repeating the full configuration. Use it when several endpoints or backends connect to the same providers, so you keep credentials, models, and endpoints in a single source of truth. The inventory is intentionally minimal: a usable entry needs only a handful of options.

Security notice

The `credentials` of each provider live in your configuration. Set them through environment variables instead of writing the keys in plain text, and restrict access to the configuration file.

### Defining Providers

You declare the inventory in the root `extra_config` using the `ai/providers` namespace. The namespace holds a single `providers` list, where each entry describes one provider configuration. The minimum a usable entry needs is a `name` and a `provider` (the vendor: `openai`, `gemini`, `anthropic`, `mistral`, `bedrock`, or `alibaba`). Most vendors also require `credentials` to authenticate, but providers that rely on external authentication, such as AWS for Bedrock, can omit them. When you omit `endpoint` or `model`, KrakenD falls back to the vendor’s defaults, so entries like `gpt-default` and `reasoning` below are valid with only two or three fields:

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

The configuration above declares seven providers across five vendors. The `cheap-quick` entry points to a self-hosted OpenAI-compatible endpoint, while the rest rely on each vendor’s default endpoint. The `summaries` entry omits `credentials` because Bedrock authenticates through AWS. Replace every `"xxx"` with your real credentials, preferably through an environment variable.

A provider entry can also carry custom templates, streaming, debugging, and vendor-specific variables:

- `input_template` and `output_template` point to [Go template](https://pkg.go.dev/text/template) files that customize the request payload and the response transformation, the same mechanism as the [Prompt Templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates).
- `streaming` forwards the tokens to the client as the model produces them, and `format` normalizes the streamed output to the `anthropic` or `openai` wire format, regardless of the vendor. See [LLM streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/).
- `variables` carries provider-specific parameters such as `temperature`. The accepted keys depend on the `provider` and match the variables documented on each vendor’s page.
- `debug` logs the provider activity for troubleshooting. Do not enable it in production, as it may log sensitive data.

These are all the fields of the `ai/providers` namespace:

##### Fields of AI Providers

\* required fields

##### [`providers`](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#providers "Click to copy link to providers") * array of objects

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

### Referencing a Provider from the LLM Component

Once a provider exists in the inventory, components reference it by `name`. The `ai/llm` component replaces its inline vendor block with a single `provider` property:

```json
{
  "endpoint": "/",
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

The backend above resolves the `cheap-quick` provider from the inventory and uses its vendor, endpoint, model, and credentials, so it needs neither `host` nor `url_pattern`. Because the provider is referenced by name, you can reuse it across many backends and change its definition in one place. To choose among several providers on each request based on headers, policies, or a classifier, use the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/).

### Default Endpoints and Models

When you omit `endpoint` or `model` in a provider entry, KrakenD applies these defaults:

| Provider                                              | Default endpoint                                                                   | Default model              |
|-------------------------------------------------------|------------------------------------------------------------------------------------|----------------------------|
| [OpenAI](https://www.krakend.io/docs/enterprise/ai-gateway/openai/)         | `https://api.openai.com/v1/responses`                                              | `gpt-5.4-mini`             |
| [Google Gemini](https://www.krakend.io/docs/enterprise/ai-gateway/gemini/)  | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`  | `gemini-3.5-flash`         |
| [Anthropic](https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/)   | `https://api.anthropic.com/v1/messages`                                            | `claude-haiku-4-5`         |
| [Mistral](https://www.krakend.io/docs/enterprise/ai-gateway/mistral/)       | `https://api.mistral.ai/v1/chat/completions`                                       | `mistral-small-latest`     |
| [AWS Bedrock](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/)   | `https://bedrock-runtime.eu-west-1.amazonaws.com/model/{model}/converse`           | `eu.amazon.nova-lite-v1:0` |
| [Alibaba Cloud](https://www.krakend.io/docs/enterprise/ai-gateway/alibaba/) | `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/responses` | `qwen3.8-flash`            |

The Gemini and Bedrock default endpoints embed the selected `model` in the URL, and also change when you enable `streaming`; the defaults shown correspond to the default `model` without streaming. The Bedrock default targets the `eu-west-1` region; set `endpoint` to use a different region. See each provider’s page for the available model names and the variables accepted in the `variables` object.
