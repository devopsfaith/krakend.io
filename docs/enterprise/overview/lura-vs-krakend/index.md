# Lura vs. KrakenD

> The Lura Project is the code libraries we donated to the Linux Foundation (and still maintain!) and KrakenD the distributable software that runs on top of it.

Source: https://www.krakend.io/docs/enterprise/overview/lura-vs-krakend/

If you had a quick look at our git repositories or the documentation, you might be confused at first, as there is something called the **Lura Project** and also **KrakenD**.

## TL;DR; Difference between Lura, KrakenD, and Enterprise

- [**Lura**](https://luraproject.org) is the KrakenD’s engine. Formerly known as “**KrakenD framework**” until we [donated it to The Linux Foundation on 2021](https://www.krakend.io/blog/krakend-framework-joins-the-linux-foundation/). It is not a product itself but a toolkit/set of libraries to build API gateways. KrakenD founders are in the steering committee of Lura at The Linux Foundation.
- **KrakenD** is driven by the company KRAKEND S.L.U, and is our [open-source API Gateway](https://www.krakend.io/open-source/) ready to use.
- **KrakenD Enterprise** is our commercial version with added functionality and includes services to businesses.

### Lura Project

The [Lura Project](https://luraproject.org) is our original *KrakenD framework* that we [donated to The Linux Foundation on 2021](https://www.krakend.io/blog/krakend-framework-joins-the-linux-foundation/). Previously it lived from 2006 to 2021 under the KrakenD’s team organization ([@krakend\_io](https://twitter.com/krakend_io)) until it became a [Linux Foundation](https://linuxfoundation.org/) project. KrakenD team continues to be part of the steering committee.

The mission of the Lura Project is to offer an extendable, simple and stateless high-performance API Gateway **framework** designed for both cloud-native and on-prem setups. It provides components for assembling your API Gateway. It can be used in its entirety or just importing it as Go libraries to take only some of the functionality it brings.

Lura focuses on providing the core functionality that a pure API gateway needs. It keeps it clean and extensible so that you can create your custom gateway without any trouble. KrakenD is the primary representation of Lura’s possibilities.

[Website](https://luraproject.org "Website") [Source code](https://github.com/luraproject/lura "Source code")

### KrakenD API gateway

`KrakenD` ([repo](https://github.com/krakend/krakend-ce)) is our ready-to-use API gateway, assembled the way we think it delivers more value to the general audience. KrakenD uses the Lura Project in its core and extends its functionality by adding in the final binary multiple middlewares [contributions](https://github.com/krakend/krakend-contrib) we thought an API Gateway should have.

KrakenD adds to Lura more functionality like logging, service discovery, developer tools, metrics, circuit breaker, rate limiting, OAuth, security, and other exciting stuff.

[Download](https://www.krakend.io/download/ "Download") [Source code](https://github.com/krakend/krakend-ce "Source code")

### KrakenD Enterprise

Customers of the [KrakenD Enterprise](https://www.krakend.io/enterprise/) package enjoy the development, consultancy, support, and training services offered by the very same KrakenD creators (and Lura steering committee). As per the software, KrakenD Enterprise offers more functionality than the open source edition, including the integration with additional proprietary observability solutions, wildcards, GeoIP, OpenAPI, Postman collections and more. There is also more tooling around KrakenD to increase productivity and enable working with KrakenD in large groups of developers.

**Our commitment to open-source is in the center of our business**, and this is why our Enterprise solution is built on top of the open-source version. The Enterprise version uses the same OSS binary and extends it with a great variety of pluggable solutions. We want to make sure that both enterprise and community users have the excellent quality and reliability they are used to.

[Learn more about Enterprise](https://www.krakend.io/enterprise/)
