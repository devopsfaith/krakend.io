# Limiting requests' payload maximum size

> Learn how to set the maximum number of bytes you allow a user to send in the payload and return an error '413 Request Entity Too Large' for those who pass it.

Source: https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/

Consumers of the gateway might see their requests limited when using the `max_payload` property. All requests are validated when this attribute is set, checking that their size is inside the limits set.

There are two possible placements of this attribute:

- At the service level: limits the requests of all activity
- At the endpoint level: limits the requests of specific endpoints

You can set both limits simultaneously if you want. When both limits exist, the service level limit is checked first, and if it passes, then it checks the endpoint limit. This means that the endpoint `max_payload` must be equal to or smaller than the one at the service. Otherwise, the endpoint limit will never have an opportunity to work.

When users exceed the maximum number of bytes, they get the following status code:

```
HTTP/1.1 413 Request Entity Too Large
```

Maximum payload of Gzipped content

When you use `max_payload` in combination with `decompress_gzip` when Gzip content goes through KrakenD, it is decompressed in the first place and the maximum payload applies to the decompressed payload.

## Limit the request size of all calls

When you want to limit the maximum request size of any request, add the following configuration at the service level under the `router` property:

```json
{
    "version": 4,
    "extra_config": {
        "router": {
            "max_payload": 1024
        }
    }
}
```

The configuration above limits all requests to 1KB (1024 bytes)

##### Fields of `"router"`

\* required fields

##### [`decompress_gzip`](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/#decompress_gzip "Click to copy link to decompress_gzip") integer

**Enterprise only.** Decompresses any Gzipped content before sending it to the backend when the `Content-Encoding` has `gzip` in the first position. You can also set this value [per endpoint](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/).

Defaults to `0`

##### [`max_payload`](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/#max_payload "Click to copy link to max_payload") integer

**Enterprise only.** Limits the maximum number of bytes a user can send to the gateway. `0` means no limit. You can also set this value [per endpoint](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/).

Defaults to `0`

Schema: [https://www.krakend.io/schema/v3.0/router.json](https://www.krakend.io/schema/v3.0/router.json "JSON schema definition")

## Limit the maximum request size to an endpoint

When you want to limit the maximum payload you can send to an endpoint, place the flag under the `proxy` entry of the endpoint. Remember that if you have also set the limit in the `router`, that limit will kick in first. This is what you need to add to limit an endpoint:

```json
 {
    "endpoint": "/body_size",
    "method":"POST",
    "backend": [
        {
            "url_pattern": "/__debug/body_size"
        }
    ],
    "extra_config":{
        "proxy":{
            "max_payload": 1024
        }
    }
}
```

##### Maximum payload configuration for proxy's extra\_config

\* required fields

##### [`decompress_gzip`](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/#decompress_gzip "Click to copy link to decompress_gzip") boolean

**Enterprise only.** Decompresses any Gzipped content before sending it to the backend when the `Content-Encoding` has `gzip` in the first position. You can also set this value globally at the [service level](https://www.krakend.io/docs/enterprise/service-settings/router-options/#max_payload).

Defaults to `false`

##### [`max_payload`](https://www.krakend.io/docs/enterprise/endpoints/maximum-request-size/#max_payload "Click to copy link to max_payload") integer

**Enterprise only.** Limits the maximum number of bytes a user can send to the endpoint. `0` means no limit. You can also set this value globally at the [service level](https://www.krakend.io/docs/enterprise/service-settings/router-options/#max_payload).

Defaults to `0`

Schema: [https://www.krakend.io/schema/v3.0/endpoint\_extra\_config.json](https://www.krakend.io/schema/v3.0/endpoint_extra_config.json "JSON schema definition")
