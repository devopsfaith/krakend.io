# Introduction to gRPC and the service catalog

> The gRPC integration allows you to connect to gRPC services (client) and expose data using gRPC (server). You can choose to use both together or separately.

Source: https://www.krakend.io/docs/enterprise/grpc/

[gRPC is a protocol](https://grpc.io/docs/what-is-grpc/introduction/) that creates a channel connection between a client and a server and allows calling methods to send and receive payloads serialized with [protocol buffers](https://protobuf.dev/overview/).

KrakenD supports **Unary RPCs** requests as a backend but not streaming connections (server, client, or bidirectional streaming), as we don’t see fit in the context of an API Gateway.

The gRPC integration **serves a double purpose** (server and client) that you can use separately or together.

As a **gRPC client**, it enables KrakenD to **consume content from a gRPC upstream**, independently of how you return it to the end-user, whether you continue doing it as gRPC or transform it into regular REST content.

As a **gRPC server**, you can **expose a gRPC service** to your end-users, independently of the data you consume from your upstream services, gRPC or not.

You can combine both if needed and introduce other protocols into the mix!

![grpc-server.mmd diagram](https://www.krakend.io/images/documentation/diagrams/grpc-server.mmd.svg)

## gRPC use cases

Because KrakenD is much more than a proxy but a powerful transformation machine, you can create a gRPC server out of the blue when you don’t have a backend supporting gRPC. Or you can expose a regular REST API that takes data from a gRPC service, hiding the complexity from the end user.

Some of the **use cases** you can enable with this integration are:

- Offer a gRPC service to your consumers when your upstream services do not support it yet (gRPC server).
- Convert a gRPC upstream into a regular REST API, hiding complexity to consumers (gRPC client).
- Enable gRPC to gRPC communication through the gateway (gRPC server + gRPC client)

## Catalog definition

Whether you use the client or server gRPC, you should start configuring your integration by creating a list of directories or files containing the **protocol buffer definitions**. We use the `catalog` entry in the configuration to express this list.

The `catalog` contains the available services, their exposed endpoints, and the input and output messages. These definitions are written in `.proto` files that are used to generate **client** and **server** code in different languages using the [**Protocol Buffer Compiler**](https://grpc.io/docs/protoc-installation/). Both `proto2` and `proto3` are supported.

KrakenD does not directly use `.proto` files but their binary counterpart, the `.pb` files. You can generate the binary `.pb` files with a one-liner using the same Protocol Buffer Compiler you are using today (see below).

### Generating binary protocol buffer files (.pb)

You can create `.pb` files with a command like the one below:

```sh
protoc --descriptor_set_out=file.pb file.proto
```

Nevertheless, you can use two different approaches to provide the necessary `.pb` information:

1. Create multiple `.pb` files, one for each `.proto` file you have
2. Gather all `.proto` files and create a single `.pb` file that contains all the definitions.

### Multiple `.pb` files example

This script assumes that you execute it from the root directory where you have all the `.proto` files you want to collect and places the `.pb` files under a `../defs` directory.

```bash
#!/bin/bash
DSTDIR='../defs'
for pfile in $(find . -name '*.proto')
do
    reldir=$(echo $(dirname $pfile) | sed "s,^\.,$DSTDIR,g")
    mkdir -p $reldir
    fname=$(basename $pfile)
    fname=$(echo "${reldir}/${fname%.proto}.pb")
    protoc --descriptor_set_out=$fname $pfile
done
```

### A single `.pb` file

If you have all your `.proto` files under the same directory, it is easy to create a single `.pb` file that contains all the definitions:

```bash
mkdir -p ./defs
cd contracts && \
    protoc \
    --descriptor_set_out=../fullcatalog.pb \
    $$(find . -name '*.proto')
```

### Handling dependencies

KrakenD needs to know about each of the services you want to call and their dependencies. If you `import` other definitions in your `.proto` files, the `.pb` file will also need to be used for those imported types.

For example, if you have a code like this:

```proto

syntax = "proto3";

import "mylib/protobuf/something.proto";
```

As you import another `.proto`, you must have the `something.pb` binary definition to send or receive that data. Missing definitions will result in data not being filled (it will not fail, but the data will not be there).

KrakenD emits **warning logs** for **missing message type definitions**.

### Well-known types

In the official [Protocol Buffers](https://github.com/protocolbuffers/protobuf) repository, under `src/google/protobuf` folder, you can find some common message definitions, like `timestamp.proto` or `duration.proto`.

If you `include` those types in your message definitions, you might want to collect those to create their binary `.pb` counterparts to be used by KrakenD.

This is an example of how to get the `.proto` files for those “well known types” from the `protoc` GitHub repo, assuming you have `./contracts` dir, where you want to store the files (that can be the same place where you store your own `.proto` files):

```bash
mkdir -p ./tmp && \
    cd ./tmp && \
    git clone --depth=1 https://github.com/protocolbuffers/protobuf.git
mv ./tmp/protobuf/src/google ./contracts
rm -rf ./contracts/google/protobuf/compiler
find ./contracts/google -type f | grep -v '\.proto' | xargs rm
find ./contracts/google -type f | grep 'unittest' | xargs rm
find ./contracts/google -type d -empty -delete
rm -rf ./tmp
```

As you can see in the script above, we get rid of all `unittest` proto definitions.

**You are advised to create your script to collect from different directories or repositories**.

KrakenD internally transforms some well-known types to its JSON representation:

- `timestamp.proto`
- `duration.proto`

The `timestamp` is the most frequently used across all applications. For the rest of the well-known types, the structure remains in the response as it is defined in the protobuf file. For example, an `Any` type is returned as an `URL` and a `bytes` field, but it does not resolve to a new message.

## gRPC client and server configuration

When you have the `catalog` defined, it’s time to decide whether you want to expose gRPC to your consumers (gRPC server), or to consume data from gRPC backends (gRPC client). You have the complete freedom to decide the format to consume, and the format to expose, as the transformation is handled automatically.

You must place the catalog definition at the service level under the `grpc` extra configuration key, and it requires to contain a list of definitions to load into KrakenD:

##### Fields of `"grpc"`

\* required fields

##### [`catalog`](https://www.krakend.io/docs/enterprise/grpc/#catalog "Click to copy link to catalog") * array of strings

The paths to the different `.pb` files you want to load, or the paths to directories containing `.pb` files. All content is scanned in the order of the list, and after fetching all files it resolves the dependencies of their imports. The order you use here is not important to resolve imports, but it matters when there are conflicts (different files using the same namespace and package type).

Example: `["./grpc/flights.pb","./grpc/definitions","/etc/krakend/grpc"]`

Schema: [https://www.krakend.io/schema/v3.0/grpc.json](https://www.krakend.io/schema/v3.0/grpc.json "JSON schema definition")

While loading the catalog, if there are conflicts, the log will show messages with a WARNING log level.

Continue now to:

- [gRPC server](https://www.krakend.io/docs/enterprise/grpc/server/)
- [gRPC client](https://www.krakend.io/docs/enterprise/backends/grpc/)
