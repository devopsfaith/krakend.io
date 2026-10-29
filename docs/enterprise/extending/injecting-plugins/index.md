# Injecting Plugins into KrakenD API Gateway - Extensibility Guide

> Discover the extensibility of KrakenD API Gateway by learning how to inject custom plugins for adding new functionality and integration

Source: https://www.krakend.io/docs/enterprise/extending/injecting-plugins/

**Injecting plugins** is the configuration step that connects your compiled `.so` files with the KrakenD pipes. It happens in two phases: KrakenD **loads** every plugin it finds in a folder during startup, and then you **inject** each loaded plugin in the place of the configuration where it must run (service, endpoint, or backend). Use this page once you have [written and compiled a plugin](https://www.krakend.io/docs/enterprise/extending/writing-plugins/) and want KrakenD to execute it. You also decide here how KrakenD behaves when a plugin fails to load.

Plugin configuration changed in v3.0

The `plugin` block now lives inside the service `extra_config`, and every plugin is declared as an object with its own `name` and `config`. If you come from a 2.x configuration, read the [migration section](https://www.krakend.io/#migration-from-the-2x-plugin-configuration).

## Loading the plugin

KrakenD registers plugins **during startup** according to the `plugin` entry of the service `extra_config`:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    }
  }
}
```

The `folder` is the directory containing the plugins you **want to load**, and the `pattern` filters its contents: only files whose name contains that substring load. With the configuration above, KrakenD loads any plugin with a `.so` extension. You can also use a prefix, a suffix, or the full name of a single plugin. For instance, `"pattern": "krakend-rewrite.so"` loads only the rewrite plugin, and `"pattern": "-prod.so"` loads all the production plugins ending with that suffix.

##### Fields of Plugin

\* required fields

##### [`folder`](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#folder "Click to copy link to folder") * string

The path in the filesystem where all the plugins you want to load are. MUST END IN SLASH. The folder can be a relative or absolute path. KrakenD Enterprise uses /opt/krakend/plugins/ for all plugins.

Examples: `"/opt/krakend/plugins/"` , `"./plugins/"`

Defaults to `"/opt/krakend/plugins/"`

##### [`on_load_default_error`](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#on_load_default_error "Click to copy link to on_load_default_error")

The default behavior when a plugin fails to load. It applies to every plugin that does not declare its own `on_load_error`. The options are:

`exit`: KrakenD stops and does not start, so a configuration with a broken plugin never serves traffic.

`reject`: KrakenD starts, but every endpoint or backend where the failing plugin is attached responds with a pipe error. Everything else works normally. Plugins under `plugin/http-server` are the exception: they run in the router layer, so a failing server plugin makes the whole gateway fail even though KrakenD starts normally.

`passthrough`: KrakenD starts, and the endpoints or backends where the plugin is attached work without it, skipping its logic. Use it carefully with plugins that enforce security, like authentication or IP filtering, because traffic flows through without them.

Defaults to `"exit"`

##### [`pattern`](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#pattern "Click to copy link to pattern") * string

The pattern narrows down the contents of the folder. It represents the substring that must be present in the plugin name to load.

Examples: `".so"` , `"-production.so"`

Defaults to `".so"`

Schema: [https://www.krakend.io/schema/v3.0/plugin/plugin.json](https://www.krakend.io/schema/v3.0/plugin/plugin.json "JSON schema definition")

Place the plugin in the folder you have declared in the configuration and start KrakenD. At this point, you have **registered plugins during startup**, and you see a line early in the logs when starting KrakenD. The log lines depend on the type of plugin you have chosen. An example:

```log
INFO [SERVICE: Handler Plugin] Total plugins loaded: 1
```

The system loads the plugins according to their operating system directory scan order (e.g., alphabetically).

### Checking the plugin registration

When the service starts, **KrakenD doesn’t know the type of plugin** you have coded until it tries to register it, and **it tries to register it as all known types** (even if it doesn’t match). You see this activity in the logs when using a `DEBUG` log level.

In most cases, you create your plugin for a single type, but you can implement more than one type of plugin per file. The logs reflect the registration attempts, and you will see log lines that could look like errors, but they are not.

Log line ‘symbol X not found in plugin Y’

This log line is not an error (it’s a DEBUG message). Instead, it tells you that your plugin cannot register itself as one of the other types of plugins you are not implementing. **It’s all good** (unless, of course, you were trying to register this type).

For example, consider how the following plugins log into KrakenD:

- `client-example.so` (An [HTTP client plugin](https://www.krakend.io/docs/enterprise/extending/http-client-plugins/))
- `server-example.so` (An [HTTP server plugin](https://www.krakend.io/docs/enterprise/extending/http-server-plugins/))
- `request-modifier.so` (A [request/response modifier plugin](https://www.krakend.io/docs/enterprise/extending/plugin-modifiers/))
- `middleware.so` (A [Middleware plugin](https://www.krakend.io/docs/enterprise/extending/middleware-plugins/))

In the logs, each plugin fails to register as the types it doesn’t implement:

```txt
Parsing configuration file: krakend.json
▶ INFO Listening on port: 8080
▶ DEBUG [PLUGIN: client-example] Logger loaded
▶ DEBUG [SERVICE: Executor Plugin] plugin #1 (request-modifier.so): plugin: symbol ClientRegisterer not found in plugin mytest
▶ DEBUG [SERVICE: Executor Plugin] plugin #2 (server-example.so): plugin: symbol ClientRegisterer not found in plugin myserver
▶ INFO [SERVICE: Executor Plugin] Total plugins loaded: 1
▶ DEBUG [PLUGIN: server-example] Logger loaded
▶ DEBUG [SERVICE: Handler Plugin] plugin #0 (client-example.so): plugin: symbol HandlerRegisterer not found in plugin myclient
▶ DEBUG [SERVICE: Handler Plugin] plugin #1 (request-modifier.so): plugin: symbol HandlerRegisterer not found in plugin mytest
▶ INFO [SERVICE: Handler Plugin] Total plugins loaded: 1
▶ DEBUG [PLUGIN: request-modifier] Logger loaded
▶ DEBUG [SERVICE: Modifier Plugin] plugin #0 (client-example.so): plugin: symbol ModifierRegisterer not found in plugin myclient
▶ DEBUG [SERVICE: Modifier Plugin] plugin #2 (server-example.so): plugin: symbol ModifierRegisterer not found in plugin myserver
▶ INFO [SERVICE: Modifier Plugin] Total plugins loaded: 1
```

The `INFO` log level tells you what is going on, but notice how the highlighted `DEBUG` messages fail to register for the type they are not. This is expected.

The same line is printed for Middleware plugins.

## Injecting the plugin

At this point, KrakenD has registered the plugin and is ready to use it. The next step is to inject the plugin somewhere in the configuration. The namespace and the place where you declare it depend on the type of plugin.

Every plugin you inject is an object with the following keys:

- `name` (*string*, required): The name the plugin registers in its Go code.
- `config` (*object*, optional): The configuration of the plugin. KrakenD passes this object, as is, to the factory function of your plugin, so its content depends entirely on what you have coded.
- `on_load_error` (*string*, optional): What to do if this plugin fails to load. See [handling plugin load errors](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#handling-plugin-load-errors).

### Injecting HTTP server plugins

HTTP server plugins live in the service `extra_config` under the `plugin/http-server` namespace, and accept a list of `plugins`. Below there is a sample configuration for two fake HTTP server plugins:

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
          "name": "my_plugin",
          "config": {
            "some_flag_in_my_plugin": true
          }
        },
        {
          "name": "another_plugin_maybe"
        }
      ]
    }
  }
}
```

