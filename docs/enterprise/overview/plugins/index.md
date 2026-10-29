# Built-in Enterprise Plugins

> Discover the plugins that ship with KrakenD Enterprise, which features they enable, and how to load only the ones you need.

Source: https://www.krakend.io/docs/enterprise/overview/plugins/

KrakenD Enterprise ships a few **built-in plugins**: compiled plugins (`.so` files) that enable specific Enterprise features and come ready to use in every distribution, Linux package or Docker image. You only need the plugins below when you use the feature that depends on them. This page lists them and explains how to load them. To write and load your own plugins, see [Writing plugins](https://www.krakend.io/docs/enterprise/extending/writing-plugins/) and [Injecting plugins](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/).

Built-in plugins are a legacy feature

Built-in plugins are disappearing. KrakenD Enterprise delivers its functionality through regular components that are part of the binary, which you enable in the `extra_config` without loading separate `.so` files. Every release moves more of the remaining plugins into native components, and v3.0 already removed most of them.

## Available Built-in Plugins

KrakenD Enterprise stores the built-in plugins in the folder `/opt/krakend/plugins/`. These are the plugins available and the features that use them:

| Plugin                   | Namespace                                  | Feature                                                                                                                                               |
|--------------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ip-filter.so`           | `plugin/http-server`                       | [IP filtering](https://www.krakend.io/docs/enterprise/throttling/ipfilter/)                                                                                                 |
| `geoip.so`               | `plugin/http-server`                       | [GeoIP](https://www.krakend.io/docs/enterprise/endpoints/geoip/)                                                                                                            |
| `url-rewrite.so`         | `plugin/http-server`                       | [URL rewrite](https://www.krakend.io/docs/enterprise/endpoints/url-rewrite/)                                                                                                |
| `jwk-aggregator.so`      | `plugin/http-server`                       | [Multiple identity providers](https://www.krakend.io/docs/enterprise/authentication/multiple-identity-providers/)                                                           |
| `http-logger.so`         | `plugin/http-client`                       | [HTTP logger](https://www.krakend.io/docs/enterprise/backends/http-logger/)                                                                                                 |
| `deprecated-wildcard.so` | `plugin/http-server`, `plugin/http-client` | [Legacy wildcard configuration](https://www.krakend.io/docs/enterprise/endpoints/wildcard/#upgrading-from-the-old-wildcard-plugin-before-v23), replaced by native wildcards |

To list the plugins of the version you are running, list the contents of the folder:

Listing the built-in plugins 

```
$docker run --rm --entrypoint=/bin/ls krakend/krakend-ee:3.0.2 /opt/krakend/plugins
```

Removed built-in plugins

KrakenD Enterprise v3.0 removed the built-in plugins that native components had already replaced: `basic-auth`, `virtualhost`, `http-proxy`, `no-redirect`, `redis-ratelimit`, `content-replacer`, `minimum-response`, `client-live`, and `handler-live`. When a feature has a native replacement, its page explains how to migrate.

## Loading Built-in Plugins

KrakenD registers plugins during startup according to the `plugin` block of the service `extra_config`. Point the `folder` to `/opt/krakend/plugins/` (it **must end in a slash**) and use the `pattern` to load only the plugin you need. For instance, to load the IP filtering plugin alone:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": "ip-filter.so",
      "folder": "/opt/krakend/plugins/"
    }
  }
}
```

The `pattern` is a substring that must be present in the plugin file name, so `".so"` would load every plugin in the folder. Load only the plugins you use, either with a precise `pattern` or by copying the ones you need to your own folder in your Dockerfile.

Registering the plugin makes it available, but it does nothing until you enable it with its namespace and settings. Each feature page listed above shows the complete configuration, and [Injecting plugins](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/) explains how plugins are declared with their `name` and `config`, and in which order they execute.

## Verifying That Plugins Load

When KrakenD starts, the log shows every plugin it loads. For example:

```log
url-rewrite handler plugin loaded!!!
...
2020/01/31 20:20:40  DEBUG: http-server-handler: injecting plugin url-rewrite
```

If a plugin fails to load, the log shows the reason:

```log
2020/01/31 20:23:50  WARNING: loading plugins: plugin loader found 1 error(s):
opening plugin 0 (/opt/krakend/pluginsip-filter.so): plugin.Open("/opt/krakend/pluginsip-filter.so"): realpath failed
```

In the example above, the `folder` in the configuration didn’t end in a slash, so KrakenD joined the folder and the file name incorrectly.

By default, a plugin that fails to load prevents KrakenD from starting. To change this behavior, globally or per plugin, see [handling plugin load errors](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#handling-plugin-load-errors).
