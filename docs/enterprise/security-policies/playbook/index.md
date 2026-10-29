# Security Policies Playbook

> Access our Security Policies Playbook for comprehensive guidelines on safeguarding your APIs. Ensure robust protection

Source: https://www.krakend.io/docs/enterprise/security-policies/playbook/

An example is sometimes self-explanatory and lets you see the potential of the kind of stuff you can do with policies. The following examples demonstrate who to apply different policies to your API, but possibilities are endless!

## Check if user has one of the selected roles (RBAC) or attributes (ABAC)

This configuration would go inside the `endpoint`’s extra\_config. Checks that the role is *admin* or *root*, and that the department is also contained in a list:

```json
{
  "extra_config": {
    "security/policies": {
      "jwt": {
        "policies": [
          "JWT.role in ['admin', 'root'] || JWT.permissions.can_write_users",
          "JWT.department in ['IT','HR']"
        ]
      }
    },
    "auth/validator": {
      "@comment": "Add here your auth/validator settings to enable 'jwt' policies"
    }
  }
}
```

## Create a maintenance window

Disable requests between the 10am and noon on the 1st of January (UTC -5), and return a custom `500` status code:

```json
{
  "extra_config": {
    "security/policies": {
      "req": {
        "policies": [
          "timestamp(now)< timestamp('2023-01-01T10:00:20.000-05:00') || timestamp(now)> timestamp('2023-01-01T12:00:20.000-05:00')"
        ],
        "error": {
          "body": "The system is down for maintenance",
          "status": 500
        }
      }
    }
  }
}
```

## Endpoint lifecycle

You can decide to publish an endpoint on a specific date (or unpublish it). Here’s an example to deploy an endpoint on a date:

```json
{
  "extra_config": {
    "security/policies": {
      "req": {
        "policies": [
          "timestamp(now) > timestamp('2023-01-01T10:00:20.000-05:00')"
        ],
        "error": {
          "body": "The endpoint /foo is not yet implemented",
          "status": 404
        }
      }
    }
  }
}
```

## User is from a specific country

Requires enabling the [GeoIP integration](https://www.krakend.io/docs/enterprise/endpoints/geoip/) and allowing the `X-Geoip` header in. Example to allow traffic from the US or France only.

```json
{
  "input_headers": ["X-Geoip"],
  "extra_config": {
    "security/policies": {
      "req": {
        "policies": [
          "geoIP().Country.IsoCode in ['US','FR']"
        ]
      }
    }
  }
}
```

## Enforce query string validation

Make sure the query string `user` contains a value that matches a regexp.

```json
{
  "input_query_strings": ["user"],
  "extra_config": {
    "security/policies": {
      "req": {
        "policies": [
          "req_querystring.user.exists(u,u.matches('[0-9]+'))"
        ]
      }
    }
  }
}
```

Similar alternative policies:

- `hasQuerystring('user')`: checks the user is not empty.
- `int(req_querystring.user[0]) > 1000`: checks if the user is larger than 1000.
- `req_querystring.user[0].isAlphanumeric()`: checks if the user is an alphanumeric string.

## Ensure a JWT claim matches part of the URL

Suppose a JWT token contains a claim `sub`, and we want to make sure users can access only the endpoint that matches their profile, and is part of the URL requested.

For instance, `/users/john` is accessible only with valid JWT `{"sub": "john"}`.

```json
{
    "endpoint": "/users/{id}",
    "input_headers":["X-Example-Claim"],
    "extra_config": {
        "security/policies":{
            "req": {
                "policies": [
                    "req_headers['X-Example-Claim'][0].lowerAscii() == req_params.Id.lowerAscii()"
                ]
            }
        },
        "auth/validator": {
            "@comment": "irrelevant config details omitted",
            "propagate_claims": [
                ["sub", "X-Example-Claim"]
            ]
        }
    }
}
```

Notice that the `auth/validator` is the first component in receiveing the request, and propagates the claim `sub` as the header `X-Example-Claim`. The header is added into the `input_headers` to make sure the endpoint can work with it. Finally the policy converts both the parameter `{id}` and the header to lower case (normalize) and checks that they have the same value.

## A cookie is set and sent to consume an endpoint

Check that a specific cookie is set to proceed with a tracking option. For instance, there is a cookie `GDPR=yes` set by the user.

```json
{
    "endpoint": "/tracking/{id}",
    "input_headers":["Cookie"],
    "extra_config": {
        "security/policies":{
            "req": {
                "policies": [
                    "getCookie('GDPR') == 'yes'"
                ],
                "error": {
                  "body": "Tracking not allowed by user",
                  "status": 403
                }
            }
        }
    }
}
```

## The response lacks attributes

Checking that a specific response from the backend(s) contains essential data, otherwise fail.

```json
{
    "extra_config": {
        "security/policies":{
            "resp": {
                "policies": [
                    "has(resp_data.important_attribute)"
                ],
                "error": {
                  "body": "Couldn't fetch the required data",
                  "status": 503
                }
            }
        }
    }
}
```
