# Other AI Vendors and OpenAI-Compatible Servers

> Connect KrakenD to LLM vendors and self-hosted servers without a dedicated integration, through an OpenAI-compatible provider or your own templates.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/other-vendors/

KrakenD can connect to **other AI vendors** and self-hosted model servers that have no dedicated integration in the [unified LLM interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/). When the server implements the OpenAI Responses API, as Ollama and vLLM do, declare it as an `openai` provider with its own `endpoint` and you get the full unified interface: the same request and response format, token metrics, routing, and streaming. For any other API, write the payload yourself with the request body generator, which works with any vendor at the cost of building and maintaining the templates.

## OpenAI-Compatible Servers

Many vendors and inference servers expose an API compatible with OpenAI. When it implements the [Responses API](https://platform.openai.com/docs/api-reference/responses) (`/v1/responses`), declare it in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) with `provider` set to `openai` and `endpoint` pointing to the server. For example, the following configuration exposes a local Ollama server on `/local`:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "local-llama",
          "provider": "openai",
          "endpoint": "http://localhost:11434/v1/responses",
          "model": "llama3.2"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/local",
      "method": "POST",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "local-llama"
            }
          }
        }
      ]
    }
  ]
}
```

KrakenD sends the [OpenAI payload](https://www.krakend.io/docs/enterprise/ai-gateway/openai/#default-input-template) to the Ollama endpoint with the `llama3.2` model, and clients use the [unified request format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format):

Send a prompt to a local Ollama server through KrakenD 

```
$curl -XPOST --json '{"contents": "What is an API gateway?"}' http://localhost:8080/local
```

The entry has no `credentials` because a local Ollama server requires none, so KrakenD sends no `Authorization` header. For a server that requires a key, set `credentials` and KrakenD sends it as a bearer token. Because the server is a regular provider, you can reference it from the [AI Router](https://www.krakend.io/docs/enterprise/ai-gateway/ai-router/), stream its responses, and enforce [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/) on it like on any other vendor.

Check the Responses API support of your server

Ollama supports `/v1/responses` from version 0.13.3, without its stateful features. vLLM and other servers implement it to different degrees. When your server only offers `/v1/chat/completions`, use the request body generator described below.

## Any Other Vendor API

When the vendor API is not compatible with any supported integration, build the payload yourself. Any AI integration needs two things:

1. The payload format of the vendor endpoint, which the [request body generator](https://www.krakend.io/docs/enterprise/backends/body-generator/) builds from the client request.
2. The vendor authentication, which a [Martian header modifier](https://www.krakend.io/docs/enterprise/backends/martian/#header-modifier) adds to the request.

The following configuration exposes the DeepSeek Chat Completions API on `/deepseek`:

```json
{
  "endpoint": "/deepseek",
  "method": "POST",
  "backend": [
    {
      "host": ["https://api.deepseek.com"],
      "url_pattern": "/chat/completions",
      "extra_config": {
        "modifier/request-body-generator": {
          "path": "/etc/krakend/templates/deepseek.tmpl",
          "content_type": "application/json"
        },
        "modifier/martian": {
          "header.Modifier": {
            "scope": ["request"],
            "name": "Authorization",
            "value": "Bearer YOUR_DEEPSEEK_API_KEY"
          }
        }
      }
    }
  ]
}
```

The `deepseek.tmpl` template builds the Chat Completions payload from the `contents` and `instructions` fields of the client request, the same fields the unified interface uses:

```go-text-template
{
  "model": "deepseek-chat",
  "stream": false,
  "messages": [
    {{- if hasKey .req_body "instructions" }}
    { "role": "system", "content": {{ .req_body.instructions | toJson }} },
    {{- end }}
    { "role": "user", "content": {{ .req_body.contents | toJson }} }
  ]
}
```

The same template works for other servers that implement the Chat Completions API, such as Ollama on `/v1/chat/completions`, after changing the `model`. For a vendor with a different payload, adapt the template to the format of its documentation. Inject the API key through an environment variable with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) instead of writing it in the configuration.

### Returning the Unified Response

Without more configuration, the endpoint returns the vendor response as is. To give clients the same [unified response](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#response-format) as the other vendors, add a [response body generator](https://www.krakend.io/docs/enterprise/backends/response-body-generator/) to the backend:

```json
{
  "modifier/response-body-generator": {
    "path": "/etc/krakend/templates/chat-completions-response.tmpl",
    "content_type": "application/json"
  }
}
```

With this template, which reads the first choice of a Chat Completions response:

```go-text-template
{
  "ai_gateway_response": [
    {
      "contents": [
        {{ (index .resp_body.choices 0).message.content | toJson }}
      ]
    }
  ],
  "usage": "{{ .resp_body.usage.total_tokens }}"
}
```

The `usage` field keeps the response compatible with the [token budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/). This approach does not report the token metrics of the `ai/llm` component, which only covers the supported vendors and the providers of the inventory.