#### Plugin execution order

Plugins **execute** according to the resulting order of **STACKING** when reading the `plugins` array. If you declare the plugins `A`, `B`, and `C` in this order, they wrap each other as `A(B(C()))`. So `C` executes first, then `B`, then `A` (reverse order than declared).

### Injecting HTTP client plugins

HTTP client plugins live in the backend’s `extra_config`, and you can declare one plugin per backend. As there is only one plugin, the `plugin/http-client` namespace takes the plugin object directly instead of a list:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    }
  },
  "endpoints": [
    {
      "endpoint": "/foo",
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__debug/",
          "extra_config": {
            "plugin/http-client": {
              "name": "your-plugin",
              "config": {
                "your-setting": true
              }
            }
          }
        }
      ]
    }
  ]
}
```

### Injecting request and response modifier plugins

You can place the request/response modifier plugins at the `endpoint` or the `backend` level. In both cases, you can inject several plugins, and KrakenD executes them in the order you declare them in the `plugins` array.

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    }
  },
  "host": ["https://api.github.com"],
  "endpoints": [
    {
      "endpoint": "/github/orgs/{org}",
      "extra_config": {
        "plugin/req-resp-modifier": {
          "plugins": [
            {
              "name": "your-plugin"
            }
          ]
        }
      },
      "backend": [
        {
          "url_pattern": "/orgs/{org}",
          "extra_config": {
            "plugin/req-resp-modifier": {
              "plugins": [
                {
                  "name": "your-plugin"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

### Injecting middleware plugins

You can place the middleware plugins at the `endpoint` or the `backend` level. In both cases, you can inject several plugins, and KrakenD executes them in the order you declare them in the `plugins` array.

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/"
    }
  },
  "endpoints": [
    {
      "endpoint": "/foo",
      "extra_config": {
        "plugin/middleware": {
          "plugins": [
            {
              "name": "your-plugin-A",
              "config": {
                "your-A-setting": true
              }
            }
          ]
        }
      },
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/bar",
          "extra_config": {
            "plugin/middleware": {
              "plugins": [
                {
                  "name": "your-plugin-A",
                  "config": {
                    "your-A-setting": true
                  }
                },
                {
                  "name": "your-plugin-B",
                  "config": {
                    "your-B-setting": true
                  }
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

## Handling Plugin Load Errors

A plugin fails to load when any of the following happens:

- You compiled it with a [builder](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#compile-the-plugin) that doesn’t match your KrakenD version.
- The plugin dependencies do not match the versions used by the KrakenD binary. You can detect this before compiling with the [plugin dependency check](https://www.krakend.io/docs/enterprise/extending/check-plugin/).
- The KrakenD process cannot read the `.so` file.
- The plugin does not implement the interface of the type you inject it as (server, client, middleware, or modifier). You can detect this before deploying with the [test-plugin command](https://www.krakend.io/docs/enterprise/extending/test-plugin/).

KrakenD lets you decide, globally and per plugin, whether such a failure prevents KrakenD from starting, disables the affected endpoints, or lets traffic flow without the plugin.

You control this behavior with two properties:

- `on_load_default_error`, inside the service `plugin` block, sets the behavior for every plugin. When you don’t set it, the default is `exit`.
- `on_load_error`, inside any plugin object, overrides the service default for that plugin only. When you don’t set it, the service value applies.

Both properties accept the same values:

| Value         | KrakenD starts? | Behavior of the endpoints or backends where the plugin is attached                                        |
|---------------|-----------------|-----------------------------------------------------------------------------------------------------------|
| `exit`        | No              | The failure prevents KrakenD from starting, so a configuration with a broken plugin never serves traffic. |
| `reject`      | Yes             | They respond with a pipe error, while the rest of the gateway works normally.                             |
| `passthrough` | Yes             | They work without the plugin, skipping its logic.                                                         |

reject on HTTP server plugins affects the whole gateway

Plugins under `plugin/http-server` run in the router layer, before any endpoint. When one of them fails to load with `reject`, KrakenD starts normally, but **the whole gateway fails**, not a single endpoint.

Security risk of passthrough

With `passthrough`, traffic flows through the endpoint as if the plugin did not exist. Never use it with plugins that enforce security, such as authentication, authorization, or IP filtering: a load failure would silently expose the endpoints they protect.

`on_load_error` and `on_load_default_error` only apply while KrakenD loads the plugin. After loading it, KrakenD calls the plugin factory and continues running whatever the factory returns, regardless of these properties. If a factory failure must stop KrakenD or reject all incoming requests, handle it in your plugin code, for instance, by calling `os.Exit` or `logger.Fatal`, or by returning a handler that rejects every request.

Combine both properties to treat plugins differently according to their role. For example, a security plugin must prevent KrakenD from starting when it fails, while an optional enrichment plugin can be skipped:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "/opt/krakend/plugins/",
      "on_load_default_error": "exit"
    },
    "plugin/http-server": {
      "plugins": [
        {
          "name": "ip-filter",
          "config": {
            "allow": true,
            "CIDR": ["192.168.0.0/24"]
          }
        }
      ]
    }
  },
  "endpoints": [
    {
      "endpoint": "/foo",
      "extra_config": {
        "plugin/req-resp-modifier": {
          "plugins": [
            {
              "name": "my-enrichment-plugin",
              "on_load_error": "passthrough"
            }
          ]
        }
      },
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__debug/",
          "extra_config": {
            "plugin/http-client": {
              "name": "my-client-plugin",
              "on_load_error": "reject"
            }
          }
        }
      ]
    }
  ]
}
```

