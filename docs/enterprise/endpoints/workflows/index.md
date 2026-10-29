# Workflows

> KrakenD's workflows functionality lets you define and orchestrate multiple backend calls in a sequence, enabling complex API flows and responses with minimal configuration.

Source: https://www.krakend.io/docs/enterprise/endpoints/workflows/

The Workflow component allows you to create **complex API flows** behind an endpoint. In a regular endpoint, you connect a route to one or several backends, but what if you could **nest other endpoints** in any backend call? The workflow component allows you, amongst other things, to:

- **Add more functionality to your backends without changing them**: like decorating responses of existing backends, sending additional messages to queues, and other functionality.
- **Create unlimited nested calls**: The user calls an endpoint that internally calls one or more services, and at the same time, they can call other services again and again to create complex workflows
- **Combine sequential and parallel flows**: While a regular endpoint offers sequential **OR** concurrent connections, with the workflow, you can connect sequentially **AND** in concurrent using the combinations that better work for you.
- **Intermediate manipulations**: Sometimes, you must do multiple manipulations and create intermediate states before another backend can use the data.
- **Set conditional logic**: Add multiple backends but call only those that comply with your business logic
- **Reduce client API calls**: Move API calls that are done by the client to a new endpoint and save all the traffic and computation to the client
- **Continue the flow on errors**: While the flow of regular endpoints halts when errors are found, the workflow can continue operations even in those cases.

