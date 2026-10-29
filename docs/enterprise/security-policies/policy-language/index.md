# Security Policies language and syntax

> Explore the policy language for enhanced security in KrakenD documentation. Define precise access controls and policies

Source: https://www.krakend.io/docs/enterprise/security-policies/policy-language/

The policies language and syntax look nearly identical to **C++, Go, Java, and Typescript** and is based on Google’s CEL [built-in functions](https://www.krakend.io/docs/enterprise/security-policies/policy-language/) and [advanced macros](https://www.krakend.io/docs/enterprise/security-policies/advanced-policy-macros/). If you have existing validation using the [CEL Component](https://www.krakend.io/docs/endpoints/common-expression-language-cel/), you can also port them as policies.

The policy language is used in CEL Validation, Security Policies, and in the Tiered Rate Limit.

## Basic syntax

### Data types

The supported data types are:

- `uint` (unsigned integer)
- `int` (integer)
- `double` (Number, float)
- `string` (string)
- `bool` (boolean)
- `null_type`
- `bytes` (on JSON mapping a string of base64-encoded bytes)
- `map` (Object. e.g., `{}`)
- `list` (Array. e.g., `[]`)
- `duration` (e.g., `1h1m` for 1 hour and 1 minute)
- `timestamp` (e.g., `timestamp(now)` returns in RFC3339 format including timezone `2023-01-01T10:00:20.021-05:00`).
- `dyn` the union of all other types.

In addition, you can **cast** some types using their type name as a function, for instance: `int("23")` or `double("21.3")`.

### Logic and arithmetic operators

The logic operators are:

- `!` (not)
- `==` (equal)
- `!=` (unequal)
- `&&` (and)
- `||` (or)
- `_?_:_` (ternary)
- `<`,`<=`, `>=`, `>` (ordering)

The arithmetic operators are:

- `%` (mod)
- `*` (multiplication)
- `+` (sum and concatenation)
- `-` (subtract)
- `/` (divide)

### Accessing maps

A `map` (also could be named object) is traversed with the dot operator `.`, or using the syntax `['field']`. For instance, the map `{"foo": {"bar": 1}}` can be accessed as `foo.bar` and `foo['bar]` equivalently. The second method is necessary when keys use characters like `-` that can be interpreted as operators. E.g., `req_headers['X-Forwarded-For']`.

If you want to test if a specific field exists in a map use `has('field')`.

## Functions and macros

For the complete list of supported functions and macros see:

- [Built-in functions](https://www.krakend.io/docs/enterprise/security-policies/built-in-functions/)
- [Advanced macros](https://www.krakend.io/docs/enterprise/security-policies/advanced-policy-macros/)

## Data variables

The following data variables are available inside CEL and security policies. They are only available if you are in a request, response, or validating a token accordingly:

- Use a `req_` type variable to access **request** data.
- Use a `resp_` type variable to access **response** data.
- Use the `JWT` variable to access the **payload of the JWT** (available on `endpoint` context only if the namespace `auth/validator` is correctly configured).

When instead of working with security policies, you work with a [Tiered Rate Limit policy](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/) using the `qos/ratelimit/tiered` namespace, **the only variable you can access** is:

- `value`, which contains the string value that matched the ratelimit tier.

For example:

A policy `value.matches('[a-zA-Z]+')` will make sure that the rate limit tier is a word of one or more letters using a regular expression.

### Variables for requests

You can use the following variables inside policies:

- `req_method`: Returns the method of this endpoint, e.g.: `GET`
- `req_path`: The path used to access this endpoint, e.g.: `/foo`
- `req_params`: An object with all the placeholder `{parameters}` declared in the endpoint.
  
  First letter capitalized
  
  All **`req_params` capitalize the first letter**.
  
  E.g., an `"endpoint": "/users/{id_user}"` will set a variable `req_params.Id_user` containing the value of the parameter passed in the request. When you use the [sequential proxy](https://www.krakend.io/docs/endpoints/sequential-proxy/#chaining-the-requests) you also have under `req_params.RespX_field` the response of a previous backend call (where `X` is the sequence number and `field` the object you want to retrieve.
- `req_headers`: A map with all the headers received in its **canonical form** (converts the first letter and any letter following a hyphen to upper case; the rest are converted to lowercase. For example, the canonical key for `accept-encoding` is `Accept-Encoding`). The value of the map **is an array**, as you can have a header declared multiple times (e.g., multiple cookies with `Set-Cookie`). For example, you can access headers like this: `req_headers['X-Forwarded-For']`.
  
  Do not forget `input_headers`!
  
  The `req_headers` variable won’t contain any headers that are not declared in the `input_headers` of the endpoint.
- `req_querystring`: An Object with all the query strings that the user passed to the endpoint (not anything you wrote on the backend `url_pattern`). Remember that no query strings pass unless they are in the `input_query_strings` list. Notice that query strings, unlike `req_params`, are NOT capitalized. The `req_querystring.foo` **will also return an array** as a query string can contain multiple values (e.g., `?foo[]=1&foo[]=2`). Most of the times you might want `req_querystring.foo[0]`.
  
  Do not forget `input_query_strings`!
  
  The `req_querystring` variable won’t contain any query strings that are not declared in the `input_query_strings` of the endpoint.
- `now`: An object containing the current timestamp, e.g., `timestamp(now).getDayOfWeek()`

### Variables for responses

You can use the following variables inside the policies:

- `resp_completed`: Boolean whether all the data has been successfully retrieved. When you use multiple backends, this information makes sense in the `endpoint` context.
- `resp_metadata_status`: Returns an integer with the status code. Only available when using `no-op` encoding.
- `resp_metadata_headers`: Returns a map with all the headers of the response. Only available when using `no-op` encoding.
- `resp_data`: An object with all the data captured in the response. Using the dot notation, you can access its fields, e.g.:`resp_data.user_id`. If you use the `group` operator in the backend, then you need to add it to access the object, e.g., `resp_data.mygroup.user_id`. Not available when using `no-op`.
- `now`: An object containing the current timestamp

A note on response metadata

The response metadata is only filled for no-op pipes. In non-no-op cases, it will always be empty, and the pipe will end the execution if the status code is not 200/201.

### Variables for the JWT rejecter

You can also use CEL expressions during the JWT token validation. Use the `JWT` variable to access its metadata in an `endpoint` context. The namespace `auth/validator` must be correctly configured. For instance:

```js
has(JWT.user_id) && has(JWT.enabled_days) && (timestamp(now).getDayOfWeek() in JWT.enabled_days)
```

This example checks that the JWT token contains the metadata `user_id` and `enabled_days` with the macro `has()`, and then checks that today’s weekday is within one of the allowed days to see the endpoint.