In the configuration above, the `on_load_default_error` makes `exit` the behavior of every plugin without its own setting, so if the `ip-filter` plugin fails to load, KrakenD does not start. The `my-enrichment-plugin` overrides it with `passthrough`: if it fails, the `/foo` endpoint keeps working without the enrichment. Finally, the `my-client-plugin` uses `reject`: if it fails, the requests to `/foo` that need this backend return an error, but any other endpoint in the gateway keeps working.

## Migration from the 2.x Plugin Configuration

KrakenD v3.0 changes the way you declare plugins in the configuration and the way your plugins receive their configuration. The previous format is no longer valid, so you must update both the configuration and the Go code of your plugins.

The `plugin` block moves from the root of the configuration to the service `extra_config`:

```diff
 {
   "version": 4,
-  "plugin": {
-    "pattern": ".so",
-    "folder": "/opt/krakend/plugins/"
-  },
   "extra_config": {
+    "plugin": {
+      "pattern": ".so",
+      "folder": "/opt/krakend/plugins/"
+    }
   }
 }
```

In `plugin/http-server`, `plugin/req-resp-modifier`, and `plugin/middleware`, the `name` array becomes a `plugins` array of objects, and each plugin configuration moves from a key with its name to its own `config`. The order of the array is the same as before:

```diff
 "plugin/http-server": {
-  "name": ["my_plugin", "another_plugin_maybe"],
-  "my_plugin": {
-    "some_flag_in_my_plugin": true
-  }
+  "plugins": [
+    {
+      "name": "my_plugin",
+      "config": {
+        "some_flag_in_my_plugin": true
+      }
+    },
+    {
+      "name": "another_plugin_maybe"
+    }
+  ]
 }
```

