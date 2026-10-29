# Streaming LLM Responses with the AI Gateway

> Stream LLM completions token by token through KrakenD's ai/llm component, optionally normalized to a single vendor format regardless of the backend.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/llm-streaming/

**LLM streaming** delivers a large language model’s response to the client incrementally, as the model generates it, instead of waiting for the full completion. It builds on KrakenD’s [HTTP streaming](https://www.krakend.io/docs/enterprise/endpoints/streaming/) support and the `ai/llm` component from the [Unified LLM Interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/), so requests still go through the same abstraction you already use for non-streaming LLM calls. Use it for chat and agent experiences where users expect tokens to appear in real time. The key difference from the non-streaming case: KrakenD does not force a single wire format across vendors when streaming, you choose it explicitly with the `format` option.

Streaming outside the AI Gateway

This page covers streaming LLM responses processed by the `ai/llm` component. To proxy an upstream SSE, NDJSON, or event-stream source without any AI-specific processing, see [Streaming and SSE](https://www.krakend.io/docs/enterprise/endpoints/streaming/) instead.

## Enabling LLM Streaming

Set the endpoint’s `output_encoding` to `streaming`. Unlike the generic `sse`, `ndjson`, and `eventstream` encodings, `streaming` is a pseudo-encoding reserved for the `ai/llm` component: KrakenD resolves it to whichever concrete wire format the vendor and the `format` you configured actually require, so you don’t need to track which encoding each combination uses. For example, most vendors stream over SSE, while AWS Bedrock streams over the `eventstream` binary framing.

A minimal endpoint that streams an OpenAI response looks like this:

```json
{
  "endpoint": "/v1/chat",
  "output_encoding": "streaming",
  "method": "POST",
  "backend": [
    {
      "method": "POST",
      "host": ["https://api.openai.com"],
      "url_pattern": "/v1/responses",
      "extra_config": {
        "ai/llm": {
          "openai": {
            "v1": {
              "credentials": "xxx",
              "variables": {
                "model": "gpt-4o-mini"
              }
            }
          }
        }
      }
    }
  ]
}
```

With `format` omitted, KrakenD streams OpenAI’s own native response format to the client unchanged, only wrapped through the `ai/llm` request abstraction. To present the stream in a different vendor’s interface, add `format`, described next.

## Normalizing the Output Format with format

The `format` option, set inside `extra_config.ai/llm`, normalizes the streamed output to a single provider interface, so your clients speak one wire format no matter which vendor actually serves the request. For example, you can connect to Gemini, Mistral, or OpenAI and still deliver the stream in Anthropic’s format, letting a single client implementation consume any of them.

| Value                | Behavior                                                               |
|----------------------|------------------------------------------------------------------------|
| *(empty or omitted)* | Default. Streams the configured vendor’s own native format, unchanged. |
| `anthropic`          | Normalizes the stream to the Anthropic Messages API format.            |
| `openai`             | Normalizes the stream to the OpenAI format.                            |

Supported format values

`format` currently accepts `anthropic` or `openai`. More provider formats are planned for future releases.

The following endpoint connects to Gemini but streams the output in Anthropic’s format:

```json
{
  "endpoint": "/v1/messages",
  "output_encoding": "streaming",
  "method": "POST",
  "backend": [
    {
      "method": "POST",
      "host": ["https://generativelanguage.googleapis.com"],
      "url_pattern": "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
      "extra_config": {
        "ai/llm": {
          "format": "anthropic",
          "gemini": {
            "v1beta": {
              "credentials": "xxx",
              "variables": {
                "model": "gemini-2.5-flash"
              }
            }
          }
        }
      }
    }
  ]
}
```

Notice the `url_pattern` targets Gemini’s `streamGenerateContent` method with `?alt=sse`, the query string Gemini requires to switch its own API into streaming mode; `output_encoding: "streaming"` only controls how KrakenD talks to the client, not how you call the vendor. A client built for the Anthropic Messages API can consume this endpoint unchanged, even though the request is actually served by Gemini.

## Vendor Notes

Each vendor exposes streaming through its own combination of URL and parameters, independent of the `format` you choose:

- **OpenAI**: streams through the same `/v1/responses` endpoint used for non-streaming requests; only `output_encoding` changes.
- **Gemini**: requires the `streamGenerateContent` method with `?alt=sse` appended to `url_pattern`, as shown above, so Gemini’s own API emits Server-Sent Events.
- **Anthropic**: streams through the same `/v1/messages` endpoint used for non-streaming requests. Setting `format` to `anthropic` against an Anthropic backend is a no-op, since it is already the vendor’s native format.
- **Mistral**: streams through the same `/v1/chat/completions` endpoint used for non-streaming requests; only `output_encoding` changes.
- **Bedrock**: requires the `converse-stream` method instead of `converse` in `url_pattern` (for example, `/model/{model}/converse-stream`), Bedrock’s streaming counterpart of the [Converse API](https://www.krakend.io/docs/enterprise/ai-gateway/bedrock/). KrakenD streams the response using the `eventstream` wire format instead of SSE, which `output_encoding: "streaming"` resolves automatically.

## Configuration Example

The following endpoints expose five different vendors behind the same Anthropic-compatible streaming interface. Each sets `output_encoding` to `streaming` and `format` to `anthropic`, so a single client implementation works across all of them:

```json
{
  "endpoints": [
    {
      "endpoint": "/openai/v1/messages",
      "output_encoding": "streaming",
      "method": "POST",
      "backend": [
        {
          "method": "POST",
          "host": ["https://api.openai.com"],
          "url_pattern": "/v1/responses",
          "extra_config": {
            "ai/llm": {
              "format": "anthropic",
              "openai": {
                "v1": {
                  "credentials": "xxx",
                  "variables": {
                    "model": "gpt-4o-mini"
                  }
                }
              }
            }
          }
        }
      ]
    },
    {
      "endpoint": "/gemini/v1/messages",
      "output_encoding": "streaming",
      "method": "POST",
      "backend": [
        {
          "method": "POST",
          "host": ["https://generativelanguage.googleapis.com"],
          "url_pattern": "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
          "extra_config": {
            "ai/llm": {
              "format": "anthropic",
              "gemini": {
                "v1beta": {
                  "credentials": "xxx",
                  "variables": {
                    "model": "gemini-2.5-flash"
                  }
                }
              }
            }
          }
        }
      ]
    },
    {
      "endpoint": "/anthropic/v1/messages",
      "output_encoding": "streaming",
      "method": "POST",
      "input_query_strings": ["beta"],
      "input_headers": ["Anthropic-Beta"],
      "backend": [
        {
          "method": "POST",
          "host": ["https://api.anthropic.com"],
          "url_pattern": "/v1/messages",
          "extra_config": {
            "ai/llm": {
              "format": "anthropic",
              "anthropic": {
                "v1": {
                  "credentials": "xxx",
                  "variables": {
                    "model": "claude-haiku-4-5"
                  }
                }
              }
            }
          }
        }
      ]
    },
    {
      "endpoint": "/mistral/v1/messages",
      "output_encoding": "streaming",
      "method": "POST",
      "backend": [
        {
          "method": "POST",
          "host": ["https://api.mistral.ai"],
          "url_pattern": "/v1/chat/completions",
          "extra_config": {
            "ai/llm": {
              "format": "anthropic",
              "mistral": {
                "v1": {
                  "credentials": "xxx",
                  "variables": {
                    "model": "mistral-small-latest"
                  }
                }
              }
            }
          }
        }
      ]
    },
    {
      "endpoint": "/bedrock/v1/messages",
      "output_encoding": "streaming",
      "method": "POST",
      "backend": [
        {
          "method": "POST",
          "host": ["https://bedrock-runtime.eu-west-1.amazonaws.com"],
          "url_pattern": "/model/eu.meta.llama3-2-1b-instruct-v1:0/converse-stream",
          "extra_config": {
            "ai/llm": {
              "format": "anthropic",
              "bedrock": {
                "v1": {
                  "credentials": "bedrock-api-key-xxx",
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
  ]
}
```

Every endpoint above returns an Anthropic-format stream, regardless of which vendor serves it. The Gemini backend still needs `?alt=sse` on its `url_pattern`, since that is Gemini’s own way of requesting a streaming response. The Anthropic endpoint forwards the `beta` query string and the `Anthropic-Beta` header, so clients can opt into Anthropic beta features. The Bedrock backend targets `converse-stream` instead of `converse`, and streams over `eventstream` instead of SSE, both of which `output_encoding: "streaming"` resolves without further configuration.

## See Also

- [Streaming and SSE](https://www.krakend.io/docs/enterprise/endpoints/streaming/) for streaming that doesn’t go through the AI Gateway, including the underlying `sse`, `ndjson`, and `eventstream` encodings.
- [Unified LLM Interface](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/) for the non-streaming request and response abstraction `ai/llm` builds on.
- [LLM Routing](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/) to send streaming requests to different providers based on headers, tokens, or policies.
