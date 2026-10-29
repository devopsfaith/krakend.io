# Request manipulation with templates

> Explore the body generator backend feature in KrakenD API Gateway, allowing dynamic generation of request bodies for advanced API interactions.

Source: https://www.krakend.io/docs/enterprise/backends/body-generator/

The body generator modifier allows you to **craft the body you send** to a backend through templates and enables injecting other values from the user request, such as the original body, headers, query strings, or URL parameters.

The body generator does not necessarily need that the endpoint sends data, as it works even when there is no input body from the user. It lets you specify the body content you want to send to the final service, and you can reuse parts of the request (such as headers) to form a new body.

The most common **uses cases** are:

- Body manipulation or transformation
- Add headers, token claims, or query strings to the body
- Convert a backend POST into a GET endpoint while still sending data
- Enrich the user’s body with additional data
- Build your gateway without having yet a client (set mock data in the POST)

## Configuration for the body generator

The body generator modifier has the following options available:

##### Fields of Template-based body generator

\* required fields

Minimum configuration needs **one of**: `path` , or `template`

##### [`content_type`](https://www.krakend.io/docs/enterprise/backends/body-generator/#content_type "Click to copy link to content_type") string

The `Content-Type` you are generating in the template, so it can be recognized by whoever is using it.

Examples: `"application/json"` , `"application/xml"` , `"text/xml"`

Defaults to `"application/json"`

##### [`debug`](https://www.krakend.io/docs/enterprise/backends/body-generator/#debug "Click to copy link to debug") boolean

When `true`, shows useful information in the logs with `DEBUG` level about the input received and the body generated. Do not enable in production. Debug logs are multiline and designed fore developer readibility, not machine processing.

Defaults to `false`

##### [`path`](https://www.krakend.io/docs/enterprise/backends/body-generator/#path "Click to copy link to path") string

The path to the Go template file you want to use to craft the body.

Example: `"./path/to.tmpl"`

##### [`template`](https://www.krakend.io/docs/enterprise/backends/body-generator/#template "Click to copy link to template") string

An inline base64 encoded Go template with the body you want to generate. This option is useful if you want to have the template embedded in the configuration instead of an external file.

##### [`variables`](https://www.krakend.io/docs/enterprise/backends/body-generator/#variables "Click to copy link to variables") object

An object traversable with dots with any content you want to be available to the template.

