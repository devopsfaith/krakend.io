# Unified LLM Interface

> Connect backends to OpenAI, Gemini, Anthropic, Mistral, Bedrock, or Qwen with the ai/llm component and give clients one request and response format.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/

The **unified LLM interface** is the `ai/llm` component that connects a KrakenD backend to a Large Language Model (LLM) vendor. Clients send only the prompt in a short, vendor-independent JSON body, and KrakenD builds the vendor-specific payload, adds the credentials, calls the vendor, and turns the answer into the same response format for every vendor. Use it to put OpenAI, Google Gemini, Anthropic, Mistral, AWS Bedrock, or Alibaba Cloud Qwen behind your API without exposing their APIs or keys to clients. Because the client contract never changes, you can switch the model or the vendor behind an endpoint without touching any client.

![ai-gateway-unified-llm.seq.mmd diagram](https://www.krakend.io/images/documentation/diagrams/ai-gateway-unified-llm.seq.mmd.svg)

## How the Unified LLM Interface Works

For every request to a backend with the `ai/llm` component, KrakenD:

1. Reads the client’s request body, which contains the prompt in `contents` and, optionally, a system prompt in `instructions`.
2. Builds the payload the vendor expects with a **prompt template**, adding the model and the variables you configured, such as `temperature` or `max_tokens`.
3. Sends the request to the vendor with the credentials of the configuration, so clients never see the API key.
4. Transforms the vendor’s response with an output template into the unified response, which contains the generated text and the token usage.

The default templates cover each vendor’s chat or completion API, and you can replace them with your own (see [Prompt Templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates)). The component also reports the token usage of every call as [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) metrics and trace attributes when you enable telemetry.

## Connecting a Backend to an LLM

You can tell the `ai/llm` component which vendor to use in two ways: by referencing a provider from the LLM provider inventory, which is the recommended option, or by writing the vendor configuration inline in the backend.

### LLM Provider Inventory

The [LLM Provider Inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) declares each provider once in the root `extra_config` under the `ai/providers` namespace, with its vendor, model, and credentials. Backends then reference it by `name`. The following configuration declares an OpenAI provider and exposes it on `/chat`:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "chat",
          "provider": "openai",
          "model": "gpt-5-nano",
          "credentials": "xxx"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/chat",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "chat"
            }
          }
        }
      ]
    }
  ]
}
```

The backend needs neither `host` nor `url_pattern`, because KrakenD sends the request to the provider’s endpoint, the OpenAI default in this case. To move `/chat` to another model or vendor, change the `chat` entry and every backend that references it follows. The same inventory feeds the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), which chooses a provider on each request.

### Inline Vendor Configuration

Instead of a provider reference, the `ai/llm` component accepts a vendor block keyed by the vendor name and the API version. In this case, the backend sets the `host` and `url_pattern` of the vendor API itself:

```json
{
  "endpoint": "/chat",
  "method": "POST",
  "backend": [
    {
      "host": ["https://api.openai.com"],
      "url_pattern": "/v1/responses",
      "extra_config": {
        "ai/llm": {
          "openai": {
            "v1": {
              "credentials": "xxx",
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

This backend behaves like the previous example. Use the inline form when a backend needs a vendor configuration that no other backend shares, or to keep configurations written before the inventory existed. Each vendor page documents its block and the accepted `variables`:

- [OpenAI](https://www.krakend.io/docs/enterprise/ai-gateway/openai/)
- [Google Gemini](https://www.krakend.io/docs/enterprise/ai-gateway/gemini/)
- [Mistral](https://www.krakend.io/docs/enterprise/ai-gateway/mistral/)
- [Anthropic](https://www.krakend.io/docs/enterprise/ai-gateway/anthropic/)
- [AWS Bedrock](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/)
- [Alibaba Cloud (Qwen)](https://www.krakend.io/docs/enterprise/ai-gateway/alibaba/)

To reach a vendor that is not on this list, see [Other AI Vendors](https://www.krakend.io/docs/enterprise/ai-gateway/other-vendors/).

The `ai/llm` namespace takes either a `provider` reference or exactly one vendor block, keyed by `openai`, `gemini`, `mistral`, `anthropic`, `bedrock`, or `alibaba`, whose fields are documented on each vendor page. Next to a vendor block, `format` sets the wire format of [streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/) responses. With a `provider` reference, set `format` in the inventory entry instead:

##### Fields of the ai/llm namespace

\* required fields

##### [`format`](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#format "Click to copy link to format")

Wire format KrakenD exposes to the client for streaming responses, when not defined, the request and response format is not modified. Only anthropic and openai stream formats are supported client-side, regardless of the upstream connector. When defined, KrakenD translates the client’s request into the upstream connector’s format, and translates the streamed response back into this format before returning it.

Possible values are: `"anthropic"` , `"openai"`

##### [`provider`](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#provider "Click to copy link to provider") string

The `name` of a provider declared in the service-level `ai/providers` configuration. Use it instead of a vendor block so you declare the connection settings once and reuse them on every backend.

Example: `"fast-chat"`

Schema: [https://www.krakend.io/schema/v3.0/ai/llm.json](https://www.krakend.io/schema/v3.0/ai/llm.json "JSON schema definition")

## Request Format

On endpoints that return the full completion, clients send a JSON body with these fields, whatever the vendor behind the endpoint:

- `contents` (required): the prompt, as a string.
- `instructions` (optional): a system prompt that sets the behavior of the model.

For example, with the `/chat` endpoint of the previous examples:

Send a prompt through the unified LLM interface 

```
$curl -XPOST --json '{"instructions": "Answer in one sentence", "contents": "What is an API gateway?"}' http://localhost:8080/chat
```

Clients cannot set the model, the system configuration, or any other part of the vendor payload, because the prompt template only reads these two fields. This keeps the payload under your control and prevents clients from injecting their own system directives or picking a more expensive model.

## Response Format

The default output template returns the generated text inside `ai_gateway_response`, together with the total number of tokens the call consumed in `usage`:

```json
{
  "ai_gateway_response": [
    {
      "contents": [
        "An API gateway is a single entry point that routes, secures, and manages the traffic between clients and backend services."
      ]
    }
  ],
  "usage": "52"
}
```

The `usage` value is a string. Use it to enforce [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) with the quota component, which reads string values too. When you prefer another name for `ai_gateway_response`, add a [`mapping`](https://www.krakend.io/docs/enterprise/backends/data-manipulation/#mapping) to the backend instead of writing a custom template:

```json
{
  "mapping": {
    "ai_gateway_response": "answer"
  }
}
```

## Prompt Templates

**Prompt templates** define how KrakenD talks to each vendor. The input template builds the payload sent to the LLM, and the output template builds the response returned to the client. Every vendor has a default pair, documented on its page, and you can replace either of them with your own [Go template](https://pkg.go.dev/text/template) file:

- `input_template`: the path to the template that builds the request payload.
- `output_template`: the path to the template that transforms the vendor response.

Both options go in the provider entry of the inventory or in the inline vendor block. Custom templates let you add placeholders, read values from other parts of the request, or fix part of the prompt, so the client only fills the gaps. The templates can access these values:

| Value                                             | Available in     | Content                                                          |
|---------------------------------------------------|------------------|------------------------------------------------------------------|
| `.req_body`                                       | Input and output | The request body sent by the client                              |
| `.req_headers`                                    | Input and output | The request headers listed in the endpoint’s `input_headers`     |
| `.req_params`                                     | Input and output | The parameters of the endpoint URL                               |
| `.req_querystring`                                | Input and output | The query strings listed in the endpoint’s `input_query_strings` |
| `.req_path` and `.req_method`                     | Input and output | The path and method of the request                               |
| `.variables`                                      | Input and output | The `variables` of the configuration, including `extra_payload`  |
| `.resp_body`, `.resp_headers`, and `.resp_status` | Output           | The vendor response                                              |

The `variables.extra_payload` object holds any extra attribute your custom input template needs, accessible as `{{ .variables.extra_payload.yourkey }}`. The default templates ignore it. Templates support the same functions as the [request body generator](https://www.krakend.io/docs/enterprise/backends/body-generator/).

When your output template drops the `usage` field, the [quota](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) can no longer count tokens from the response. The token metrics are not affected, because KrakenD reads them from the vendor response before the output template runs.

## Streaming LLM Responses

By default, KrakenD waits for the full completion before answering. To forward the tokens as the model produces them, see [LLM Streaming](https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/). Streaming endpoints do not use the request and response format of this page: clients send their requests and receive the stream in the wire format of a vendor, either the vendor behind the endpoint or the OpenAI or Anthropic format you choose with `format`.
