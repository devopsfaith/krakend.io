# TLS Configuration

> Learn how to configure Transport Layer Security (TLS) in KrakenD API Gateway to ensure secure HTTP and HTTP/2 communication between clients and your APIs

Source: https://www.krakend.io/docs/enterprise/service-settings/tls/

The TLS settings define the parameters that the gateway takes into account to handle incoming and outgoing HTTPS traffic. We refer to this as:

- `tls`: **TLS settings**, or how the gateway handles incoming traffic as a server.
- `client_tls`: **Client TLS settings**, or how the gateway connects to your upstream services

![TLS diagram](https://www.krakend.io/images/documentation/diagrams/tls.mmd.svg)

Independent properties

The properties `tls` and `client_tls` are independent of each other. You can declare one, both, or none.

## TLS server settings

There are two different strategies when using TLS over KrakenD:

- Use TLS for HTTPS and HTTP/2 in KrakenD (this document)
- [Use a balancer with TLS termination in front of KrakenD](https://www.krakend.io/docs/enterprise/throttling/load-balancing/) (e.g., ELB, HAproxy)

If you want to listen with TLS, add a `tls` key at the service level (configuration’s file root) with at least the public and private keys. When you add TLS, KrakenD listens **only using TLS**, and no traffic to plain HTTP is accepted (no redirection).

If you want to enable mTLS see [Mutual TLS configuration](https://www.krakend.io/docs/enterprise/authorization/mutual-authentication/)

Secure by default

When you don’t set any other parameters than stated below, KrakenD defaults to very strong security. **Only TLS 1.3 is accepted** (with its three cipher suites), and attempts to negotiate other versions will fail. Nevertheless, you can change this behavior.

To start KrakenD with TLS, you need to provide a certificate for both the public and the private keys:

```json
{
  "version": 4,
  "tls": {
    "keys": [
      {
        "public_key": "/path/to/cert.pem",
        "private_key": "/path/to/key.pem"
      }
    ]
  }
}
```

All TLS options for the server go inside the `tls` object:

##### Fields of TLS/SSL

\* required fields

Minimum configuration needs **any of**: `keys` , or `null` object

##### [`ca_certs`](https://www.krakend.io/docs/enterprise/service-settings/tls/#ca_certs "Click to copy link to ca_certs") array of strings

An array with all the CA certificates you would like to load to KrakenD **when using mTLS**, in addition to the certificates present in the system’s CA. Each certificate in the list is a relative or absolute path to the PEM file. If you have a format other than PEM, you must convert the certificate to PEM using a conversion tool. See also `disable_system_ca_pool` to avoid system’s CA.

Example: `["ca.pem"]`

Defaults to `[]`

##### [`cipher_suites`](https://www.krakend.io/docs/enterprise/service-settings/tls/#cipher_suites "Click to copy link to cipher_suites") array of integers

The list of cipher suites as defined in the documentation.

Defaults to `[4865,4866,4867]`

##### [`curve_preferences`](https://www.krakend.io/docs/enterprise/service-settings/tls/#curve_preferences "Click to copy link to curve_preferences") array

The list of all the identifiers for the curve preferences. Use `23` for CurveP256, `24` for CurveP384 or `25` for CurveP521.

Defaults to `[23,24,25]`

##### [`disable_system_ca_pool`](https://www.krakend.io/docs/enterprise/service-settings/tls/#disable_system_ca_pool "Click to copy link to disable_system_ca_pool") boolean

Ignore any certificate in the system’s CA. The only certificates loaded will be the ones in the `ca_certs` list when true.

Defaults to `false`

##### [`disabled`](https://www.krakend.io/docs/enterprise/service-settings/tls/#disabled "Click to copy link to disabled") boolean

A flag to disable TLS (useful while in development).

Defaults to `false`

##### [`enable_mtls`](https://www.krakend.io/docs/enterprise/service-settings/tls/#enable_mtls "Click to copy link to enable_mtls") boolean

Whether to enable or not Mutual Authentication. When mTLS is enabled, **all KrakenD endpoints** require clients to provide a known client-side X.509 authentication certificate. KrakenD relies on the system’s CA to validate certificates.

Defaults to `false`

##### [`keys`](https://www.krakend.io/docs/enterprise/service-settings/tls/#keys "Click to copy link to keys") array

An array with all the key pairs you want the TLS to work with. You can support multiple and unrelated domains in a single process.

Each item of keys accepts the following properties:

##### [`private_key`](#keys-private_key "Click to copy link to private_key") string

Absolute path to the private key, or relative to the current [working directory](https://www.krakend.io/docs/configuration/working-directory/).

Examples: `"/path/to/key.pem"` , `"./certs/key.pem"`

Defaults to `"./certs/key.pem"`

##### [`public_key`](#keys-public_key "Click to copy link to public_key") string

Absolute path to the public key, or relative to the current [working directory](https://www.krakend.io/docs/configuration/working-directory/).

Examples: `"/path/to/cert.pem"` , `"./certs/cert.pem"`

Defaults to `"./certs/cert.pem"`

##### [`max_version`](https://www.krakend.io/docs/enterprise/service-settings/tls/#max_version "Click to copy link to max_version")

Maximum TLS version supported.

Possible values are: `"SSL3.0"` , `"TLS10"` , `"TLS11"` , `"TLS12"` , `"TLS13"`

Defaults to `"TLS13"`

##### [`min_version`](https://www.krakend.io/docs/enterprise/service-settings/tls/#min_version "Click to copy link to min_version")

Minimum TLS version supported. When specifiying very old and insecure versions under TLS12 you must provide the `ciphers_list`.

Possible values are: `"SSL3.0"` , `"TLS10"` , `"TLS11"` , `"TLS12"` , `"TLS13"`

Defaults to `"TLS13"`

Schema: [https://www.krakend.io/schema/v3.0/tls.json](https://www.krakend.io/schema/v3.0/tls.json "JSON schema definition")

### Upgrade from legacy key declaration

The version v2.7 of KrakenD introduces declaring multiple TLS keys in the configuration. **Prior to KrakenD v2.7** the public and private keys were unique, and you had to declare them directly under `tls`, like this:

```json
{
  "version": 4,
  "tls": {
      "public_key": "/path/to/cert.pem",
      "private_key": "/path/to/key.pem"
    }
}
```

When using **KrakenD v2.7 and above**, make sure to place key pairs inside the `keys` array:

```json
{
  "version": 4,
  "tls": {
    "keys": [
      {
        "public_key": "/path/to/cert.pem",
        "private_key": "/path/to/key.pem"
      }
    ]
  }
}
```

## Client TLS settings

You can also set global TLS settings when KrakenD acts as a client, meaning that the gateway takes the role of the requesting user and fetches data with the upstream services.

All TLS options for the client go inside the `client_tls` object, and are similar to the server ones. When you set a `client_tls` in the configuration **the settings apply to all HTTP backends of all endpoints**.

For instance:

```json
{
  "version": 4,
  "client_tls": {
    "@comment": "Skip SSL verification when connecting to backends",
    "allow_insecure_connections": true
  }
}
```

If you need to **define TLS options for an individual backend** see [HTTP Client options](https://www.krakend.io/docs/enterprise/backends/http-client/) Enterprise

These are the `client_tls` options:

##### Fields of TLS client settings

\* required fields

##### [`allow_insecure_connections`](https://www.krakend.io/docs/enterprise/service-settings/tls/#allow_insecure_connections "Click to copy link to allow_insecure_connections") boolean

By default, KrakenD verifies every SSL connection. This option allows you to connect to backends considered **insecure**, for instance when you are using self-signed certificates

Defaults to `false`

##### [`ca_certs`](https://www.krakend.io/docs/enterprise/service-settings/tls/#ca_certs "Click to copy link to ca_certs") array

An array with all the CA certificates you would like to validate the server you are connecting to.

Example: `["ca.pem"]`

Defaults to `[]`

##### [`cipher_suites`](https://www.krakend.io/docs/enterprise/service-settings/tls/#cipher_suites "Click to copy link to cipher_suites") array

The list of cipher suites as defined in the documentation.

Defaults to `[4865,4866,4867]`

##### [`client_certs`](https://www.krakend.io/docs/enterprise/service-settings/tls/#client_certs "Click to copy link to client_certs") array of objects

The list of all client certificates available when fetching data from the upstream service.

Each item of client\_certs accepts the following properties:

##### [`certificate`](#client_certs-certificate "Click to copy link to certificate") * string

The path to the certificate you will use for mTLS connections.

##### [`private_key`](#client_certs-private_key "Click to copy link to private_key") * string

The path to the private key you will use for mTLS connections.

##### [`curve_preferences`](https://www.krakend.io/docs/enterprise/service-settings/tls/#curve_preferences "Click to copy link to curve_preferences") array

The list of all the identifiers for the curve preferences. Use `23` for CurveP256, `24` for CurveP384 or `25` for CurveP521.

Defaults to `[23,24,25]`

##### [`disable_system_ca_pool`](https://www.krakend.io/docs/enterprise/service-settings/tls/#disable_system_ca_pool "Click to copy link to disable_system_ca_pool") boolean

Ignore any certificate in the system’s CA. The only certificates loaded will be the ones in the `ca_certs` list when true.

Defaults to `false`

##### [`max_version`](https://www.krakend.io/docs/enterprise/service-settings/tls/#max_version "Click to copy link to max_version")

Maximum TLS version supported.

Possible values are: `"SSL3.0"` , `"TLS10"` , `"TLS11"` , `"TLS12"` , `"TLS13"`

Defaults to `"TLS13"`

##### [`min_version`](https://www.krakend.io/docs/enterprise/service-settings/tls/#min_version "Click to copy link to min_version")

Minimum TLS version supported. When specifiying very old and insecure versions under TLS12 you must provide the `ciphers_list`.

Possible values are: `"SSL3.0"` , `"TLS10"` , `"TLS11"` , `"TLS12"` , `"TLS13"`

Defaults to `"TLS13"`

Schema: [https://www.krakend.io/schema/v3.0/client\_tls.json](https://www.krakend.io/schema/v3.0/client_tls.json "JSON schema definition")

## Supporting older TLS 1.2 and below

Although we do not recommend downgrading your installation, this is the configuration you will need to support **older protocol versions**.

### Support old TLS v1.2

To support TLS v1.2 and 1.3 simultaneously, you need the following configuration:

```json
{
  "version": 4,
  "tls": {
    "keys": [
      {
        "public_key": "/path/to/cert.pem",
        "private_key": "/path/to/key.pem"
      }
    ],
    "min_version": "TLS12"
  }
}
```

### Support archaic TLS versions

To support versions older than 1.2, specify the list of `cipher_suites` you want to enable (see below).

## Supported cipher suites

You can select which `cipher_suites` you’d like to support by passing an array of integers. The possible values of the cipher suites are listed below. The recommendation is to stay with TLS 1.3, or downgrade to TLS 1.2 when strongly needed. Below that should be out of the table.

**Default suites for TLS 1.3** are:

- `4865`: TLS\_AES\_128\_GCM\_SHA256
- `4866`: TLS\_AES\_256\_GCM\_SHA384
- `4867`: TLS\_CHACHA20\_POLY1305\_SHA256

**Default suites for TLS 1.2** are:

- `49199`: TLS\_ECDHE\_RSA\_WITH\_AES\_128\_GCM\_SHA256
- `49200`: TLS\_ECDHE\_RSA\_WITH\_AES\_256\_GCM\_SHA384
- `52392`: TLS\_ECDHE\_RSA\_WITH\_CHACHA20\_POLY1305
- `49196`: TLS\_ECDHE\_ECDSA\_WITH\_AES\_256\_GCM\_SHA384
- `52393`: TLS\_ECDHE\_ECDSA\_WITH\_CHACHA20\_POLY1305
- `49195`: TLS\_ECDHE\_ECDSA\_WITH\_AES\_128\_GCM\_SHA256

Other `cipher_suites` are supported but **not recommended**. Their existence is to support legacy systems:

- `5`: TLS\_RSA\_WITH\_RC4\_128\_SHA
- `10`: TLS\_RSA\_WITH\_3DES\_EDE\_CBC\_SHA
- `47`: TLS\_RSA\_WITH\_AES\_128\_CBC\_SHA
- `53`: TLS\_RSA\_WITH\_AES\_256\_CBC\_SHA
- `60`: TLS\_RSA\_WITH\_AES\_128\_CBC\_SHA256
- `156`: TLS\_RSA\_WITH\_AES\_128\_GCM\_SHA256
- `157`: TLS\_RSA\_WITH\_AES\_256\_GCM\_SHA384
- `49159`: TLS\_ECDHE\_ECDSA\_WITH\_RC4\_128\_SHA
- `49161`: TLS\_ECDHE\_ECDSA\_WITH\_AES\_128\_CBC\_SHA
- `49162`: TLS\_ECDHE\_ECDSA\_WITH\_AES\_256\_CBC\_SHA
- `49169`: TLS\_ECDHE\_RSA\_WITH\_RC4\_128\_SHA
- `49170`: TLS\_ECDHE\_RSA\_WITH\_3DES\_EDE\_CBC\_SHA
- `49171`: TLS\_ECDHE\_RSA\_WITH\_AES\_128\_CBC\_SHA
- `49172`: TLS\_ECDHE\_RSA\_WITH\_AES\_256\_CBC\_SHA
- `49187`: TLS\_ECDHE\_ECDSA\_WITH\_AES\_128\_CBC\_SHA256
- `49191`: TLS\_ECDHE\_RSA\_WITH\_AES\_128\_CBC\_SHA256

## Generating certificates

You can acquire, use external tools, or self-generate your certificates.

For example, to generate a self-signed certificate from the command line, you can do the following:

Generate a certificate 

```
$openssl req -newkey rsa:2048 -new -nodes -x509 -days 365 -out cert.pem -keyout key.pem \
    -subj "/C=US/ST=California/L=Mountain View/O=Your Organization/OU=Your Unit/CN=localhost"
```

## Common TLS errors

Self-signed certificates will show in the logs:

```log
http: TLS handshake error from 172.17.0.1:45474: local error: tls: bad record MAC
```

Old clients trying to connect to a newer TLS version, will produce errors as follows:

```log
http: TLS handshake error from 172.17.0.1:33698: tls: unsupported SSLv2 handshake received
http: TLS handshake error from 172.17.0.1:33710: tls: client offered only unsupported versions
```

Incompatible curves offered by client:

```
http: TLS handshake error from 172.17.0.1:33810: tls: no cipher suite supported by both client and server
http: TLS handshake error from 172.17.0.1:33814: tls: no ECDHE curve supported by both client and server
```

When the client offers a limited set of options that the server cannot accept. It will hang up the connection with an End Of File:

```
http: TLS handshake error from 172.17.0.1:33990: EOF
```

### SSL scan results for the default settings

The following output is the results of the [sslscan](https://github.com/rbsec/sslscan) command with a KrakenD configuration specifying the private and public keys in the configuration with no other additional `tls` settings:

```
Version: 2.0.15-7-gbc46606-static
OpenSSL 1.1.1u-dev  xx XXX xxxx

Connected to ::1

Testing SSL server localhost on port 443 using SNI name localhost

  SSL/TLS Protocols:
SSLv2     disabled
SSLv3     disabled
TLSv1.0   disabled
TLSv1.1   disabled
TLSv1.2   disabled
TLSv1.3   enabled

  TLS Fallback SCSV:
Server supports TLS Fallback SCSV

  TLS renegotiation:
Session renegotiation not supported

  TLS Compression:
Compression disabled

  Heartbleed:
TLSv1.3 not vulnerable to heartbleed

  Supported Server Cipher(s):
Preferred TLSv1.3  128 bits  TLS_AES_128_GCM_SHA256        Curve P-521 DHE 521
Accepted  TLSv1.3  256 bits  TLS_AES_256_GCM_SHA384        Curve P-521 DHE 521
Accepted  TLSv1.3  256 bits  TLS_CHACHA20_POLY1305_SHA256  Curve P-521 DHE 521

  Server Key Exchange Group(s):
TLSv1.3  128 bits  secp256r1 (NIST P-256)
TLSv1.3  192 bits  secp384r1 (NIST P-384)
TLSv1.3  260 bits  secp521r1 (NIST P-521)

  SSL Certificate:
Signature Algorithm: sha256WithRSAEncryption
RSA Key Strength:    2048

Subject:  localhost
Issuer:   localhost

Not valid before: Feb 28 11:44:05 2023 GMT
Not valid after:  Feb 28 11:44:05 2024 GMT
```
