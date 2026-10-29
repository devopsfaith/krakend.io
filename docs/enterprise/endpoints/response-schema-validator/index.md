# Response Schema Validation for API Endpoints

> Ensure the integrity of your API responses by implementing response schema validation in KrakenD Enterprise. Follow our documentation to learn how to validate and enforce response schemas

Source: https://www.krakend.io/docs/enterprise/endpoints/response-schema-validator/

The response JSON schema validator adds a schema validation **before the gateway returns the response to the end-user** or before it’s merged in the endpoint with the rest of the backends.

Before returning the response, you can define the minimum response fields and their characteristics through [JSON schema syntax](https://json-schema.org/) (drafts 04, 06, 07, 2019-09 and 2020-12 supported).

Validation of responses, not requests

This component validates that the response from the server of after content aggregation/manipulation in KrakenD has the desired attributes. To validate the user input on requests use the [`validation/json-schema`](https://www.krakend.io/docs/endpoints/json-schema/) instead.

You can use this plugin in conjunction with other components and perform validations, and you can insert it either in the endpoint section or the backend section. For instance, it can be part of a sequential proxy call and decide that the response does not have enough data to move forward and cancel the cascading connection.

## Configuration

The configuration is straightforward, as you only need to write the desired JSON schema you expect in the response at the `endpoint` or `backend` levels (you can place it in both). For example, to validate that the backend response has a specific schema, you would do:

```json
{
  "url_pattern": "/mybackend",
  "extra_config": {
    "validation/response-json-schema": {
      "schema": {
        "type": "object",
        "required": [
          "user"
        ]
      },
      "error": {
        "body": "We couldn't process you request, try again later.",
        "status": 401
      }
    }
  }
}
```

The configuration above declares a very simple JSON schema that checks the existence of a property `user` in the response. All backend manipulations (e.g.: `deny`, `allow`, `target`, etc.) take place before the validator runs, so when planning your validations make sure to take into account any previous modifications.

There are other attributes you can use. This is the configuration possible:

##### Fields of Response Schema Validator

\* required fields

##### [`error`](https://www.krakend.io/docs/enterprise/endpoints/response-schema-validator/#error "Click to copy link to error") object

In case the validation fails, the error definition containing body and status.

Example: `{"body":"We couldn't process you request, try again later.","status":401}`

##### [`body`](#error-body "Click to copy link to body") string

The error message you want to show when the validation fails. Set it to an empty string `""` to show the JSON-schema validation error.

Defaults to `""`

##### [`content_type`](#error-content_type "Click to copy link to content_type") string

The Content-Type header you want to set back in the response when you are setting a custom `body`

Example: `"application/json"`

Defaults to `"text/plain"`

##### [`status`](#error-status "Click to copy link to status") integer

The HTTP status code you want to set back in the response.

Defaults to `500`

##### [`schema`](https://www.krakend.io/docs/enterprise/endpoints/response-schema-validator/#schema "Click to copy link to schema") * object

Write your JSON schema directly in this field, with any number of fields or validations you need.

Schema: [https://www.krakend.io/schema/v3.0/validation/response-json-schema.json](https://www.krakend.io/schema/v3.0/validation/response-json-schema.json "JSON schema definition")

At the endpoint level the validator works exactly the same, and runs also after other manipulations. Here is the same example but with more detail on the validated JSON Schema:

```json
{
  "endpoint": "/foo",
  "extra_config": {
    "validation/response-json-schema": {
      "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "user": {
            "type": "object",
            "properties": {
              "username": {
                "type": "string"
              },
              "user_id": {
                "type": "number"
              },
              "status": {
                "type": "string",
                "enum": [
                  "registered",
                  "banned"
                ]
              }
            },
            "required": [
              "username",
              "user_id"
            ]
          }
        },
        "required": [
          "user"
        ]
      },
      "error": {
        "body": "We couldn't process you request, try again later.",
        "status": 401
      }
    }
  }
}
```

## Migration from old plugin

Prior to v2.9 the `response-schema-validator` offered this functionality, and is now deprecated as it is supported natively. If you used the plugin you will need to execute the following change in your configuration:

```diff
{
   "endpoint": "/foo",
   "extra_config": {
-    "plugin/req-resp-modifier": {
-      "name": [
-        "response-schema-validator"
-      ],
-      "response-schema-validator": {
-        "schema": {},
-        "error": {
-          "body": "The server encountered an internal error. Please try again later.",
-          "status": 500
-        }
+    "validation/response-json-schema": {
+     "schema": {},
+     "error": {
+        "body": "The server encountered an internal error. Please try again later.",
+        "status": 500
       }
     }
}
```

As you can see the following changes are needed:

- The `plugin/req-resp-modifier` is renamed to `"validation/response-json-schema`
- The `name` property goes away
- The extra `response-schema-validator` level goes away
- The attributes `schema` and `error` stay the same.
