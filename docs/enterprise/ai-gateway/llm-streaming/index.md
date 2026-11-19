# Streaming LLM Responses with the AI Gateway

> Stream LLM completions token by token through KrakenD's ai/llm component, optionally normalized to the OpenAI or Anthropic format whatever the vendor.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/

**LLM streaming** delivers a large language model’s response to the client incrementally, as the model generates it, instead of waiting for the full completion. It builds on KrakenD’s [HTTP streaming](https://www.krakend.io/docs/enterprise/endpoints/streaming/) support and the `ai/llm` component, so the vendor credentials, the models, and the [provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) stay on the gateway as in non-streaming calls. Use it for chat and agent experiences where users expect tokens to appear in real time. Unlike the [unified request and response format](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#request-format) of non-streaming calls, clients speak the wire format of a vendor: the one behind the endpoint, or the OpenAI or Anthropic format you choose with the `format` option, so existing SDKs and agents work against KrakenD unchanged.

Streaming outside the AI Gateway

This page covers streaming LLM responses processed by the `ai/llm` component. To proxy an upstream SSE, NDJSON, or event-stream source without any AI-specific processing, see [Streaming and SSE](https://www.krakend.io/docs/enterprise/endpoints/streaming/) instead.

## Enabling LLM Streaming

Streaming needs two settings: `streaming` set to `true` in the provider entry of the inventory, and the endpoint’s `output_encoding` set to `streaming`. Unlike the generic `sse`, `ndjson`, and `eventstream` encodings, `streaming` is a pseudo-encoding reserved for the `ai/llm` component: KrakenD resolves it to the concrete wire format that the vendor and the `format` you configured require. For example, most vendors stream over Server-Sent Events (SSE), while AWS Bedrock streams over the `eventstream` binary framing.

A minimal endpoint that streams an OpenAI response looks like this:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "gpt-stream",
          "provider": "openai",
          "model": "gpt-5-nano",
          "credentials": "xxx",
          "streaming": true
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
              "provider": "gpt-stream"
            }
          }
        }
      ]
    }
  ]
}
```

Without `format`, clients send the same request they would send to the OpenAI Responses API, including `"stream": true`, and receive OpenAI’s native stream unchanged. KrakenD adds the credentials and replaces the `model` of the request with the one of the provider, so clients cannot choose a different model:

Stream an OpenAI response through KrakenD 

```
$curl -N -XPOST --json '{"input": "Tell me a joke", "stream": true}' http://localhost:8080/v1/responses
```

The `streaming` flag of the provider must match the endpoint, as explained in [Streaming Providers](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/#streaming-providers). Declare a separate provider entry when you need the same model with and without streaming.

## Normalizing the Output Format with format

The `format` option normalizes the stream to a single provider interface, so your clients speak one wire format no matter which vendor serves the request. KrakenD translates the client’s request into the vendor’s format, and the vendor’s stream back into the chosen format. For example, you can connect to Gemini, Mistral, or OpenAI and still deliver the stream in Anthropic’s format, letting a single client implementation consume any of them.

| Value                | Behavior                                                            |
|----------------------|---------------------------------------------------------------------|
| *(empty or omitted)* | Default. Clients use the configured vendor’s own format, unchanged. |
| `anthropic`          | Clients use the Anthropic Messages API format.                      |
| `openai`             | Clients use the OpenAI Responses API format.                        |

Set `format` in the provider entry. The following configuration connects to Gemini but serves the Anthropic Messages format:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "gemini-as-anthropic",
          "provider": "gemini",
          "model": "gemini-2.5-flash",
          "credentials": "xxx",
          "streaming": true,
          "format": "anthropic"
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/v1/messages",
      "method": "POST",
      "output_encoding": "streaming",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "gemini-as-anthropic"
            }
          }
        }
      ]
    }
  ]
}
```

A client built for the Anthropic Messages API can consume this endpoint unchanged, even though Gemini serves the request. Because the provider streams, KrakenD calls Gemini’s `streamGenerateContent` method automatically. Setting `format` to the vendor’s own format, such as `anthropic` on an Anthropic provider, changes nothing, as the stream is already in that format.

## Streaming with an Inline Vendor Configuration

