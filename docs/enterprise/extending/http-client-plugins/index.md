# HTTP Client Plugins for KrakenD API Gateway

> Learn how to extend the functionality of KrakenD API Gateway by utilizing HTTP client plugins, enabling customized communication with external services

Source: https://www.krakend.io/docs/enterprise/extending/http-client-plugins/

The **HTTP client** plugins execute in the proxy layer when KrakenD tries to reach your backends for content. They allow you to intercept, transform, and manipulate the requests **before they hit your backend services**, and their way back. It is the perfect time to modify the request before it reaches the backend.

![](https://www.krakend.io/images/documentation/http-client-plugin.png "HTTP client plugins")

You **cannot chain HTTP client plugins**, limiting them to one plugin per backend connection, and **replace the default KrakenD’s HTTP client**.

HTTP client components will stop working

An HTTP client is a terminator. It means that it is the last executor in the KrakenD pipe. When you add an HTTP client plugin, **you replace KrakenD’s default client** with your own. It means some built-in functionality in the default HTTP client won’t exist unless you code it.

More specifically, if you inject your plugin, you don’t have [Client Credentials](https://www.krakend.io/docs/enterprise/authorization/client-credentials/), [Backend Cache](https://www.krakend.io/docs/enterprise/backends/caching/), or [Backend Telemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry-layers-metrics/#data-exposed-in-the-backend-layer) unless you add this logic to your plugin.

## HTTP client interface

Writing plugins

Read the introduction to [writing plugins](https://www.krakend.io/docs/enterprise/extending/writing-plugins/) for compilation and configuration options if you haven’t done it yet.

To start with a *hello world* for your first plugin, you have to implement the plugin client interface by copying the example provided in the [Go documentation](https://godoc.org/github.com/luraproject/lura/transport/http/client/plugin)

### Example: Building your first client plugin

The easiest way to demonstrate how HTTP client plugins work is with a Hello World plugin. So let’s start by creating a new Go project named `krakend-client-example`:

```
mkdir krakend-client-example
cd krakend-client-example
go mod init krakend-client-example
```

Now we have to create a file `main.go` with the content below:

```go
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
)

// ClientRegisterer is the symbol the plugin loader will try to load. It must implement the RegisterClient interface
var ClientRegisterer = registerer("krakend-client-example")

type registerer string

var logger Logger = nil

func (registerer) RegisterLogger(v interface{}) {
	l, ok := v.(Logger)
	if !ok {
		return
	}
	logger = l
	logger.Debug(fmt.Sprintf("[PLUGIN: %s] Logger loaded", ClientRegisterer))
}

func (r registerer) RegisterClients(f func(
	name string,
	handler func(context.Context, map[string]interface{}) (http.Handler, error),
)) {
	f(string(r), r.registerClients)
}

func (r registerer) registerClients(_ context.Context, cfg map[string]interface{}) (http.Handler, error) {
	// check the cfg. If the plugin requires some configuration,
	// declare it under its "config" key. E.g.:
	/*
	   "extra_config":{
	       "plugin/http-client":{
	           "name":"krakend-client-example",
	           "config":{
	               "path": "/some-path"
	           }
	       }
	   }
	*/

	// The cfg variable contains all the keys you have defined under "config".
	// The plugin will look for this path:
	path, ok := cfg["path"].(string)
	if !ok {
		return nil, errors.New("path not found in the configuration")
	}
	logger.Debug(fmt.Sprintf("The plugin is now hijacking the path %s", path))

	// return the actual handler wrapping or your custom logic so it can be used as a replacement for the default http handler
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {

		// The path matches, it has to be hijacked and no call to the backend happens.
		// The path is the the call to the backend, not the original request by the user.
		if req.URL.Path == path {
			w.Header().Add("Content-Type", "application/json")
			// Return a custom JSON object:
			res := map[string]string{"message": html.EscapeString(req.URL.Path)}
			b, _ := json.Marshal(res)
			w.Write(b)
			logger.Debug("request:", html.EscapeString(req.URL.Path))

			return
		}

		// If the requested path is not what we defined, continue.
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Copy headers, status codes, and body from the backend to the response writer
		for k, hs := range resp.Header {
			for _, h := range hs {
				w.Header().Add(k, h)
			}
		}
		w.WriteHeader(resp.StatusCode)
		if resp.Body == nil {
			return
		}
		io.Copy(w, resp.Body)
		resp.Body.Close()

	}), nil
}

func main() {}

type Logger interface {
	Debug(v ...interface{})
	Info(v ...interface{})
	Warning(v ...interface{})
	Error(v ...interface{})
	Critical(v ...interface{})
	Fatal(v ...interface{})
}
```

The plugin above aborts the request and replies by printing a `Hello, %q` without passing the request to the backend. It is a simple example, but it shows the necessary structure to start working with plugins.

If you look now closely at the plugin code, notice that the loader looks for the symbol `ClientRegisterer` and, if found, the loader checks if the symbol implements the `plugin.Registerer` interface. Once the plugin is validated, the loader registers handlers from the plugin by calling the exposed `RegisterClients` method.

With the `main.go` file saved, it’s time to build and test the plugin. If you added more code and external dependencies, you must run a `go mod tidy` before the compilation, which is unnecessary for this example.

For compiling Go plugins, the flag `-buildmode=plugin` is required. The command is:

 

```
$go build -buildmode=plugin -o krakend-client-example.so .
```

If you are using Docker and want to load your plugin on Docker, compile it in the [Plugin Builder](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#plugin-builder) for easier integration.

Build your plugin 

```
$docker run -it -v "$PWD:/app" -w /app \
krakend/builder-ee:3.0.2 \
go build -buildmode=plugin -o krakend-client-example.so .
```

There is no output for this command. Now you have a file `krakend-client-example.so`, the KrakenD binary has to side load. Remember that you cannot use this binary in a different architecture (e.g., compiling the binary in Mac and loading it in a Docker container).

The plugin is ready to use! You can now load your plugin in the configuration. Add the `plugin` entry to the service `extra_config` and the `plugin/http-client` entry to the backend `extra_config`, as explained in [injecting plugins](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/). Here’s an example of `krakend.json`:

```json
{
  "version": 4,
  "extra_config": {
    "plugin": {
      "pattern": ".so",
      "folder": "./krakend-client-example/"
    }
  },
  "endpoints": [
    {
      "endpoint": "/test/{id}",
      "backend": [
        {
          "host": [
            "http://localhost:8080"
          ],
          "url_pattern": "/__debug/{id}",
          "extra_config": {
            "plugin/http-client": {
              "name": "krakend-client-example",
              "config": {
                "path": "/__debug/hijack-me"
              }
            }
          }
        }
      ]
    }
  ]
}
```

Start the server with `krakend run -dc krakend.json`. When you run the server, the expected output (with `DEBUG` log level) is:

```
Parsing configuration file: krakend.json
yyyy/mm/dd hh:mm:ss KRAKEND ERROR: [SERVICE: Logging] Unable to create the logger: getting the extra config for the krakend-gologging module
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [SERVICE: Plugin Loader] Starting loading process
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [PLUGIN: krakend-client-example] Logger loaded
yyyy/mm/dd hh:mm:ss KRAKEND INFO: [SERVICE: Executor Plugin] Total plugins loaded: 1
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [SERVICE: Handler Plugin] plugin #0 (krakend-client-example/krakend-client-example.so): plugin: symbol HandlerRegisterer not found in plugin krakend-client-example
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [SERVICE: Modifier Plugin] plugin #0 (krakend-client-example/krakend-client-example.so): plugin: symbol ModifierRegisterer not found in plugin krakend-client-example
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [SERVICE: Plugin Loader] Loading process completed
yyyy/mm/dd hh:mm:ss KRAKEND INFO: Starting the KrakenD instance
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [ENDPOINT: GET /test/:id] Building the proxy pipe
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [BACKEND: GET /test/:id -> GET /__health] Building the backend pipe
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: The plugin is now hijacking the path /hijack-me
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [BACKEND: GET /test/:id -> GET /__health] Injecting plugin krakend-client-example
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [ENDPOINT: GET /test/:id] Building the http handler
yyyy/mm/dd hh:mm:ss KRAKEND DEBUG: [ENDPOINT: GET /test/:id][JWTSigner] Signer disabled
yyyy/mm/dd hh:mm:ss KRAKEND INFO: [ENDPOINT: GET /test/:id][JWTValidator] Validator disabled for this endpoint
yyyy/mm/dd hh:mm:ss KRAKEND INFO: [SERVICE: Gin] Listening on port: 8080
...
```

Let’s take a closer look at the log. First, notice that the plugin tried registering itself for each plugin type (`[SERVICE: Executor Plugin]`, `[SERVICE: Handler Plugin]`, and `[SERVICE: Modifier Plugin]`), but we are only building an Executor Plugin in this case.

As we are implementing only one of the types, the other two types will fail to load (`symbol not found`). The logline is expected and is not an error but just an informational `DEBUG` message.

The essential lines are:

- `[PLUGIN: krakend-client-example] Logger loaded` printed by the plugin logger we introduced in our code telling us that the plugin is loaded
- The `[SERVICE: Executor Plugin] Total plugins loaded: 1` telling us there is one type of plugin for this type
- `[BACKEND: GET /test/:id -> GET /__health] Injecting plugin krakend-client-example` telling us that the plugin is loaded AND injected by the configuration.

If you see these lines, you did great! Your plugin is working.

To test the plugin, request the test endpoint `/test/{id}`. If you request a path not declared in the configuration, like `/test/normal,` the plugin will execute the request. If you request to `/test/hijack-me,`, then the plugin will respond with the content `Hello, /hijack-me.`

Delegate the request 

```
$curl http://localhost:8080/test/normal
{"message":"pong"}
```

Hijack the request 

```
$curl http://localhost:8080/test/hijack-me
{"message":"/__debug/hijack-me"}
```

The plugin is now working.
