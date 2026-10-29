# End-to-End Testing for Developers

> Streamline your API development process with E2E tests in KrakenD Enterprise. Explore our documentation to learn how to write comprehensive tests for your APIs.

Source: https://www.krakend.io/docs/enterprise/developer/integration-tests/

In addition to checking the syntax of your KrakenD configuration and ensuring that the gateway can start, an essential step in any CI/CD strategy is including **end-to-end tests** to guarantee that all the active software components from beginning to end have the expected flow and that the gateway returns what you planned when working together with your upstream services.

## How E2E testing works

The end-to-end testing definition is quite simple. You must create a folder to hold all the test cases you want to execute (e.g., `specs`). Inside the folder, you make a file per test case. Each test case is a JSON file containing the input request you will send to the gateway ( `in`) and the form of the expected output ( `out`). The test file has a structure supported by a JSON schema definition.

With a folder full of test cases, the `krakend e2e` command **starts a gateway** with the provided configuration and **launches all the test cases in the folder**. You are creating real traffic to the gateway and the backends and analyzing their responses through the gateway to validate the behavior before setting a configuration online.

## Creating e2e test files

Tests must be deterministic

Make sure tests are deterministic and reproducible with a consistent output in different executions. If the output of a call varies over time, consider using the `schema` property to describe the properties rather than checking their exact values.

For instance, you could have the following contents on your disk:

Contents of E2E testing 

```
$tree /etc/krakend
├── krakend.json
└── specs
    ├── test-foo.json
    ├── test-bar.json
    └── some-other-test.json
```

KrakenD will run all the tests declared in the folder alphabetically (according to the file sorting of the OS).

### Test Case files

Each test case is a simple `.json` file containing an object with an `in` (the input request you want to do to KrakenD) and an `out` (the output you expect in the response).

Sometimes, a test case needs to have multiple calls to validate a scenario. When this happens, you can add a `next` entry, an array containing couples of `in` and `out` objects that will be executed and analyzed in the declared order. The `next` does not evaluate until the tool has already processed the siblings `in` and `out`.