In summary, a workflow can be seen as a **nested endpoint with no route exposed** to the consumers. In combination with [sequential](https://www.krakend.io/docs/enterprise/endpoints/sequential-proxy/) backends, [security policies](https://www.krakend.io/docs/enterprise/security-policies/), [API composition](https://www.krakend.io/docs/enterprise/endpoints/response-manipulation/), and many other KrakenD features, you can manipulate data and perform complex jobs that would be impossible to achieve otherwise.

## How Workflows work

When you declare an endpoint, you always add one or more backends to determine where KrakenD will connect. Workflows add the capability of adding **more internal endpoints under a backend**, so you start new processes when the backend is hit. As very few limitations apply, you can use the new internal endpoints for aggregation, conditional requests, or anything you want. The workflow can reduce the number of API calls a client application needs to make to complete a job on a microservices architecture.

Looking at the bigger picture, here’s how the workflows act in a KrakenD pipe:

![Data flow](https://www.krakend.io/images/documentation/diagrams/components-sequence-simple.mmd.svg)

As you can see, when you fetch data from a backend (whether initiated by an end-user or an [async agent](https://www.krakend.io/docs/enterprise/async/) through an endpoint), you can repeatedly initiate the flow of another endpoint (saving you from the unnecessary HTTP processing).

## Workflow declaration

A `workflow` object always lives under a `backend`’s `extra_config` and, from a functional perspective, is precisely like any other `endpoint` object.

The significant differences are that its first parent `endpoint` object handles the end-user HTTP request (like validating the JWT token, applying CORS, etc.), while the `workflow` kicks in in a later stage that has all the HTTP processing completed by its parent and concentrates on the data manipulation and proxy parts. It is important to notice that the `workflow` has an `endpoint` wrapped inside its configuration, but its **route is unpublished and inaccessible**.

Skipping the unrelated parts, the addition of a workflow looks like this (this is a conceptual, non-valid, configuration):

```yaml
  endpoint: /foo/{param}
  backend:
    url_pattern: /__workflow/unused-pattern
    extra_config:
      worfklow:
        endpoint: /__workflow/unpublished-route/{param}
        backend:
          url_pattern: /backend-2
```

Get into an agreement with your team

As you can see, as the gateway sets no limit to the complexity and level of nesting you can do, you could implement crazy ideas. If you use complex workflows, you and your team should go into a handshake deal to set limits and boundaries to keep everyone’s sanity.

From this syntax, you need to understand the following concepts:

- You could repeatedly add another workflow inside any `backend`. There is no logical limit to nested `workflow` components. The limits are the latency and machine resources.
- The workflow can include as many backends as you want, sequential or not.
- The `endpoint` inside the `workflow` (`/__workflow/unpublished-route/{param}` above) must have any `{params}` you will use inside the workflow’s `backend`. Besides that, this endpoint is solely to identify the log activity when triggering a workflow, as its HTTP route does not exist. It is not required that it starts with `/__workflow` but that helps when you read the logs.
- The `url_pattern` declared at the immediate superior level of a `workflow` (here `/__workflow/unused-pattern`), from a connection perspective, **is not used at all**. Yet, it has an important function: declaring the [dynamic routing](https://www.krakend.io/docs/enterprise/endpoints/dynamic-routing/) (e.g., `{JWT.sub}`) and [sequential proxy](https://www.krakend.io/docs/enterprise/endpoints/sequential-proxy/) variables (e.g., `{resp0_id}`)you will reuse in the workflow. While the `url_pattern` you choose is unusued for anything else than logs, if dynamic and sequential proxy variables do not exist in the `url_pattern`, inner levels won’t have access to these variables. We recommend you again writing `/__workflow/` or something that helps you identify it in the logs and visualize that this is not any call to a service.
- If you have a `host` list outside the `workflow`, all backends inside will use it by default, so you can skip the declaration if they are all the same.
- The endpoint will stop any workflow when its `timeout` is reached. If you need larger timeouts, remember to declare them decreasing (e.g., the endpoint timeout is larger than the backend/workflow timeout).
- Unlike `endpoints`, workflows can continue with the rest of the backends if you use the `ignore_errors` flag.
- From a Telemetry point of view, workflows get their share too!

## Workflow configuration

Experimental syntax

The declarative workflow configuration is considered experimental in its first release of v2.7 because future changes could be needed given its endless uses and combinations.

You’ll find the following configuration familiar as it is like an `endpoint` with very few differences:

##### Fields of Workflow Object

\* required fields

##### [`backend`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#backend "Click to copy link to backend") * array of objects

List of all the [backend objects](https://www.krakend.io/docs/backends/) called within this workflow. Each backend can initiate another workflow if needed.

##### [`concurrent_calls`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#concurrent_calls "Click to copy link to concurrent_calls") integer

The concurrent requests are an excellent technique to improve the response times and decrease error rates by requesting in parallel the same information multiple times. Yes, you make the same request to several backends instead of asking to just one. When the first backend returns the information, the remaining requests are canceled.

Defaults to `1`

##### [`endpoint`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#endpoint "Click to copy link to endpoint") * string

An endpoint name for the workflow that will be used in logs. The name will be appended to the string `/__workflow/` in the logs, and although it does not receive traffic under this route, it is necessary when you want to pass URL `{params}` to the nested backends.

Example: `"/workflow-1/{param1}"`

##### [`extra_config`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#extra_config "Click to copy link to extra_config") object

Configuration entries for additional components that are executed within this endpoint, during the request, response or merge operations.

##### [`ignore_errors`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#ignore_errors "Click to copy link to ignore_errors")

Allow the workflow to continue with the rest of declared actions when there are errors (like security policies, network errors, etc). The default behavior of KrakenD is to abort an execution that has errors as soon as possible. If you use conditional backends and similar approaches, you might want to allow the gateway to go through all steps.

Defaults to `false`

##### [`output_encoding`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#output_encoding "Click to copy link to output_encoding")

The gateway can work with several content types, even allowing your clients to choose how to consume the content. See the [supported encodings](https://www.krakend.io/docs/endpoints/content-types/)

Possible values are: `"json"` , `"json-collection"` , `"yaml"` , `"fast-json"` , `"xml"` , `"negotiate"` , `"string"` , `"no-op"`

Defaults to `"json"`

##### [`timeout`](https://www.krakend.io/docs/enterprise/endpoints/workflows/#timeout "Click to copy link to timeout") string

The duration you write in the timeout represents the **whole duration of the pipe**, so it counts the time all your backends take to respond and the processing of all the components involved in the endpoint (the request, fetching data, manipulation, etc.). By default the timeout is taken from the parent endpoint, if redefined **make sure that is smaller than the endpoint’s**

Specify units using `ns` (nanoseconds), `us` or `µs` (microseconds), `ms` (milliseconds), `s` (seconds), `m` (minutes), or `h` (hours).

Examples: `"2s"` , `"1500ms"`

Schema: [https://www.krakend.io/schema/v3.0/workflow.json](https://www.krakend.io/schema/v3.0/workflow.json "JSON schema definition")

Here is an elementary example of a workflow you can try locally:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "echo_endpoint": true,
  "debug_endpoint": true,
  "endpoints": [
    {
      "endpoint": "/test",
      "extra_config": {
        "proxy": {
          "sequential": true
        }
      },
      "@comment": "Because there is a sequential proxy the two first level backends are executed in order",
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__debug/call-1",
          "group": "call-1"
        },
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__debug/call-2",
          "group": "call-2",
          "extra_config": {
            "workflow": {
              "endpoint": "/call-2",
              "@comment": "Call 2A and 2B are fetched in parallel because there is no sequential proxy inside the workflow",
              "backend": [
                {
                  "url_pattern": "/__debug/call-2A",
                  "group": "call-2A"
                },
                {
                  "url_pattern": "/__debug/call-2A",
                  "group": "call-2B"
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

The example above calls three backend servers for one endpoint call and returns a structure like this:

- `call-1`
- `call-2`
  
  - `call-2A`
  - `call-2B`

Notice that because there is a `sequential` proxy flag, the calls 1 and 2 are fetched one after the other. But the calls 2A and 2B are fetched concurrently, because there is no sequential configuration inside the second backend.

Another important takeaway is that `"url_pattern": "/__debug/call-2"` is never called. This is because when there is a `workflow` object inside a backend, the patterns and hosts used are those inside its inner `backend` definition. Still, `url_pattern` in the superior levels is needed to define the dynamic variables you can use inside the workflows.

Let’s see a practical example. Here is a short flow:

![Workflows Example](https://www.krakend.io/images/documentation/diagrams/workflows-example.mmd.svg)

In the example above, a user signs up using a single endpoint on KrakenD, and the gateway calls a legacy server. Up to this point, this could be a regular endpoint, but when the successful response from the legacy service comes in, we want to start a workflow with two more concurrent calls: one inserting an event into a queue for other microservices to be notified and another triggering email sending.

In this example, our old legacy application grows in functionality without actually coding on it. If developers won’t touch legacy code with a ten-foot pole, this strategy helps them add new services without changing the API contract there was with the end user. This example mixes concurrent and sequential calls (the lines do not reveal the difference between concurrent and sequential).

The configuration would be:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "host": [
    "http://localhost:8080"
  ],
  "debug_endpoint": true,
  "echo_endpoint": true,
  "endpoints": [
    {
      "@comment": "signup endpoint for /user/signup/yes and /user/signup/no",
      "method": "POST",
      "endpoint": "/user/signup/{wants_notifications}",
      "input_headers": [
        "User-Agent"
      ],
      "extra_config": {
        "proxy": {
          "@comment": "We want our first group of backends to register in order (sequentially)",
          "sequential": true
        }
      },
      "backend": [
        {
          "@comment": "Call to the legacy service registering the user first",
          "method": "POST",
          "url_pattern": "/__debug/user-registration",
          "group": "legacy-response"
        },
        {
          "@comment": "Additional services next. Declare the 'message' field from the legacy response, user agent, and params",
          "url_pattern": "/__workflow/{resp0_legacy-response.message}/{input_headers.User-Agent}/{wants_notifications}/",
          "group": "additional-services",
          "extra_config": {
            "workflow": {
              "ignore_errors": true,
              "endpoint": "/workflow1/{wants_notifications}/{resp0_legacy-response.message}",
              "@comment": "Backends below will be executed concurrently after the legacy service has been called and the signup was ok (returned a 'message')",
              "backend": [
                {
                  "@comment": "publish a message to the queue",
                  "url_pattern": "/__debug/you-could-replace-this-with-a-rabbitmq?newuser={resp0_legacy-response.message}",
                  "group": "notification-service"
                },
                {
                  "@comment": "trigger a welcome email only when when user wants notifications ('yes')",
                  "url_pattern": "/__echo/welcome/{resp0_legacy-response.message}?ua={input_headers.User-Agent}",
                  "extra_config": {
                    "security/policies": {
                      "req": {
                        "policies": [
                          "req_params.Wants_notifications == 'yes'"
                        ]
                      }
                    }
                  },
                  "allow": [
                    "req_uri"
                  ],
                  "mapping": {
                    "User-Agent": "browser"
                  },
                  "group": "send-email"
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

The response for the following configuration is, when calling `/user/signup/yes`

Response when user wants notifications 

```
$curl -XPOST http://localhost:8080/user/signup/yes | jq
 {
  "additional-services": {
    "notification-service": {
      "message": "pong"
    },
    "send-email": {
      "req_uri": "/__echo/welcome/pong?ua=curl/8.6.0"
    }
  },
  "legacy-response": {
    "message": "pong"
  }
}
```

And when calling `/user/signup/no`

Response when user does not want email notifications 

```
$curl -XPOST http://localhost:8080/user/signup/yes | jq
 {
  "additional-services": {
    "notification-service": {
      "message": "pong"
    }
  },
  "legacy-response": {
    "message": "pong"
  }
}
```

Try this example locally and play with it to understand the flow.
