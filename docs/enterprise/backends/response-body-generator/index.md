# Response manipulation with templates

> The response body generator lets you write a whole new payload using a template that has access to the full data of the response.

Source: https://www.krakend.io/docs/enterprise/backends/response-body-generator/

The **response body generator** lets you write a whole new payload [using a template](https://www.krakend.io/docs/enterprise/configuration/templates/) that has access to all the response data. In addition to the payload from the backend, you can incorporate other information such as headers, status codes, query strings, or URL parameters.

You can add validations, data transformation, and other valuable operations as you work with a template.

## Modify the body with templates

The `modifier/response-body-generator` lets you change the content from a `backend` response or the aggregated result after merging in an `endpoint`.

You can manipulate data with any encoding you choose, including `no-op`. You can access the status codes and the headers in the template when using `no-op` (and only in this case).

The data you return is defined by a [template](https://www.krakend.io/docs/enterprise/configuration/templates/) that you write in an external file or embed inline in the configuration as a base64 string.

For example, the following `response.json.tmpl` represents a body in JSON format you would return from your backend and takes data from additional places:

```go-text-template
{
  "data": {{ toJson .resp_body }},
  "status_code": {{ toJson .resp_status }},
  "headers": {{ toJson .resp_headers }},
}
```

The `.resp_body` is what the user would have gotten if they had contacted the backend directly. Instead, in the example above, we are putting it in a new key, `data`, and adding the status code and headers in the response (the endpoint must be `no-op` in this case). The `toJson` function converts the response field structure into a JSON object.

The example template renders into a JSON format, but you could use any other form. The configuration option `content_type` lets the consumer know (or additional KrakenD components) how to treat this content. In this case, it should be `application/json` to match our written content.

## Configuration for the response body generator

Manipulation skipped on errors

When you use this component in and endpoint with aggregation, if one of the backends fail, the manipulation is skipped. If you’d like to apply manipulations even when there are backends failing, consider creating an intermediate endpoint that does the aggregation, and another one to apply the template. In the case of backends, if you use `no-op`, you can check the status codes and condition the responses.

The response body generator modifier has the following options available:

##### Fields of Template-based body generator

\* required fields

Minimum configuration needs **one of**: `path` , or `template`

##### [`content_type`](https://www.krakend.io/docs/enterprise/backends/response-body-generator/#content_type "Click to copy link to content_type") string

The `Content-Type` you are generating in the template, so it can be recognized by whoever is using it.

Examples: `"application/json"` , `"application/xml"` , `"text/xml"`

Defaults to `"application/json"`

##### [`debug`](https://www.krakend.io/docs/enterprise/backends/response-body-generator/#debug "Click to copy link to debug") boolean

When `true`, shows useful information in the logs with `DEBUG` level about the input received and the body generated. Do not enable in production. Debug logs are multiline and designed fore developer readibility, not machine processing.

Defaults to `false`

##### [`path`](https://www.krakend.io/docs/enterprise/backends/response-body-generator/#path "Click to copy link to path") string

The path to the Go template file you want to use to craft the body.

Example: `"./path/to.tmpl"`

##### [`template`](https://www.krakend.io/docs/enterprise/backends/response-body-generator/#template "Click to copy link to template") string

An inline base64 encoded Go template with the body you want to generate. This option is useful if you want to have the template embedded in the configuration instead of an external file.

##### [`variables`](https://www.krakend.io/docs/enterprise/backends/response-body-generator/#variables "Click to copy link to variables") object

An object traversable with dots with any content you want to be available to the template.

Schema: [https://www.krakend.io/schema/v3.0/modifier/body-generator.json](https://www.krakend.io/schema/v3.0/modifier/body-generator.json "JSON schema definition")

## Template variables

When you write the template’s content, you do it in a [template](https://www.krakend.io/docs/enterprise/configuration/templates/). The template engine parses the content and replaces variables with the format `{{ .variable }}`, but you can use all the power of templates and introduce conditionals, loops, and other checks.

The following variables are available in the template you will use to construct a body:

Response data:

- `.resp_headers`
- `.resp_body`
- `.resp_status`

Request data:

- `.req_params`
- `.req_headers`
- `.req_querystring`
- `.req_path`
- `.req_body`
- `.req_method`

See their usage below.

### `.resp_headers` (`no-op` required)

The variable `{{ .resp_headers }}` contains all the response headers returned by the `backend` when you use `no-op`, in its **canonical MIME form**. The variable will be empty if you use another encoding in the `output_encoding`.

The canonicalization converts the first letter and any letter following a hyphen to upper case; the rest are converted to lowercase. For example, the canonical key for `accept-encoding` is `Accept-Encoding`.

Given the nature of headers and the specificities of templates, you should know a few things to work efficiently with them.

Headers can be according to its RFC specification **multi-value**. It means that a single header key can coexist with several values, or said otherwise, you can pass the same header several times in a request or response. This is why the variable `.resp_headers` is a map with all the header keys, but it uses an array for their values, even if there is only one.

For instance, the backend sends the header `Cache-Control: "public, max-age=60"`. To use a familiar language with most readers, if it were Javascript notation, our variable would be `resp_headers["Cache-Control"][0] = "public, max-age=60"`.

In a template, that would be like `{{ .resp_headers.Cache-Control.0}}`, only that **this syntax is wrong**. The word `Cache-Control` contains a minus sign `-` that is an operator. Accessing a key in a map with special characters needs the `index` function.

In all, here’s an example that returns all the headers in the response and the specific header `Cache-Control` (which is an array):

```go-text-template
{
    "all_headers": {{ toJson .resp_headers }},
    "cache-control": {{ toJson (index .resp_headers "Cache-Control") }}
}
```

### `.resp_status` (`no-op` required)

The response’s status code is an integer returned by the `{{ .resp_status }}` variable when you use `no-op` encoding. The response status allows us to do **conditional responses**.

Sometimes, we want to return a **custom template** when the status code is unexpected. Here’s an example of a template that checks that the status code is a `200`, and if it is not, returns a different JSON object:

```go-text-template
{{-  if eq 200 .resp_status -}}
    {{-  toJson .resp_body -}}
{{- else -}}
{
    "system": "is down"
}
{{- end -}}
```

### `resp_body`

The response body contains the data from the response. It works with any `encoding`. When the encoding is `no-op`, KrakenD will attempt to read the body (despite it’s been told to do no-operation) and parse it following the `Content-Type` indications of the backend. If the backend does not return a `Content-Type` header or an unsupported type, you won’t be able to access its data.

The configuration option `content_type` is what you return to the end-user, and it does not need to match what KrakenD gets from the backend header `Content-Type`, so they are entirely different things. The `.req_body` is initially empty unless the following requirements are met:

The following `Content-Type` headers are the ones KrakenD can parse to extract its data for working with it: - `application/json` (default) - `application/xml` - `text/xml` - `text/plain`

Here is an example of a template that takes parts of a response body to build a new one:

```go-text-template
{
    "message": "{{.resp_body.some_string}}",
    "message2": {{toJson .resp_body.some_string}},
    "number": {{.resp_body.some_integer}},
    "array": {{ toJson .resp_body.some_array}}
}
```

Notice that since you are writing a JSON response by hand, you must **take care of quotes**, or use the `toJson` function to do it automatically for you. Here are a few hints:

- If you directly access a variable that is not set, like `{{ .res_body.unexisting }}`, the template engine will print `<no value>`, and this can break the format if unquoted.
- Instead, if you access a variable that is not set through `toJSON`, the value is `null`, a valid value for a JSON object.

Another problem you might face is that you see an error like this in the logs:

```log
KRAKEND ERROR: [ENDPOINT: GET /test] invalid character 'm' looking for beginning of value
```

The `m` stands for the word`map[...]`, which indicates that you are printing the native Go data structure in the template instead of its JSON value.

### Request variables `.req_...`

In addition to the backend response, you can access parameters in the request passed by the user and inject them into the response, or even check them for conditional output. The variables `{{ .req_params }}`, `{{ .req_headers }}`, `{{ .req_querystring }}`, `{{ .req_path }}`, `{{ .req_method }}`, and `{{ .req_body }}` contain information passed in the user request. You can return to the end-user data that was contained in the original request or even make checks inside the template for conditional responses.

The usage of these variables is [documented in the request generator](https://www.krakend.io/docs/enterprise/backends/body-generator/#req_params), which uses the same template engine and contains numerous examples of how to access data with special characters and other useful information.

## Response body transformation example

Let’s show how this works with a testable model.

We want to design a JSON response from scratch for an endpoint and embed a few fields from a call to the GitHub API. The response we want to get is:

```json
{
    "hi": "there!",
    "a":"a",
    "b":"b",
    "c":"c",
    "github": {
      "login":"alombarte",
      "blog":"https://www.krakend.io"
    }
}
```

We want the first field hard coded; then we want a, b, and c, which is a loop, and then a few properties from a Github call, but not all.

Here is the configuration (you can test it, it is fully functional):

```json
{
    "version": 4,
    "$schema": "https://www.krakend.io/schema/krakend.json",
    "endpoints": [
        {
            "endpoint": "/test",
            "backend": [
                {
                    "url_pattern": "/users/alombarte",
                    "host": ["https://api.github.com"],
                    "extra_config": {
                        "modifier/response-body-generator": {
                            "path": "custom_template.tmpl",
                            "debug": true
                        }
                    }
                }
            ]
        }
    ]
}
```

As you can see above, there is a path `custom_template.tmpl` that we will also save next to our `krakend.json` file. It has this content:

```go-text-template
{{/*
    pick: Fields to pick from the response body
    Docs: http://masterminds.github.io/sprig/dicts.html
*/}}
{{- $returned_data := pick .resp_body "login" "blog" -}}
{{/* Print the response */}}
{
    "hi": "there!",
    {{- range (list "a" "b" "c" ) -}}
    "{{.}}": "{{.}}",
    {{- end -}}
    "github": {{ toJson $returned_data }}
}
```

This is mostly understanding [templates](https://www.krakend.io/docs/configuration/templates/), but let’s dissect it:

- We want our colleagues to know what this does, so we add comments `{{/* .... */}}`
- We set a variable `$returned_data` that uses the `pick` function, which creates a new dictionary with the selected fields. The `pick` function extracts the fields from the `.resp_body`, which contains all the fields from Github.
- Then, we print the response and write the opening and closing curly braces because we will write JSON content.
- The `hi there` key and value are hardcoded in the template
- Then we have an iteration (`range`) over a list `["a","b","c"]`
- Inside the range, we use `{{.}}`, which contains the element we are iterating (a,b, and c)
- Finally, we write the `github` key, and as value, we use `toJson`, which converts the response data we selected to JSON

You can test this configuration and play with it.

## Debugging the template

While working with the response body generator modifier, you might find it useful to set the `debug` flag to true. This flag (that you should not use in production) outputs the following information in the console (when the [debug level](https://www.krakend.io/docs/logging/) is `DEBUG`):

- All the variables available in the template
- The final generated body, after compiling the template and injecting the variables
- The content type to send to the backend server

Use the flag for faster development! But remove it in production. It is designed for developer reading of the logs (multiline content) and not for machine processing of the lines.

When something is not working, **read carefully the log**, as in case the templates cannot be rendered or found (the relative path could be different than you expect), you will see lines showing the problem:

```log
KRAKEND DEBUG: [BACKEND: GET /foo -> GET /bar][body-generator] open ./body.json.tmpl: no such file or directory
```

## Embedding templates in base64

You can embed the template in the configuration as a base64 instead of referencing it as an external file. There are several ways you can do this.

**Written inline in the template** using flexible configuration:

```go-text-template
"modifier/response-body-generator": {
      "template": "{{ `{
          "id": "{{ .req_params.Id }}",
          "message": "User said {{ .req_body.text }}"
          }` | b64enc }}",
      "content_type": "application/json",
      "debug": true
}
```

As you can see, the backtick delimiters write the template as it is, and at the end, it pipes it to the `b64enc` function.

**Loaded as a partial template** with base64 encoding and flexible configuration:

```go-text-template
"modifier/response-body-generator": {
      "template": "{{ include "body.json.tmpl" | b64enc }}",
      "content_type": "application/json",
      "debug": true
}
```

Copy and paste the value from a **terminal:**

Base64 encode of a template 

```
$base64 -w 0 body.json.tmpl
ewogICJpZCI6ICJ7eyAucmVxX3BhcmFtcy5JZCB9fSIsCiAgIm1lc3NhZ2UiOiAie3sgLnJlcV9ib2R5Lm1lc3NhZ2UgfX0iCn0=
```

Notice that we are adding `-w 0` because we don’t want new lines that would break the configuration.