The test case file must follow the [e2e schema](https://www.krakend.io/schema/v3.0/e2e.json) (explained below) to work correctly, but the **tool does not validate the JSON format of each test case during runtime** (this makes processing faster).

Here’s an example of test you can save under `specs/test1.json` and run it with any KrakenD configuration ([`debug_endpoint`](https://www.krakend.io/docs/endpoints/debug-endpoint/) set to `true` required):

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/e2e.json",
    "@comment": "Makes sure that the debug endpoint returns a status ok",
    "in": {
        "method": "GET",
        "url": "http://localhost:8080/__debug/something",
        "header": {
            "User-Agent": "krakend-e2e-tool"
        }
    },
    "out": {
        "status_code": 200,
        "body": {
          "status": "ok"
        },
        "header": {
            "content-type": ["application/json; charset=utf-8"],
            "X-Krakend-Completed": ["true"],
            "Cache-Control": [""]
        }
    }
}
```

The test above connects to the URL `http://localhost:8080/__debug/something` and analyzes its response `out`put, and checks that:

- It returns an HTTP `status_code` equal to `200`
- That the `body` is literally `{"status": "ok"}`, and the entirety of the payload.
- It also makes sure that there are three `header` conditions:
  
  - The `content-type` and `X-Krakend-Completed` have the specified values
  - The `Cache-Control` header cannot be present (we compare it to an empty string).

Any other headers that are not mapped here are ignored, so the response could have more.

Finally, the `$schema` you see at the top of the file points to the E2E JSON Schema that helps you autocomplete and validate from your IDE (provided that it has automatic JSON-schema validation). The value can be either of:

- `https://www.krakend.io/schema/v3.0/e2e.json` (minor version)
- `https://www.krakend.io/schema/e2e.json` (latest version)

See the format of the test cases below.

## Test Case format

Test cases must be in JSON format and might contain two or three top-level attributes:

##### Fields of Schema validation for End To End testing specs

\* required fields

##### [`in`](https://www.krakend.io/docs/enterprise/developer/integration-tests/#in "Click to copy link to in") * object

The input request definition. At least you should define the URL used to connect to KrakenD

##### [`body`](#in-body "Click to copy link to body") object, array, string

If you want to add a payload in the request, set its body here

##### [`header`](#in-header "Click to copy link to header") object

An optional map of headers you want to include in the request.

Example: `{"User-Agent":"krakend e2e tool"}`

##### [`method`](#in-method "Click to copy link to method")

The method sent in the request

Possible values are: `"GET"` , `"POST"` , `"PUT"` , `"PATCH"` , `"DELETE"`

Defaults to `"GET"`

##### [`url`](#in-url "Click to copy link to url") * string

The full URL you want to use in the request, including schema, host, port, path, and any additional query string parameters you might need.

Example: `"http://localhost:8080/__debug/something"`

##### [`next`](https://www.krakend.io/docs/enterprise/developer/integration-tests/#next "Click to copy link to next") array

Additional checks, in sequential order, of `in` and `out` definitions. The outter `in` and `out` are always executed first.

Example: `[{"in":{"url":"http://localhost/__health"},"out":{"status_code":200}},{"in":{"url":"http://localhost:8080/foo"},"out":{"status_code":500}}]`

Each item of next accepts the following properties:

##### [`in`](#next-in "Click to copy link to in") * object

The input request definition. At least you should define the URL used to connect to KrakenD

##### [`body`](#in-body-2 "Click to copy link to body") object, array, string

If you want to add a payload in the request, set its body here

##### [`header`](#in-header-2 "Click to copy link to header") object

An optional map of headers you want to include in the request.

Example: `{"User-Agent":"krakend e2e tool"}`

##### [`method`](#in-method-2 "Click to copy link to method")

The method sent in the request

Possible values are: `"GET"` , `"POST"` , `"PUT"` , `"PATCH"` , `"DELETE"`

Defaults to `"GET"`

##### [`url`](#in-url-2 "Click to copy link to url") * string

The full URL you want to use in the request, including schema, host, port, path, and any additional query string parameters you might need.

Example: `"http://localhost:8080/__debug/something"`

##### [`out`](#next-out "Click to copy link to out") * object

The expected response from the server

\* Required **any of**: ( `status_code` ) , or ( `status_code` + `body` ) , or ( `status_code` + `schema` )

##### [`body`](#out-body "Click to copy link to body") string, object

The expected returned body by the response as a string or JSON object. Remove this body field when you don’t want to check its contents, when the response does not have a body, or when you want to use the schema instead.

Example: `"http://localhost:8080/__debug/something"`

##### [`header`](#out-header "Click to copy link to header") object Show properties

Checks that all headers included in the response match the provided values. You only need to declare the relevant headers you want, as the rest are ignored. As headers, by RFC definition, can be multiple, you must always use an array to express the values you want to check. You can also check that **a specific header does not exist** in the response declaring an empty value `[""]`.

Example: `{"Cache-Control":[""],"X-Krakend-Completed":["true"],"content-type":["application/json; charset=utf-8"]}`

Properties of `header` can use a name matching the pattern `.*`, and their content is an `array`

##### [`schema`](#out-schema "Click to copy link to schema") object

A JSON Schema object that validates the response. This option allows you to work with responses that the literal value is not that important and you want to check the structure of the returned document instead. If the response matches the schema definition, the test passes. If you define a `schema` and a `body` simultaneously only the schema is validated.

##### [`status_code`](#out-status_code "Click to copy link to status_code") integer

The integer value of the HTTP status code returned by the server.

Example: `200`

##### [`out`](https://www.krakend.io/docs/enterprise/developer/integration-tests/#out "Click to copy link to out") * object

The expected response from the server

\* Required **any of**: ( `status_code` ) , or ( `status_code` + `body` ) , or ( `status_code` + `schema` )

##### [`body`](#out-body-2 "Click to copy link to body") string, object

The expected returned body by the response as a string or JSON object. Remove this body field when you don’t want to check its contents, when the response does not have a body, or when you want to use the schema instead.

Example: `"http://localhost:8080/__debug/something"`

##### [`header`](#out-header-2 "Click to copy link to header") object

Checks that all headers included in the response match the provided values. You only need to declare the relevant headers you want, as the rest are ignored. As headers, by RFC definition, can be multiple, you must always use an array to express the values you want to check. You can also check that **a specific header does not exist** in the response declaring an empty value `[""]`.

Example: `{"Cache-Control":[""],"X-Krakend-Completed":["true"],"content-type":["application/json; charset=utf-8"]}`

Properties of `header` can use a name matching the pattern `.*`, and their content is an `array`

##### [`schema`](#out-schema-2 "Click to copy link to schema") object

A JSON Schema object that validates the response. This option allows you to work with responses that the literal value is not that important and you want to check the structure of the returned document instead. If the response matches the schema definition, the test passes. If you define a `schema` and a `body` simultaneously only the schema is validated.

##### [`status_code`](#out-status_code-2 "Click to copy link to status_code") integer

The integer value of the HTTP status code returned by the server.

Example: `200`

Schema: [https://www.krakend.io/schema/v3.0/e2e.json](https://www.krakend.io/schema/v3.0/e2e.json "JSON schema definition")

### Testing non-deterministic responses

When the response of your backend is not deterministic, instead of checking the response against a `body` trying to find an exact payload, you can test it against a **JSON Schema**, using the `schema` attribute.

For instance, our [health endpoint](https://www.krakend.io/docs/service-settings/health/) returns the date after every request. It would be impossible to test it literally, as the date changes between executions. The following test would make sure that it works by comparing the response with a schema:

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/e2e.json",
    "@comment": "Makes sure that the health endpoint contains three fields with the right types",
    "in": {
        "url": "http://localhost:8080/__health"
    },
    "out": {
        "status_code": 200,
        "schema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "required": ["agents","now","status"],
          "properties": {
            "agents": {
                "type": "object"
            },
            "now": {
                "type": "string"
            },
            "status": {
                "type": "string",
                "enum": ["ok"]
            }
          }
        }
    }
}
```

The content inside the `schema` property is JSON Schema syntax up to a Draft-07 response.

## Running the e2e tests

The `e2e` command can run without additional flags if you use the default naming, but it has several run options. It looks like this:

Term 

````
$krakend e2e -h

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2

Executes an end to end test for the gateway based on the configuration file and a set of specs.

Usage:
  krakend e2e [flags]

Examples:
krakend e2e -c config.json -s specs

Flags:
  -c, --config string             Path to the KrakenD configuration file. (default "./krakend.json")
  -d, --delay duration            The delay for the delayed backend endpoint. (default 200ms)
  -e, --envar string              Comma separated list of patterns to use to filter the envars to pass (set to ".*" to pass everything).
  -g, --grpc-port int             Port for the mocked grpc backend api (disabled if 0)
  -h, --help                      help for e2e
      --https-extra-port int      Port for the mocked mTLS https extra backend api (disabled if 0)
      --https-port int            Port for the mocked mTLS https backend api (disabled if 0)
  -l, --log string                Path for storing the server logs. (default "./e2e.log")
  -r, --no-redirect               Disable redirects at the http client.
  -p, --port int                  The port for the mocked backend api. (default 8081)
      --ready-url string          Ready endpoint URL to check that the KrakenD system has started (expects a 200 Ok response: in case of doubt use the /__health endpoint)
      --ready-url-wait duration   Maximum time to keep attempting to get an Ok response from the ready endpoint. (default 30s)
  -s, --specs string              Path to the specs folder. (default "./specs")
  -w, --startup-wait duration     Time to wait for services to startup before start testing. (default 1.5s)
````

When you run the tests, KrakenD will tell you the failing ones with a `[KO]` and the working ones with an `[OK]`. For instance:

Launch e2e tests with default krakend.json file and a specs/ folder 

```
$krakend e2e
[OK] test1
1 test(s) completed
Total time: 1.102928274s
```

The `e2e` command starts and shuts down two services during the tests:

- A KrakenD instance running on port `8080` or the port you have defined in your configuration, on which all test requests are sent.
- An additional backend service on port `8081` (or the one you define with `krakend e2e -p`) with a few utility endpoints that you can use to complement your testing (see below)

## Waiting for readiness

There are three options that are meant to deal with the startup times and the readiness of the testing KrakenD, because the integration tests could run before the setup is actually available, making tests to fail.

By default the `e2e` command waits 1.5 seconds before running the tests which is suitable in almost all scenarios. Nevertheless, there might be complex setups that require more time to start and you can change this behaviour with three different flags:

- `startup-wait` : The hardcoded time you will wait before launching the tests. By default it uses `1500ms` (1.5 seconds).
- `ready-url`: An HTTP address that will return a `200` status code when ready. For instance, you could point to `http://localhost:8080/__health` (if you have the default health endpoint enabled) and the command would keep retrying until it gets a `200` or the `ready-url-wait` times out.
- `ready-url-wait`: The time you want the tester to keep retrying the readiness.

The `startup-wait` and the `ready-url` are mutually exclusive. In case of declaring both, only the latter is used.

Example:

Launch e2e tests with increased wait time 

```
$krakend e2e -w 2500ms
```

Or also:

Launch e2e tests with ready URL 

```
$krakend e2e --ready-url-wait 2500ms --ready-url "http://localhost:8080/__health"
```

## Skipping tests

Only files ending with a `.json` extension are taken into account.

If you want to skip a test temporarily, rename the test to a non `.json` extension. For instance, you can rename `test1.json` to `test1.json.skip`.

## Using mock data

The main point of integration tests is to test KrakenD configurations (not necessarily the backend content itself). Therefore, all tests expect reproducible outputs.

Part of a testing strategy is using mocked data. An easy way to have fake data is to create a `mock` folder with static JSON content and offer it via the [static-filesystem](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/).

By using static files, you could, for instance, create `/mock/` endpoints that return the static files inside your mock folder folder.

## E2E utility backend service

In addition to the KrakenD service used to test the configuration, the command `e2e` will start on port `8081`(by default) an additional backend service with the following endpoints you can include in your tests.

You can see the code of these endpoints below [here](https://github.com/krakend/krakend-ce/blob/master/tests/integration.go#L424-L429).

In addition to the endpoints below, you can also use the [echo](https://www.krakend.io/docs/endpoints/echo-endpoint/) and [debug](https://www.krakend.io/docs/endpoints/debug-endpoint/) endpoints of KrakenD (not this service)

### Endpoint `/param_forwarding/*`

An echo endpoint that returns an object containing a map with the request details:

- `path`: The URL requested to the backend
- `query`: The different query strings passed to the backend
- `headers`: All the headers that reached the backend
- `foo`: An additional object with a hardcoded value `42`
- `body`: A string with the data passed in the request’s body. Only dumped when you call the backend with the query string `?dump_body=1`.

For example, a call to `http://localhost:8081/param_forwarding/hey/yo?a=1&b=1&dumb_body=1` produces the response:

```json
{
    "path": "/param_forwarding/hey/yo",
    "query": {
        "a": 1,
        "b": 2,
        "dump_body": 1
    },
    "headers": {
        "Accept-Encoding": [
            "gzip"
        ],
        "User-Agent": [
            "KrakenD Version 3.0.2"
        ],
        "X-Forwarded-Host": [
            "localhost:8080"
        ]
    },
    "foo": 42,
    "body": {}
}
```

### Endpoint `/xml`

Returns hardcoded content in XML format. Useful to test a mix of JSON and XML encodings:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<user type="admin">
  <name>Elliot</name>
  <social>
    <facebook>https://facebook.com</facebook>
    <twitter>https://twitter.com</twitter>
    <youtube>https://youtube.com</youtube>
  </social>
</user>
```

### Endpoint `/collection/*`

Returns a collection of 10 objects (an array) with the number of iteration (`i`) and the `path` used. For instance, calling `http://localhost:8081/collection/hi-there` produces:

```json
[
    {
        "i": 0,
        "path": "/collection/hi-there"
    },
    {
        "i": 1,
        "path": "/collection/hi-there"
    },
    {
        "i": 2,
        "path": "/collection/hi-there"
    },
    {
        "i": 3,
        "path": "/collection/hi-there"
    },
    {
        "i": 4,
        "path": "/collection/hi-there"
    },
    {
        "i": 5,
        "path": "/collection/hi-there"
    },
    {
        "i": 6,
        "path": "/collection/hi-there"
    },
    {
        "i": 7,
        "path": "/collection/hi-there"
    },
    {
        "i": 8,
        "path": "/collection/hi-there"
    },
    {
        "i": 9,
        "path": "/collection/hi-there"
    }
]
```

### Endpoint `/delayed/*`

Returns an echo endpoint (as in `/param_forwarding`), but it delays the response for `200ms` or any other value you pass using the `-d` flag when running the tests.

### Endpoint `/redirect/*`

Returns an HTTP redirection to `/param_forwarding/` using the status code passed by query string with `?status=301`. For instance, http://localhost:8081/redirect/hi-there?status=302\`.

### Endpoint `/jwk/symmetric`

Returns a fake signing key that validates demo JWT tokens. To be used when you set the `jwk_url` if you don’t want to issue real tokens

```json
{
  "keys": [
    {
      "kty": "oct",
      "alg": "A128KW",
      "k": "GawgguFyGrWKav7AX4VKUg",
      "kid": "sim1"
    },
    {
      "kty": "oct",
      "k": "AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow",
      "kid": "sim2",
      "alg": "HS256"
    }
  ]
}
```

The key above validates the following `Authorization: Beaerer` demo token:

```
bearer eyJhbGciOiJIUzI1NiIsImtpZCI6InNpbTIifQ.eyJhdWQiOiJodHRwOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxNzM1Njg5NjAwLCJpc3MiOiJodHRwczovL2tyYWtlbmQuaW8iLCJqdGkiOiJtbmIyM3Zjc3J0NzU2eXVpb21uYnZjeDk4ZXJ0eXVpb3AiLCJyb2xlcyI6WyJyb2xlX2EiLCJyb2xlX2IiXSwic3ViIjoiMTIzNDU2Nzg5MHF3ZXJ0eXVpbyJ9.htgbhantGcv6zrN1i43Rl58q1sokh3lzuFgzfenI0Rk
```
