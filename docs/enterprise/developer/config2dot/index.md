# Generate graphs from your configuration

> Get a comprehensive guide to using Config2Dot in KrakenD Enterprise for better visualization and analysis of configurations

Source: https://www.krakend.io/docs/enterprise/developer/config2dot/

The `krakend.json` file whether it is a single file or the result of using the flexible configuration, it might be a complex file. A generated image of the configuration might help you understand better the running configuration.

The config2dot generator will generate internally an intermediate [DOT dile](https://graphviz.org/doc/info/lang.html) that you can render into a `png` image with GraphViz or similar software.

The following image illustrates an example of a KrakenD configuration:

![Config to dot](https://www.krakend.io/images/documentation/config2dot.png)

## Generating the Config2dot

The command needed to generate a DOT file is `krakend generate config2dot`:

Command to start KrakenD 

````
$krakend generate config2dot -h

╓▄█                          ▄▄▌                               ╓██████▄µ
▐███  ▄███╨▐███▄██H╗██████▄  ║██▌ ,▄███╨ ▄██████▄  ▓██▌█████▄  ███▀╙╙▀▀███╕
▐███▄███▀  ▐█████▀"╙▀▀"╙▀███ ║███▄███┘  ███▀""▀███ ████▀╙▀███H ███     ╙███
▐██████▌   ▐███⌐  ,▄████████M║██████▄  ║██████████M███▌   ███H ███     ,███
▐███╨▀███µ ▐███   ███▌  ,███M║███╙▀███  ███▄```▄▄` ███▌   ███H ███,,,╓▄███▀
▐███  ╙███▄▐███   ╙█████████M║██▌  ╙███▄`▀███████╨ ███▌   ███H █████████▀
                     ``                     `'`

Version: 3.0.2

Generates a DOT graph from your KrakenD configuration.
Usage:
  krakend generate config2dot [flags]
Examples:
krakend generate config2dot -c config.json -o config.dot
Flags:
  -h, --help   help for config2dot
Global Flags:
  -c, --config string   Path to the configuration filename
  -o, --out string      Path to the generated result.")
````

## Generating the image

Once you have generated the `dot` file, you get a plain text content that is ready to be rendered by any software library that is capable of processing dot files. A good of example is [Graphviz](https://graphviz.org/).

You can install Graphviz on Linux (Debian/Ubuntu) with the following command, but other distributions are similar:

Install Graphviz 

```
$sudo apt-get install graphviz
```

On Mac:

Install on Mac 

```
$brew install graphviz
```

Or you can also add Graphviz to the official Enterprise Docker image (gets heavier):

```Dockerfile
RUN apk update
RUN apk add graphviz
```

Then you can generate the image with the following command:

Generate image 

```
$dot -Tpng graph.dot -o graph.png
```
