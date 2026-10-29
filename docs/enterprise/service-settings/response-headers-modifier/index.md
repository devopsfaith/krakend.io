# Response header transformation

> Add, replace, or delete headers at the service level, applying the conditions to all endpoints simultaneously before the headers reach the end-users

Source: https://www.krakend.io/docs/enterprise/service-settings/response-headers-modifier/

The response headers modifier allows you to `add`, `replace`, or `delete` headers declaratively before responses are returned to the end-user for **all declared endpoints simultaneously**.

The main benefit of the `modifier/response-headers` is that the execution happens **at the end of the response flow**, and you can **transform headers** from all types of endpoints or encodings or change headers set by KrakenD itself (like the `X-KrakenD-Complete` and similar)

![response-headers-modifier.mmd diagram](https://www.krakend.io/images/documentation/diagrams/response-headers-modifier.mmd.svg)

With this component, you can transform the returning headers no matter how they were generated.

## Configuration of response headers transformation

The configuration of the modifier is quite simple, and is declared at the **service level**, acting over all endpoints’ activity. If you want to transform headers in a single endpoint, see the different ways below.

Headers are case insensitive, but normalized on the output

All header declarations are **case-insensitive**, as per the RFC specification of headers. You can write them in the configuration using uppercase, lowercase, or mixed. Nevertheless, when the header is returned on the response, it is normalized in the **canonical format of the MIME header**. For instance `mY-HEAdEr` becomes `My-Header`.

Here is a configuration example that performs the three types of transformations:

- Adds an `X-Hello: World` header to all responses
- Replaces any existing value of `Cache-Control` to set a `no-store` value
- Deletes the `Server` header set by the backend

```json
{
  "version": 4,
  "extra_config": {
    "modifier/response-headers": {
      "add": {
        "X-Hello": [
          "World"
        ]
      },
      "replace": {
        "Cache-Control": [
          "no-store"
        ],
        "Vary": [
          "foo",
          "bar",
          "foobar"
        ]
      },
      "delete": [
        "Server"
      ],
      "rename": {
        "X-Krakend-Completed": "X-Completed"
      }
    }
  }
}
```

The operations are always executed in this fixed order:

1. `delete`
2. `replace`
3. `add`
4. `rename`

##### Fields of Response headers modifier

\* required fields

##### [`add`](https://www.krakend.io/docs/enterprise/service-settings/response-headers-modifier/#add "Click to copy link to add") object

The headers you want to add. Every key under `add` is the header name, and the values are declared in an array with all those you want to set. If the header didn’t exist previously, it is created with the values you passed. If the header existed, then the new values are appended.

Example: `{"X-Hello":["World"]}`

Properties of `add` can use a name matching the pattern `(.+)`, and their content is an `array`

##### [`delete`](https://www.krakend.io/docs/enterprise/service-settings/response-headers-modifier/#delete "Click to copy link to delete") array of strings

The list of headers you want to delete. All headers listed will be missing in the response.

Example: `["X-Krakend","X-Krakend-Completed"]`

##### [`rename`](https://www.krakend.io/docs/enterprise/service-settings/response-headers-modifier/#rename "Click to copy link to rename") object

The headers you want to rename. The key used under `rename` is the original header name, and the value the new header name. This operation is destructive, meaning that if you rename to a header name that already existed it will be replaced with the new header and value.

Example: `{"Header-A":"Header-A-New-Name"}`

Properties of `rename` can use a name matching the pattern `(.+)`, and their content is an `string`

##### [`replace`](https://www.krakend.io/docs/enterprise/service-settings/response-headers-modifier/#replace "Click to copy link to replace") object

The headers you want to replace. The key used under `replace` is the header name, and the value an array with all the header values you want to set. The replacement overwrites any other value that could exist in this header.

Example: `{"Cache-Control":["no-store"],"Vary":["foo","bar","foobar"]}`

Properties of `replace` can use a name matching the pattern `(.+)`, and their content is an `array`

Schema: [https://www.krakend.io/schema/v3.0/modifier/response-headers.json](https://www.krakend.io/schema/v3.0/modifier/response-headers.json "JSON schema definition")

## Example: Remove `X-KrakenD` headers

If for any reason you want to remove the KrakenD headers from the reponses, you only need to set the following configuration:

```json
{
  "version": 4,
  "extra_config": {
    "modifier/response-headers": {
      "delete": [
        "X-Krakend", "X-Krakend-Completed"
      ]
    }
  }
}
```

## Alternatives to transform headers

There are several ways to set response headers without the `modifier/response-headers` that allow you work on a per-endpoint scenario, such as:

- Set them in the backend by using the [`no-op` encoding](https://www.krakend.io/docs/enterprise/endpoints/no-op/) on the endpoints you like.
- Setting them statically with a [Martian modifier](https://www.krakend.io/docs/enterprise/backends/martian/) (and `no-op`)
- Script them with [Lua](https://www.krakend.io/docs/enterprise/endpoints/lua/)
- In a [Go plugin](https://www.krakend.io/docs/enterprise/extending/writing-plugins/)
