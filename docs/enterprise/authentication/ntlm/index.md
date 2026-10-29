# NTLM authentication

> Secure API access with NTLMv2 authentication for Microsoft servers to integrate legacy systems like the ERP Microsoft Dynamics that still need to switch to Oauth.

Source: https://www.krakend.io/docs/enterprise/authentication/ntlm/

NTLM (NT Lan Manager) is a suite of Microsoft security protocols used for authentication, integrity, and confidentiality of network communications. It is primarily used for authentication on Windows-based systems but can also be used in other environments.

KrakenD NTLM integration does the user impersonation and acts as a client in the communication gateway to the backend. The end-user authentication is independent, and you can offer standard JWT tokens, no authentication, or another authentication option.

Microsoft has deprecation plans for NTLM

**Microsoft strongly recommends moving away from this protocol and adopting more modern and secure authentication mechanisms such as OAuth**.

NTLM has several security weaknesses and limitations, which can make it **vulnerable to various types of attacks**. However, KrakenD supports internal-facing communications using NTLM for legacy systems, as it is still widely used in many Windows-based systems and applications and remains an essential part of the Windows security ecosystem.

**KrakenD supports NTLMv2** and no key exchange or encryption. It only supports Unicode (UTF16LE) encoding of protocol strings, no OEM encoding. Internally uses the official Azure Go library.

NTLM authentication is used in various Microsoft applications so that you can integrate KrakenD primarily with the following:

- **Microsoft Dynamics** and other ERP systems.
- **Microsoft SharePoint** (collaboration platform used for document management)

NTLM is also used in Windows Server, Microsoft Active Directory, Exchange Server, SQL Server, or IIS, to mention a few others.

## How NTLM works

There are two steps in the communication of service consumption.

1. The end-user requests KrakenD content
2. KrakenD retrieves it from an NTLM-protected server

![NTLM authentication](https://www.krakend.io/images/documentation/krakend-ntlm-authentication.png)

For the first step (user to KrakenD), you can use JWT tokens for instance, or another authentication option, but we do not enable end-user authentication with NTLM.

The NTLM integration covers the second step, which authenticates KrakenD on local and remote servers like Microsoft Dynamics.

As you can see, both steps are independent, and you can choose which mechanism protections suit you best.

NTLM authentication works by using a challenge-response mechanism. When KrakenD logs on to a Windows-based system or accesses a network resource with the provided credentials, the system challenges the connection. The challenge is a random string of characters that KrakenD must encrypt and send back to the system. The system then checks the response against its copy of the user’s password hash to verify the user’s identity.

### Security considerations

From a security perspective, NTLM could be more secure, and as it happens with Basic Authentication, you should refrain from using it in new developments. Its purpose is to cover legacy implementations.

NTLMv1 is an ancient protocol, and KrakenD does not support it.

NTLMv2 is a newer, more secure protocol (comparatively) that includes additional security features such as mutual authentication and message integrity checking. Still, neither of them is a safe option nor recommendable.

## NTLM configuration

The NTLM configuration works at the `backend` level, and you have the following options available:

##### Fields of NTLM Authentication

\* required fields

##### [`password`](https://www.krakend.io/docs/enterprise/authentication/ntlm/#password "Click to copy link to password") * string

The password you will use, in clear text.

Example: `"myp4ssw0rd"`

##### [`user`](https://www.krakend.io/docs/enterprise/authentication/ntlm/#user "Click to copy link to user") * string

The username you will send as NTLM authentication user.

Example: `"krakendclient"`

Schema: [https://www.krakend.io/schema/v3.0/auth/ntlm.json](https://www.krakend.io/schema/v3.0/auth/ntlm.json "JSON schema definition")

Below there is a functional example you can test. It should work unless the external site stops responding.

```json
{
  "version": 4,
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "endpoints": [
    {
      "endpoint": "/ntlm",
      "output_encoding": "no-op",
      "backend": [
        {
          "url_pattern": "/HTTPAuth/",
          "host": [
            "https://authenticationtest.com"
          ],
          "extra_config": {
            "auth/ntlm": {
              "user": "user",
              "password": "pass"
            }
          }
        }
      ]
    }
  ]
}
```
