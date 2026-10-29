# SOAP Backend Integration

> Integrate SOAP backends into KrakenD API Gateway for seamless integration with legacy SOAP-based services and modernize your services

Source: https://www.krakend.io/docs/enterprise/backends/soap/

The SOAP integration is the ideal tool for those companies that rely on SOAP services and would like to have an option to **modernize their interface for the end-user**.

KrakenD has the native capability of dealing with multiple encodings, like XML or JSON, and transforming from one to the other transparently before returning the content to the user. In addition, the SOAP integration adds the possibility to **craft the body and XML content** you will send to a SOAP service, injecting **dynamic variables** from places like the body sent by the user, headers, query strings, or parameters of the URL.

You can afterward **manipulate the responses back** to get the desired output, regardless of the end user’s encoding or method.

The SOAP integration introduces **templates** to craft the body sent as an underlying SOAP XML contract to the server, while the end-user doesn’t see any of that. You can decide to keep the SOAP response modified or “as is”, return JSON content, or another [encoding](https://www.krakend.io/docs/endpoints/content-types/).

### Configuration

To use the SOAP integration, you need to:

- Decide what content type you are going to return to the user (by default JSON) in the `output_encoding`.
- Write the SOAP XML request you will send for this endpoint
- Inject any variables you need in the template

For example, you want to return `json` content (`output_encoding`) and send to SOAP the body (template) on each request:

```xml
<soap:Envelope>
  <soap:Body>
    <User>{{ .req_params.User }}</User>
  </soap:Body>
</soap:Envelope>
```

The `{{ .req_params.User }}` is an injected value from the URL.

The different configuration options of the SOAP integration are:

##### Fields of SOAP Template modifier

\* required fields

Minimum configuration needs **one of**: `path` , or `template`

##### [`content_type`](https://www.krakend.io/docs/enterprise/backends/soap/#content_type "Click to copy link to content_type") string

The `Content-Type` used in your template, and that will be sent to the SOAP server. This is not the content-type the end-user sent in the request.

Examples: `"application/xml"` , `"text/xml"`

Defaults to `"text/xml"`

##### [`debug`](https://www.krakend.io/docs/enterprise/backends/soap/#debug "Click to copy link to debug") boolean

When `true`, shows useful information in the logs with `DEBUG` level about the input received and the body generated. Do not enable in production. Debug logs are multiline and designed fore developer readibility, not machine processing.

Defaults to `false`

##### [`path`](https://www.krakend.io/docs/enterprise/backends/soap/#path "Click to copy link to path") string

The path to the Go template file you want to use to craft the body.

Example: `"./path/to.xml"`

##### [`template`](https://www.krakend.io/docs/enterprise/backends/soap/#template "Click to copy link to template") string

An inline base64 encoded Go template with the body XML content you want to send to the SOAP service. This option is useful if you don’t want to rely on external files and embed the template in the configuration.

Schema: [https://www.krakend.io/schema/v3.0/backend/soap.json](https://www.krakend.io/schema/v3.0/backend/soap.json "JSON schema definition")

## Template definition

When you write the content of your body, you do it in a template. The template engine parses the content using the [Go text template](https://pkg.go.dev/text/template) language (similar to Helm, Kubernetes, and other systems).

You can insert variables with the format `{{ .variable }}` that will replace the placeholder with the corresponding value.

The following variables are available in the template you will use to construct a body:

### `.req_body`

It contains the data sent by the user in the body request. You can reuse the body of the user sent in several formats, to compose the final body you will send to the SOAP server.

The `.req_body` is initially empty unless the following requirements are met:

- The template has at least a `.req_body` declaration
- The `Content-Type` is declared in the `input_headers` of the endpoint. The content type is necessary to determine how to parse the request body and make it available to the template. This is not the `content_type` configuration option you will send to the SOAP server. The following content types are the only ones that will work (otherwise, there will be an error):
  
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

Allows you to use in a soap template `.req_body.foo`, which will translate into `bar`.

### `.req_params`

It contains all the parameters you have declared in the endpoint as `{placeholders}`. To access the parameters, use the first letter capitalized.

For instance, an endpoint defined like this:

```json
{
  "endpoint": "/foo/{bar}"
}
```

Allows you to use in a template `.req_params.Bar` and contains the value of the request in `{bar}`.

### `.req_headers`

It contains all the headers allowed in the endpoint, not the ones sent by the user. It means that the endpoint needs to declare in `input_headers` each header you would like to access. For instance:

```json
{
  "endpoint": "/foo/{bar}",
  "input_headers": ["X-Header"]
}
```

Allows you to use in a template `.req_headers["X-Header"]`. Notice that we are accessing differently as the header contains `-`, and that is a minus sign on the template.

When `input_headers` is set to `["*"]`, all headers sent by the client are in the variable, although this practice might lead to potential security threads and is discouraged. Add only those that you will actually use.

### `.req_querystring`

It contains all the query strings allowed to pass in the endpoint. As with headers, the endpoint must declare the list in `input_query_strings`. For instance

```json
{
  "endpoint": "/foo/{bar}",
  "input_query_strings": ["query","limit"]
}
```

Allows you to use in a template `.req_querystring.query` or `.req_querystring.limit`.

When `input_query_strings` is set to `["*"]`, then all query strings sent by the client are in the variable, although this practice might lead to potential security threads and is discouiraged.

### `.req_path`

The path that KrakenD will use to connect the SOAP server. It matches the `url_pattern` of the configuration.

## SOAP integration example

Let’s show how this works with a testable example. We have a public SOAP service that returns information about a country, and when we make the right POST request, it returns the following content:

```xml
<Envelope soap="http://schemas.xmlsoap.org/soap/envelope/">
    <Body>
    <CountryFlagResponse m="http://www.oorsprong.org/websamples.countryinfo">
        <CountryFlagResult>http://www.oorsprong.org/WebSamples.CountryInfo/Flags/USA.jpg</CountryFlagResult>
    </CountryFlagResponse>
    </Body>
</Envelope>
```

What we want to achieve with this example is that our end-users receive this content as (method GET + JSON + transformation):

```json
{
  "flag_url":"http://www.oorsprong.org/WebSamples.CountryInfo/Flags/USA.jpg"
}
```

You can reproduce this test with the following `krakend.json` configuration that is explained below:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/country/{country}",
      "method": "GET",
      "backend": [
        {
          "host": ["http://webservices.oorsprong.org"],
          "url_pattern": "/websamples.countryinfo/CountryInfoService.wso",
          "method": "POST",
          "encoding": "xml",
          "extra_config": {
            "backend/soap": {
              "path": "./soap_flag_request.xml"
            }
          },

          "target": "Envelope.Body.CountryFlagResponse",
          "mapping": {
            "CountryFlagResult": "flag_url"
          },
          "deny": [
            "-m"
          ]
        }
      ]
    }
  ]
}
```

The content of the external `soap_flag_request.xml` file is:

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CountryFlag xmlns="http://www.oorsprong.org/websamples.countryinfo">
      <sCountryISOCode>{{ .req_params.Country }}</sCountryISOCode>
    </CountryFlag>
  </soap:Body>
</soap:Envelope>
```

