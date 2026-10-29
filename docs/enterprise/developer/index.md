# KrakenD Development Tools

> Access KrakenD tooling tailored for developers. Build powerful APIs using KrakenD API Gateway quicker through these aids.

Source: https://www.krakend.io/docs/enterprise/developer/

There are some tools that make your life easier when developing KrakenD. Here is a miscellaneous list of features that might help you speed up KrakenD adoption and development.

## The debug flags

There are a lot of components that offer a `debug` or similar flag that makes components go extra verbose, so you can see what is going on when implementing new functionalities.

## IDE integration

Autocomplete, automatic validation as you type, showing documentation while hovering an attribute, explanation of errors, are features that you get automatically while working with KrakenD with certain editors.

There is nothing specific you need to install to have autocompletion. See [IDE integration](https://www.krakend.io/docs/enterprise/developer/ide-integration/)

## HTTP Logger

The HTTP logger is a response dumper that allows you to write the backend request and its response into a file, to help you debug your processes during development.

[HTTP Logger: Dump backend requests and responses](https://www.krakend.io/docs/enterprise/backends/http-logger/)

## The debug and echo endpoints

The debug and echo endpoints can be used as fake backends and are very useful to see the interaction between the gateway and the backends as its activity is printed in the log using the DEBUG log level, or returned as the response. They are safe to be used even in production.

See [the `/__debug/` endpoint](https://www.krakend.io/docs/enterprise/endpoints/debug-endpoint/), and the [`/__echo/` endpoint](https://www.krakend.io/docs/enterprise/endpoints/echo-endpoint/).

## Wildcard routes

The wildcard functionality allows you that URLs starting with known patterns forward to a common endpoint without declaring all possible routes. For instance, you want to forward all traffic to /foo/* (plus any nesting levels) to a specific backend.

[Wildcard routes](https://www.krakend.io/docs/enterprise/endpoints/wildcard/)

## Mock responses

Create an endpoint pointing to an unfinished backend where its functionality is not in production yet, but your client application needs to go ahead the backend developers and start using the static responses. Or start serving static content directly

- [Mock data](https://www.krakend.io/docs/enterprise/endpoints/static-proxy/)
- [Load static content from disk](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/)

## Integration tests

In addition to checking the syntax of your KrakenD configuration and ensuring that the gateway can start, you can run integration tests to guarantee that all the active software components from beginning to end have the expected flow and that the gateway returns what you planned.

[Automated End-to-End (E2E) tests](https://www.krakend.io/docs/enterprise/developer/integration-tests/)

## Import and export OpenAPI

The OpenAPI generators are command-line utilities embedded in the KrakenD binary, offering OpenAPI import and export capabilities

[Import and Export OpenAPI](https://www.krakend.io/docs/enterprise/developer/openapi/)

## Import KrakenD in Postman

The Postman Swagger generator is a command line utility embedded in the KrakenD binary, offering the automatic generation of Postman collections based on the KrakenD configuration.

[Generate Postman collections](https://www.krakend.io/docs/enterprise/developer/postman/)

## Generate graphs from configuration

The `krakend.json` file whether it is a single file or the result of using the flexible configuration, it might be a complex file. A generated image of the configuration might help you understand better the running configuration.

![config2dot example](https://www.krakend.io/images/documentation/config2dot.png)
