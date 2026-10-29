# Deploying KrakenD API Gateway with Docker

> Learn how to deploy KrakenD API Gateway using Docker, enabling containerized deployments for efficient scaling and management

Source: https://www.krakend.io/docs/enterprise/deploying/docker/

If you use containers, the recommended approach is to write your own `Dockerfile` and deploy an **immutable artifact** (embedding the config).

In its simplified form would be:

```Dockerfile
FROM krakend/krakend-ee:3.0
COPY krakend.json /etc/krakend/krakend.json
# Uncomment with Enterprise image:
# COPY LICENSE /etc/krakend/LICENSE
```

Volume or copy?

Even though you can use the official container directly and attach the configuration mounting an external volume (or ConfigMap in Kubernetes), a custom image with your configuration copied inside has benefits. It guarantees that you can do safe rollbacks and have effective testing and debugging. If you break something at any point, you only need to deploy the previous container, while if you use a volume, you are exposed to downtime or impossible scaling until you fix it.

A more real-life example illustrates below a combination of the `check` command with a multi-stage build to compile a [flexible configuration](https://www.krakend.io/docs/enterprise/configuration/flexible-config/) in a `Dockerfile`:

```docker
FROM krakend/krakend-ee:3.0 as builder
ARG ENV=prod

COPY krakend.tmpl .
COPY config .

# Save temporary file to /tmp to avoid permission errors
RUN FC_ENABLE=1 \
    FC_OUT=/tmp/krakend.json \
    FC_PARTIALS="/etc/krakend/partials" \
    FC_SETTINGS="/etc/krakend/settings/$ENV" \
    FC_TEMPLATES="/etc/krakend/templates" \
    krakend check -d -t -c krakend.tmpl --lint

FROM krakend/krakend-ee:3.0
# Keep operating system updated with security fixes between releases
RUN apk upgrade --no-cache --no-interactive

COPY --from=builder --chown=krakend:nogroup /tmp/krakend.json .
# Uncomment with Enterprise image:
# COPY LICENSE /etc/krakend/LICENSE

# Uncomment if you have certificates issued by a custom CA
# e.g., tls: failed to verify certificate: x509: certificate signed by unknown authority
#
# COPY yourca.pem /usr/local/share/ca-certificates/
# RUN update-ca-certificates
```

The `Dockerfile` above has two stages:

1. The copy of all templates and intermediate files to end with a `check` command that compiles the template `krakend.tmpl` and any included sub-template inside. The command outputs (thanks to `FC_OUT`) the result into a `/tmp/krakend.json` file.
2. The `krakend.json` file from the previous build is the only addition to the final Docker image.

The example `Dockerfile` above assumes that you have a file structure like this:

```
.
├── config
│   ├── partials
│   ├── settings
│   │   ├── prod
│   │   │   └── env.json
│   │   └── test
│   │       └── env.json
│   └── templates
│       └── some.tmpl
├── Dockerfile
└── krakend.tmpl
```

If you want to try this code, you can either download a [working Flexible Config example](https://github.com/krakend/examples/tree/main/3.flexible-configuration), or generate an **empty skeleton** like this:

```bash
mkdir -p config/{partials,settings,templates}
mkdir -p config/settings/{prod,test}
touch config/settings/{prod,test}/env.json
touch Dockerfile
touch krakend.tmpl
```

Now the only missing step to generate the image, is to build it, making sure that the environment argument matches our folder inside the `settings` folder:

Docker build 

```
$docker build --build-arg ENV=prod -t mykrakend .
```

The resulting image, including your configuration, weighs around `80MB`.