When we start the server with access to these two files, we get beautiful JSON content from a dynamic SOAP request. These are the important takeaways from this configuration:

- The `output_encoding` defines how you would like to offer the content to the end user. As the configuration does not specifies it, the default `json` prevails, but we could still return XML or RSS.
- The `host` and the `url_pattern` define the SOAP endpoint.
- The `method` we are sending to the SOAP service is a `POST`, but we allow a GET to the end-user, e.g., `GET /country/US`
- The `path` defines where the external template is, using a relative dir `./` based on KrakenD’s [working directory](https://www.krakend.io/docs/enterprise/configuration/working-directory/), but it can also be an absolute path.

Finally, there are a few additional [basic manipulation](https://www.krakend.io/docs/backends/data-manipulation/) options, that strip undesired content:

- `target` traverses the response to a specific path and ignores everything else.
- `mapping` renames the field to something friendlier
- `deny` prevents undesired fields from showing up

As you can see, there is a variable `{{ .req_params.Country }}` in the template that the integration replaces by the value of the parameter in the request URL `/country/{country}`. Notice that the first letter in the template is in upper case.

To summarize, the host `http://webservices.oorsprong.org` receives a POST request with the crafted body, and all the variables replaced, despite the user sending none. The `target` option tells KrakenD that the starting content is after traversing the XML in the path `Envelope.Body.CountryFlagResponse`, ignoring everything else. After finding the content, we finally renamed `CountryFlagResult` to `flag_url`, and the end-user received the response as we designed.

## Helping your SOAP development

While working with the SOAP integration, you might find it useful to set the `debug` flag to true. This flag (that you should not use in production) outputs the following information in the console (when the [debug level](https://www.krakend.io/docs/logging/) is `DEBUG`):

- All the variables available in the template
- The final generated body, after compiling the template and injecting the variables
- The content type to send to the SOAP server

For instance:

```log
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [BACKEND: GET /country/:country -> POST /websamples.countryinfo/CountryInfoService.wso][SOAP] Template variables:
 {
  "req_headers": {
    "Accept": [
      "*/*"
    ],
    "User-Agent": [
      "curl/7.74.0"
    ],
    "X-Forwarded-For": [
      "127.0.0.1"
    ],
    "X-Forwarded-Host": [
      "localhost:8080"
    ],
    "X-Forwarded-Via": [
      "KrakenD Version 2.1.2-ee"
    ]
  },
  "req_params": {
    "Country": "DE"
  },
  "req_path": "/websamples.countryinfo/CountryInfoService.wso",
  "req_querystring": {}
}
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [BACKEND: GET /country/:country -> POST /websamples.countryinfo/CountryInfoService.wso][SOAP] Generated content-type: text/xml
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [BACKEND: GET /country/:country -> POST /websamples.countryinfo/CountryInfoService.wso][SOAP] Generated body:
 <?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CountryFlag xmlns="http://www.oorsprong.org/websamples.countryinfo">
      <sCountryISOCode>DE</sCountryISOCode>
    </CountryFlag>
  </soap:Body>
</soap:Envelope>
 yyyy/mm/dd hh:mm:ss [AccessLog] | 200 | 151.883ms |       127.0.0.1 | GET      /country/DE
```

Use the flag for faster development!
