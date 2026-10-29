# Serving Static Content

> Learn how to serve static content through KrakenD API Gateway, enabling efficient delivery of static files for web applications

Source: https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/

The static filesystem component lets you return content saved in the disk to end users and updates as the filesystem changes. The component is very lightweight and straightforward, using only the standard lib.

**Notice the two possible usages of this component**

When used globally at the service level (`server/static-filesystem`), the component registers itself as a static web server for a set of defined paths. Whenever users request a recognized starting path (the `prefix`), the component tries to return the requested resource (CSS, JS, images, or JSON files, to name a few examples).

Conversely, when the component is used in a backend (`backend/static-filesystem`), the content is treated as a regular backend that gets the content from the disk instead of a remote server, and you can use it to mock data.

From a content management perspective, you have to place the static content in the filesystem where KrakenD runs, and it has to be readable by the `krakend` user.

## Static content web server

When the component is used as a server (`server/static-filesystem`), it works similarly to a regular static web server; it loads content from the disk and presents it to the users. It uses the same port where the gateway runs.

The component executes before the gateway’s router layer enters the scene. The implications of this statement are that if a path contains the defined `prefix`, it is processed by the web server and won’t hit any KrakenD endpoint later on unless you add that endpoint in its configuration’s `skip` section.

Whether a matching URL prefix can retrieve the requested file in the filesystem or not, the request finishes the journey here anyway. It won’t be passed to the router layer to serve endpoint content, neither will it make use of any [Catchall functionality](https://www.krakend.io/docs/enterprise/endpoints/catch-all/).

### Configuration as a static service

The configuration requires the following entry at the `extra_config` of the root level:

```json
{
    "version": 4,
    "extra_config": {
        "server/static-filesystem": {
            "prefix": "/media/",
            "path": "./../../assets",
            "skip": [
                "/media/ignore/this/directory",
                "/media/file.json"
            ],
        }
    }
}
```

##### Fields of Static Filesystem

\* required fields

##### [`directory_listing`](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#directory_listing "Click to copy link to directory_listing") boolean

Whether to allow directory listings or not

Defaults to `false`

##### [`path`](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#path "Click to copy link to path") * string

The folder in the filesystem containing the static files. Relative to the working dir where KrakenD config is (e.g.: `./assets`) or absolute (e.g.: `/var/www/assets`).

Example: `"./static/"`

##### [`prefix`](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#prefix "Click to copy link to prefix") * string

This is the beginning (prefix) of all URLs that are resolved using this plugin. All matching URLs won’t be passed to the router, meaning that they are not considered endpoints. Make sure you are not overwriting valid endpoints. When the `prefix` is `/`, then **all traffic is served as static** and you must declare a prefix under `skip` (e.g.: `/api`) to match endpoints.

Example: `"/media/assets"`

##### [`skip`](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#skip "Click to copy link to skip") array of strings

An array with all the prefix URLs that despite they could match with the `prefix`, you don’t want to treat them as static content and pass them to the router.

Example: `["/media/ignore/this/directory","/media/file.json"]`

Schema: [https://www.krakend.io/schema/v3.0/server/static-filesystem.json](https://www.krakend.io/schema/v3.0/server/static-filesystem.json "JSON schema definition")

### Protecting your content when using the web server

Because this configuration works like a web server, the user could request the directory path directly, with no associated sub-resource, or try to get hidden files.

#### Directory listing

The **directory listing is disabled by default**. Nevertheless you can add an `index.html` file to be presented to the user. When no `index.html` exists, the end-user receives a `403 Forbidden`.

You can still enable directory listing by setting `directory_listing` to `true`. The HTML output when browsing directories without an `index.html` is not customizable and looks like this:

```html
<pre>
<a href="file1.json">file1.json</a>
<a href="file2.css">file2.css</a>
<a href="directory/">directory/</a>
</pre>
```

#### Symbolic links and hidden files

KrakenD serves everything in the directory you pass. It means that it will follow symlinks pointing out of the directory tree and access to hidden files and directories, meaning that directories or files starting with a period (such as `.git` or `.htpasswd`) are served. Make sure to **remove those files** if you don’t want to serve them.

## Static content as a backend

When the component is used inside a backend (`backend/static-filesystem`), fetching the static content does not happen until the matching endpoint is called. In this scenario, the returned static content is to be consumed by KrakenD.

The endpoint’s configuration decides if the content ends up returning to the end-user “as is” (using `no-op`) or if the content is part of a larger response and needs to be parsed in conjunction with other backends’ response (e.g: `json` encoding).

As the component is inside a regular backend, you have more options to use other features.

### Configuration as static backend

This is the most useful way to use the component, as it gives more flexibility and you could even add authorization, rate-limiting and many other features. To use it, include in the `extra_config` the namespace `"backend/static-filesystem"`. Your `backend` section needs the following entry:

```json
{
    "endpoints": [
      {
        "endpoint": "/media/*",
        "backend":[
        {
            "url_pattern": "/",
            "host": ["http://ignored-host-field"],
            "extra_config": {
                "backend/static-filesystem": {
                    "path": "./media-files/"
                }
            }
        }
        ]
      }
    ]
}
```

The settings are:

##### Fields of Static Filesystem

\* required fields

##### [`directory_listing`](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#directory_listing "Click to copy link to directory_listing") boolean

Whether to allow directory listings or not

Defaults to `false`

##### [`path`](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#path "Click to copy link to path") * string

The folder in the filesystem containing the static files. Relative to the working dir where KrakenD config is (e.g.: `./assets`) or absolute (e.g.: `/var/www/assets`).

Example: `"./static/"`

Schema: [https://www.krakend.io/schema/v3.0/backend/static-filesystem.json](https://www.krakend.io/schema/v3.0/backend/static-filesystem.json "JSON schema definition")

## Caching content

The static content is already on the disk, but you might want to add in-memory caching to reduce the accesses to it. When using the component `backend/static-filesystem`, with the combination of [Martian and the Cache component](https://www.krakend.io/docs/enterprise/backends/caching/#overriding-the-expiration-time), you can save in-memory the content in the disk (avoid storing large files that would exhaust the server’s memory).

For the `server/static-filesystem`, if you need to cache its contents, consider adding a CDN before KrakenD.

## Examples

### Example without manipulation

The following example shows an endpoint that could reply to a request like `/logs/2023-09-09/errors` and return a log file in the filesystem without manipulation (“as is”).

```json
{
    "endpoint": "/logs/{date}/{file}",
    "output_encoding": "no-op",
    "backend": [
        {
            "url_pattern": "/{date}-{file}.log",
            "host": ["http://this-host-is-not-used-but-field-is-mandatory"],
            "encoding": "no-op",
            "extra_config": {
                "backend/static-filesystem": {
                    "path": "/var/log/application/"
                }
            }
        }
    ]
}
```

Notice that the `url_pattern` constructs the filename using data from the user request and the `path` in this example.

### Example with data manipulation

In the following example, we can see a KrakenD endpoint fetching and aggregating data from two different endpoints. The first backend entry is an API that returns content in XML format, and the second is a raw JSON file, `static-service.json`, stored in the disk (which could be the mock of our next API service).

KrakenD will parse both backends and return both calls aggregated in the endpoint. With this example, we have built a temporary service until it’s actually coded.

```json
{
    "endpoint": "/user/{id}",
    "backend": [
        {
            "url_pattern": "/user/data/{id}",
            "encoding": "xml",
            "host": ["http://some-service"]
        },
        {
            "url_pattern": "/static-service.json",
            "encoding": "json",
            "host": ["http://this-host-is-not-used-but-field-is-mandatory"],
            "extra_config": {
                "backend/static-filesystem": {
                    "path": "./"
                }
            }
        }
    ]
}
```

## Upgrading from the old static plugin (before v2.4)

If you used the static plugin before EE v2.4, eliminate now all entries referring to plugins. This means:

- If you don’t use additional plugins, you can get rid of the `plugin` entry in the root level.
- You can delete all `plugin/http-server` objects if they only use the static-filesystem
- You can delete any `static-filesystem` object in the configuration
- You can delete all `plugin/http-client` with an insider `static-filesystem` entry.

This can be summarized with a diff as:

```diff
  "version": 4,
-  "plugin": {
-     "pattern":".so",
-     "folder": "/opt/krakend/plugins/"
-  },
  "extra_config": {
-    "plugin/http-server": {
-      "name": ["static-filesystem"],
-      "static-filesystem": {
+    "server/static-filesystem": {
```

And when using the http-client plugin, as:

```diff
"backend": [
  {
      "extra_config": {
-          "plugin/http-client": {
-              "name": "static-filesystem"
+          "backend/static-filesystem": {
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
            "name": ["static-filesystem", "another-plugin-maybe" ],
            "static-filesystem": {
                "prefix": "/media/",
                "path": "./../../assets",
                "skip": [
                    "/media/ignore/this/directory",
                    "/media/file.json"
                ],
            }
        }
    }
}
```

Since EE 2.4, it has become:

```json
{
    "version": 4,
    "extra_config": {
        "server/static-filesystem": {
            "prefix": "/media/",
            "path": "./../../assets",
            "skip": [
                "/media/ignore/this/directory",
                "/media/file.json"
            ],
        }
    }
}
```
