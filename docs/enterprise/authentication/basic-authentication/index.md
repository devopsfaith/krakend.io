# Basic Authentication

> Implement basic authentication in KrakenD API Gateway to secure your APIs using username and password credentials

Source: https://www.krakend.io/docs/enterprise/authentication/basic-authentication/

The Basic Authentication functionality protects access to selected endpoints using basic username and password credentials. The functionality works at the router level, and the backend is never hit when the authentication fails.

No longer a plugin

KrakenD Enterprise v2.2 deprecated the `basic-auth` plugin in favor of the native `auth/basic` component, and v3.0 removed it. If your configuration still uses the plugin, follow the steps to [upgrade from plugin-based Basic Auth](https://www.krakend.io/#upgrade-from-plugin-based-basic-auth).

## How does it work

KrakenD feeds from a regular`.htpasswd` file that declares all the possible combinations of users and credentials that KrakenD recognizes. You can also declare users inline directly in the configuration file. You must store these credentials in `bcrypt` format.

There is no special tooling required to administer this file other than having the `htpasswd` command in the development machine (the command is part of the `apache2-utils` package in Linux).

When KrakenD starts, it reads the `.htpasswd` file if declared in the configuration and loads it in memory. As a result, the credential-checking process does not need to open the file, ensuring that the system does not rely on I/O.

The basic authentication applies only to the endpoints containing an `auth/basic` entry. The rest are public or use other authentication/authorization mechanisms.

When a user fails to provide valid credentials, a `401 Unauthorized` status code is returned.

## Configuration

The namespace you need to enable basic authorization is `auth/basic`, and you can place it at the **endpoint level** (required), the **service level** (optional), or **both**.

Include the `auth/basic`’s `extra_config` in the desired **endpoint** that needs to check the credentials with the credentials file and/or usernames. If you want to use the same credential sets across multiple endpoints, you can place the namespace at the **service level** instead (root of the file) and include an empty `extra_config` reference (`"auth/basic": {}`) which will inherit its settings.

When the endpoint includes a non-empty configuration object, if you have declared settings at the service level, then you are overriding the whole object.

For instance:

```json
{
  "version": 4,
  "extra_config": {
    "auth/basic": {
      "@comment": "The following configuration applies to any endpoint with auth/basic{} config",
      "htpasswd_path": "/path/to/.htpasswd",
      "@comment": "Additional users to the ones in htpasswd:",
      "users": {
        "admin": "$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ...",
        "user2": "$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ..."
      }
    }
  },
  "endpoints": [
    {
      "endpoint": "/user/{id}",
      "extra_config": {
        "@comment": "The empty inclusion enables basic auth for this endpoint with the config above ",
        "auth/basic": {}
      }
    },
    {
      "endpoint": "/checkout",
      "extra_config": {
        "@comment": "Exceptionally an endpoint can override all settings",
        "auth/basic": {
          "htpasswd_path": "/path/to/.htpasswd_secondary"
        }
      }
    }
  ]
}
```

##### Fields of Basic Authentication

\* required fields

##### [`htpasswd_path`](https://www.krakend.io/docs/enterprise/authentication/basic-authentication/#htpasswd_path "Click to copy link to htpasswd_path") string

Absolute Path to the `htpasswd` filename (recommended) or relative `./` to the workdir (less secure).

Example: `"/path/to/.htpasswd"`

##### [`users`](https://www.krakend.io/docs/enterprise/authentication/basic-authentication/#users "Click to copy link to users") object

**Additional** users to the `htpasswd` file can be declared directly inside the configuration. The content of both places will be merged (and this list will overwrite users already defined in the htpasswd file). The key of each entry is the username, and the value the bcrypt.

Example: `{"admin":"$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ...","user2":"$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ..."}`

Properties of `users` can use a name matching the pattern `(.*)`, and their content is an `string`

Schema: [https://www.krakend.io/schema/v3.0/auth/basic.json](https://www.krakend.io/schema/v3.0/auth/basic.json "JSON schema definition")

## User administration

The htpasswd file is loaded only during startup, and KrakenD needs to be restarted or redeployed if you want to modify which users can access the resources. The same happens with any users declared inside the `users` array.

KrakenD only works with passwords encrypted with `bcrypt`. Generate a file using the following command (notice the `-B` flag for bcrypt):

Generate access file 

```
$htpasswd -Bbc .htpasswd yourUser yourPassword
```

Or generate the output in stdout:

Ask for password and create hash 

```
$htpasswd -nB yourUser
New password:
Re-type new password:
yourUser:$2y$05$s8eiQOQtfvOPB3K4vr212eZyZFdtdnKap6RfEVd479xXtXlfx7Nsq
```

A string like the one below represents the user and the password hash, which is inserted in the `.htpasswd` file or directly inside the KrakenD configuration under `users`.

Generate access file 

```
$myName:$2y$05$c4WoMPo3SXsafkva.HHa6uXQZWr7oboPiC2bT/r7q1BB8I2s0BRqC
```

To delete users, edit the file and remove the desired line.

## Upgrade from plugin-based Basic Auth

KrakenD Enterprise v2.2 deprecated the basic authentication plugin, and v3.0 removed it. If your configuration still uses the plugin, you must switch to the configuration format of the core component, which offers the following **benefits**:

- Now, all rejections appear in the telemetry
- You can override the configuration at the endpoint level
- Easier to maintain configuration

### Configuration upgrade

Below you can find the same configuration for the removed plugin and the core component.

**Plugin configuration (removed in v3.0)**:

```json
{
    "version": 4,
    "plugin": {
        "pattern":".so",
        "folder": "/opt/krakend/plugins/"
    },
    "extra_config": {
        "plugin/http-server": {
            "name": [ "basic-auth" ],
            "basic-auth": {
                "htpasswd_path": "/path/to/.htpasswd",
                "endpoints": [
                    "/user/{id}",
                    "/checkout"
                    ],
                "users": {
                    "admin": "$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ...",
                    "user2": "$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ..."
                }
            }
        }
    }
}
```

**Core component configuration**:

```json
{
    "version": 4,
    "extra_config": {
            "auth/basic": {
                "@comment": "The following configuration applies to any endpoint with auth/basic config",
                "htpasswd_path": "/path/to/.htpasswd",
                "users": {
                    "admin": "$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ...",
                    "user2": "$2y$05$HpdPmv2Z3h3skMCVaf/CEep/UUBuhZ..."
            }
        }
    },
    "endpoints": [
        {
            "endpoint": "/user/{id}",
            "extra_config": {
                "@comment": "The simple inclusion of the component enables basic authentication for this endpoint",
                "auth/basic": {}
            }
        },
        {
            "endpoint": "/checkout",
            "extra_config": {
                "auth/basic": {
                    "@comment": "Additionally an endpoint can override any settings",
                    "htpasswd_path": "/path/to/.htpasswd_secondary"
                }
            }
        }
    ]
}
```

As you can see, your configuration in the plugin moves to a new `extra_config` section named `auth/basic`. And instead of having a list of endpoints, you declare the usage directly in the endpoint. In summary:

- You no longer need the `plugin` entry
- The global configuration moves:
  
  - From `extra_config` / `plugin/http-server`/ `basic-auth`
  - To `extra_config` / `auth/basic`
- The `endpoints` list disappears in the global configuration
- You include in each `endpoint` the `extra_config` -&gt; `auth/basic` as an empty object
- Optionally, you can override the configuration on a specific endpoint by passing new settings.
