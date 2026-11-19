# AI Gateway Security and Data Protection

> Secure LLM traffic with KrakenD by isolating consumer and vendor authentication, protecting API keys, masking sensitive data, and preventing exfiltration.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/security/

**AI Gateway security** is the set of KrakenD controls that protect the traffic between your consumers and the LLM vendors. KrakenD authenticates consumers with your own identity mechanisms, keeps the vendor API keys on the gateway, masks sensitive data in prompts and responses, and restricts what data can leave your perimeter. Use these controls whenever internal or external consumers reach an LLM through KrakenD. Because they live at the gateway, you apply them to every AI endpoint without changing the applications or the vendors.

This page covers authentication, API keys, and data protection. To block prompt injection, jailbreaks, and other malicious payloads before they reach the model, see [Prompt Guard](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/).

## Isolated Authentication

KrakenD separates the authentication of the consumers from the authentication against the LLM vendors. Consumers authenticate with the mechanism of your choice, and only the gateway holds the vendor credentials:

![ai-gateway-isolated-auth.mmd diagram](https://www.krakend.io/images/documentation/diagrams/ai-gateway-isolated-auth.mmd.svg)

Most LLM vendors authenticate with a static API key. Instead of sharing that key with your consumers, demand the credentials of your existing identity provider at the endpoint, for instance with [JWT validation](https://www.krakend.io/docs/enterprise/authorization/jwt-validation/) or [API keys](https://www.krakend.io/docs/enterprise/authentication/api-keys/), and leave the vendor key in the [LLM provider inventory](https://www.krakend.io/docs/enterprise/ai-gateway/provider-inventory/):

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
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "https://idp.example.com/.well-known/jwks.json",
          "cache": true
        }
      },
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

Consumers call `/chat` with a token issued by your identity provider, and KrakenD calls OpenAI with the key of the `chat` provider. The OpenAI key never leaves the gateway, and revoking a consumer does not require rotating it.

## Protecting LLM API Keys

The `credentials` of each provider live in the KrakenD configuration. Keep them out of the file and out of your repositories:

- Inject them from environment variables with [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/), writing `"credentials": "{{ env "OPENAI_API_KEY" }}"` in the provider entry.
- Restrict access to the configuration file and to the environment of the KrakenD process.
- Keep `debug` set to `false` in production, as the debug logs may contain sensitive data.

When consumers use the vendor API directly through a `no-op` endpoint, KrakenD does not process the payload, and a Martian header modifier adds the key instead. See [Vendor-Native Passthrough](https://www.krakend.io/docs/enterprise/ai-gateway/llm-routing/#vendor-native-passthrough).

## Data Masking and Data Loss Prevention

**Data masking** replaces sensitive values, such as credit card numbers or personal identifiers, before they leave KrakenD. Apply it to the responses, so consumers and logs never see the raw values, and to the prompts, so consumers cannot send sensitive content to an LLM vendor. KrakenD masks data with the [request and response manipulation components](https://www.krakend.io/docs/enterprise/request-response-manipulation/), using regular expressions on the content.

### Masking Sensitive Data in Responses

The [regular expression modifier](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#regular-expression-modifier) of the `modifier/response-body` namespace rewrites a field of the response with a regular expression. The following example uses the echo backend to mask the digits in the path of the request, except the last four:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "host": [
    "localhost:8080"
  ],
  "echo_endpoint": true,
  "endpoints": [
    {
      "endpoint": "/mask",
      "method": "GET",
      "backend": [
        {
          "url_pattern": "/__echo/123456789",
          "extra_config": {
            "modifier/response-body": {
              "modifiers": [
                {
                  "regexp": {
                    "@comment": "Example of masking SSN or credit numbers in the response body",
                    "field": "req_uri_details.path",
                    "find": "([\\d+\\-\\s]*)(\\d{4})",
                    "replace": "XXX-$2"
                  }
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

The `field` attribute selects the element of the response to rewrite, and the `find` expression matches any sequence of digits, hyphens, and spaces followed by four digits, which the `replace` turns into `XXX-` and the last four digits. Stack as many modifiers as you need in the `modifiers` array.

### Masking Sensitive Data in Prompts

To mask the prompt before it reaches the LLM, apply the regular expression in the template that builds the payload. For instance, consider a consumer that sends a number that must never reach the vendor:

Send a prompt that contains sensitive data 

```
$curl -H'Content-Type: application/json' \
  -d '{"message": "123456789 is a number that should never be sent"}' \
  http://localhost:8080/req-mask
```

The [request body generator](https://www.krakend.io/docs/enterprise/backends/body-generator/) builds the payload with a template that masks the number:

```go-text-template
{{- $message := index .req_body "message" -}}
{{- $message = regexReplaceAll "([\\d+\\-\\s]*)(\\d{4})" $message "XXX-${2}" -}}
{
    "message": {{ $message | toJson }}
}
```

The configuration loads the template from `body_mask.tmpl`:

```json
{
  "endpoint": "/req-mask",
  "method": "POST",
  "backend": [
    {
      "url_pattern": "/__echo/test",
      "host": ["http://localhost:8080"],
      "extra_config": {
        "modifier/request-body-generator": {
          "path": "body_mask.tmpl",
          "content_type": "application/json"
        }
      }
    }
  ]
}
```

The backend receives the masked payload:

```json
{
  "message": "XXX-6789 is a number that should never be sent"
}
```

When the backend uses the `ai/llm` component, apply the same `regexReplaceAll` to `.req_body.contents` in a custom [input template](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates), so the masked prompt goes straight into the vendor payload.

## Exfiltration Prevention

**Exfiltration prevention** restricts, sanitizes, or monitors the data that leaves your perimeter through the gateway, so no unauthorized or sensitive data reaches consumers or LLM vendors. Combine these controls:

- Use an [allow list](https://www.krakend.io/docs/enterprise/backends/data-manipulation/#allow) for APIs that must return a limited set of attributes.
- Use [Security Policies](https://www.krakend.io/docs/enterprise/security-policies/) to check the roles and conditions required to deliver content.
- Use [regular expression masking](https://www.krakend.io/docs/enterprise/ai-gateway/security/#data-masking-and-data-loss-prevention) on the fields that must never leave in full.
- Use [prompt templates](https://www.krakend.io/docs/enterprise/ai-gateway/unified-llm-interface/#prompt-templates) instead of open LLM queries, so consumers only provide the content.
- Use [Prompt Guard](https://www.krakend.io/docs/enterprise/ai-gateway/prompt-guard/), which includes default guards against data exfiltration attempts.
- Write custom logic in [request and response modifier plugins](https://www.krakend.io/docs/enterprise/extending/plugin-modifiers/) when the rules above are not enough.
