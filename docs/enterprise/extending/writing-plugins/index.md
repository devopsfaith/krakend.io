# Writing and building custom plugins

> Learn how to extend the functionality of KrakenD API Gateway by writing and building custom plugins, enabling custom business logic and workflows

Source: https://www.krakend.io/docs/enterprise/extending/writing-plugins/

**Plugins are soft-linked libraries**, thus a separated `.so` file that can participate in the processing when running in conjunction with KrakenD. When we talk about plugins, we refer to [**Go plugins**](https://golang.org/pkg/plugin/). You can create custom code, inject it into different parts of KrakenD processing, and still use the official KrakenD software without forking the code.

Do I need a plugin?

In most cases, you don’t need a custom plugin. The combination of different functionalities offered by the built-in functionality might help you solve a myriad of scenarios, with special mention to [CEL](https://www.krakend.io/docs/enterprise/endpoints/common-expression-language-cel/), [Martian](https://www.krakend.io/docs/enterprise/backends/martian/), or even [Lua scripting](https://www.krakend.io/docs/enterprise/endpoints/lua/). If you’d like to introduce custom business logic, a plugin does not limit what you can do. Also, if you need a lot of performance, a Go plugin is much faster than a Lua script (generally speaking, at least x10).

Plugins are **an independent binary** of your own and are not part of KrakenD itself. Plugins allow you to “*drag and drop*” (so to speak) custom functionality that interacts with KrakenD while still using the official binaries without needing to fork the code.

Let’s get you started building custom code!

## Types of plugins

In the journey of a request and response the data passess different stages (we call them *pipes*) and is validated and transformed back and forth. The different types of plugins available determine **WHEN** you want to inject a customization. Depending on the pipe you are in, you can use a specific type of plugin or another to accomplish the job.

A **simplified version** of the [Execution Flow](https://www.krakend.io/docs/enterprise/design/execution-flow/#execution-flow-pipes) is:

![components-sequence-plugins.mmd diagram](https://www.krakend.io/images/documentation/diagrams/components-sequence-plugins.mmd.svg)

**Request:**

1. A user or machine sends an HTTP request to KrakenD. The initial hit is processed by the `router pipe` that decides what to do with it.
2. The `router pipe` **transforms** the HTTP request into one or many `proxy` internal requests -HTTP or not- through a handler function.
3. Each `proxy pipe` fetches the data through the selected `transport` layer.

**Response:**

4. When the backend services return the data, the `proxy pipe` manipulates,merges, applies logic… and returns a single context to the `router pipe`.
5. The `router pipe` finally converts the internal proxy response into an HTTP response that is returned to the user

**TL;DR**: The `Router` deals with HTTP/gRPC and determines how to map the incoming request to an endpoint, the `Proxy` what to do with it, and the `Transport` how to communicate with the involved service(s).

There are **four different types of plugins** you can inject in these pipes, and most of the job is understanding which one is the right kind for the job you want to. Let’s see them all:

| Plugin Type | Pipe      | Purpose                                                                                                                                                                 |
|-------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| server      | Router    | [HTTP server plugins](https://www.krakend.io/docs/enterprise/extending/http-server-plugins/) modify the HTTP request and response between the end-user and KrakenD (the server)               |
| req/resp    | Proxy     | [Request/Response Modifier plugins](https://www.krakend.io/docs/enterprise/extending/plugin-modifiers/) modify data (such as headers, body, status code…)                                     |
| middleware  | Proxy     | [Middleware plugins](https://www.krakend.io/docs/enterprise/extending/middleware-plugins/) inject custom code inside the internals of KrakenD.                                                |
| client      | Transport | [HTTP client plugins](https://www.krakend.io/docs/enterprise/extending/http-client-plugins/) modify the request and response between KrakenD and the upstream services (internal HTTP client) |

As you can see, each type of plugin belongs to a specific pipe where it is injected. Let’s see now the same execution flow with its possible type of plugins association:

![components-sequence-plugins-injected.mmd diagram](https://www.krakend.io/images/documentation/diagrams/components-sequence-plugins-injected.mmd.svg)

As we described, the flow involves both a request and a response, but the `Proxy` pipe is a complex piece that can make that a single request transforms into **multiple API queries** requiring to split and merge requests. Let’s zoom in now the pipes and see **all possible places where you can inject plugins** (you might want to open this image in a new tab):

![Diagram of plugin placement](https://www.krakend.io/images/documentation/diagrams/plugin-types.mmd.svg)

What are the capabilities of each plugin?

- server : [HTTP server plugins](https://www.krakend.io/docs/enterprise/extending/http-server-plugins/) (or **http handlers**) belong to the **router layer** and let you **modify the HTTP request** as soon as it hits KrakenD and before the routing to an endpoint happens. They can also decorate the HTTP response before it is delivered to the consumer. For example, you can modify the request, block traffic, make validations, change the final response, connect to third-party services, databases, or anything else you imagine, scary or not, but it does not allow you to modify the internals of KrakenD. If you need multiple plugins, you can stack them.
- client : [HTTP client plugins](https://www.krakend.io/docs/enterprise/extending/http-client-plugins/) (or proxy client plugins) belong to the **proxy layer** and let you change **how KrakenD interacts (as a client) with a specific backend service**. They are as powerful as server plugins, but their working influence is smaller. You can have only **one plugin for the connecting backend call**, because client plugins are **terminators**. When you set a client plugin, you are replacing the internal HTTP KrakenD client, which means you can lose instrumentation and other features. Despite being called HTTP, the only relationship with HTTP is their interface used to encapsulate the plugin.
- reqresp : [Request/Response Modifier plugins](https://www.krakend.io/docs/enterprise/extending/plugin-modifiers/) are strictly **data modifiers** and let you change headers, paths, body, method, status code both in the request or response to and from your backends. A limitation is that request and response are isolated from each other and don’t share context, so you cannot correlate information between the request and the response. These are lighter than the rest but the most frequent ones.
- middleware : [Middleware plugins](https://www.krakend.io/docs/enterprise/extending/middleware-plugins/) allow you to inject any behavior in the **proxy layer** at the endpoint or backend levels, alter the native request or response, raise errors, do premature termination, or connect to third parties. This is the most powerful type of plugin and is the equivalent to forking the source code and adding your components.

All different types of plugins let you freely implement your logic without restrictions. However, make sure to write them down, implement the correct interface, and compile them with respect to the requirements.

## Requirements to write plugins

If you have gone through the different functionalities of KrakenD and think that a combination of components does not fulfill your needs, writing a plugin can be the solution. This document omits the initial parts of the development lifecycle (plan, analyze, design…) and jumps directly to the **implementation part**.

### System requirements

To build custom plugins, you will need **Docker**, and you don’t need Go installed. Yep, you read it right:

- **Docker** to run the Plugin builder and compile the code correctly (even if you don’t plan to run the gateway on Docker)
- **You don’t need Go in your machine**, because the Plugin builder takes care of the compilation.

### Plugin requirements

Writing plugins isn’t complicated per se, but **Go is very strict** with the environment where you compile and load them. When you use the Plugin builder, the complicated parts are taken care of for you. The following principles are essential:

- **Right interface**: Your plugin must implement the proper interface for the type of plugin you are coding.
- **Same Go version**: Your plugin and KrakenD are compiled with the same Go version. E.g., you cannot build a plugin on Go 1.19 and load it on a KrakenD assembled with Go 1.22. The `krakend version` tells you the Go and Glibc versions.
- **Same architecture/platform**: KrakenD and plugins must have been compiled in the same architecture. E.g., you cannot compile a plugin in a Mac natively and use it in a Docker container
- **Same shared library versions**: If the KrakenD core also uses external libraries, they must import identical versions.
- **Injection in the configuration**: Besides coding and compiling your plugin, you must add it to the `krakend.json` configuration.

Yes, it sounds rigorous, but fortunately, KrakenD has developed many tools, so you don’t have to spend time thinking about this. Let’s see them below.

## Writing your first plugin

These are all the steps needed to create a plugin from scratch and successfully deploy it:

![plugin-sdlc.mmd diagram](https://www.krakend.io/images/documentation/diagrams/plugin-sdlc.mmd.svg)

1. Choose the [type of plugin](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#types-of-plugins) you want to create.
2. [Write the Go file](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#write-the-go-file) with the right interface and custom logic
3. [Check the dependencies](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#check-the-dependencies) are compatible with the binary
4. [Compile the plugin](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#compile-the-plugin) for your architecture (not in your machine, but in the builder)
5. [Test the plugin is loadable](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#test-the-plugin)
6. [Inject your plugin](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#inject-your-plugin-and-run-krakend) and run KrakenD

These steps are detailed below.

## Write the Go file

Let KrakenD write the boilerplate for you

You don’t need to start from an empty file: the command `krakend plugin init` creates all the boilerplate necessary to build a plugin. [See documentation](https://www.krakend.io/docs/enterprise/extending/generating-plugins/)

Create a Go file and implement the interface of the plugin type you chose, as shown in the documentation of every type of plugin.

When the interface is correct, implement the rest of the custom logic you’d like to have.

## Check the dependencies

Before compiling the plugin, you must ensure the libraries you use in your code are compatible with KrakenD. To do so, execute the command [`krakend plugin check`](https://www.krakend.io/docs/enterprise/extending/check-plugin/) that analyzes your `go.sum` file and warns you about incompatibilities.

This is a crucial step because your custom plugins need to match the Go and library versions used to build KrakenD

Checking plugins 

```
$krakend plugin check -v 1.17.0 -s ../myplugin/go.sum
1 incompatibility(ies) found...
go
 have: 1.17.0
 want: 1.16.4
```

Once you have written your plugin with the interface you have chosen, compile it in the same architecture type as follows:

Go compilation 

```
$go mod init myplugin
go build -buildmode=plugin -o yourplugin.so .
```

## Compile the plugin

Do not compile locally, use the builder

Regardless of where you want to use your plugin, compiling your plugins using the right builder is the way to go. The builder makes sure that the **system architecture and Go version** match the destination, making the plugin loadable.

If you choose to compile locally without the builder, you will use a different architecture and underlying libc/musl libraries, making your plugin unusable.

There are two builders you should use, depending on where you want to run the plugin:

| Architecture                                                                   | Alpine (Docker)                                            | Non-Docker (on-premises)                                                 |
|--------------------------------------------------------------------------------|------------------------------------------------------------|--------------------------------------------------------------------------|
| [AMD64](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#compile-plugins-for-amd64) | `krakend/builder-ee:3.0.2`                                 | `krakend/builder-ee:3.0.2-linux-generic`                                 |
| [ARM64](https://www.krakend.io/docs/enterprise/extending/writing-plugins/#compile-plugins-for-arm64) | `krakend/builder-ee:3.0.2` with cross-compile instructions | `krakend/builder-ee:3.0.2-linux-generic` with cross-compile instructions |

When using Docker to deploy your gateway, our official KrakenD container uses [**Alpine**](https://hub.docker.com/_/alpine) as the base image. Therefore, to use your custom plugins, they must compile using the Alpine builder.

### Compile plugins for AMD64

To build your plugin for **Docker targets**, you only need to execute the following command inside the folder where your plugin is:

Build your plugin for Alpine 

```
$docker run -it -v "$PWD:/app" -w /app krakend/builder-ee:3.0.2 go build -buildmode=plugin -o yourplugin.so .
```

The command will generate a `yourplugin.so` file (name it as you please) that you can now copy into a `krakend/krakend-ee:3.0.2` Docker image, and load it as described in [injecting plugins](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/). **Never use a tag that mismatches the builder and KrakenD**. If you want to load the plugin in a KrakenD version `x.y.x` make sure to build it on a builder `x.y.z`. Using `.so` files that were compiled in a builder with a different version, will mostly fail.

To build the plugin for **on-premises installations**, use the following command instead:

Build your plugin for Non-Docker 

```
$docker run -it -v "$PWD:/app" -w /app krakend/builder-ee:3.0.2-linux-generic go build -buildmode=plugin -o yourplugin.so .
```

### Compile plugins for ARM64

Regardless of your host architecture when running the Docker builder, the **default plugin architecture target is AMD64**. Therefore, if you want to test the plugin on **ARM64** (e.g., a Macintosh, Raspberry, etc.), you must cross-compile it. This is because the plugin builder is available for AMD64 only, as emulation does not work well on Go compilation.

To cross-compile a plugin for **Docker ARM64**, you need to add extra flags when compiling the plugin:

Build your plugin for Alpine ARM64 

```
$docker run -it -v "$PWD:/app" -w /app \
-e "CGO_ENABLED=1" \
-e "CC=aarch64-linux-musl-gcc" \
-e "GOARCH=arm64" \
-e "GOHOSTARCH=amd64" \
krakend/builder-ee:3.0.2 \
go build -ldflags='-extldflags=-fuse-ld=bfd -extld=aarch64-linux-musl-gcc' \
-buildmode=plugin -o yourplugin.so .
```

And the same command, changing the builder, when you need **on-premises** plugins for ARM64:

Build your plugin for non-Alpine ARM64 

```
$docker run -it -v "$PWD:/app" -w /app \
-e "CGO_ENABLED=1" \
-e "CC=aarch64-linux-gnu-gcc" \
-e "GOARCH=arm64" \
-e "GOHOSTARCH=amd64" \
krakend/builder-ee:3.0.2-linux-generic \
go build -ldflags='-extldflags=-fuse-ld=bfd -extld=aarch64-linux-gnu-gcc' \
-buildmode=plugin -o yourplugin.so .
```

Remember that the resulting plugin will only work on **ARM64** and that you cannot reuse plugins from one platform into another.

## Test the plugin

Once your `.so` file is available, you must check that the plugin is loadable by KrakenD. You can test the plugin using the [test command](https://www.krakend.io/docs/enterprise/extending/test-plugin/)

Here’s an example:

Testing the plugin 

```
$krakend plugin test -smc yourplugin.so
[OK] MODIFIER   yourplugin.so
```

## Inject your plugin and run KrakenD

The final step before running the plugin is including the configuration of the new plugin.

To inject a plugin, copy it into the folder declared in the `plugin` entry of the service `extra_config`. Then, add the plugin namespace (`plugin/http-server`, `plugin/http-client`, `plugin/req-resp-modifier`, or `plugin/middleware`) where necessary across the configuration, with the plugin `name` and its `config`.

When you run KrakenD, the plugin shows as loaded in the log. If it fails to load, by default KrakenD does not start, but you can [change how KrakenD handles plugin load errors](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#handling-plugin-load-errors).

See the detailed information to [inject plugins](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/).
