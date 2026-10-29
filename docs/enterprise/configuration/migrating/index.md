# Upgrading KrakenD from an older version

> Seamlessly migrate your KrakenD configuration to a new version. Hassle-free transition for your API Gateway

Source: https://www.krakend.io/docs/enterprise/configuration/migrating/

Upgrading to a new version of KrakenD is designed to be straightforward, thanks to our commitment to **maintaining backward compatibility** across versions within the same major release (e.g., within `2.x` versions). You can generally update KrakenD to a newer version without altering your configuration. However, to ensure optimal performance and access to the latest features, reviewing and adjusting your configuration is wise.

KrakenD’s upgrade policy

Our policy focuses on **minimizing disruption by preserving compatibility with previous versions**. However, important changes can occur between versions, such as the deprecation of components, the introduction of superior alternatives, the relocation of properties, or the outright removal of outdated features. Although KrakenD aims to ensure your existing setup will continue to run, these changes may necessitate adjustments to your configuration for improved stability and performance.

## Upgrade steps

1. **Review the [changelog](https://www.krakend.io/changelog/)**. This document provides a chronological list of releases detailing new features, bug fixes, and possible breaking changes between major versions.
2. **Adjust your configuration and run the linter** as needed. Below, you’ll find the changes between versions. Scroll down to your current version and apply all changes above it. Then, run [the linter](https://www.krakend.io/docs/enterprise/configuration/check/) (`krakend check --lint`), which is designed to scrutinize your configuration rigorously.
3. **Update the KrakenD binary**. Replace the existing binary file with the latest version. This process varies depending on how KrakenD was installed and whether it is container-based or not.
4. If you have custom plugins, you need to recompile them with the enterprise builder, and rename in your CI/CD the [test](https://www.krakend.io/docs/enterprise/extending/test-plugin/) and [check](https://www.krakend.io/docs/enterprise/extending/check-plugin/) plugin commands.

Jumping several versions

To upgrade when you are more than one version away from the latest, adjust the configuration for all the versions that the upgrade comprehends.

*The list below is automatically generated based on the changelog.*

## Upgrade to EE v3.0 (latest)

Configuration changes needed to upgrade to v3.0:

- All previous configurations used `version: 3`. Migrate your configuration and use `version: 4` instead.
- Endpoint logs now include the HTTP method of the request, which was not previously logged. Ensure your log parsing and monitoring tools are updated accordingly.
- Plugin configuration [has been reworked](https://www.krakend.io/docs/enterprise/extending/injecting-plugins/#migration-from-the-2x-plugin-configuration) both at service and endpoint/backend levels to improve flexibility, invalidating old configurations. Ensure you update your plugin configurations accordingly.
- Removed the deprecated built-in plugins basic auth, virtual host, redirect, HTTP proxy, live, content replacer, minimum response, and Redis rate limit. Use their native replacements, such as [Basic Authentication](https://www.krakend.io/docs/enterprise/authentication/basic-authentication/), [Virtual Hosts](https://www.krakend.io/docs/enterprise/service-settings/virtual-hosts/), and [content replacement](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/).
- Removed OpenCensus (`telemetry/opencensus`) and all its exporters. Use [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) instead.
- Removed Telemetry Port (`telemetry/metrics`). KrakenD could listen to an alternative port for metrics, but this is no longer supported.
- Removed the InfluxDB component (`telemetry/influx`). Use [OpenTelemetry](https://www.krakend.io/docs/enterprise/telemetry/opentelemetry/) instead.
- Legacy repository-style namespaces (e.g., `github_com/devopsfaith/krakend-gologging`) are no longer accepted. Use their current names (e.g., `telemetry/logging`).

## Upgrade to EE v2.13

Configuration changes needed to upgrade to v2.13:

- Opencensus no longer instruments PubSub nor Jose secrets management.

## Upgrade to EE v2.12

Configuration changes needed to upgrade to v2.12:

**This version does not require any configuration change.**

## Upgrade to EE v2.11

Configuration changes needed to upgrade to v2.11:

- End of support for Debian 11 and older versions (or Ubuntu 21.10 and older) for its Glibc incompatibility with secure Go versions.

## Upgrade to EE v2.10

Configuration changes needed to upgrade to v2.10:

**This version does not require any configuration change.**

## Upgrade to EE v2.9

Configuration changes needed to upgrade to v2.9:

- The attribute `use_h2c` under the `router` entry was deprecated in previous versions and has been removed. Place it [at the root level instead](https://www.krakend.io/docs/service-settings/http-server-settings/).
- The parameter `connection_pool` in the Redis rate limit configuration has been renamed to `connection_name` to support the addition of Redis clusters. The old parameter will be removed in future versions.
- The plugin `response-schema-validator` has been deprecated and replaced by the native component `validation/response-json-schema` (See [migration](https://www.krakend.io/docs/enterprise/endpoints/response-schema-validator/#migration-from-old-plugin) notes). The old plugin will be removed in future versions.
- The plugin `content-replacer` has been deprecated and replaced by the native component `modifier/response-body` (See [migration](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/#migration-from-old-plugin) notes). The old plugin will be removed in future versions.
- The `public_key` and `private_key` fields in the `tls` configuration were deprecated in the previous version and have been removed. [Migrate to the newer syntax](https://www.krakend.io/docs/enterprise/service-settings/tls/#upgrade-from-legacy-key-declaration)
- The commands `krakend generate openapi` and `krakend generate from openapi` were deprecated on 2.3 and have been removed. Please use the command `krakend openapi` instead.
- The commands `krakend check-plugin` and `krakend test-plugin` are deprecated and will be removed. Please rename them to `krakend plugin check` and `krakend plugin test`, no functionality changes.

## Upgrade to EE v2.8

Configuration changes needed to upgrade to v2.8:

- The `letgoapp/influx` namespace, which was available for historical reasons, has been removed from the configuration schema. Rename it to `telemetry/influx` for a quick fix (which is also deprecated), or upgrade to OpenTelemetry for a long-term solution.
- The `redis-ratelimit` based on the `plugin/http-server` has transitioned to the new native [Redis Service Rate Limit](https://www.krakend.io/docs/enterprise/throttling/global-rate-limit/)

## Upgrade to EE v2.7

Configuration changes needed to upgrade to v2.7:

- The [`request_definition` of OpenAPI](https://www.krakend.io/docs/enterprise/endpoints/openapi/#request_definition) was an object previously `{}`, but now is an array of objects `[{}]` because multiple requests are possible. Wrap the object in an array.
- The properties `public_key` and `private_key` of the `tls` configuration have been moved under an array `keys` to facilitate multiple certificates and domains. [Read more](https://www.krakend.io/docs/enterprise/service-settings/tls/#upgrade-from-legacy-key-declaration)

## Upgrade to EE v2.6

Configuration changes needed to upgrade to v2.6:

- Removed from schema previosuly deprecated fields `allow_insecure_connections` in the root. Must be declared [under `client_tls.allow_insecure_connections`](https://www.krakend.io/docs/service-settings/tls/#client-tls-settings) now.
- Removed from schema previously deprecated `prefetch_size` and `prefetch_count` attributes from [AMQP](https://www.krakend.io/docs/backends/amqp-consumer/). These attributes did not have any effect in the software.
- The telemetry exporters based in `telemetry/opencensus`, although they are still available, **won’t receive further updates** and will be deprecated in the future. All efforts are focused on [OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/) instead.
- The telemetry exporter `telemetry/influx` is still available, but **won’t receive further updates** and will be deprecated in the future. All efforts are focused on [OpenTelemetry](https://www.krakend.io/docs/telemetry/opentelemetry/) instead.

## Upgrade to EE v2.5

Configuration changes needed to upgrade to v2.5:

- The flag `router.use_h2c` has [moved to the root level](https://www.krakend.io/docs/service-settings/http-server-settings/#use_h2c) as `use_h2c`, and its usage inside the `router` is marked as deprecated.

## Upgrade to EE v2.4

Configuration changes needed to upgrade to v2.4:

- The static filesystem plugin has been deprecated. [Upgrade to the native functionality](https://www.krakend.io/docs/enterprise/endpoints/serve-static-content/#upgrading-from-the-old-static-plugin-before-v24).
- The virtual host plugin has been deprecated. [Upgrade to the native functionality](https://www.krakend.io/docs/enterprise/service-settings/virtual-hosts/#upgrading-from-the-old-virtualhost-plugin-before-v24).
- The [Instana integration](https://www.krakend.io/docs/enterprise/v2.3/telemetry/instana/) was deprecated in previous versions and has been removed.
- The [Google Analytics integration](https://www.krakend.io/docs/enterprise/v2.3/telemetry/google-analytics/) was deprecated in previous versions and has been removed.
- When the license is missing or expired, the Enterprise binary will not try to run in open source mode as there might be security implications, such as not understanding security policies.
- The flag `tls.allow_insecure_connections` has been relocated under `client_tls.allow_insecure_connections` in v2.3, and the old location is no longer supported.
- The [flag `prefer_server_cipher_suites`](https://www.krakend.io/docs/v2.3/service-settings/tls/#prefer_server_cipher_suites) is no longer supported. Servers now select the best mutually supported cipher suite automatically based on the logic that considers inferred client hardware, server hardware, and security.

## Upgrade to EE v2.3

Configuration changes needed to upgrade to v2.3:

- The `prefetch_size` flag on AMQP was never implemented, and it has been removed from the configuration
- The `prefetch_count` has been removed from AMQP producers as it only makes sense in a consumer scenario
- The `krakend generate openapi` command has been renamed to `krakend openapi export`; please replace its usages.
- The `krakend generate from openapi` command has been renamed to `krakend openapi import`; please replace its usages.
- The HTTP proxy plugin is deprecated as the functionality is natively supported as an [HTTP Client option](https://www.krakend.io/docs/enterprise/backends/http-client/).
- The no-redirect plugin is deprecated as the functionality is natively supported as an [HTTP Client option](https://www.krakend.io/docs/enterprise/backends/http-client/).
- The `allow_insecure_connections` property at the service level now moves under `client_tls` &gt; `allow_insecure_connections`.
- The [Instana integration](https://www.krakend.io/docs/enterprise/v2.3/telemetry/instana/) is deprecated and will be removed in future releases.
- The [Google Analytics integration](https://www.krakend.io/docs/enterprise/v2.3/telemetry/google-analytics/) is deprecated and will be removed in future releases.

## Upgrade to EE v2.2

Configuration changes needed to upgrade to v2.2:

**This version does not require any configuration change.**

## Upgrade to EE v2.1

Configuration changes needed to upgrade to v2.1:

- The `–accept-eula` (or `-e`) flag is no longer necessary to start KrakenD and should be removed
- The `telemetry/opencensus` component for NewRelic will stop working in future versions. Use `telemetry/newrelic` instead.

## Upgrade to v2.0 from v0.x or v1.x

The KrakenD 2.0 release is a major version that **simplifies the configuration** of `v1.x` and **standardizes field names** that were using different criteria to declare the attributes. The migration tool allows you to migrate from KrakenD `0.x` or `1.x` to `2.0`

[Download migration tool](https://github.com/krakend/krakend-config-migrator "Download migration tool")

### How to use the legacy migration tool

- Use `git` or similar DVCS to track the changes. Compare the differences at the end.
- Download the configuration [migration tool](https://github.com/krakend/krakend-config-migrator) and execute it passing the path to your KrakenD project
- Review the changes the migration tool did to your config and start the config with the new version

**If you have custom go plugins**, recompile them. KrakenD has now a command [`krakend check-plugin`](https://www.krakend.io/docs/enterprise/extending/check-plugin/) and [`krakend test-plugin`](https://www.krakend.io/docs/enterprise/extending/test-plugin/) to test them.

Special attention to short words

The migration script replaces words used by KrakenD in the past and are no longer supported that might collide with wording you use in your endpoints. Words like `whitelist` or `blacklist` will be replaced by `allow` and `deny`. Make sure to check the changes in the configuration and ensure that the migration tool didn’t change any endpoint definition using those names.

The migration tool will take care of what is described below for you, and is actually quite simple. For the most part, what it does is to rename configurations and namespaces. The following list is what it takes care of:

#### Renamed namespaces

The most visible change is that all non-core components (this is everything outside of [Lura](https://luraproject.org)) were declared inside an `extra_config` section, using a looong **namespace**. That namespace contained what could look like a URL (e.g., `github.com/devopsfaith/krakend-jose/validator`) and generated frequent misunderstandings year after year. Now, all namespaces have been categorized and simplified to a description of their functionality (e.g., `auth/validator`).

See the migration tool’s source code for the complete list of renamed namespaces.

#### Consistent attribute naming

Another relevant change is that some attributes have been renamed to be consistent across all configurations. Prior to 2.0, some attributes used hyphenation (`hyphen-ation`), while others used snake case (`snake_case`) or camel case (`camelCase`). Now, we use `snake_case` everywhere if possible.

#### Removed deprecated elements

The final change is that all functionalities and attributes marked as deprecated in 1.4 have been removed.

- `whitelist` is removed, and only `allow` is recognized now
- `blacklist` is removed, and only `deny` is recognized now
- `krakend-etc` is no longer included in the binary
- `krakend-consul`, the integration of consul for the JWT revoker, is no longer included in the binary.

Summing up, see the before and after of the following snippet which has 3 of the changes mentioned above.

**KrakenD 1**:

```json
{
    "endpoint": "/foo",
    "extra_config": {
        "github.com/devopsfaith/krakend-jose/validator" {
            "alg": "RS256",
            "jwk-url": "https://url/to/jwks.json"
        }
    },
    "backend": [
        {
            "url_pattern": "/foo",
            "whitelist": ["field1", "field2"]
        }
    ]
}
```

**KrakenD 2**: Differences highlighted

```json
{
    "endpoint": "/foo",
    "extra_config": {
        "auth/validator": {
            "alg": "RS256",
            "jwk_url": "https://url/to/jwks.json"
        }
    },
    "backend": [
        {
            "url_pattern": "/foo",
            "allow": ["field1", "field2"]
        }
    ]
}
```
