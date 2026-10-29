# Automatically generate boilerplate for Go plugins

> Generate any type of plugin with a simple command that provides scaffolding and the Makefile to compile for any supported architecture.

Source: https://www.krakend.io/docs/enterprise/extending/generating-plugins/

The command `krakend plugin init` generates the necessary boilerplate code to start working with plugins. This command provides a structured starting point for plugin development, ensuring that the required interfaces are included from the outset.

By using this command, you can focus on writing the plugin logic without manually creating the files for each possible interface or setting up the build environment. The recommended workflow involves running KrakenD inside a container while mounting the directory where the plugin code will be generated. You must map the KrakenD **Enterprise license** into the container for successful execution.

This is how the command looks like:

Plugin init command 

````
$krakend plugin init -h

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2-ee

Generates the necessary boilerplate to develop a new plugin

Usage:
 krakend plugin init [flags]

Examples:
 krakend plugin init --type handler --name myplugin

Flags:
 -h, --help          help for init
 -n, --name string   Plugin name
 -o, --out string    Output path. Default value: <type>-<name>
 -t, --type string   Plugin type. One of: handler, client, modifier, middleware (default "handler")
````

To build and compile a plugin, follow the steps below.

## 1. Generate the go code

For instance, let’s build a plugin named `myplugin` of the `handler` type. Notice that this is a **KrakenD image**.

Generate a plugin 

```
$docker run --rm -it \
 -w /app \
 -e "KRAKEND_LICENSE_PATH=/LICENSE"\
 -v "$PWD/LICENSE:/LICENSE:ro" \
 -v "$PWD/plugins:/app" \
 krakend/krakend-ee:3.0.2 plugin init --name myplugin --type handler
```

The command above **assumes you have a `LICENSE` file in the current directory**.

This is what you get:

- A new folder `plugins/handler-myplugin` with the source code
- Inside, a file `myplugin.go` that implements the complete interface of the chosen plugin type
- A `Makefile` to compile your plugin (**not in this container**)

## 2. Initialize Go modules

With the source files ready, you should start with the Go modules setup. The following command must be executed in the **KrakenD builder image**.

Initialize go modules 

```
$cd plugins/handler-myplugin
docker run -it -v $PWD:/app -w /app krakend/builder-ee:3.0.2 make go.mod
```

## 3. Compile the plugin

With the source files ready, you can compile the plugin. The following commands assume that you want to run this plugin inside the official image `krakend/krakend-ee:3.0.2` or in a Docker file that extends `FROM` this one.

Compile the plugin 

```
$docker run -it -v $PWD:/app -w /app krakend/builder-ee:3.0.2 make amd64
```

This will generate the compiled plugin binary `myplugin-amd64.so` compatible with KrakenD running on AMD64 Docker.

Compilation for non-Docker

Use the image `krakend/builder-ee::3.0.2-linux-generic` to compile your plugins that run in a non-Docker environment. In addition, if your architecture is ARM64 you must edit the `Makefile` and switch the commented `CROSSCOMPILER` variable.

## 4. Inject the plugin and run

Now, you should [inject the plugin](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/) in your configuration and run KrakenD.
