# KrakenD API Gateway Installation Guide

> Follow our step-by-step installation guide to set up and configure KrakenD API Gateway, enabling efficient and scalable API management.

Source: https://www.krakend.io/docs/overview/installing/

KrakenD is a **single binary file** that does not require any external libraries to work. To install KrakenD choose your operative system in the downloads section or use the Docker image.

[Download](https://www.krakend.io/download/ "Download") [Generate a config file](https://designer.krakend.io/ "Generate a config file")

## Installation

You can install (or just run) KrakenD using different options.

Just exploring?

Use the [KrakenD Playground](https://github.com/krakend/playground-community) if you want to play with KrakenD without configuring it. The Playground comes with several flavors of KrakenD and a mock API. Everything is ready to start playing, just do a `docker compose up`!

### Docker

The easiest way to get started is by pulling and running the [KrakenD image](https://hub.docker.com/_/krakend) from the Docker Hub.

Running KrakenD using the Docker container 

```
$docker run -p 8080:8080 -v $PWD:/etc/krakend/ krakend run --config /etc/krakend/krakend.json
```

If you choose not to mount the volume (the `-v`), a default `krakend.json` serving a `/__health` endpoint will be used. The volume expects to find a `krakend.json` in the current directory ([generate your first here](https://designer.krakend.io/)).

### AWS and Azure VM

See the [downloads page](https://www.krakend.io/download/) for pre-built virtual machines in Azure and AWS.

### Mac OS X

The [Homebrew](https://brew.sh/) formula will download the source code, build the binary, and link the binary for you. The installation might take a while.

Install on Mac via Brew 

```
$brew install krakend
```

After the installation completes go to [Using KrakenD](https://www.krakend.io/docs/overview/run/)

### Linux

#### CentOS, Oracle Linux, and Redhat (yum)

The installation process requires following these steps:

1. Install the repo package
2. Install the KrakenD package
3. Start the KrakenD service

Paste this in the terminal:

Yum based 

```
$rpm -Uvh https://repo.krakend.io/rpm/krakend-repo-0.2-0.x86_64.rpm
yum install -y krakend
systemctl start krakend
```

#### Fedora

Paste this in the terminal:

DNF based 

```
$rpm -Uvh https://repo.krakend.io/rpm/krakend-repo-0.2-0.x86_64.rpm
dnf install -y krakend
systemctl start krakend
```

The current KrakenD version will run at least in Centos 7 and Fedora 24

#### Debian and Ubuntu

The installation process requires following these steps:

1. Add the key
2. Add the repo to the sources.list
3. Update your package list
4. Install the KrakenD service

Bottom line:

DEB based 

```
$apt install -y ca-certificates gnupg
apt-key adv --keyserver keyserver.ubuntu.com --recv 5DE6FD698AD6FDD2
echo "deb https://repo.krakend.io/apt stable main" | tee /etc/apt/sources.list.d/krakend.list
apt-get update
apt-get install -y krakend
```

Minimum supported versions are Debian 8, and Ubuntu 16.x.

#### Generic Linux (`tar.gz`)

You can also [download](https://www.krakend.io/download/) the `tar.gz` and decompress it anywhere. Instructions to check the SHA and PGP signature [here](https://www.krakend.io/docs/overview/verifying-packages/).

## Compile from source

As KrakenD is [open source](https://www.krakend.io/open-source/) you can opt for [building the binary](https://github.com/krakend/krakend-ce). The binary you will produce is the same you can get in our download page, only that compiling it yourself always feels good!
