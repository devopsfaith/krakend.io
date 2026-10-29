# Moesif integration for API Analytics and Monetization

Source: https://www.krakend.io/docs/enterprise/governance/moesif/

[Moesif](https://www.moesif.com/) is our API Analytics and Monetization partner that helps you understand and monetize API usage with a robust analytics and billing platform. While KrakenD focuses on organizing and protecting your content through the API gateway, Moesif provides governance and monetization dashboards that allow you to rule the activity on the API.

When the Moesif integration is enabled on KrakenD, the activity of your API is asynchronously pushed to Moesif, where you can configure your **API governance** and **API Monetization rules**.

KrakenD is in real-time synchronized with Moesif and applies your governance rules as set in the Moesif platform, preventing users from violating them. KrakenD also provides Moesif with identification mechanisms so you can quickly pinpoint which organizations are linked to the activity you see in the dashboards.

## How does it work

![moesif-async-flow.mmd diagram](https://www.krakend.io/images/documentation/diagrams/moesif-async-flow.mmd.svg)

When the integration is enabled, every pair of requests and responses is stored as an event in an internal in-memory queue that serves as a buffer. Then, a timer periodically takes the number of events you have set in the configuration from the queue and pushes them to the Moesif API.

**The events are pushed asynchronously to the Moesif API, and the request and response flow to the end user is unaffected.**

Once the data is pushed to Moesif, from Moesif itself, you can:

- **Analyze Customer API Usage**: Understand API usage by customer, product, revenue, and more in real time.
- **Ensure Customer Success**: Get notified of changes in API and customer usage. Identify self-serve customers ready for the sales team.
- **Charge for APIs Effortlessly**: Connect to a payment gateway and set up usage-based billing rules on API calls, gross dollar volume, and more. Issue invoices directly from Stripe, Recurly, Chargebee, or trigger webhooks.
- **Enforce Subscription Quotas**: Make your users subscribe and accept terms automatically. Allow access to freemium and trial accounts.
- **Guide Developers at Scale**: Automatically guide external developers on using your platform with behavioral emails, like they have exceeded the quota or any other rules you want to enforce.

Streaming incompatible

The activation of this component disables [streaming](https://www.krakend.io/docs/endpoints/no-op/) on all endpoints (and the full response uses buffering instead).

## Monetization and API Analytics configuration

To push data to your Moesif account, the configuration you need is straightforward, as you only need to add your Application ID and a few additional settings to map your users and companies correctly. Here is an example configuration:

```json
{
  "version": 4,
  "extra_config": {
    "telemetry/moesif": {
      "@comment": "Push user activity to Moesif based on the information contained in JWT, every second, in batches of 1000 events",
      "application_id": "yourapplicationid",
      "user_id_headers": [
        "Authorization"
      ],
      "user_id_jwt_claim": "sub",
      "identify_company": {
        "jwt_claim": "company_id"
      },
      "debug": false,
      "log_body": false,
      "event_queue_size": 1000000,
      "batch_size": 1000,
      "timer_wake_up_seconds": 1
    }
  }
}
```

The list of all the supported options is as follows:

##### Fields of Moesif integration

\* required fields

##### [`application_id`](https://www.krakend.io/docs/enterprise/governance/moesif/#application_id "Click to copy link to application_id") * string

The Collector Application ID is used to send events, actions, users, and companies to Moesif’s Collector API. Moesif provides it under the ‘API Keys’ section.

##### [`batch_size`](https://www.krakend.io/docs/enterprise/governance/moesif/#batch_size "Click to copy link to batch_size") integer

Number of events you will send on every batch reporting asynchronously to Moesif. For high throughput you will need to increase this value.

Defaults to `200`

##### [`debug`](https://www.krakend.io/docs/enterprise/governance/moesif/#debug "Click to copy link to debug") boolean

Set to true when configuring Moesif for the first time while in development, to see the activity in the logs. Set to false in production.

Defaults to `false`

##### [`event_queue_size`](https://www.krakend.io/docs/enterprise/governance/moesif/#event_queue_size "Click to copy link to event_queue_size") integer

Sends the number of events you can hold in-memory to send them asynchronously to Moesif. If the throughput of your API generates more events than the size of the queue, the exceeding events will be discarded and not reported.

Defaults to `1000000`

##### [`identify_company`](https://www.krakend.io/docs/enterprise/governance/moesif/#identify_company "Click to copy link to identify_company") object

It sets which strategy you want to use to identify the company. Identifying the company helps you efficiently govern your API. Choose the system you wish to apply (**declare only one property**). The claim value you access must be of type string. You can access nested structured using the dot `.` separator. When using dots, literals with an exact match containing the dot are checked first.

##### [`header`](#identify_company-header "Click to copy link to header") string

The company is identified using a header. Provide the header name.

Example: `"X-Tenant"`

##### [`jwt_claim`](#identify_company-jwt_claim "Click to copy link to jwt_claim") string

The company is stored in a claim inside the JWT. The claim must return a string.

Example: `"company_id"`

##### [`query_string`](#identify_company-query_string "Click to copy link to query_string") string

The company is always passed inside a query string when calling any URL. Provide the query string name.

Example: `"company"`

##### [`log_body`](https://www.krakend.io/docs/enterprise/governance/moesif/#log_body "Click to copy link to log_body") boolean

Send the body of all endpoints and requests to Moesif.

Defaults to `true`

##### [`metadata`](https://www.krakend.io/docs/enterprise/governance/moesif/#metadata "Click to copy link to metadata") object

A free-form object that allows you to push custom metadata along with events. The custom metadata appears in Moesif under a key `krakend`, you can use nesting if needed.

Example: `{"instance_id":"1234abcd","region":"us-west-1"}`

##### [`request_body_masks`](https://www.krakend.io/docs/enterprise/governance/moesif/#request_body_masks "Click to copy link to request_body_masks") array of strings

The list of fields in the request body that you want to mask before sending them to Moesif. You can set `log_body` to `false` to prevent any body being sent.

Example: `["password","credit_card"]`

##### [`request_header_masks`](https://www.krakend.io/docs/enterprise/governance/moesif/#request_header_masks "Click to copy link to request_header_masks") array of strings

The list of request headers that you want to mask their values before sending them to Moesif.

Example: `["Authorization"]`

##### [`response_body_masks`](https://www.krakend.io/docs/enterprise/governance/moesif/#response_body_masks "Click to copy link to response_body_masks") array of strings

The list of fields in the response body that you want to mask before sending them to Moesif. You can set `log_body` to `false` to prevent any body being sent.

Example: `["password","credit_card"]`

##### [`response_header_masks`](https://www.krakend.io/docs/enterprise/governance/moesif/#response_header_masks "Click to copy link to response_header_masks") array of strings

The list of response headers that you want to mask their values before sending them to Moesif.

Example: `["Cookie"]`

##### [`should_skip`](https://www.krakend.io/docs/enterprise/governance/moesif/#should_skip "Click to copy link to should_skip") string

Defines an expression expressed as [Security Policy](https://www.krakend.io/docs/enterprise/security-policies/) that avoids reporting to Moesif when the result of the evaluation is `true`.

Example: `"( req_method=='GET' || req_path.startsWith('/bar/')) && hasHeader('X-Something')"`

##### [`timer_wake_up_seconds`](https://www.krakend.io/docs/enterprise/governance/moesif/#timer_wake_up_seconds "Click to copy link to timer_wake_up_seconds") integer

Specifies how often a background thread runs to send events to Moesif. Value in seconds.

Defaults to `2`

##### [`user_id_headers`](https://www.krakend.io/docs/enterprise/governance/moesif/#user_id_headers "Click to copy link to user_id_headers") * array of strings

Defines the list of possible headers that can identify a user uniquely. When the header is `Authorization`, it automatically extracts the username if it contains an `Authorization: Basic` value with no additional configuration. If, on the other hand, you use tokens and pass an `Authorization: Bearer`, it will extract the user ID from the JWT claim defined under `user_id_jwt_claim`. If there are multiple headers in the list, all of them are tested in the given order, and the first existing header in the list is used to extract the user ID (successfully or not).

Example: `["X-User-ID","Authorization"]`

##### [`user_id_jwt_claim`](https://www.krakend.io/docs/enterprise/governance/moesif/#user_id_jwt_claim "Click to copy link to user_id_jwt_claim") string

When using JWT tokens, it defines which claim contains the user ID. The claim value you access must be of type string. You can access nested structured using the dot `.` separator. When using dots, literals with an exact match containing the dot are checked first.

Examples: `"sub"` , `"user.id"`

Defaults to `"sub"`

Schema: [https://www.krakend.io/schema/v3.0/telemetry/moesif.json](https://www.krakend.io/schema/v3.0/telemetry/moesif.json "JSON schema definition")

You have the freedom to configure the size of the queue, the wake-up timer, and the batch size to optimize resources and gain efficiency. When you enable API Analytics and Monetization, the gateway must hold information in transit until it’s pushed to the Moesif API in memory. Depending on the cardinality of your endpoints, the size of the requests and responses, etc., the memory and CPU consumption will increase accordingly.
