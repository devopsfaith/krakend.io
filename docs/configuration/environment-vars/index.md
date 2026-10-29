# Environment variables in the configuration

> Learn how to leverage environment variables in KrakenD API Gateway configuration for flexible and dynamic configuration management

Source: https://www.krakend.io/docs/configuration/environment-vars/

When KrakenD runs (whether with `run` or `check`), all the behavior is loaded from the [configuration file](https://www.krakend.io/docs/configuration/structure/). Through environment variables, you can also set values. There are two different ways of injecting environment vars:

- **Use a `KRAKEND_`-like reserved environment variable**: To override values set in the configuration.
- **Set your own environment variables** when using the `{{env}}` function in [flexible configuration](https://www.krakend.io/docs/configuration/flexible-config/) templates.

## Use a reserved environment variable

There are a group of reserved environment variables that are automatically recognized by KrakenD when set.

Examples are when you want to replace the `port`, the default `timeout`, or the configuration `name` (sent to your telemetry) that already exists in the configuration.

In essence, you can replace any value in the configuration that lives in the root level, and is a string, an integer, or a boolean. To do it you only need to capitalize the property name and add a prefix `KRAKEND_`.

Reserved variables are ignored unless the key exists in the configuration

The following list of variables only set the desired values when you have its associated value in the configuration. They are meant to **override** settings **already present** in the configuration, but if you set one of them and there is no value in the configuration, it won’t have any effect.

- Use `KRAKEND_CACHE_TTL` to override `cache_ttl` in the config (*string*)
- Use `KRAKEND_DEBUG_ENDPOINT` to override `debug_endpoint` in the config (*boolean*)
- Use `KRAKEND_DIALER_FALLBACK_DELAY` to override `dialer_fallback_delay` in the config (*string*)
- Use `KRAKEND_DIALER_KEEP_ALIVE` to override `dialer_keep_alive` in the config (*string*)
- Use `KRAKEND_DIALER_TIMEOUT` to override `dialer_timeout` in the config (*string*)
- Use `KRAKEND_DISABLE_COMPRESSION` to override `disable_compression` in the config (*boolean*)
- Use `KRAKEND_DISABLE_KEEP_ALIVES` to override `disable_keep_alives` in the config (*boolean*)
- Use `KRAKEND_DISABLE_REST` to override `disable_rest` in the config (*boolean*)
- Use `KRAKEND_DNS_CACHE_TTL` to override `dns_cache_ttl` in the config (*string*)
- Use `KRAKEND_ECHO_ENDPOINT` to override `echo_endpoint` in the config (*boolean*)
- Use `KRAKEND_EXPECT_CONTINUE_TIMEOUT` to override `expect_continue_timeout` in the config (*string*)
- Use `KRAKEND_IDLE_CONNECTION_TIMEOUT` to override `idle_connection_timeout` in the config (*string*)
- Use `KRAKEND_IDLE_TIMEOUT` to override `idle_timeout` in the config (*string*)
- Use `KRAKEND_LISTEN_IP` to override `listen_ip` in the config (*string*)
- Use `KRAKEND_MAX_HEADER_BYTES` to override `max_header_bytes` in the config (*integer*)
- Use `KRAKEND_MAX_IDLE_CONNECTIONS` to override `max_idle_connections` in the config (*integer*)
- Use `KRAKEND_MAX_IDLE_CONNECTIONS_PER_HOST` to override `max_idle_connections_per_host` in the config (*integer*)
- Use `KRAKEND_MAX_SHUTDOWN_WAIT_TIME` to override `max_shutdown_wait_time` in the config (*string*)
- Use `KRAKEND_NAME` to override `name` in the config (*string*)
- Use `KRAKEND_PORT` to override `port` in the config (*integer*)
- Use `KRAKEND_READ_HEADER_TIMEOUT` to override `read_header_timeout` in the config (*string*)
- Use `KRAKEND_READ_TIMEOUT` to override `read_timeout` in the config (*string*)
- Use `KRAKEND_RESPONSE_HEADER_TIMEOUT` to override `response_header_timeout` in the config (*string*)
- Use `KRAKEND_SEQUENTIAL_START` to override `sequential_start` in the config (*boolean*)
- Use `KRAKEND_TIMEOUT` to override `timeout` in the config (*string*)
- Use `KRAKEND_USE_H2C` to override `use_h2c` in the config (*boolean*)
- Use `KRAKEND_WRITE_TIMEOUT` to override `write_timeout` in the config (*string*)
- Use `USAGE_DISABLE` to remove usage telemetry, a request to our stats server during startup or every 12 hours with anonymous non-sensitive information (e.g.: version, operative system, architecture, uptime - [see source code](https://github.com/krakend/krakend-usage)) (*boolean*)

### Reserved variable example

For instance, take the following `krakend.json` configuration as an example:

```json
{
    "version": 4,
    "timeout": "3s",
    "name": "Example gateway.",
    "cache_ttl": "0s"
}
```

You could start the server with the following command which would allow you to override the values in the configuration:

Example: Override configuration with env vars 

```
$KRAKEND_NAME="Build ABC0123" \
KRAKEND_TIMEOUT="500ms" \
KRAKEND_PORT=9000 \
krakend run -c krakend.json
```

The resulting configuration will be:

```json
{
    "version": 4,
    "timeout": "500ms",
    "name": "Build ABC0123"
}
```

**Important**: Notice that the `port` attribute is not present in the configuration, despite passing a `KRAKEND_PORT` parameter. This is because the `port` didn’t exist previously in the configuration file, and the environment variables can only **override** values.

## Setting your environment variables

If you need to set content using environment variables at any level, you have can either use the [flexible configuration](https://www.krakend.io/docs/configuration/flexible-config/), which includes a series of [advanced functions](https://www.krakend.io/docs/configuration/templates/#sprig-functions) including an `env` function, or you can not use KrakenD at all and rely on the operating system `envsubst` command. Obviously you can also write your custom replacement process.

### Environment variables with Flexible Configuration

Here is an example with Flexible Configuration:

```go-text-template
{
    "version": 4,
    "name": "Configuration for {{ env "MY_POD_NAMESPACE" }}"
}
```

When you use the flexible configuration, you can start KrakenD from the template that uses them.

### Environment variables with envsubst

Another example is not to use any of the built-in features of KrakenD and rely on your operating system via the command `envusbst`.

For instance, you have a configuration file `krakend.template.json` like the following:

```json
{
    "version": 4,
    "name": "Configuration for $MY_POD_NAMESPACE"
}
```

Then you can generate the final configuration `krakend.json` like this:

Environment variable substitution 

```
$export MY_POD_NAMESPACE="my-namespace" && envsubst < krakend.template.json > krakend.json
```

The command, which is generally available in Linux distributions, takes a template file as input and outputs the same file with the environment variables replaced (you cannot override the same file). You have to be aware that missing variables are simply replaced by an empty string.

Note: on Alpine-based containers, like the KrakenD image, you need to do an `apk add envsubst` to use this command.
