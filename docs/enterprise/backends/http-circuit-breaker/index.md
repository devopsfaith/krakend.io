# HTTP Circuit Breaker

> Implement the HTTP circuit breaker pattern in KrakenD API Gateway to enhance the resilience and stability of your API ecosystem

Source: https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/

Both this **HTTP Circuit Breaker** and the regular [Circuit Breaker](https://www.krakend.io/docs/enterprise/backends/circuit-breaker/) are **state machines** that monitor failures. Once they see more consecutive errors than expected within the defined time window, they prevent further traffic from reaching the backend and enter a cooldown state.

The HTTP Circuit Breaker is an **automatic protection measure** for your API stack and **avoids cascade failures**, keeping your API responsive and resilient. It has a low resource consumption. Try to implement it consistently.

## Difference between the Circuit Breaker and the HTTP Circuit Breaker

The HTTP Circuit Breaker (`qos/circuit-breaker/http`) behaves mostly like a regular [Circuit Breaker](https://www.krakend.io/docs/enterprise/backends/circuit-breaker/) (`qos/circuit-breaker`), but it has a few differences:

- Allows you to **customize the HTTP status codes** considered errors.
- Can read HTTP status code **even with no-op** and other encodings
- It is executed at a different stage

Do not run both

You should not run both types of Circuit Breakers in the same backend as they would compete with each other.

On the common part, the HTTP Circuit Breaker uses the same settings and adds the status code list, and also considers other errors, such as **connectivity issues or timeouts**.

Read [How the Circuit Breaker works](https://www.krakend.io/docs/enterprise/backends/circuit-breaker/#how-the-circuit-breaker-works) to better understand this pattern.

## HTTP Circuit breaker configuration

The HTTP Circuit Breaker is available in the namespace `qos/circuit-breaker/http` inside the `extra_config` key of every `backend`. The following configuration is an example of how to add circuit breaker capabilities to a backend. While the regular Circuit Breaker will consider an error anything different than a 200 or 201 status code, you can extend this list using the `valid_status_codes` array, which is the most important configuration:

```json
{
  "endpoints": [
    {
      "endpoint": "/myendpoint",
      "method": "GET",
      "backend": [
        {
          "host": [
            "http://api.example.com"
          ],
          "url_pattern": "/mybackend-endpoint",
          "extra_config": {
            "qos/circuit-breaker/http": {
              "valid_status_codes": [
                200,
                201,
                400,
                404
              ],
              "@comment": "Three errors IN A ROW within a minute, stop sending traffic!",
              "interval": 60,
              "timeout": 10,
              "max_errors": 3,
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

##### [`interval`](https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/#interval "Click to copy link to interval") * integer

Time window where the errors count, in seconds.

##### [`log_status_change`](https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/#log_status_change "Click to copy link to log_status_change") boolean

Whether to log the changes of state of this circuit breaker or not.

Defaults to `false`

##### [`max_errors`](https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/#max_errors "Click to copy link to max_errors") * integer

The **CONSECUTIVE** (not total) number of errors within the `interval` window to consider the backend unhealthy. All HTTP status codes different than `20x` are considered an error, except for the `no-op` encoding that does not evaluate status codes and is limited to connectivity/networking, security and component errors. See the definition of error below.

Example: `5`

##### [`name`](https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/#name "Click to copy link to name") string

A friendly name to follow this circuit breaker’s activity in the logs.

Example: `"cb-backend-1"`

##### [`timeout`](https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/#timeout "Click to copy link to timeout") * integer

For how many seconds the circuit breaker will wait before testing again if the backend is healthy. This number of seconds can also be read as the **minimum cooldown** of the backend interaction.

Example: `10`

##### [`valid_status_codes`](https://www.krakend.io/docs/enterprise/backends/http-circuit-breaker/#valid_status_codes "Click to copy link to valid_status_codes") * array of integers

A list of HTTP status codes that will be considered successful responses. Any response with a status code not in this list will be counted as an error by the circuit breaker.

Example: `[200,201,404]`

Schema: [https://www.krakend.io/schema/v3.0/qos/circuit-breaker-http.json](https://www.krakend.io/schema/v3.0/qos/circuit-breaker-http.json "JSON schema definition")

**IMPORTANT**: The number of maximum errors reflects **consecutive errors**, and **not the aggregated number** of errors in the period. This approach works better when your traffic is variable, as it’s based on a **probabilistic pattern** and isn’t affected by traffic volume.

## Limitations with `backend/http`

The HTTP Circuit Breaker is a subtype of the `backend/http`, that means that if the HTTP Circuit Breaker faces a failing status code, any configuration related to [custom detailed errors](https://www.krakend.io/docs/enterprise/backends/detailed-errors/) is ignored.

## HTTP Circuit Breaker Metrics

Since v3.0, the HTTP Circuit Breaker reports its state transitions and evaluated requests as OpenTelemetry metrics, the same ones as the regular Circuit Breaker. See [Circuit Breaker metrics in OpenTelemetry](https://www.krakend.io/docs/enterprise/backends/circuit-breaker/#circuit-breaker-metrics-in-opentelemetry) for the complete list and their meaning.
