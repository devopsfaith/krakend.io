# URL Rewrite for API Endpoints

> Rewrite and customize API URLs with URL rewriting in KrakenD Enterprise. Learn how to modify and optimize API endpoints without impacting client applications.

Source: https://www.krakend.io/docs/enterprise/endpoints/url-rewrite/

The `url-rewrite` plugin allows you to define a set of URLs or regular expressions that are handled by an endpoint of your choice. In other words, this plugin allows you to declare additional URLs other than the ones defined under the `endpoints` configuration, used as aliases of existing endpoints.

Extendind router capabilities

This plugin allows you to overcome some of the routing capabilities of KrakenD, such as declaring endpoints that would be conflicting or unaccepted by the KrakenD core.

## URL rewrite configuration

You need to define a URL dictionary specifying how requests map to the existing endpoints to use the plugin. There are two diferent ways of declaring rewrites:

- `literal`: The literal match takes precedence and is checked first. If the requested URL is exactly the one defined in the map, then the redirection happens.
- `regexp`: The regexp expressions are checked in sequence when there are no literal matches. You can use the capturing groups in the endpoint definition.

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    },
    "plugin/http-server": {
      "plugins": [
        {
          "name": "url-rewrite",
          "config": {
            "literal": {
              "/hi-there": "/hello",
              "/whatsup": "/hello"
            },
            "regexp": [
              ["^/hi-there/([\\w\\d\\s]+)/bar$", "/hello/${1}"],
              ["^/whats/up/([\\w\\d\\s]+)$", "/hey/${1}/whatsup"]
            ]
          }
        }
      ]
    }
  }
}
```

The configuration options inside the `config` of the `url-rewrite` plugin are:

##### Fields of URL rewrite

\* required fields

Minimum configuration needs **any of**: `literal` , or `regexp`

##### [`literal`](https://www.krakend.io/docs/enterprise/endpoints/url-rewrite/#literal "Click to copy link to literal") object

A map with the exact desired url and its mapping to an endpoint. If the endpoint has `{placeholders}` you need to write them, but the literal value `{placeholders}` is passed.

Example: `{"/hi-there":"/hello","/whatsup":"/hello"}`

##### [`regexp`](https://www.krakend.io/docs/enterprise/endpoints/url-rewrite/#regexp "Click to copy link to regexp") array of arrays

A list of lists, containing the regular expression that defines the URL to be rewritten, and its endpoint destination. You can use the capturing groups with the syntax `${1}`, `${2}`, etc.

Schema: [https://www.krakend.io/schema/v3.0/plugin/url-rewrite.json](https://www.krakend.io/schema/v3.0/plugin/url-rewrite.json "JSON schema definition")

All regular expressions are evaluated in order. The first matching expression will rewrite and exit.
