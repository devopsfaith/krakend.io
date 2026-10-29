# HTTP Security Considerations

> KrakenD's HTTP Security component enhances API protection by enabling features like Clickjacking protection, MIME-Sniffing prevention, and XSS protection, and more

Source: https://www.krakend.io/docs/enterprise/service-settings/security/

KrakenD has implemented several security strategies, controlled via the `security/http` component. To enable them you only need to add its namespace `security/http` at the `extra_config` in the root level of the configuration.

The following configuration describes all possible options:

```json
{
    "version": 4,
    "extra_config": {
      "security/http": {
        "allowed_hosts": [
          "host.known.com:443"
        ],
        "ssl_proxy_headers": {
          "X-Forwarded-Proto": "https"
        },
        "host_proxy_headers":[
          "X-Forwarded-Hosts"
        ],
        "ssl_redirect": true,
        "ssl_host": "ssl.host.domain",
        "sts_seconds": 300,
        "sts_include_subdomains": true,
        "frame_deny": true,
        "referrer_policy": "same-origin",
        "custom_frame_options_value": "ALLOW-FROM https://example.com",
        "hpkp_public_key": "pin-sha256=\"base64==\"; max-age=expireTime [; includeSubDomains][; report-uri=\"reportURI\"]",
        "content_type_nosniff": true,
        "browser_xss_filter": true,
        "content_security_policy": "default-src 'self';",
        "is_development": false
      }
}
```

See below the different options described in this configuration file.

##### Fields of HTTP Security

\* required fields

##### [`allowed_hosts`](https://www.krakend.io/docs/enterprise/service-settings/security/#allowed_hosts "Click to copy link to allowed_hosts") array of strings

When a request hits KrakenD, it will confirm if the value of the Host HTTP header is in the list. If so, it will further process the request. If the host is not in the allowed hosts list, KrakenD will simply reject the request.

Defaults to `[]`

##### [`allowed_hosts_are_regex`](https://www.krakend.io/docs/enterprise/service-settings/security/#allowed_hosts_are_regex "Click to copy link to allowed_hosts_are_regex") boolean

Treat the allowed hosts list as regular expressions.

Defaults to `false`

##### [`browser_xss_filter`](https://www.krakend.io/docs/enterprise/service-settings/security/#browser_xss_filter "Click to copy link to browser_xss_filter") boolean

Defaults to `false`

##### [`content_security_policy`](https://www.krakend.io/docs/enterprise/service-settings/security/#content_security_policy "Click to copy link to content_security_policy") string

The HTTP Content-Security-Policy (CSP) default-src directive serves as a fallback for the other CSP fetch directives.

Example: `"default-src 'self';"`

Defaults to `""`

##### [`content_type_nosniff`](https://www.krakend.io/docs/enterprise/service-settings/security/#content_type_nosniff "Click to copy link to content_type_nosniff") boolean

Enabling this feature will prevent the user’s browser from interpreting files as something else than declared by the content type in the HTTP headers.

Defaults to `false`

##### [`custom_frame_options_value`](https://www.krakend.io/docs/enterprise/service-settings/security/#custom_frame_options_value "Click to copy link to custom_frame_options_value") string

You can add an X-Frame-Options header using custom\_frame\_options\_value with the value of DENY (default behavior) or even set your custom value.

Example: `"ALLOW-FROM https://example.com"`

Defaults to `""`

##### [`force_sts_header`](https://www.krakend.io/docs/enterprise/service-settings/security/#force_sts_header "Click to copy link to force_sts_header") boolean

Force a STS Header even if using plain HTTP.

Defaults to `false`

##### [`frame_deny`](https://www.krakend.io/docs/enterprise/service-settings/security/#frame_deny "Click to copy link to frame_deny") boolean

Set to true to enable clickjacking protection, together with `custom_frame_options_value`.

Defaults to `false`

##### [`host_proxy_headers`](https://www.krakend.io/docs/enterprise/service-settings/security/#host_proxy_headers "Click to copy link to host_proxy_headers") array of strings

A set of header keys that may hold a proxied hostname value for the request.

Example: `["X-Forwarded-Hosts"]`

##### [`hpkp_public_key`](https://www.krakend.io/docs/enterprise/service-settings/security/#hpkp_public_key "Click to copy link to hpkp_public_key") string

HTTP Public Key Pinning (HPKP) is a security mechanism which allows HTTPS websites to resist impersonation by attackers using mis-issued or otherwise fraudulent certificates. (For example, sometimes attackers can compromise certificate authorities, and then can mis-issue certificates for a web origin.).

Example: `"pin-sha256=\"base64==\"; max-age=expireTime [; includeSubDomains][; report-uri=\"reportURI\"]"`

Defaults to `""`

##### [`is_development`](https://www.krakend.io/docs/enterprise/service-settings/security/#is_development "Click to copy link to is_development") boolean

This will cause the AllowedHosts, SSLRedirect, and STSSeconds/STSIncludeSubdomains options to be ignored during development. When deploying to production, be sure to set this to false.

Defaults to `false`