Schema: [https://www.krakend.io/schema/v3.0/modifier/body-generator.json](https://www.krakend.io/schema/v3.0/modifier/body-generator.json "JSON schema definition")

## How body generation works?

To use the body generator modifier, write a template (inline as base64 or clear text in an external file). For example, the following `sample.json.tmpl` represents a body in JSON format you would send to your backend:

```go-text-template
{
  "update":{
    "user_id": "{{ .req_params.User }}",
    "email": "{{ .req_body.email }}"
  }
}
```

When a request to the backend arrives, this template replaces the `{{ .req_params.User }}` with the `{user}` value of the URL (e.g., `/foo/{user}`), and the `{{ .req_body.email }}` with an `email` field passed in the user request body. The final render is the content of the body you will send to the backend.

The example uses a JSON format, but you can write the template using any other format you need, and the configuration option `content_type` lets the backend know the correct type. In this case, it should be `application/json` to match our written content.

## Template definition

When you write the content of the body, you do it in a [Go text template](https://pkg.go.dev/text/template) (similar to Helm, Kubernetes, and other systems). The template engine parses the content and replaces variables with the format `{{ .something }}`, but you can use all the power of templates and introduce conditionals, loops, and other checks.

The following variables are available in the template you will use to construct a body:

### `.req_body`

It contains the data sent by the user in the body request. You can reuse the user’s body sent in several formats to compose the final body you will send to the backend server.

The `.req_body` is initially empty unless the following requirements are met:

- The template has at least a `.req_body` declaration
- The `Content-Type` is declared in the `input_headers` of the endpoint. The content type is necessary to determine **how to parse the request** body and make it available to the template. This is not the `content_type` configuration option you will send to the backend server, although it could match. The following content types are the only ones that will work when submitting data to KrakenD (otherwise, there will be an error):
  
  - `application/json`
  - `application/xml`
  - `text/xml`
  - `application/x-www-form-urlencoded`
  - `multipart/form-data`
  - `text/plain`

For instance, a user request like:

Term 

```
$curl -XPOST -d '{"foo": "bar"}' -H'Content-Type: application/json' http://localhost:8080/hello
```

Allows you to use `.req_body.foo` in a template, which will translate into `bar`. At the same time, you could decide to write a template in XML format using these values and switch to a `content_type` different when reaching the backend server.

### `.req_params`

It contains all the parameters you have declared in the `endpoint` as `{placeholders}` or in the `url_pattern` ([dynamic routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/)). To access the parameters, use the **first letter capitalized**.

For instance, an endpoint defined like this:

```json
{
  "endpoint": "/foo/{bar}"
}
```

Allows you to use in a template `.req_params.Bar` and contains the value of the request in `{bar}`.

### `.req_method`

It contains a string with the method used to access the backend service, for instance `GET`, `PUT`, etc.

### Sprig functions

In addition to the variables, the template system accepts [Sprig Functions](https://www.krakend.io/docs/configuration/flexible-config/#sprig-functions).

### Accessing req\_params with dynamic routing

When accessing content from [dynamic routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/), you need to access variables in a special way. Because the `url_pattern` contains variables with dots inside, these are special characters, and they must be accessed using an `index`

For instance, let’s say you have an endpoint like this:

```json
{
      "endpoint": "/notify/{id_user}",
      "method": "POST",
      "input_query_strings": ["channel"],
      "backend": [
        {
          "url_pattern": "/__debug/{input_query_strings.channel}",
          "host": ["http://localhost:8080"],
          "extra_config": {
            "modifier/request-body-generator": {
              "path": "body_querystring.json.tmpl",
              "debug": true
            }
          }
        }
      ]
    }
```

And expects a request from the user such as `curl -XPOST http://localhost:8080/notify/25\?channel\=mobile`.

The configuration contains the `endpoint` parameter `{id_user}` that can be accessed in the template as `{{ .req_params.Id_user }}`, but it also contains a parameter `channel` in the backend `url_pattern` that is defined as `{input_query_strings.channel}`. It has a dot inside. As the `.` is a special character on go templates, you must access it using an `index` without forgetting that we must uppercase the first letter. In all, we could then have our template as follows:

```go-text-template
{
  "params_where": "{{ .req_params }}",
  "id_user": "{{ .req_params.Id_user }}",
  "channel": "{{ index .req_params "Input_query_strings.channel" }}"
}
```

Similarly, we could access the `sub` claim of a JWT token passed in the `"url_pattern": "/foo/{JWT.sub}"` like this:

```go-text-template
{
  "params_where": "{{ .req_params }}",
  "id_user": "{{ .req_params.Id_user }}",
  "channel": "{{ index .req_params "JWT.sub" }}"
}
```

### `.req_headers`

It contains all the headers allowed in the endpoint, not the ones sent by the user. It means that the endpoint must declare in `input_headers` each header you want to access. For instance:

```json
{
  "endpoint": "/foo/{bar}",
  "input_headers": ["X-Header"]
}
```

Allows you to use in a template `{{ index .req_headers "X-Header"}}`. Notice that we are NOT accessing this variable as `.req_headers.X-Header` in this case because it contains the special char `-`, and that is a minus sign on the template. Same as we saw with the dot.

When `input_headers` is set to `["*"]`, all headers sent by the client are in the variable, although this practice might lead to potential security threads and is discouraged. Instead, add only those that you will use.

Another important comment on headers is that by definition, a header might contain **multiple values**, therefore when accessing the `.input_headers.Foo` variable you are getting an array. In most of the cases you will want the first position, so you can have a syntax in the template as follows:

```go-text-template
{ "content-type": "{{index (index .req_headers "Content-Type") 0}}" }
```

The index inside the parenthesis accesses the `Content-Type` key (because it has the special char `-`), and the index outside the parenthesis accesses the position `0` of the array.

### `.req_querystring`

It contains all the query strings allowed to pass in the endpoint. As with headers, the endpoint must declare the list in `input_query_strings`. For instance

```json
{
  "endpoint": "/foo/{bar}",
  "input_query_strings": ["query","limit"]
}
```

Allows you to use in a template `.req_querystring.query` or `.req_querystring.limit`.

When `input_query_strings` is set to `["*"]`, then all query strings sent by the client are in the variable, although this practice might lead to potential security threads and is discouraged.

### `.req_path`

The path that KrakenD will use to connect the backend server. It matches the `url_pattern` of the configuration.

### `.variables`

It contains an object traversable with dots with any content you add in the backend configuration under the `variables` property. The content inside variables accepts any structure you need, including sub-objects and arrays.

For instance, if you have this configuration:

```json
{
  "modifier/request-body-generator": {
    "path": "file.tmpl",
    "debug": true,
    "variables": {
      "hello": "world"
    }
  }
}
```

Then a template containing `{{ .variables.hello }}` would print `world`

## Body generator modifier example

Let’s show how this works with a testable model.

Suppose you have a POST endpoint on KrakenD where a user sends a `text`, and we want to POST this content modified, along with additional parts of the input to build the body. The user request would be:

Post request 

```
$curl -XPOST -d '{"text": "hello"}' -H'Content-Type: application/json' http://localhost:8080/bodygenerator/10
```

But we want to receive in our backend something like:

Post request to backend 

```
$curl -XPOST -d '{"message": "User said hello", "id": 10}' -H'Content-Type: application/json' http://backend/url
```

Where the `text` is renamed to `message` and we also include the id passed in the URL. The reproducible configuration would look like this:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "host": ["http://localhost:8080"],
  "debug_endpoint": true,
   "endpoints": [
        {
            "endpoint": "/bodygenerator/{id}",
            "method": "GET",
            "input_headers": [ "Content-Type" ],
            "backend": [
                {
                    "url_pattern": "/__debug/test/{id}",
                    "method": "POST",
                    "encoding": "json",
                    "extra_config": {
                        "modifier/request-body-generator": {
                            "path": "./body.json.tmpl",
                            "content_type": "application/json",
                            "debug": true
                        }
                    },
                    "host": [ "http://localhost:8080" ]
                }
            ]
        }
    ]
}
```

And the configuration refers to a file `body.json.tmpl`, which would contain the following content:

```go-text-template
{
  "id": "{{ .req_params.Id }}",
  "message": "User said {{ .req_body.text }}"
}
```

You would have the expected replacement when running KrakenD and calling the endpoint. These are the critical takeaways from this configuration:

- The `path` defines where the external template is, using a relative dir `./` based on KrakenD’s [working directory](https://www.krakend.io/docs/enterprise/configuration/working-directory/), but it can also be an absolute path.
- You can use `template` instead, but then you need to convert the template above into a base64 string. Do not use both.
- The variable `req_params` (and not the rest) is accessing parameters with the first letter in uppercase (`Id`).
- All injected variables start with a dot `.` and use one of the variables defined in the variables section.
- All template blocks are delimited by `{{ }}`.

## Debugging the POST template

While working with the body generator modifier, you might find it useful to set the `debug` flag to true. This flag (that you should not use in production) outputs the following information in the console (when the [debug level](https://www.krakend.io/docs/logging/) is `DEBUG`):

- All the variables available in the template
- The final generated body, after compiling the template and injecting the variables
- The content type to send to the backend server

Use the flag for faster development! But remove it in production. It is designed for developer reading of the logs (multiline content), and not for machine processing of the lines.

It is also important to look at the rest of the log lines, as in case the templates cannot be rendered or found (the relative path could be different than you expect) you will see lines showing the problem:

```log
KRAKEND DEBUG: [BACKEND: GET /foo -> GET /bar][body-generator] open ./body.json.tmpl: no such file or directory
```

## Embedding templates in base64

You can embed the template in the configuration as a base64 instead of referencing it as an external file. There are several ways you can do this.

**Written inline in the template** using flexible configuration:

```go-text-template
"modifier/request-body-generator": {
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
"modifier/request-body-generator": {
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
