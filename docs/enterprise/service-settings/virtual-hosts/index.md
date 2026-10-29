# Virtual Hosts

> Configure virtual hosts in KrakenD API Gateway's Enterprise Edition to host multiple domains and handle complex routing scenarios

Source: https://www.krakend.io/docs/enterprise/service-settings/virtual-hosts/

The Virtual Host server allows you to run different configurations of KrakenD endpoints based on the host used to access the server.

For instance, you can declare different endpoint configurations for a path `/foo` that is accessed through `abcd.example.com/foo` or `efgh.example.com/foo`. These two could have different rate limits or authorization rules, for example.

## Virtual host configuration

To add virtual hosts, add the component `server/virtualhost` under the service `extra_config` and declare the host names that you will recognize. The hosts can be a simple list or using aliases, as depicted below:

```json
{
    "version": 4,
    "extra_config": {
        "server/virtualhost": {
           "hosts": ["abcd.example.com", "efgh.example.com"]
        }
    }
}
```

The alias might come in handy to have uncluttered endpoint declarations:

```json
{
    "version": 4,
    "extra_config": {
        "server/virtualhost": {
           "aliased_hosts": {
              "user_api":"abcd.example.com",
              "basket_api":"efgh.example.com"
            }
        }
    }
}
```

You can use `hosts` or `aliased_hosts`, but not both simultaneously.

##### Fields of VirtualHost

\* required fields

Minimum configuration needs **one of**: `hosts` , or `aliased_hosts`

##### [`aliased_hosts`](https://www.krakend.io/docs/enterprise/service-settings/virtual-hosts/#aliased_hosts "Click to copy link to aliased_hosts") object

A map of all recognized virtual hosts where the key is the alias and the value the host name, including the port if it’s not 443 or 80. The values declared here must match the content of the `Host` header passed by the client. The alias must be an alphanumeric string.

Example: `{"user_api":"users.svc.example.com:9000"}`

##### [`[a-z0-9_]+`](#aliased_hosts-%5ba-z0-9_%5d%2b "Click to copy link to [a-z0-9_]+") string

The key of this map must compile with the regexp `[a-z0-9_]+` and the host name is the string that matches the value sent by the user in the `Host` header.

##### [`hosts`](https://www.krakend.io/docs/enterprise/service-settings/virtual-hosts/#hosts "Click to copy link to hosts") array of strings

All recognized virtual hosts by KrakenD must be listed here. The values declared here must match the content of the `Host` header when passed by the client.

Example: `["api-a.example.com","api-b.example.com"]`

Schema: [https://www.krakend.io/schema/v3.0/server/virtualhost.json](https://www.krakend.io/schema/v3.0/server/virtualhost.json "JSON schema definition")

## Declaring endpoints

When you enable the `server/virtualhost` component, KrakenD first checks the `Host` header and tries to match an endpoint with the format `/__virtual/{host}/path` in the configuration. For instance, if the user is accessing `example.com/path`, you must declare an endpoint `/__virtual/example.com/path`.

If the configuration does not have a `/__virtual/` endpoint with the requested `example.com` host, the gateway resolves to the default endpoint `/path` if it exists or returns a `404` otherwise.

You can also create an endpoint for all the recognized virtual hosts using a variable like this: `/__virtual/{host}/path`, and unrecognized hosts will fall into `/path`.

You can use an alias (using `aliased_hosts`) to declare virtual endpoints easily instead of using the full domain name. E.g., instead of `/__virtual/example.com:9000/path`, you could write `/__virtual/domain1/path`.

### Virtual host example

Given the following `extra_config` configuration:

```json
{
    "extra_config": {
        "server/virtualhost": {
            "hosts": [
                "host-a.example.com",
                "host-b.example.com"
            ]
        }
    }
}
```

And the following `endpoints`:

```json
{
  "version": 4,
  "endpoints": [
    {
      "endpoint": "/foo",
      "backend": [
        {
          "url_pattern": "/__debug/no-host",
          "host": ["http://localhost:8080"]
        }
      ]
    },
    {
      "endpoint": "/__virtual/host-a.example.com/foo",
      "backend": [
        {
          "url_pattern": "/__debug/host-A",
          "host": ["http://localhost:8080"]
        }
      ]
    },
    {
      "endpoint": "/__virtual/host-b.example.com/foo",
      "backend": [
        {
          "url_pattern": "/__debug/host-B",
          "host": ["http://localhost:8080"]
        }
      ]
    }
  ]
}
```

You can check how `/foo` hits different endpoints in the following order:

- `curl -i -H 'Host: anything' http://localhost:8080/foo`: No rewriting placed as `host` is unknown. Hits the first endpoint.
- `curl -i -H 'Host: host-a.example.com' http://localhost:8080/foo`: Hits the second endpoint
- `curl -i -H 'Host: host-b.example.com' http://localhost:8080/foo`: Hits the third endpoint

## Using hosts with non-default ports

Sometimes, you expose the API on a non-default port (different from `80` and `443`). In these cases, the `Host` header comes with the port, for instance, `Host: example.com:1234`. When the header contains the port, you must add it as a different entry in the virtual host configuration and the endpoint definition. If the same hostname (e.g., `example.com`) uses different ports, you must use `aliased_hosts`; otherwise, the gateway will panic during startup.

The following example supports `Host` headers with values `Host: example.com:1234` and `Host: example.com`. Notice that it makes use of `aliased_hosts`:

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "version": 4,
    "echo_endpoint": true,
    "host": ["http://localhost:8080"],
    "extra_config": {
        "server/virtualhost": {
            "aliased_hosts": {
              "example": "example.com",
              "example1234": "example.com:1234"
            }
        }
    },
    "endpoints": [
        {
            "endpoint": "/default",
            "backend": [{
                "url_pattern": "/__echo/any-non-matching-host",
                "allow": ["req_uri"]
            }]
        },
        {
            "endpoint": "/__virtual/example/default",
            "backend": [{
                "url_pattern": "/__echo/virtualhost-without-port",
                "allow": ["req_uri"]
            }]
        },
        {
            "endpoint": "/__virtual/example1234/default",
            "backend": [{
                "url_pattern": "/__echo/virtualhost-with-port",
                "allow": ["req_uri"]
            }]
        }
    ]
}
```

## Upgrading from the old virtual host plugin (before v2.4)

If you used the static plugin before EE v2.4, eliminate now all entries referring to plugins. This means:

- If you don’t use additional plugins, you can get rid of the `plugin` entry in the root level.
- You can delete all `plugin/http-server` objects if they only use the static-filesystem
- You can delete any `virtualhost` object in the configuration

This can be summarized with a diff as:

```diff
  "version": 4,
-  "plugin": {
-     "pattern":".so",
-     "folder": "/opt/krakend/plugins/"
-  },
  "extra_config": {
-    "plugin/http-server": {
-      "name": ["virtualhost"],
-      "virtualhost": {
+    "server/virtualhost": {
```

For instance, if you had this configuration:

```json
{
    "version": 4,
    "plugin": {
        "pattern":".so",
        "folder": "/opt/krakend/plugins/"
    },
    "extra_config": {
        "plugin/http-server": {
            "name": ["virtualhost", "some-other-plugin" ],
            "virtualhost": {
                "hosts": ["host-a.tld", "host-b.tld"]
            }
        }
    }
}
```

This now becomes:

```json
{
    "version": 4,
    "extra_config": {
        "server/virtualhost": {
            "hosts": ["host-a.tld", "host-b.tld"]
        }
    }
}
```

No additional changes are required in the endpoints.
