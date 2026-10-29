# Extending KrakenD with your code

> Learn how to extend KrakenD API Gateway by developing custom plugins or scripts to add new functionalities and integrate with external systems

Source: https://www.krakend.io/docs/enterprise/extending/

KrakenD is **highly extensible and flexible** and allows developers to extend its functionality through custom code when the built-in features are not enough. Whether you need to add custom logic, integrate specific business rules, or enhance features, KrakenD lets you add extensions coded by you.

Go plugins are an Enterprise feature since v3.0

KrakenD 3.0 dropped all custom Go plugins on the Community Edition ([see why](https://www.krakend.io/blog/dropping-plugins-support-on-community/)), and they are available in the [Enterprise Edition](https://www.krakend.io/enterprise/) only. Existing plugins on the open source version can be ported to the Enterprise version without effort. Lua script continues to be available in the open source.

These are the two approaches to add custom functionality that is not offered out of the box:

- Write a [Lua script](https://www.krakend.io/docs/enterprise/endpoints/lua/)
- Write a [Go plugin](https://www.krakend.io/docs/enterprise/extending/writing-plugins/) (Enterprise )

## Lua or Go?

Both Lua and Go plugins allow you to extend KrakenD’s capabilities, but their suitability depends on your use case, **team expertise** (this is key), and performance requirements. Summarizing:

- Lua is best for quick, simple, runtime modifications, and it is the extensibility option of the Community Edition
- Go is best for complex, performance-critical, or testable extensions, and requires the [Enterprise Edition](https://www.krakend.io/enterprise/)

[Get started with Lua](https://www.krakend.io/docs/endpoints/lua/ "Get started with Lua") [Get started with Go Plugins](https://www.krakend.io/docs/enterprise/extending/writing-plugins/ " Get started with Go Plugins")

## Extending with Lua

[Lua](https://www.krakend.io/docs/enterprise/endpoints/lua/) is an embedded scripting language designed for simplicity and speed. It’s perfect for **quick customizations**, such as:

- Request and response manipulation
- Custom validations and rules
- Dynamic transformations

### Lua advantages

- Simplicity: Lua is easy to learn and try.
- No Compilation: Changes are applied by editing the Lua script, making it faster to iterate and test.
- Runtime Flexibility: Scripts can be dynamically loaded and modified without restarting KrakenD.
- Ideal for Small Tasks: like header manipulation, simple data, transformations, or basic validation rules
- Portability: Lua scripts do not need modifications on KrakenD upgrades.

### Lua limitations

- Limited performance: Lua is interpreted, making it slower for CPU-intensive tasks.
- Lack of strong typing: Type safety and error handling are minimal, which could lead to runtime errors.
- No user-contributed libraries: You cannot import external libraries.
- Testing: Testing Lua scripts requires custom tooling or integration tests, as Lua doesn’t have built-in testing frameworks akin to Go’s tools.

See the [Lua documentation](https://www.krakend.io/docs/enterprise/endpoints/lua/)

## Extending with Go plugins

For more **advanced and performance-critical** requirements, KrakenD supports [plugins written in Go](https://www.krakend.io/docs/enterprise/extending/writing-plugins/) (Enterprise ). Using Go plugins ensures optimal performance for your extensions, and if you are fluent in Go, they are the best option for extensibility.

With Go plugins, you can pretty much do anything you want, including integrating with external services, using databases, and anything you can code.

### Go plugins advantages

- High performance: Compiled Go plugins execute at native speed, suitable for heavy processing tasks.
- Extensive libraries: A world of Go libraries and an ecosystem for integrating with APIs, databases, and more.
- Strong typing: Compile-time checks reduce runtime errors, ensuring predictable behavior.
- Testable:
  
  - Write unit tests for your plugin logic using Go’s testing framework.
  - Use CI/CD pipelines for automated testing and validation.
- Advanced capabilities with external system integration
- **Very** complex data manipulation

### Go plugins limitations

- Compilation Overhead: Each change requires recompilation, which is not suitable for “quick hacking”
- Deployment Complexity: Plugins are platform-specific (.so files), requiring recompilation for different OS/architecture setups. When you upgrade the KrakenD version, you need to recompile using the builder.
- KrakenD Restarts: Reloading the plugin requires restarting KrakenD.
- Higher Barrier to Entry: Requires Go expertise and familiarity with KrakenD’s plugin contract.
- Enterprise Edition: Plugins are not available in the Community Edition.

See the [Go plugins documentation](https://www.krakend.io/docs/enterprise/extending/writing-plugins/)

## What about forking?

Users of the [KrakenD Community Edition](https://www.krakend.io/open-source/) can fork the source code and add their own modifications; the license allows it. Before you do, be aware of what you are taking on:

- **You get out of sync**: every new KrakenD release has to be merged into your fork, and the more you change, the harder those merges get. We have seen over and over forked projects that are left behind because companies don’t have the resources to keep up.
- **Security is on you**: security fixes and dependency updates published upstream don’t reach your users until you merge, rebuild, and redeploy them yourself.
- **You own the build**: compiling, testing, and distributing your binary becomes your team’s responsibility, permanently.
- **Docs and support no longer match your binary**: your fork is not the product described in this documentation, and nobody but your team can help with code only you ship.

Our recommended way to customize KrakenD is always through Lua scripts or Enterprise plugins: your custom logic lives in your own repository, and upgrading KrakenD stays a matter of changing a version, with no merges involved.