##### [`referrer_policy`](https://www.krakend.io/docs/enterprise/service-settings/security/#referrer_policy "Click to copy link to referrer_policy") string

Allows the Referrer-Policy header with the value to be set with a custom value.

Defaults to `"same-origin"`

##### [`ssl_host`](https://www.krakend.io/docs/enterprise/service-settings/security/#ssl_host "Click to copy link to ssl_host") string

When the SSL redirect is true, the host where the request is redirected to.

Example: `"ssl.host.domain"`

Defaults to `"ssl.host.domain"`

##### [`ssl_proxy_headers`](https://www.krakend.io/docs/enterprise/service-settings/security/#ssl_proxy_headers "Click to copy link to ssl_proxy_headers") object

Header keys with associated values that would indicate a valid https request. Useful when using Nginx, e.g: `"X-Forwarded-Proto": "https"`

Example: `{"X-Forwarded-Proto":"https"}`

##### [`ssl_redirect`](https://www.krakend.io/docs/enterprise/service-settings/security/#ssl_redirect "Click to copy link to ssl_redirect") boolean

Redirect any request that is not using HTTPS

Defaults to `true`

##### [`sts_include_subdomains`](https://www.krakend.io/docs/enterprise/service-settings/security/#sts_include_subdomains "Click to copy link to sts_include_subdomains") boolean

Set to true when you want the `includeSubdomains` be appended to the Strict-Transport-Security header.

Defaults to `false`

##### [`sts_seconds`](https://www.krakend.io/docs/enterprise/service-settings/security/#sts_seconds "Click to copy link to sts_seconds") integer

Enable this policy by setting the `max-age` of the `Strict-Transport-Security` header. Setting to `0` disables HSTS.

Defaults to `0`

Schema: [https://www.krakend.io/schema/v3.0/security/http.json](https://www.krakend.io/schema/v3.0/security/http.json "JSON schema definition")

### Restrict connections by host

Use `allowed_hosts`

Define a list of hosts that KrakenD should accept requests to.

When a request hits KrakenD, it will confirm if the value of the `Host` HTTP header is in the list. If so, it will further process the request. If the host is not in the allowed hosts list, KrakenD will simply reject the request.

The list must contain the fully qualified domain names that are allowed, along with the origin port. When the list is empty accepts any host.

### Clickjacking protection

KrakenD follow the OWASP’s recommendations by adding a frame-breaking strategy.

Use `frame_deny` together with `custom_frame_options_value`

You can add an `X-Frame-Options` header using `custom_frame_options_value` with the value of `DENY` (default behavior) or even set your custom value.

Check the [OWASP Clickjacking cheat sheet](https://www.owasp.org/index.php/Clickjacking_Defense_Cheat_Sheet#X-Frame-Options_Header_Types) for more details about the header and its recommended values.

### MIME-Sniffing prevention

Use `content_type_nosniff`

Enabling this feature will prevent the user’s browser from interpreting files as something else than declared by the content type in the HTTP headers.

### Cross-site scripting (XSS) protection

Use `browser_xss_filter`

This feature enables the [Cross-site scripting (XSS)](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29) filter in the user’s browser.

### Content-Security-Policy

Related to XSS protection there is the HTTP Content-Security-Policy response header, which allows you to control resources the user agent is allowed to load for a given page.

Use `content_security_policy` (*string*) to set your policy. E.g.: `default-src 'self';`

## HTTPS

### HTTP Strict Transport Security (HSTS)

OWASP defines the HSTS as

> HTTP Strict Transport Security (HSTS) is a web security policy mechanism which helps to protect websites against protocol downgrade attacks and cookie hijacking. It allows web servers to declare that web browsers (or other complying user agents) should only interact with it using secure HTTPS connections, and never via the insecure HTTP protocol. HSTS is an IETF standards track protocol and is specified in RFC 6797. A server implements an HSTS policy by supplying a header (Strict-Transport-Security) over an HTTPS connection (HSTS headers over HTTP are ignored).

- Use `sts_seconds` (*integer*): Enable this policy by setting the max-age of the Strict-Transport-Security header. Setting to `0` disables HSTS. Use the `sts_seconds` setting.
- Use `sts_include_subdomains` (*bool*): Set to true when you want the `includeSubdomains` be appended to the Strict-Transport-Security header.

### HTTP Public Key Pinning (HPKP)

Use `hpkp_public_key`

OWASP defines the HPKP as

> HTTP Public Key Pinning (HPKP) is a security mechanism which allows HTTPS websites to resist impersonation by attackers using mis-issued or otherwise fraudulent certificates. (For example, sometimes attackers can compromise certificate authorities, and then can mis-issue certificates for a web origin.).

**This feature must be used with caution because there is a risk that hosts may make themselves unavailable by pinning to a set of public key hashes that becomes invalid.**

## OAuth2

KrakenD supports the client credentials grant.

Use this feature if you need to authorize the KrakenD to access your backend services.

See the specific docs for [OAuth2 Client Credentials](https://www.krakend.io/docs/enterprise/authorization/client-credentials/)
