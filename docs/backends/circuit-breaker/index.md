# Circuit Breaker

> Implement the circuit breaker pattern in KrakenD API Gateway to enhance the resilience and stability of your API ecosystem

Source: https://www.krakend.io/docs/backends/circuit-breaker/

The **Circuit Breaker** is a straightforward **state machine** in the middle of the request and response that monitors all your backend failures. In the image above you can see a simplified version of its behavior. When backends fail to succeed for a number of consecutive times, the circuit breaker will prevent sending more traffic to a failing backend alleviating its pressure under challenging conditions.

When KrakenD demands more throughput than your API stack can deliver properly, the Circuit Breaker mechanism will detect the failures and prevent stressing your servers by not sending requests that are likely to fail. It is also helpful for dealing with network and other communication problems by preventing too many requests from dying due to timeouts, etc.

It is important to remark that the number of maximum errors are **consecutive errors**, and **not the total** of errors in the period. This approach works better when your traffic is variable, as it’s based on a **probabilistic pattern** and it’s not affected by the volume of traffic you might have.

A must have

The Circuit Breaker is an **automatic protection measure** for your API stack and **avoids cascade failures**, keeping your API responsive and resilient. It has a small consumption of resources. Try to implement it always. You might start with a big number of errors if you hesitate.

## Circuit breaker configuration

The Circuit Breaker is available in the namespace `qos/circuit-breaker` inside the `extra_config` key of every `backend`. The following configuration is an example of how to add circuit breaker capabilities to a backend:

```json
{
    "endpoints": [
    {
        "endpoint": "/myendpoint",
        "method": "GET",
        "backend": [
        {
            "host": [
                "http://127.0.0.1:8080"
            ],
            "url_pattern": "/mybackend-endpoint",
            "extra_config": {
                "qos/circuit-breaker": {
                    "interval": 60,
                    "timeout": 10,
                    "max_errors": 1,
                    "name": "cb-myendpoint-1",
                    "log_status_change": true
                }
            }
        }
        ]
    }
    ]
}
```

The attributes available for the configuration are:

##### Fields of Circuit Breaker

\* required fields

##### [`interval`](https://www.krakend.io/docs/backends/circuit-breaker/#interval "Click to copy link to interval") * integer

Time window where the errors count, in seconds.

##### [`log_status_change`](https://www.krakend.io/docs/backends/circuit-breaker/#log_status_change "Click to copy link to log_status_change") boolean

Whether to log the changes of state of this circuit breaker or not.

Defaults to `false`

##### [`max_errors`](https://www.krakend.io/docs/backends/circuit-breaker/#max_errors "Click to copy link to max_errors") * integer

The **CONSECUTIVE** (not total) number of errors within the `interval` window to consider the backend unhealthy. All HTTP status codes different than `20x` are considered an error, except for the `no-op` encoding that does not evaluate status codes and is limited to connectivity/networking, security and component errors. See the definition of error below.

##### [`name`](https://www.krakend.io/docs/backends/circuit-breaker/#name "Click to copy link to name") string

A friendly name to follow this circuit breaker’s activity in the logs.

Example: `"cb-backend-1"`

##### [`timeout`](https://www.krakend.io/docs/backends/circuit-breaker/#timeout "Click to copy link to timeout") * integer

For how many seconds the circuit breaker will wait before testing again if the backend is healthy.

Schema: [https://www.krakend.io/schema/v3.0/qos/circuit-breaker.json](https://www.krakend.io/schema/v3.0/qos/circuit-breaker.json "JSON schema definition")

## How the Circuit Breaker works

It’s easy to picture the state of the circuit breaker as an electrical component, where an open circuit means no flow of electricity between the ends, and a closed one normal flow:

![](https://www.krakend.io/images/documentation/circuit-breaker.png "Circuit Breaker states")

The Circuit Breaker starts with the `CLOSED` state, meaning the electricity can flow to the backends as they are considered healthy (*innocent until proven guilty*).

Then the component watches the state of the connections with your backend(s), with a tolerance to **consecutive failures** (`max_errors`) during a time interval (`interval`). it stops all the interaction with the backend for the next N seconds (the `timeout`). We call this state `OPEN`.

After waiting for this time window, the state changes to `HALF-OPEN` and allows **a single connection** to pass and **test the system** again. At this stage:

- If the test connection fails, the state returns to “open” and the circuit breaker will wait N seconds again to test it again.
- If it succeeds, it will return to the “closed “state, and the system is considered healthy.

This is the way the states change:

![circuit-breaker-transitions.mmd diagram](https://www.krakend.io/images/documentation/diagrams/circuit-breaker-transitions.mmd.svg)

- `CLOSED`: In the initial state, the system is healthy and sending connections to the backend.
- `OPEN`: When the consecutive number of errors from the backend (`max_errors`) is **exceeded**, the system changes to `OPEN`, and no further connections are sent to the backend. The system will stay in this state for N seconds ( where N = `timeout`).
- `HALF-OPEN`: After the timeout, it changes to this state and allows **one connection** to pass (the test). If the connection succeeds, the state changes to `CLOSED`, and the backend is considered to be healthy again. But if it fails, it switches back to `OPEN` for another timeout.

### Definition of error

When the circuit breaker counts the number of consecutive `max_errors`, an error could be anything that prevents having a successful connection with the service and completing the work.

`no-op` endpoints do not check HTTP status codes

Because a `no-op` does not evaluate the response status code, the circuit breaker does not see the response status code of the backend and the errors are limited to the following list below.

An error could be any of the following:

- Network or connectivity problems
- Security policies
- Timeouts
- Components in the list returning errors or having issues:
  
  - Proxy rate limit (`qos/ratelimit/proxy`)
  - Lua backend scripts (`modifier/lua-backend`)
  - CEL in the backend (`validation/cel`)
  - Lambda (`backend/lambda`)
  - AMQP or PubSub issues

#### For endpoints that DO NOT use `no-op`

In addition, only when you work with `json`, or **any other encoding different than `no-op`** , the gateway also takes into account the HTTP responses back from the backend and marks as errors:

- Status codes different than `200` or `201` (including client credentials)
- Decoding issues
- Martian issues
