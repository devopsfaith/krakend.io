# Security Policies Engine

> Protect your APIs and enforce security policies using KrakenD Enterprise. Discover best practices and configuration options in our comprehensive security policies documentation.

Source: https://www.krakend.io/docs/enterprise/security-policies/

The policies engine lets you write custom rules validated on runtime during **requests, responses, and token validation**. The policies allow you to implement all sorts of validations and user access control, from parameter compliance, to **RBAC** (Role-Based Access Control) and **ABAC** (Attribute-Based Access Control) strategies.

## What is a policy

A policy is a test rule based on the [CEL language](https://www.krakend.io/docs/enterprise/security-policies/policy-language/) and [advanced macros](https://www.krakend.io/docs/enterprise/security-policies/advanced-policy-macros/) that evaluates the gateway’s input or output and determines if it can continue executing or if it must break the flow with an error. For example, a simple policy could look like this:

```js
has(JWT.department) && JWT.department in ["marketing", "sales"]
```

The policy above checks if the JWT token contains a claim named `department` and its value is one of the listed ones. If it doesn’t there is a configurable error. The [JWT validator](https://www.krakend.io/docs/authorization/jwt-validation/) would have previously validated that the token is valid, signed, and so on.

### What can you do with policies?

Policies extend the rest of existing features (security related or not) like token validation, CORS, HTTPS headers, authentication, parameter validation, etc., with **your set of rules**.

The rules are **business logic** that you will apply to your API. These rules might have access to query strings, URLs, parameters, cookies, tokens, time functions, geolocation, cryptography, and a long etcetera, and you can combine all this data.

For instance, real-world examples could be:

- Show a document if the user works in the legal department and has a senior role.
- The user request contains a mandatory query string and params with a particular format (regexp)
- The endpoint `/blackfriday` will become available and unavailable automatically based on dates and without any intervention.
- The GDPR cookie isn’t set, so the tracking endpoint must be disabled.
- The partner requesting this content is using a specific tenant and is in a specific billing plan to display the content

## Why are policies based on CEL?

Because CEL evaluates an expression from the [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) in nanoseconds to microseconds, the ideal use case for CEL is applications with performance-critical paths. For example, executing a security policy with each HTTP request to a service is a perfect use case for CEL because the security policy does not change constantly, and CEL will have a **negligible impact on the response time**.

The rules are pre-compiled to the AST during startup time, so when the rule is evaluated, there is only the execution part. The interpretation is never needed as it was performed when the service started.

CEL is maintained by Google and used in hundreds of mission-critical projects like Google Cloud, Openshift, Digital Ocean, or Kubernetes. Even though there are other popular policy engines, we chose CEL because of its simplicity, extensibility, and, most importantly, security and performance.

### But why not JavaScript, Lua, or WASM?

JavaScript and Lua are rich languages that require **sandboxing** to execute safely. Unfortunately, sandboxing is **costly** and heavily factors into the “what will I let users evaluate?” question when the answer is anything more than *O(n)* complexity.

CEL **evaluates linearly** concerning the expression size and the input evaluated when macros are disabled. The host environment provides the only functions beyond the built-ins you can invoke.

Then, why not WASM? WASM is an excellent choice for specific applications. It is far superior to embedded JavaScript and Lua, but **it does not support garbage collection**, and non-primitive object types require **semi-expensive calls** across modules.

In most cases, CEL will be faster and more portable for its intended use case.

## Policy placements

You can set policies between the end-user and KrakenD via **endpoint policies**, or you can set policies between KrakenD and the services you want to consume via **backend policies**. Policies can work independently or together in **two directions**, both in the request and response.

You decide in which direction you want to apply the policies by setting them inside the proper context:

- `jwt`: During the token validation (`endpoint` only) in `auth/validator`. If you don’t have any JWT validation configuration, policies remain disabled. This context evaluates in the first place.
- `req`: During the request
- `resp`: Before delivering the final response

## Configuration

The following example shows the three different places to apply policies with a few checks at various stages during endpoint and backend processing. The code is `@commented` to understand each evaluation block:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "debug_endpoint": true,
  "extra_config": {
    "router": {
      "return_error_msg": true
    }
  },
  "endpoints": [
    {
      "endpoint": "/legal/document/{docId}",
      "input_query_strings": [
        "q"
      ],
      "extra_config": {
        "security/policies": {
          "auto_join_policies": true,
          "debug": false,
          "req": {
            "@comment": "Validates that the URL parameter docId begins with 'EU' and there is a ?q= parameter",
            "policies": [
              "req_params.DocId.startsWith('EU')",
              "hasQuerystring('q')"
            ],
            "error": {
              "@comment": "If any rule fails, we will return this JSON body and content-type. Plus an HTTP status code 400",
              "body": "{\"message\":\"wrong request, try again\"}",
              "status": 400,
              "content_type": "application/json"
            }
          },
          "resp": {
            "@comment": "Check that when we get the response, contains all involved backend calls",
            "policies": [
              "resp_completed"
            ],
            "error": {
              "body": "The service didn't return all the requested information",
              "status": 500,
              "content_type": "text/plain"
            }
          },
          "jwt": {
            "@comment": "The token was already validated, but user is from legal?",
            "policies": [
              "has(JWT.user_id)",
              "'legal' == JWT.department"
            ]
          }
        },
        "auth/validator": {
          "@comment": "Add here your auth/validator settings when using 'jwt' policies"
        }
      },
      "backend": [
        {
          "url_pattern": "/cms/contracts/docid/{docId}",
          "extra_config": {
            "security/policies": {
              "auto_join_policies": true,
              "debug": false,
              "req": {
                "@comment": "DocId is like EU123456Z. We could have done this earlier too.",
                "policies": [
                  "req_params.DocId.isAlphanumeric()"
                ],
                "error": {
                  "body": "The document requested does not exist",
                  "status": 400,
                  "content_type": "text/plain"
                }
              },
              "resp": {
                "policies": [
                  "!isEmpty(resp_data.message)"
                ],
                "error": {
                  "body": "We received an empty response from the service",
                  "status": 500
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

Notice the presence of `return_error_msg` when we want to return a custom body to the end-user.

These are the options available in the component:

##### Fields of Securiy Policies

\* required fields

Minimum configuration needs **any of**: `req` , or `resp` , or `jwt`

##### [`auto_join_policies`](https://www.krakend.io/docs/enterprise/security-policies/#auto_join_policies "Click to copy link to auto_join_policies") boolean

When true, all policies of the same type concatenate with an AND operation to evaluate a single expression. Performs faster, but its harder the debug.

Defaults to `false`

##### [`debug`](https://www.krakend.io/docs/enterprise/security-policies/#debug "Click to copy link to debug") boolean

When true, all the inputs and evaluation results are printed in the console.

Defaults to `false`

##### [`disable_macros`](https://www.krakend.io/docs/enterprise/security-policies/#disable_macros "Click to copy link to disable_macros") boolean

Advanced macros can be disabled in those policies not needing them for a faster evaluation.

Defaults to `false`

##### [`jwt`](https://www.krakend.io/docs/enterprise/security-policies/#jwt "Click to copy link to jwt") object

All the policies applied in the JWT context (token validation). **You must configure `auth/validator`** for the policies to run, otherwise they will be skipped. Any policy failing will generate a `401 Unauthorized` error. Works in the `endpoint` context only, and is not available under `backend`.

##### [`policies`](#jwt-policies "Click to copy link to policies") * array of strings

An array with all the policies to evaluate. Each policy is represented as a string

##### [`req`](https://www.krakend.io/docs/enterprise/security-policies/#req "Click to copy link to req") object

All the policies applied in the request context.

##### [`error`](#req-error "Click to copy link to error") object

##### [`body`](#error-body "Click to copy link to body") string

Leave an empty string to use the validation error, or write a string with the error response body. This error is NOT returned in the response, but in the application logs, unless you enable `return_detailed_errors` in the `router` section. You can add escaped JSON, XML, etc in the string and add a Content-Type.

Defaults to `""`

##### [`content_type`](#error-content_type "Click to copy link to content_type") string

The Content-Type header you’d like to send with the error response. When unset, uses `text/plain` by default.

Defaults to `"text/plain"`

##### [`status`](#error-status "Click to copy link to status") integer

The HTTP status code you want to return when the validation fails.

Defaults to `500`

##### [`policies`](#req-policies "Click to copy link to policies") * array of strings

An array with all the policies to evaluate. Each policy is represented as a string

##### [`resp`](https://www.krakend.io/docs/enterprise/security-policies/#resp "Click to copy link to resp") object

All the policies applied in the response context.

##### [`error`](#resp-error "Click to copy link to error") object

##### [`body`](#error-body-2 "Click to copy link to body") string

Leave an empty string to use the validation error, or write a string with the error response body. This error is NOT returned in the response, but in the application logs, unless you enable `return_detailed_errors` in the `router` section. You can add escaped JSON, XML, etc in the string and add a Content-Type.

Defaults to `""`

##### [`content_type`](#error-content_type-2 "Click to copy link to content_type") string

The Content-Type header you’d like to send with the error response. When unset, uses `text/plain` by default.

Defaults to `"text/plain"`

##### [`status`](#error-status-2 "Click to copy link to status") integer

The HTTP status code you want to return when the validation fails.

Defaults to `500`

##### [`policies`](#resp-policies "Click to copy link to policies") * array of strings

An array with all the policies to evaluate. Each policy is represented as a string

Schema: [https://www.krakend.io/schema/v3.0/security/policies.json](https://www.krakend.io/schema/v3.0/security/policies.json "JSON schema definition")
