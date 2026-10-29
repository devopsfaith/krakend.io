# Middleware Plugins for KrakenD API Gateway

> Discover how to write Middleware plugins for KrakenD API Gateway, enabling you to customize server behaviors and implement custom logic.

Source: https://www.krakend.io/docs/enterprise/extending/middleware-plugins/

Middleware plugins are designed to provide the maximum level of customization. They let you change the internals of KrakenD the same way forking the source code and adding your own middleware would, but without maintaining a fork or your own builds.

Middleware plugins allow you to add functionality to the remaining parts, whereas the other plugins do not allow you to do so. The primary purpose of Middleware plugins is:

- Intercept the request and response
- Delegate the execution to custom code
- Abort the execution (e.g., you implemented a custom usage policy)
- Transform data at your will

## Proxy interface

When you add a Middleware plugin, it receives a context and a request, works with it, and passes the execution to the `next` proxy component. It can live both in the `endpoint` or the `backend`.

The Middleware executes before the request and response modifier plugins (if any), before instrumentation, and after the rest of enterprise and FOSS functionality in that pipe zone. When placed in a `backend`, it executes between the rate limit and JMESpath executions, and when placed at the `endpoint` level, it executes between the Workflows and the Response Json Schema

### Example: Building your first middleware plugin

To build a middleware plugin execute the following command:

Generate a middleware plugin 

```
$docker run --rm -it \
 -w /app \
 -e "KRAKEND_LICENSE_PATH=/LICENSE"\
 -v "$PWD/LICENSE:/LICENSE:ro"
 -v "$PWD/plugins:/app" \
 krakend/krakend-ee:3.0.2 plugin init --name my-mw --type middleware
```

See the following `main.go` that modifies the data adding an `acme` field and modifying the path.

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
)

// MiddlewareRegisterer is the symbol the plugin loader will be looking for. It must
// implement the MiddlewareRegisterer interface
//   type MiddlewareRegisterer interface {
//     RegisterMiddlewares(func(
//       string,
//       func(map[string]interface{}, func(context.Context, interface{}) (interface{}, error)) func(context.Context, interface{}) (interface{}, error),
//     ))
//   }
var MiddlewareRegisterer = registerer("mw-example")

var (
	logger                Logger          = nil
	ctx                   context.Context = context.Background()
	errUnkownRequestType                  = errors.New("unknown request type")
	errUnkownResponseType                 = errors.New("unknown response type")
)

type registerer string

// RegisterMiddlewares is the function the plugin loader will call to register the
// middleware(s) contained in the plugin using the function passed as argument.
// f will register the factoryFunc under the name.
func (r registerer) RegisterMiddlewares(f func(
	name string,
	middlewareFactory func(map[string]interface{}, func(context.Context, interface{}) (interface{}, error)) func(context.Context, interface{}) (interface{}, error),
),
) {
	f(string(r), r.middlewareFactory)
}

func (r registerer) middlewareFactory(cfg map[string]interface{}, next func(context.Context, interface{}) (interface{}, error)) func(context.Context, interface{}) (interface{}, error) {
	// If the middleware requires configuration, declare it under its "config" key.
	// ex: the following example adds a parameter "option" that the plugin can use.
	/*
	   "extra_config":{
	       "plugin/middleware":{
	           "plugins":[
	               {
	                   "name":"mw-example",
	                   "config":{
	                       "option": "value"
	                   }
	               }
	           ]
	       }
	   }

	// Uncomment if you have configuration:
	config, err := r.parseConfig(cfg)
	if err != nil {
		logger.Debug(fmt.Sprintf("[PLUGIN: %s] Cannot initialize configuration: %s", r, err))
		return nil
	}
	*/

	// This is an example of registered ctx usage, it can be used to, for example, connect to external services.
	select {
	case <-ctx.Done():
		logger.Debug(fmt.Sprintf("[PLUGIN: %s] Context is done, skipping middleware injection", r))
		return nil
	default:
	}

	logger.Debug(fmt.Sprintf("[PLUGIN: %s] Middleware injected", r))
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		reqw, ok := req.(RequestWrapper)
		if !ok {
			return nil, errUnkownRequestType
		}

		resp, err := next(ctx, requestWrapper{
			params:  reqw.Params(),
			headers: reqw.Headers(),
			body:    reqw.Body(),
			method:  reqw.Method(),
			url:     reqw.URL(),
			query:   reqw.Query(),
			// Modifies the path:
			path:    reqw.Path() + "/fooo",
		})
		respw, ok := resp.(ResponseWrapper)
		if !ok {
			return nil, errUnkownResponseType
		}

		// Add an "acme" field in the response.
		data := respw.Data()
		data["acme"] = true

		return responseWrapper{
			ctx:        respw.Context(),
			request:    respw.Request(),
			data:       data,
			isComplete: respw.IsComplete(),
			metadata: metadataWrapper{
				headers:    respw.Headers(),
				statusCode: respw.StatusCode(),
			},
			io: respw.Io(),
		}, err
	}
}

