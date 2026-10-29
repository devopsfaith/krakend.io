# Security Overview

> KrakenD is built with a security-first approach in mind. Read about the security features bundled by KrakenD and the principles and design philosophy behind it

Source: https://www.krakend.io/docs/security/

KrakenD is a software built with a **security-first philosophy**. In 2022, we became a recognized **CVE Numbering Authority (CNA)** worldwide for software distribution ([Partner page](https://www.cve.org/PartnerInformation/ListofPartners/partner/KrakenD)), and we publish CVE Records for vulnerabilities within any KrakenD software or the Lura Project (© the Linux Foundation).

In addition, our company is [SOC 2 Type II Certified](https://www.krakend.io/blog/soc2-certification-announcement/) and you can get more information on our [Trust Center](https://trust.krakend.io/).

[Security Advisories](https://www.krakend.io/categories/security/ "Security Advisories") [Security Policy](https://www.krakend.io/security-policy/ "Security Policy")

## Secure by design

At KrakenD, security is not just an add-on; it’s a **design principle baked into every component**. The [Zero-trust design](https://www.krakend.io/docs/design/zero-trust/) is the foundational philosophy. From blocking unauthorized access to rejecting untrusted traffic by default or even not logging sensitive data, KrakenD ensures a minimal attack surface by enforcing strict controls over headers, parameters, and tokens.

Our *Security Program Policy and Incident Response Plan* have the following principles:

- **Secure Development and Proactive Threat Detection**: To ensure that KrakenD is secure, we conduct continuous automated code analysis, vulnerability assessments, and other security measures integrated into the CI/CD pipeline.
- **Software Integrity**: To protect the codebase’s and software’s integrity by enforcing security measures that prevent unauthorized changes, reduce human error, and mitigate potential security vulnerabilities in real time.
- **Rapid Incident Response**: To ensure a quick and effective response to security incidents and minimize their impact through defined protocols for containment, eradication, recovery, and post-incident analysis.
- **Compliance with Industry Standards**: To ensure KrakenD’s software adheres to industry standards and security frameworks, such as OWASP best practices, and complies with regulatory requirements for enterprises.
- **Enterprise-Ready Security**: To provide a robust security framework suitable for large-scale enterprise deployment, ensuring that all software produced by KrakenD is safe, scalable, and reliable for its enterprise customers.

Below are the categories in which security is more obvious. Although this is not a complete list, it provides you with a place to start exploring our documentation.

## Authentication and Authorization

API authentication and authorization are key to any secured API. KrakenD has mechanisms such as [JWT validation](https://www.krakend.io/docs/authorization/jwt-validation/), [JWT signing](https://www.krakend.io/docs/authorization/jwt-signing/), [OAuth2 Client Credentials](https://www.krakend.io/docs/authorization/client-credentials/) or [API keys](https://www.krakend.io/docs/enterprise/authentication/api-keys/) Enterprise to name a few examples.

Authorization allows you to implement Role-based (RBAC) and attribute-based access control (ABAC) policies.

In addition, if you need to invalidate legitimate tokens that are still within a valid TTL, KrakenD supports [JWT token revocation using bloom filters](https://www.krakend.io/docs/authorization/revoking-tokens/) and [centralized token revocation servers](https://www.krakend.io/docs/enterprise/authentication/revoke-server/), ensuring revoked tokens are immediately invalidated across all KrakenD nodes.

## Encryption and Secure Communication

The gateway supports [TLS](https://www.krakend.io/docs/service-settings/tls/) for traffic coming from consumers (server) and also between KrakenD and your services (client). It defaults to TLS 1.3 unless downgraded by config.

For business-to-business authentication, [Mutual TLS (mTLS)](https://www.krakend.io/docs/authorization/mutual-authentication/) creates a secure and exclusive channel based on trusted certificates.

Governments can also get a Docker container with [FIPS 140-2 validated cryptography](https://www.krakend.io/docs/enterprise/security/fips-140/) Enterprise for compliance with their regulations.

## Data protection

Showing the right data or allowing limited access is key on any API. In addition to blocking users without enough privileges to consume data, you can apply [data filtering and manipulation](https://www.krakend.io/docs/enterprise/backends/data-manipulation/) or even [masking of data](https://www.krakend.io/docs/enterprise/endpoints/content-replacer/) Enterprise

In addition, to prevent malicious or malformed requests, KrakenD allows you to [validate the payload](https://www.krakend.io/docs/endpoints/json-schema/) of requests against a JSON schema before it reaches your service. But it also works the other way around: you can also [validate responses](https://www.krakend.io/docs/enterprise/endpoints/response-schema-validator/) Enterprise of your services against a schema and decide whether is worth or not returning it to the end user.

Finally, the [Security policy engine](https://www.krakend.io/docs/enterprise/security-policies/) is designed to enforce complex business logic based on real-time evaluation of requests, responses, and tokens.

## Traffic Control

[**API Throttling**](https://www.krakend.io/docs/enterprise/throttling/) is a dragon of many heads. You might want to limit the throughput your users do against your API with one of the many rate-limiting strategies: [per-service](https://www.krakend.io/docs/enterprise/service-settings/service-rate-limit/), [per-tier](https://www.krakend.io/docs/enterprise/service-settings/tiered-rate-limit/) (both Enterprise ) , [per-endpoint](https://www.krakend.io/docs/endpoints/rate-limit/), [per-user](https://www.krakend.io/docs/endpoints/rate-limit/#client-rate-limiting-client_max_rate), or [per-proxy](https://www.krakend.io/docs/backends/rate-limit/).

Another key security component is the [Circuit Breaker](https://www.krakend.io/docs/backends/circuit-breaker/), which automatically blocks calls to failing backends, **preventing cascading failures** and reducing the load on a suffering system.

Then, depending on your environment you might want to enable [IP Filtering](https://www.krakend.io/docs/enterprise/throttling/ipfilter/) or [GeoIP filtering](https://www.krakend.io/docs/enterprise/endpoints/geoip/) to restrict API traffic based on IP addresses, CIDR ranges, or geography (both are Enterprise ), [Bot detection](https://www.krakend.io/docs/throttling/botdetector/),or enable conditional requests with [Conditional Expression Language](https://www.krakend.io/docs/endpoints/common-expression-language-cel/) (CEL) or Security Policies (also Enterprise ).

## HTTPS Security and OWASP Recommendations

KrakenD follows **OWASP best practices** and security recommendations, incorporating several protections by just declaring the security component:

- [Host Restriction](https://www.krakend.io/docs/service-settings/security/#restrict-connections-by-host): Restrict connections by host, defining a list of backends that the API gateway can communicate with.
- [Cross-Origin Resource Sharing (CORS)](https://www.krakend.io/docs/service-settings/cors/) lets you control and limit which domains can access APIs, protecting against cross-origin attacks.
- [HTTP Strict Transport Security (HSTS)](https://www.krakend.io/docs/service-settings/security/#http-strict-transport-security-hsts) makes sure that all interactions with the gateway use HTTPS, mitigating protocol downgrade attacks.
- **Public Key Pinning**: To [prevent certificate forgery](https://www.krakend.io/docs/service-settings/security/#http-public-key-pinning-hpkp), HPKP allows you to “pin” a public key, ensuring clients connect to the intended service.
- **Clickjacking Protection**: To activate frame-busting mechanisms by [configuring X-Frame-Options headers](https://www.krakend.io/docs/service-settings/security/#clickjacking-protection).
- **Cross-Site Scripting (XSS) Protection**: Mitigate XSS attacks by adding relevant security headers like [X-XSS-Protection](https://www.krakend.io/docs/service-settings/security/#cross-site-scripting-xss-protection), protecting clients from malicious script injections.
- **MIME Sniffing Prevention** prevents browsers from [MIME sniffing](https://www.krakend.io/docs/service-settings/security/#mime-sniffing-prevention) and interpreting files as a different content type than declared by using the X-Content-Type-Options header.

## Monitoring, Auditing, and Logging

Logging and Monitoring, like OpenTelemetry, Prometheus, New Relic, Datadog, and other integrations, ensure that audit trails are available for all requests and responses, which is crucial for forensics and compliance.

Another part directly related to security is the [automatic audit of configuration](https://www.krakend.io/docs/configuration/audit/), a step in your build process that checks whether your configuration has security problems or it can be improved before going live.

## Tested by many

KrakenD’s security is strengthened by the fact that **it is tested by thousands of servers every day** across diverse environments, geographies, and use cases. This extensive usage (approx. 2 million servers/month) means that potential vulnerabilities are identified and addressed quickly, as real-world scenarios expose the system to a wide range of security challenges. Continuous feedback from a large community of developers ensures that KrakenD remains resilient to new threats, benefits from community-driven improvements, and maintains robust security practices. This collective testing approach makes KrakenD more secure and reliable over time.

## No data storage

As KrakenD operates as a stateless gateway, only processes data in transit and **does not store any information**. Since KrakenD does not retain user data, logs, or any sensitive information, it reduces the risk of data breaches or unauthorized access. This design ensures that all data flows securely through the system without lingering in any storage, making KrakenD inherently more secure and compliant with heavy data privacy regulations (banking, health, insurance, etc), as it minimizes the exposure of sensitive information in an eventual breach.
