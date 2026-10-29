# Connecting to other AI vendors

> Generic approach to connect to AI vendors with no pre-defined LLM interface

Source: https://www.krakend.io/docs/enterprise/ai-gateway/other-vendors/

If you need to connect to an AI vendor that is not listed in the pre-defined list of abstracted interfaces, you can still perform the abstraction by providing a template.

On KrakenD you can implement completely different models while you keep the user away from this process.

The way to adapt the payload sent to each LLM, you need to pass the right request template to each LLM. This is achieved with the [request body generator](https://www.krakend.io/docs/enterprise/backends/body-generator/) which takes care of this job.

Examples of vendor templates, for a user payload containing a `{"content": ""}` would be:

## Configuring additional AI vendors

Generally speaking, any AI integration is going to need:

1. A specific payload format for the API endpoint of the LLM ([request body generator](https://www.krakend.io/docs/enterprise/backends/body-generator/))
2. Some authentication mechanism ([Martian modifier](https://www.krakend.io/docs/enterprise/backends/martian/))

See the following example configuration to understand how to do both:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "endpoints": [
    {
      "endpoint": "/_llm/custom-llm",
      "backend": [
        {
          "host": [
            "https://llm.example.com"
          ],
          "url_pattern": "/llm/endpoint",
          "extra_config": {
            "modifier/request-body-generator": {
              "path": "/vendor.tmpl",
              "content_type": "application/json",
              "debug": true
            },
            "modifier/martian": {
              "header.Modifier": {
                "scope": [
                  "request"
                ],
                "name": "Authorization",
                "value": "Bearer YOUR_OPENI_API_KEY"
              }
            }
          }
        }
      ]
    }
  ]
}
```

Notice that the `modifier/request-body-generator` is calling a template `vendor.tmpl` that would contain the JSON format each vendor would expect. The following are a few examples of this `vendor.tmpl` (check each vendor documentation to put the right format)

### Deepseek request template

This is an example of the `deepseek.tmpl` you would include in the `modifier/request-body-generator`:

```gotmpl
{
    "model": "deepseek-chat",
    "messages": [
      { "role": "user", "content": {{ .req_body.content | toJson }} }
    ]
  }
```

This template expects the user to call the endpoint with a JSON content containing a `content` property.

### LLaMa / Ollama request template

Another example with a LLaMa LLM;

```gotmpl
{
    "model": "meta-llama-3-70b-instruct",
    "messages": [
      {
        "role": "user",
        "content": {{ .req_body.content | toJson }}
      }
    ]
  }
```

You could also change `"model": "llama3"` for **Ollama**.

### Cohere request template

Another example with Cohere:

```gotmpl
{
  "model": "command-r-plus",
  "chat_history": [],
  "message": {{ .req_body.content | toJson }},
  "temperature": 0.5
}
```