When the backend uses an [inline vendor block](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#inline-vendor-configuration) instead of a provider reference, set `format` next to the vendor block, and point `url_pattern` to the vendor’s streaming method yourself:

```json
{
  "endpoint": "/v1/messages",
  "method": "POST",
  "output_encoding": "streaming",
  "backend": [
    {
      "host": ["https://generativelanguage.googleapis.com"],
      "url_pattern": "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
      "extra_config": {
        "ai/llm": {
          "format": "anthropic",
          "gemini": {
            "v1beta": {
              "credentials": "xxx"
            }
          }
        }
      }
    }
  ]
}
```

This backend behaves like the previous example. The `?alt=sse` query string switches Gemini’s own API into streaming mode, while `output_encoding` only controls how KrakenD talks to the client. Each vendor exposes streaming through its own URL:

- **OpenAI**: the same `/v1/responses` endpoint as non-streaming requests.
- **Gemini**: the `streamGenerateContent` method with `?alt=sse` appended, as shown above.
- **Anthropic**: the same `/v1/messages` endpoint as non-streaming requests.
- **Mistral**: the same `/v1/chat/completions` endpoint as non-streaming requests.
- **Bedrock**: the `converse-stream` method instead of `converse`, for example `/model/{model}/converse-stream`, the streaming counterpart of the [Converse API](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/). Without `format`, KrakenD streams the response with the `eventstream` wire format instead of SSE, which `output_encoding: "streaming"` resolves automatically.
- **Alibaba Cloud**: the same `/compatible-mode/v1/responses` endpoint as non-streaming requests.

Providers of the inventory select these URLs on their own.

## Configuration Example

The following configuration exposes five vendors behind the same Anthropic-compatible streaming interface. Each provider sets `streaming` to `true` and `format` to `anthropic`, so a single client implementation works across all the endpoints:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "extra_config": {
    "ai/providers": {
      "providers": [
        {
          "name": "openai-stream",
          "provider": "openai",
          "model": "gpt-5-nano",
          "credentials": "xxx",
          "streaming": true,
          "format": "anthropic"
        },
        {
          "name": "gemini-stream",
          "provider": "gemini",
          "model": "gemini-2.5-flash",
          "credentials": "xxx",
          "streaming": true,
          "format": "anthropic"
        },
        {
          "name": "anthropic-stream",
          "provider": "anthropic",
          "model": "claude-haiku-4-5",
          "credentials": "xxx",
          "streaming": true,
          "format": "anthropic"
        },
        {
          "name": "mistral-stream",
          "provider": "mistral",
          "model": "mistral-small-latest",
          "credentials": "xxx",
          "streaming": true,
          "format": "anthropic"
        },
        {
          "name": "bedrock-stream",
          "provider": "bedrock",
          "model": "eu.amazon.nova-lite-v1:0",
          "credentials": "bedrock-api-key-xxx",
          "streaming": true,
          "format": "anthropic",
          "variables": {
            "max_tokens": 1500
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/openai/v1/messages",
      "method": "POST",
      "output_encoding": "streaming",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "openai-stream"
            }
          }
        }
      ]
    },
    {
      "endpoint": "/gemini/v1/messages",
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
    },
    {
      "endpoint": "/anthropic/v1/messages",
      "method": "POST",
      "output_encoding": "streaming",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "anthropic-stream"
            }
          }
        }
      ]
    },
    {
      "endpoint": "/mistral/v1/messages",
      "method": "POST",
      "output_encoding": "streaming",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "mistral-stream"
            }
          }
        }
      ]
    },
    {
      "endpoint": "/bedrock/v1/messages",
      "method": "POST",
      "output_encoding": "streaming",
      "backend": [
        {
          "extra_config": {
            "ai/llm": {
              "provider": "bedrock-stream"
            }
          }
        }
      ]
    }
  ]
}
```

Every endpoint returns an Anthropic-format stream, whatever the vendor that serves it. KrakenD calls the streaming method of each vendor, and resolves the Bedrock `eventstream` framing into the Server-Sent Events that Anthropic clients expect.

## See Also

- [Streaming and SSE](https://www.krakend.io/docs/enterprise/endpoints/streaming/) for streaming that doesn’t go through the AI Gateway, including the underlying `sse`, `ndjson`, and `eventstream` encodings.
- [LLM Provider Inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/) for the provider options, including `streaming` and `format`.
- [Token Budgets](https://www.krakend.io/docs/enterprise/ai-gateway/budget-control/#token-budget-for-streaming-responses) to cap the tokens that streaming responses consume.
- [LLM Routing Strategies](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/) to choose which provider serves each request.
