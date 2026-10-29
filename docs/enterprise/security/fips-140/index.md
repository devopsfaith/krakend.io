# Run using the FIPS-140 Cryptographic Module

> Learn about the security considerations and best practices in configuring and securing KrakenD API Gateway for protecting your APIs

Source: https://www.krakend.io/docs/enterprise/security/fips-140/

While KrakenD’s stateless design **does not handle customer data storage**, it still offers a binary that facilitates **FIPS 140-3 compliance** to **protect customers’ data in-transit**.

If you are unfamiliar with FIPS, the [US National Institute of Standards and Technology (NIST)](https://www.nist.gov/), in collaboration with the Canadian Centre for Cyber Security, released the \[Cryptographic Module Validation Program]\[https://csrc.nist.gov/projects/cryptographic-module-validation-program] (CMVP), which validates cryptographic modules to ensure they meet security standards for Federal agencies. Still, it gained interest from other sectors and industries that started to follow the same standards.

The primary benefit of FIPS is its help towards **regulatory compliance**, as the cryptography used by KrakenD meets the requirements of industries regulated by government standards.

Might not satisfy regulatory requirements

Simply using a FIPS 140-3 compliant and validated cryptographic module may not, on its own, satisfy all relevant regulatory requirements. The KrakenD team does not provide any guarantees or support around how usage of the provided FIPS 140-3 mode may, or may not, satisfy specific regulatory requirements. You should determine whether the use of this module meets your particular requirements.

In any case, you still must integrate a FIPS-validated cryptographic module yourself to secure your data at rest and properly use TLS end-to-end.

The most common industries mandated to follow strict cryptographic standards due to the sensitivity of the information they handle are:

- **Government and defense**: Entities that deal with national security data.
- **Healthcare**: Organizations handling protected health information (PHI) that must comply with [HIPAA requirements](https://www.hhs.gov/hipaa/for-professionals/index.html).
- **Financial services**: Financial institutions that must secure customer data and comply with regulations like the Sarbanes-Oxley Act (**SOX**) or Gramm–Leach–Bliley Act (**GLBA**).
- **Technology and cloud**: Providers that need to ensure data protection for their clients across different jurisdictions.

## Enabling FIPS 140-3

To make the gateway’s Cryptographic Module operate in FIPS 140-3 mode, you need to **add an environment variable** to the container or server with the following value:

```
GODEBUG=fips140=only
```

The gateway must be started when setting this variable. Setting the variable while the process is running won’t take any effect.

The possible values of the fips140 setting are:

- `GODEBUG=fips140=off`: no special support for FIPS 140-3 mode. This is the same as removing the environment variable.
- `GODEBUG=fips140=on`: Force the Cryptographic Module to operate in FIPS 140-3 mode.
- `GODEBUG=fips140=only`: Same as above, but cryptographic algorithms not approved by FIPS 140-3 return an error or panic.

**Note**: Older versions of KrakenD required you to use a dedicated Docker container, but this is no longer a requirement.
