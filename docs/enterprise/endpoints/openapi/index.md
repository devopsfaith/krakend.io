# Document your endpoints with OpenAPI

> Enrich the OpenAPI specification that KrakenD Enterprise exports with API metadata, reusable components, and per-endpoint documentation.

Source: https://www.krakend.io/docs/enterprise/endpoints/openapi/

KrakenD Enterprise generates the **OpenAPI documentation** (formerly Swagger) of your API when you run the `krakend openapi export` command (see [Exporting to OpenAPI](https://www.krakend.io/docs/enterprise/developer/openapi/)). The `documentation/openapi` configuration enriches that export with your company information, reusable components, and a detailed description of every endpoint, so API consumers get complete documentation without you maintaining a separate specification.

## OpenAPI configuration

The OpenAPI documentation configuration has **two different placements** that you can use:

- `service` level: Defines the general business information and metadata that gives context about your company and how API consumers can get in touch with you. It is common to all endpoints.
- `endpoint` level: Defines the documentation and metadata for a specific endpoint.

Both configuration placements are optional, and when you don’t provide the information, KrakenD sets defaults.

### Setting the basic API information

At the service level (the root of the configuration file), declare the `documentation/openapi` namespace inside `extra_config` to set the general API information for your developers. **All the fields are optional**.

The following example shows the available fields:

```json
{
  "version": 4,
  "name": "Your KrakenD API",
  "extra_config": {
    "documentation/openapi": {
      "description": "This is a sample server. You can find out more at [example.com](https://example.com)",
      "version": "1.0.0",
      "host": "api.example.com",
      "base_path": "/v1",
      "terms_of_service": "https://example.com/terms",
      "contact_name": "API Support",
      "contact_email": "contact@example.com",
      "contact_url": "https://example.com/developers",
      "license_name": "MIT",
      "license_url": "https://opensource.org/licenses/MIT",
      "tag_definition": [
        {
          "name": "Admin",
          "description": "All endpoints for administrative users"
        }
      ],
      "components_schemas": {
        "Pet": {
          "type": "object",
          "required": ["id","name"],
          "properties": {
            "id": {
              "type": "integer",
              "format": "int64"
            },
            "name": {
              "type": "string"
            },
            "tag": {
              "type": "string"
            }
          }
        },
        "Pets": {
          "type": "array",
          "maxItems": 100,
          "items": {
            "$ref": "#/components/schemas/Pet"
          }
        }
      },
      "components_parameters": {
        "PageParam": {
          "name": "page",
          "in": "query",
          "description": "The page number to retrieve",
          "required": false,
          "schema": {
            "type": "integer"
          }
        }
      }
    }
  }
}
```

##### Fields of Generate documentation using OpenAPI

\* required fields

##### [`base_path`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#base_path "Click to copy link to base_path") string

A starting path that prefixes every endpoint.

Example: `"/v1"`

##### [`components_parameters`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#components_parameters "Click to copy link to components_parameters") object

Reusable OpenAPI parameter objects that the generated spec declares under `components/parameters`. You can pass either the parameter object or a base64 string.

Example: `{"MyParam":{"in":"query","name":"my_param","schema":{"type":"string"}}}`

Properties of `components_parameters` can use a name matching the pattern `.*`, and their content is an `[string object]`

##### [`components_schemas`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#components_schemas "Click to copy link to components_schemas") object

The JSON Schemas you can reuse inside endpoint definitions using `ref`. You can pass either the JSON Schema object or a base64 string.

Example: `{"Pet":{"required":["id","name"],"type":"object"}}`

Properties of `components_schemas` can use a name matching the pattern `.*`, and their content is an `[string object]`

##### [`contact_email`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#contact_email "Click to copy link to contact_email") string

The email address where consumers of your API can reach you.

Example: `"contact@example.com"`

##### [`contact_name`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#contact_name "Click to copy link to contact_name") string

The name of the person or team responsible for the API.

Example: `"API Support"`

##### [`contact_url`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#contact_url "Click to copy link to contact_url") string

The URL where consumers of your API find contact information.

Example: `"https://example.com/developers"`

##### [`cookie_name`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#cookie_name "Click to copy link to cookie_name") string

The name of the cookie declared under `components/securitySchemes` in the generated OpenAPI spec.

Defaults to `"SESSIONID"`

##### [`custom_security_schemes`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#custom_security_schemes "Click to copy link to custom_security_schemes") object

Adds custom security schemes under `components/securitySchemes` in the generated OpenAPI spec. Use it to define security schemes different from the built-in ones (e.g., `jwt`, `apikey`, `cookie`). Declare each scheme with its full definition (e.g., `"OAuth2Security":{...}`), and enable it in each endpoint by writing its name with an empty object (e.g., `{"OAuth2Security":{}}`).

Example: `{"OAuth2Security":{"description":"OAuth2 security scheme","flows":{"authorizationCode":{"authorizationUrl":"https://example.com/oauth/authorize","scopes":{},"tokenUrl":"https://example.com/oauth/token"}},"type":"oauth2"}}`

Properties of `custom_security_schemes` can use a name matching the pattern `^.*$`, and their content is an `object` with the following properties:

##### [`description`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#description "Click to copy link to description") string

An introductory, optionally verbose, explanation of your API supporting [CommonMark](https://commonmark.org/help/) syntax. To load an **external markdown file**, use flexible configuration, for instance `"description": {{include "openapi/intro.md" | toJson }}`

Example: `"Hi there, I am [OpenAPI](https://www.krakend.io/docs/enterprise/endpoints/openapi/)"`

##### [`host`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#host "Click to copy link to host") string

The hostname where you will publish your API.

Example: `"api.example.com"`

##### [`jwt_key`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#jwt_key "Click to copy link to jwt_key") string

The name of the JWT key declared under `components/securitySchemes` in the generated OpenAPI spec.

Defaults to `"KrakenD-JWT"`

##### [`license_name`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#license_name "Click to copy link to license_name") string

The name of the license of your API, e.g., `Apache 2.0`.

Example: `"MIT"`

##### [`license_url`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#license_url "Click to copy link to license_url") string

The URL where the license is hosted.

Example: `"https://opensource.org/licenses/MIT"`

##### [`servers`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#servers "Click to copy link to servers") array of objects

The list of servers where the API is hosted. The server URL can be a relative path, e.g., `/v1`, or an absolute URL. The URL might contain `{variables}`, although only OpenAPI recognizes them: KrakenD treats them as literal strings.

Examples: `[{"url":"/v1"}]` , `[{"url":"https://example.com:{port}","variables":{"port":{"default":"8443","enum":["8443","443"]}}}]`

Each item of servers accepts the following properties:

##### [`description`](#servers-description "Click to copy link to description") string

A short description of the server URL.

##### [`url`](#servers-url "Click to copy link to url") * string, object

The URL of the server, used as the base path for all endpoints.

##### [`variables`](#servers-variables "Click to copy link to variables") object

A [Server Variable Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#server-variable-object) according to the OpenAPI specification. The variable name is the key and the value is the default value for that variable.

Properties of `variables` can use a name matching the pattern `^.*$`, and their content is an `[string object]`

##### [`tag_definition`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#tag_definition "Click to copy link to tag_definition") array of objects

Sets a detailed description for the tags classifying endpoints when generating the OpenAPI spec.

Example: `[{"description":"Description of tag1","name":"Tag1"}]`

Each item of tag\_definition accepts the following properties:

##### [`description`](#tag_definition-description "Click to copy link to description") string

Describes what this tag groups.

##### [`name`](#tag_definition-name "Click to copy link to name") * string

The name of the tag. You will use this name in each endpoint.

##### [`terms_of_service`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#terms_of_service "Click to copy link to terms_of_service") string

The URL to the terms of service for using this API.

Example: `"https://example.com/terms"`

##### [`version`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#version "Click to copy link to version") string

The version of your API, e.g., `1.0`.

Example: `"1.0"`

Schema: [https://www.krakend.io/schema/v3.0/documentation/openapi.json](https://www.krakend.io/schema/v3.0/documentation/openapi.json "JSON schema definition")

The `name` specified in the root of the configuration (outside the OpenAPI’s `extra_config`) is used as the **title of your API**. If none is present, the string `KrakenD - API Gateway` is the default.

Use `components_parameters` to declare **reusable parameter objects** that the generated specification includes under `components/parameters`. Like `components_schemas`, each parameter can be a full OpenAPI parameter object or a base64-encoded string. To reuse a parameter in an endpoint, add an item with its `ref` to the `query_definition`, `param_definition`, or `header_definition` list, e.g., `{"ref": "PageParam"}`. Write only the parameter name, without the `#/components/parameters/` prefix.

To include a full markdown file in the introduction, use flexible configuration. For instance, if you write a markdown file under `partials/openapi/intro.md`, you can load it as follows:

```go-text-template
{
  "version": 4,
  "name": "Your KrakenD API",
  "extra_config": {
    "documentation/openapi": {
      "description": {{include "openapi/intro.md" | toJson }}
    }
  }
}
```

### Documenting endpoints

In addition to setting global metadata for the whole API, you can add information to each endpoint so consumers understand what every endpoint does. **All fields are optional**:

##### Fields of Generate endpoint documentation using OpenAPI

\* required fields

##### [`audience`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#audience "Click to copy link to audience") array of strings

The list of audiences that will consume this endpoint. These values **do not define the gateway logic** in any way. They are a way to group endpoints and filter them out when generating the OpenAPI documentation. Use `*` to indicate an endpoint will be present in any audience generated.

Example: `["gold","silver","*"]`

##### [`custom_security_schemes`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#custom_security_schemes "Click to copy link to custom_security_schemes") object

The custom security schemes that apply to this endpoint. Write each scheme name as declared in the service-level `custom_security_schemes`, with an empty object as value, e.g., `{"OAuth2Security":{}}`.

Example: `{"OAuth2Security":{}}`

Properties of `custom_security_schemes` can use a name matching the pattern `^.*$`, and their content is an `object` with the following properties:

##### [`description`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#description "Click to copy link to description") string

A detailed explanation of what the endpoint does, supporting [CommonMark](https://commonmark.org/help/) syntax. Use `summary` for a short version.

Example: `"Lists all users in the system, paginated in blocks of 50 users"`

##### [`disable_default_response_definitions`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#disable_default_response_definitions "Click to copy link to disable_default_response_definitions") boolean

By default, KrakenD adds a `500` and a `200` response definition to the endpoint. Set this property to `true` to avoid this behavior.

Defaults to `false`

##### [`example`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#example "Click to copy link to example") object, string

**Deprecated in OAS3** (use `response_definition` instead). A free form JSON object or a string you would like to show as a sample response of the endpoint. The examples assume they are JSON content types except when using the `output_encoding=string`.

##### [`header_definition`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#header_definition "Click to copy link to header_definition") array of objects

Sets a detailed description for the headers allowed in the endpoint. Make sure to include the same headers in the endpoint’s `input_headers`.

Example: `[{"description":"The type of content","name":"Content-Type"}]`

Each item of header\_definition accepts the following properties:

##### [`description`](#header_definition-description "Click to copy link to description") string

The description of the header.

Example: `"The Content-Type sets the encoding of the request"`

##### [`enum`](#header_definition-enum "Click to copy link to enum") array of \[array boolean integer number object string]s

The allowed values for this header

Example: `["application/json","application/xml"]`

##### [`hide`](#header_definition-hide "Click to copy link to hide") boolean

Hides this header from the generated documentation.

Defaults to `false`

##### [`name`](#header_definition-name "Click to copy link to name") string

The name of the header, as declared in `input_headers`

##### [`ref`](#header_definition-ref "Click to copy link to ref") string

The name of a parameter declared in the service-level `components_parameters`, without the `#/components/parameters/` prefix. When you set `ref`, the `name` is not needed.

Example: `"PageParam"`

##### [`required`](#header_definition-required "Click to copy link to required") boolean

Set to `true` when this header is required.

Defaults to `false`

##### [`type`](#header_definition-type "Click to copy link to type")

The type of data according to the OpenAPI spec

Possible values are: `"integer"` , `"string"` , `"boolean"` , `"object"` , `"array"` , `"float"` , `"date-time"`

Example: `"string"`

Defaults to `"string"`

##### [`operation_id`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#operation_id "Click to copy link to operation_id") string

A unique identifier of the operation, usually the method plus the endpoint. If provided, each ID must be unique among all operations described in your API.

Example: `"GET/foo"`

##### [`param_definition`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#param_definition "Click to copy link to param_definition") array of objects

Sets a detailed description for the URL parameters (e.g., `/foo/{param}`) required in the endpoint. Write each parameter name exactly as in the endpoint definition.

Example: `[{"description":"The unique user ID","name":"id_user"}]`

Each item of param\_definition accepts the following properties:

##### [`description`](#param_definition-description "Click to copy link to description") string

The description of the parameter.

##### [`enum`](#param_definition-enum "Click to copy link to enum") array of \[array boolean integer number object string]s

The allowed values for this parameter

Example: `["application/json","application/xml"]`

##### [`example`](#param_definition-example "Click to copy link to example") string, number, boolean, array, object

An example value for this parameter. This example is injected in the spec as is.

##### [`examples`](#param_definition-examples "Click to copy link to examples") object

Multiple example values for this parameter, where each key is the name of the example.

Properties of `examples` can use a name matching the pattern `^.*$`, and their content is an `[string number boolean array object]`

##### [`format`](#param_definition-format "Click to copy link to format")

The extending format for the previously defined type. If the type is `number` or `string`, you can apply one of the available formats. The linter does not check that the format matches the type.

Possible values are: `"int32"` , `"int64"` , `"float"` , `"double"` , `"date"` , `"date-time"` , `"byte"` , `"uuid"` , `""`

##### [`hide`](#param_definition-hide "Click to copy link to hide") boolean

Hides this parameter from the generated documentation, although it is still part of the endpoint definition.

Defaults to `false`

##### [`name`](#param_definition-name "Click to copy link to name") string

The name of the parameter, as declared in `endpoint` without the curly braces `{}`

##### [`ref`](#param_definition-ref "Click to copy link to ref") string

The name of a parameter declared in the service-level `components_parameters`, without the `#/components/parameters/` prefix. When you set `ref`, the `name` is not needed.

Example: `"PageParam"`

##### [`required`](#param_definition-required "Click to copy link to required") boolean

A path parameter is always mandatory on KrakenD, but you can still generate the OpenAPI documentation saying otherwise.

Defaults to `true`

##### [`type`](#param_definition-type "Click to copy link to type")

The type of data according to the OpenAPI spec

Possible values are: `"integer"` , `"number"` , `"string"` , `"boolean"` , `"object"` , `"array"` , `"float"` , `"date-time"`

Example: `"string"`

Defaults to `"string"`

##### [`query_definition`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#query_definition "Click to copy link to query_definition") array of objects

Sets a detailed description for the query strings allowed in the endpoint. Make sure to include the same strings in the endpoint’s `input_query_strings`.

Example: `[{"description":"The number of the page","name":"page"}]`

Each item of query\_definition accepts the following properties:

##### [`description`](#query_definition-description "Click to copy link to description") string

The description of the query string.

##### [`enum`](#query_definition-enum "Click to copy link to enum") array of \[array boolean integer number object string]s

The allowed values for this query definition

##### [`example`](#query_definition-example "Click to copy link to example") string, object, array, boolean, integer, null, number

An example value for this query string.

##### [`format`](#query_definition-format "Click to copy link to format")

The extending format for the previously defined type. If the type is `number` or `string`, you can apply one of the available formats. The linter does not check that the format matches the type.

Possible values are: `"int32"` , `"int64"` , `"float"` , `"double"` , `"date"` , `"date-time"` , `"byte"` , `"uuid"` , `""`

##### [`hide`](#query_definition-hide "Click to copy link to hide") boolean

Hides this query string from the generated documentation.

Defaults to `false`

##### [`name`](#query_definition-name "Click to copy link to name") string

The name of the query string, as declared in `input_query_strings`.

##### [`ref`](#query_definition-ref "Click to copy link to ref") string

The name of a parameter declared in the service-level `components_parameters`, without the `#/components/parameters/` prefix. When you set `ref`, the `name` is not needed.

Example: `"PageParam"`

##### [`required`](#query_definition-required "Click to copy link to required") boolean

Set to `true` when this query string is required.

Defaults to `true`

##### [`type`](#query_definition-type "Click to copy link to type")

The type of data according to the OpenAPI spec

Possible values are: `"integer"` , `"number"` , `"string"` , `"boolean"` , `"object"` , `"array"` , `"float"` , `"date-time"`

Defaults to `"string"`

##### [`request_definition`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#request_definition "Click to copy link to request_definition") array

Describes the payload needed to consume the endpoint. If a JSON Schema validation exists, it takes precedence when generating the documentation. An example use case is when you need to document a `multipart/form-data` request body. This property is an array because you can document requests with multiple content types.

Example: `[{"content_type":"application/json","description":"Updates the user","example":{"first_name":"Mary","id_user":33}}]`

Each item of request\_definition accepts the following properties:

##### [`content_type`](#request_definition-content_type "Click to copy link to content_type") * string

The content type of the request payload, e.g., `application/json`. You cannot repeat this content type in another item.

##### [`description`](#request_definition-description "Click to copy link to description") string

The description of the payload this endpoint accepts.

##### [`example`](#request_definition-example "Click to copy link to example") string, object, array, boolean, integer, null, number

A free form JSON object or a string you would like to show as a sample request payload of the endpoint. The examples assume they are JSON content types.

##### [`example_schema`](#request_definition-example_schema "Click to copy link to example_schema") string, object

A JSON schema that describes the request format for the accepted payload in the endpoint. Use either `example` or `example_schema`, but not both.

##### [`examples`](#request_definition-examples "Click to copy link to examples") object

A free form JSON object or a string you would like to show as a sample request payload of the endpoint. The examples assume they are JSON content types.

Examples: `{"Example 1":{"msg":"a message"}}` , `{"Example 1":{"msg":"a message"},"Example 2":{"error":"an error message"}}`

##### [`ref`](#request_definition-ref "Click to copy link to ref") string

The relative reference to the `components/schemas` OpenAPI definition that describes the accepted request. Notice that the path `#/components/schemas/` is not needed.

Example: `"your_schema_name"`

##### [`response_definition`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#response_definition "Click to copy link to response_definition") object

Describes the different status codes returned by this endpoint. Each key is a status code represented as a string, e.g., `200` (success), `500` (internal error), or `default`.

Example: `{"404":{"@comment":"Some comment","content_type":"application/json","description":"Page not found","example":{"status":"KO"}}}`

Properties of `response_definition` can use a name matching the pattern `default|^[0-9]+$`, and their content is an 

##### [`servers`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#servers "Click to copy link to servers") array of objects

The list of servers where this endpoint is hosted, when they differ from the service-level `servers`. The server URL can be a relative path, e.g., `/v1`, or an absolute URL. The URL might contain `{variables}`, although only OpenAPI recognizes them: KrakenD treats them as literal strings.

Examples: `[{"url":"/v1"}]` , `[{"url":"https://example.com:{port}","variables":{"port":{"default":"8443","enum":["8443","443"]}}}]`

Each item of servers accepts the following properties:

##### [`description`](#servers-description "Click to copy link to description") string

A short description of the server URL.

##### [`url`](#servers-url "Click to copy link to url") * string, object

The URL of the server, used as the base path for this endpoint.

##### [`variables`](#servers-variables "Click to copy link to variables") object

A [Server Variable Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#server-variable-object) according to the OpenAPI specification. The variable name is the key and the value is the default value for that variable.

Properties of `variables` can use a name matching the pattern `^.*$`, and their content is an `[string object]`

##### [`summary`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#summary "Click to copy link to summary") string

A short summary for the endpoint. Use `description` for a longer explanation.

##### [`tags`](https://www.krakend.io/docs/enterprise/endpoints/openapi/#tags "Click to copy link to tags") array of strings

You can assign a list of tags to each API operation. If you declare tags in the `tag_definition` at the OpenAPI service level, they will have a description in the documentation. Tagged operations may be handled differently by tools and libraries. For example, Swagger UI uses tags to group the displayed operations.

Schema: [https://www.krakend.io/schema/v3.0/documentation/openapi-endpoint.json](https://www.krakend.io/schema/v3.0/documentation/openapi-endpoint.json "JSON schema definition")

The example below sets a rich OpenAPI documentation for two endpoints. Notice that:

- The `GET /users` endpoint describes the `?page` query string and provides a full example response under `response_definition`.
- The `PUT /users/{id_user}` endpoint also adds a `request_definition` that defines the payload consumers need to send.

Have a look at the different parameters:

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/krakend.json",
  "host": [
    "http://localhost:8080"
  ],
  "debug_endpoint": true,
  "echo_endpoint": true,
  "endpoints": [
    {
      "endpoint": "/users",
      "method": "GET",
      "extra_config": {
        "documentation/openapi": {
          "description": "Lists all users in the system, paginated in blocks of 50 users",
          "summary": "List all users",
          "operation_id": "GET/users",
          "tags": [
            "users"
          ],
          "audience": [
            "internal"
          ],
          "query_definition": [
            {
              "name": "page",
              "required": false,
              "description": "Pass a ?page= if you want to use the pagination"
            }
          ],
          "response_definition": {
            "200": {
              "content_type": "application/json",
              "example": {
                "users": [
                  {
                    "id": 1,
                    "first_name": "Juliana",
                    "last_name": "Claire",
                    "email": "jclaire0@livejournal.com"
                  },
                  {
                    "id": 2,
                    "first_name": "Jeannette",
                    "last_name": "Hugonneau",
                    "email": "jhugonneau1@gmpg.org"
                  }
                ]
              }
            }
          }
        }
      },
      "backend": [
        {
          "url_pattern": "/api/1.0/users/list"
        }
      ]
    },
    {
      "endpoint": "/users/{id_user}",
      "method": "PUT",
      "extra_config": {
        "documentation/openapi": {
          "description": "The PUT method updates the data for the given id_user. You only need to pass the fields you want to update.",
          "summary": "Updates the user data",
          "operation_id": "PUT/users/id_user",
          "tags": [
            "users"
          ],
          "audience": [
            "internal"
          ],
          "request_definition": [
            {
              "content_type": "application/json",
              "description": "Updates provided fields. All fields are optional, id_user taken from the URL",
              "example": {
                "address": "Suite 543 907 Green Forks, Wavamouth, CT 10807-8479",
                "first_name": "Felix",
                "last_name": "Richardson"
              }
            }
          ],
          "response_definition": {
            "200": {
              "content_type": "application/json",
              "example": {
                "id_user": 33007,
                "status": "success"
              }
            }
          }
        }
      },
      "backend": [
        {
          "url_pattern": "/api/1.0/users/update/{id_user}"
        }
      ]
    }
  ]
}
```

The example above is verbose for only two endpoints, and it does not even use all the available options. You can move any part of the configuration to an external file using [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/). You can generate the OpenAPI file without any of this, but consumers appreciate a rich and detailed documentation. The following example moves the documentation out of the endpoint definition, although there are more ways of doing it:

```json
{
  "endpoints": [
    {
      "endpoint": "/users",
      "method": "GET",
      "extra_config": {
        "documentation/openapi": {
           "$ref": "./documentation/GET_users.json"
        }
      },
      "backend": [
        {
          "url_pattern": "/api/1.0/users/list"
        }
      ]
    },
    {
      "endpoint": "/users/{id_user}",
      "method": "PUT",
      "extra_config": {
          "documentation/openapi": {
            "$ref": "./documentation/PUT_users_id_user.json"
          }
      },
      "backend": [
        {
          "url_pattern": "/api/1.0/users/update/{id_user}"
        }
      ]
    }
  ]
}
```

### Integration with JSON Schema

When your endpoint uses a [`validation/json-schema`](https://www.krakend.io/docs/enterprise/endpoints/json-schema/), the documentation of all write methods (`POST`, `PUT`, `PATCH`, `DELETE`) includes its validation conditions automatically.

You don’t need to add anything else to the configuration, but you can still explain the payloads using the `request_definition` property.

### Define different audiences of your OpenAPI

When you declare your endpoints, you might want to keep some of them out of the final documentation export because the audience consuming them doesn’t need to know they exist.

For instance, your API exposes endpoints like `/user`, `/cart`, or `/admin`, where the administration endpoint is for internal usage. Your end users are not supposed to use it, so it should not appear in their documentation.

For cases like this, add audience definitions to the endpoints. For instance:

```json
[
  {
    "endpoint": "/user",
    "extra_config": {
      "documentation/openapi": {
        "description": "The user endpoint",
        "audience": [
          "public",
          "internal"
        ]
      }
    }
  },
  {
    "endpoint": "/cart",
    "extra_config": {
      "documentation/openapi": {
        "description": "The cart endpoint",
        "audience": [
          "public",
          "internal"
        ]
      }
    }
  },
  {
    "endpoint": "/admin",
    "extra_config": {
      "documentation/openapi": {
        "description": "The admin endpoint",
        "audience": [
          "internal"
        ]
      }
    }
  },
  {
    "endpoint": "/no-audience",
    "extra_config": {
      "documentation/openapi": {
        "description": "An endpoint without audience"
      }
    }
  }
]
```

Then, [when generating the documentation](https://www.krakend.io/docs/enterprise/developer/openapi/), you can filter out the `/admin` endpoint and exclude it from the final documentation with `krakend openapi export -c krakend.json -a public`. The command would document `/user`, `/cart`, and `/no-audience`.

When you filter by audience, **endpoints without an audience** always appear in the final documentation.

Similarly, `krakend openapi export -c krakend.json -a internal` generates the documentation for all the endpoints, which is the same result you get without the `-a` flag.

The `audience` attribute only excludes endpoints from the final documentation. The endpoints still exist in the service, and you must protect them against unwanted usage.

### Documenting response examples and errors

The `response_definition` object allows you to set examples of the response an API endpoint will deliver. For instance:

```json
{
  "endpoint": "/cart",
  "extra_config": {
    "documentation/openapi": {
      "description": "The cart endpoint",
      "response_definition": {
        "200": {
          "example": {
            "status": "OK",
            "message": "Product added to the cart!"
          }
        },
        "500": {
          "example": {
            "status": "KO",
            "message": "Couldn't add the product to the cart!"
          }
        }
      }
    }
  }
}
```

When the examples are long, you might want to keep the example responses in a separate file (like settings or partials) using [Flexible Configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/), so the endpoint template stays readable. For instance:

```go-text-template
{
  "endpoint": "/cart",
  "extra_config": {
    "documentation/openapi": {
      "description": "The cart endpoint",
      "response_definition": {
        "200": {
          "example": {{- include "openapi_cart_response.json" -}}
        }
      }
    }
  }
}
```

You can also describe the response with `example_schema`, a JSON schema written as an object or encoded in base64. Use either `example` or `example_schema`, but not both (if you set both, the schema takes precedence). Flexible Configuration saves you from writing base64 by hand. For instance:

```go-text-template
{
  "endpoint": "/cart",
  "extra_config": {
    "documentation/openapi": {
      "description": "The cart endpoint",
      "response_definition": {
        "200": {
          "example_schema": {{ include "cart_schema.json" | b64enc | toJson }}
        }
      }
    }
  }
}
```

Or writing the schema inline, escaped with backticks:

```go-text-template
{
  "endpoint": "/cart",
  "extra_config": {
    "documentation/openapi": {
      "description": "The cart endpoint",
      "response_definition": {
        "200": {
          "example_schema": "{{ `{
          "type": "object",
          "title": "This is the response"
          }` | b64enc }}"
        }
      }
    }
  }
}
```