In `plugin/http-client`, the `name` stays, and the settings of the plugin move under `config`:

```diff
 "plugin/http-client": {
   "name": "my-client-plugin",
-  "my-client-plugin": {
-    "path": "/some-path"
-  }
+  "config": {
+    "path": "/some-path"
+  }
 }
```

On the Go side, the map that the factory function of your plugin receives is now the content of `config`. You no longer have to look up a key with the plugin name:

```diff
 func (r registerer) registerHandlers(_ context.Context, cfg map[string]interface{}, h http.Handler) (http.Handler, error) {
-  config, ok := cfg["my_plugin"].(map[string]interface{})
-  if !ok {
-    return h, errors.New("configuration not found")
-  }
-  path, _ := config["path"].(string)
+  path, _ := cfg["path"].(string)
```

To upgrade, follow these steps:

1. Move the root `plugin` block inside the service `extra_config`.
2. In every `plugin/http-server`, `plugin/req-resp-modifier`, and `plugin/middleware`, replace the `name` array with a `plugins` array containing one object per plugin, keeping the same order.
3. Move the settings of each plugin, previously under a key with the plugin name (or flat in `plugin/http-client`), into its `config` object.
4. Update the factory functions of your plugins to read the settings directly from the received map.
5. Optionally, set `on_load_default_error` and `on_load_error` to [handle plugin load errors](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#handling-plugin-load-errors). Without them, a plugin that fails to load prevents KrakenD from starting.
6. Recompile your plugins with the [plugin builder](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#compile-the-plugin) matching your KrakenD version.
