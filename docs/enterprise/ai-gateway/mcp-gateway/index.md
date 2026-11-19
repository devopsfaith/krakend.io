# MCP Gateway for Third-Party MCP Servers

> Put third-party MCP servers behind KrakenD to add authorization, rate limits, observability, and other gateway controls without changing the server.

Source: https://www.krakend.io/docs/enterprise/ai-gateway/mcp-gateway/

The **MCP Gateway** is a KrakenD setup that places a third-party Model Context Protocol (MCP) server behind the gateway, so **MCP agents** connect to KrakenD instead of connecting to the server directly. KrakenD relays the MCP messages unchanged through `no-op` endpoints, and adds on the way the controls the server lacks, such as authorization, rate limits, IP filtering, and telemetry. Use it when your agents consume MCP servers that you do not control, or that lack enterprise-ready security and observability. Because KrakenD does not touch the MCP payload, the protocol keeps working end to end, whatever tools the server exposes.

To expose your own APIs and services as MCP tools instead, use the [MCP Server](https://www.krakend.io/docs/enterprise/ai-gateway/mcp-server/), which KrakenD implements natively.

## How the MCP Gateway Works

An MCP server that uses an HTTP transport, such as Streamable HTTP or Server-Sent Events (SSE), receives MCP messages through `POST` requests, opens server-to-client streams through `GET` requests, and ends sessions through `DELETE` requests. The MCP Gateway declares one KrakenD endpoint per method on the same path, all of them with the `no-op` encoding, so KrakenD forwards every message and every stream as is.

Each endpoint is a regular KrakenD endpoint, so you can add to it any component compatible with `no-op`, from [JWT validation](https://www.krakend.io/docs/enterprise/authorization/jwt-validation/) to [rate limits](https://www.krakend.io/docs/enterprise/endpoints/rate-limit/), and the controls apply to every MCP message that goes through.

## Configuring the MCP Gateway

The following configuration relays the MCP traffic of `/mcp` to a third-party MCP server:

```json
{
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/mcp",
      "method": "POST",
      "output_encoding": "no-op",
      "input_headers": [
        "Mcp-Session-Id",
        "Mcp-Protocol-Version"
      ],
      "backend": [
        {
          "host": ["https://mcp.example.com"],
          "url_pattern": "/mcp"
        }
      ]
    },
    {
      "endpoint": "/mcp",
      "method": "GET",
      "output_encoding": "no-op",
      "timeout": "5m",
      "input_headers": [
        "Mcp-Session-Id",
        "Mcp-Protocol-Version"
      ],
      "backend": [
        {
          "host": ["https://mcp.example.com"],
          "url_pattern": "/mcp"
        }
      ]
    },
    {
      "endpoint": "/mcp",
      "method": "DELETE",
      "output_encoding": "no-op",
      "input_headers": [
        "Mcp-Session-Id",
        "Mcp-Protocol-Version"
      ],
      "backend": [
        {
          "host": ["https://mcp.example.com"],
          "url_pattern": "/mcp"
        }
      ]
    }
  ]
}
```

These are the settings that make it work:

- `endpoint`: the path MCP agents connect to. It can be any path, and it does not need to match the path of the MCP server.
- `method`: one endpoint for each of `POST`, `GET`, and `DELETE`. `POST` carries the MCP messages, `GET` opens the server stream, and `DELETE` ends the session.
- `output_encoding`: `no-op` forwards the requests and the responses, including streams, without parsing them.
- `input_headers`: the headers the MCP server needs. The `Mcp-Session-Id` and `Mcp-Protocol-Version` headers of the MCP transport keep the session and the protocol version across requests; add any other header your server requires, such as an `Authorization` header with the client credentials.
- `timeout`: a long timeout on the `GET` endpoint, so KrakenD does not close the server stream while it waits for events.
- `host` and `url_pattern`: the address of the MCP server.

When the MCP server needs an API key that agents must not know, leave it out of `input_headers` and add it on the gateway with a [Martian header modifier](https://www.krakend.io/docs/enterprise/backends/martian/#header-modifier).

## Adding Security and Traffic Controls

Add the components you need to each endpoint of the MCP Gateway. For instance, the following `POST` endpoint demands a valid JWT and allows each client IP sixty MCP messages per minute:

```json
{
  "endpoint": "/mcp",
  "method": "POST",
  "output_encoding": "no-op",
  "input_headers": [
    "Mcp-Session-Id",
    "Mcp-Protocol-Version"
  ],
  "extra_config": {
    "auth/validator": {
      "alg": "RS256",
      "jwk_url": "https://idp.example.com/.well-known/jwks.json",
      "cache": true
    },
    "qos/ratelimit/router": {
      "client_max_rate": 60,
      "every": "1m",
      "strategy": "ip"
    }
  },
  "backend": [
    {
      "host": ["https://mcp.example.com"],
      "url_pattern": "/mcp"
    }
  ]
}
```

Apply the same components to the `GET` and `DELETE` endpoints, so every MCP request goes through them. MCP clients discover how to obtain a token through the OAuth 2.0 Protected Resource Metadata, which KrakenD can serve as explained in [MCP Server Authorization with OAuth](https://www.krakend.io/docs/enterprise/ai-gateway/mcp-server/#mcp-server-authorization-with-oauth).

Other components that fit the MCP Gateway:

- [IP filtering](https://www.krakend.io/docs/enterprise/throttling/ipfilter/) to accept MCP traffic only from known networks.
- [Security Policies](https://www.krakend.io/docs/enterprise/security-policies/) or [CEL expressions](https://www.krakend.io/docs/enterprise/endpoints/common-expression-language-cel/) to apply business rules to each request.
- The [maximum request size](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/#limit-the-maximum-request-size-to-an-endpoint) to reject oversized messages.
- [CORS](https://www.krakend.io/docs/enterprise/service-settings/cors/) when browser-based agents connect to the gateway.
- [Telemetry](https://www.krakend.io/docs/enterprise/telemetry/) to trace and measure the MCP traffic of every agent.