type config struct {
	Opt string `json:"option"`
}

// parseConfig parses the configuration marshaling and unmarshaling into a struct.
// The received map is the content of "config", so you can also check its fields manually
func (r registerer) parseConfig(extra map[string]interface{}) (*config, error) {
	cfg := config{}
	b, err := json.Marshal(extra)
	if err != nil {
		return nil, err
	}
	if err = json.Unmarshal(b, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

// This logger is replaced by the RegisterLogger method to load the one from KrakenD
func (r registerer) RegisterLogger(in interface{}) {
	l, ok := in.(Logger)
	if !ok {
		return
	}
	logger = l
	logger.Debug(fmt.Sprintf("[PLUGIN: %s] Logger loaded", r))
}

type Logger interface {
	Debug(v ...interface{})
	Info(v ...interface{})
	Warning(v ...interface{})
	Error(v ...interface{})
	Critical(v ...interface{})
	Fatal(v ...interface{})
}

// Empty logger implementation
type noopLogger struct{}

func (n noopLogger) Debug(_ ...interface{})    {}
func (n noopLogger) Info(_ ...interface{})     {}
func (n noopLogger) Warning(_ ...interface{})  {}
func (n noopLogger) Error(_ ...interface{})    {}
func (n noopLogger) Critical(_ ...interface{}) {}
func (n noopLogger) Fatal(_ ...interface{})    {}

// RegisterContext saves the KrakenD application context so KrakenD can inject
// the context like we do with the logger
func (r registerer) RegisterContext(c context.Context) {
	ctx = c
	logger.Debug(fmt.Sprintf("[PLUGIN: %s] Context loaded", r))
}

func main() {}

// RequestWrapper is an interface for passing proxy request between the krakend pipe
// and the loaded plugins
type RequestWrapper interface {
	Context() context.Context
	Params() map[string]string
	Headers() map[string][]string
	Body() io.ReadCloser
	Method() string
	URL() *url.URL
	Query() url.Values
	Path() string
}

type requestWrapper struct {
	ctx     context.Context
	method  string
	url     *url.URL
	query   url.Values
	path    string
	body    io.ReadCloser
	params  map[string]string
	headers map[string][]string
}

func (r requestWrapper) Context() context.Context     { return r.ctx }
func (r requestWrapper) Method() string               { return r.method }
func (r requestWrapper) URL() *url.URL                { return r.url }
func (r requestWrapper) Query() url.Values            { return r.query }
func (r requestWrapper) Path() string                 { return r.path }
func (r requestWrapper) Body() io.ReadCloser          { return r.body }
func (r requestWrapper) Params() map[string]string    { return r.params }
func (r requestWrapper) Headers() map[string][]string { return r.headers }

type metadataWrapper struct {
	headers    map[string][]string
	statusCode int
}

func (m metadataWrapper) Headers() map[string][]string { return m.headers }
func (m metadataWrapper) StatusCode() int              { return m.statusCode }

// ResponseWrapper is an interface for passing proxy response between the krakend pipe
// and the loaded plugins
type ResponseWrapper interface {
	Context() context.Context
	Request() interface{}
	Data() map[string]interface{}
	IsComplete() bool
	Headers() map[string][]string
	StatusCode() int
	Io() io.Reader
}

type responseWrapper struct {
	ctx        context.Context
	request    interface{}
	data       map[string]interface{}
	isComplete bool
	metadata   metadataWrapper
	io         io.Reader
}

func (r responseWrapper) Context() context.Context     { return r.ctx }
func (r responseWrapper) Request() interface{}         { return r.request }
func (r responseWrapper) Data() map[string]interface{} { return r.data }
func (r responseWrapper) IsComplete() bool             { return r.isComplete }
func (r responseWrapper) Io() io.Reader                { return r.io }
func (r responseWrapper) Headers() map[string][]string { return r.metadata.headers }
func (r responseWrapper) StatusCode() int              { return r.metadata.statusCode }
```

Once compiled, [inject the middleware plugin](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/) into your configuration. The following configuration loads the `mw-example` plugin above in an endpoint and passes it the `option` setting:

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
              "name": "mw-example",
              "config": {
                "option": "value"
              }
            }
          ]
        }
      },
      "backend": [
        {
          "host": ["http://localhost:8080"],
          "url_pattern": "/__debug/"
        }
      ]
    }
  ]
}
```

KrakenD passes the content of `config` to the `middlewareFactory` function as its `cfg` map. The plugin then appends `/fooo` to the path it sends to the backend and adds `"acme": true` to the response.
