# Google Cloud service-to-service authentication

> Learn how to implement secure GCloud authentication with KrakenD Enterprise. Step-by-step guide for seamless integration

Source: https://www.krakend.io/docs/enterprise/authentication/gcloud/

KrakenD supports the three different **service-to-service authentication** mechanisms Google Cloud provides: **Service Accounts** (this page), [OAuth 2.0](https://www.krakend.io/docs/authorization/client-credentials/), and [Mutual TLS Authentication](https://www.krakend.io/docs/authorization/mutual-authentication/).

A **service account** is a special type of Google account that belongs to an application or a virtual machine. Service accounts are used to authenticate requests to Google Cloud APIs and services or when connecting to your Google Cloud Run services if you added an option “Require Authentication”.

When KrakenD requests a Google Cloud resource, Google Cloud checks the IAM policy associated with the resource to determine whether it has the necessary permissions to access the resource. If KrakenD is authenticated and authorized to access the resource, the request is allowed, and the resource is accessed. If KrakenD is not authenticated or authorized, the request is denied, and an error message is returned.

## GCP configuration

The `auth/gcp` component automatically retrieves a token from Google to perform the authorization against the service behind KrakenD, using the specified `audience`. The configuration is straightforward, and almost all the work is on Google Cloud’s side.

By default, the credentials are taken from the environment variable`GOOGLE_APPLICATION_CREDENTIALS`, which Cloud Run passes automatically.

You can pass another value for the environment var if necessary. `GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/application_default_credentials.json"`.

You can also define the credentials by passing a JSON file, whether as path (`credentials_file`) or copy/pasted inside the configuration (`credentials_json`). This option is more relevant when KrakenD is outside of Google.

##### Fields of GCP Authentication

\* required fields

Minimum configuration needs **any of**: `audience` , or `audience` + `credentials_file` , or `audience` + `credentials_json`

##### [`audience`](https://www.krakend.io/docs/enterprise/authentication/gcloud/#audience "Click to copy link to audience") string

The audience in GCP looks like an URL, and contains the destination service you will ask a token for. Most of the times this URL will match exactly with the `host` entry.

Example: `"https://gcptest-76fewi6rca-uc.a.run.app"`

##### [`credentials_file`](https://www.krakend.io/docs/enterprise/authentication/gcloud/#credentials_file "Click to copy link to credentials_file") string

The relative or absolute path to a credentials file in JSON format that contains all the credentials to authenticate API calls to the given service account.

Example: `"/etc/krakend/gcp.json"`

##### [`credentials_json`](https://www.krakend.io/docs/enterprise/authentication/gcloud/#credentials_json "Click to copy link to credentials_json") object

An inline JSON object containing all the credentials fields to authenticate to GCP.

Example: `{"auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","auth_uri":"https://accounts.google.com/o/oauth2/auth","client_email":"xyz@developer.gserviceaccount.com","client_id":"123","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/xyz%40developer.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\nSOME_KEY\n-----END PRIVATE KEY-----\n","private_key_id":"private_key_id","project_id":"project_id","token_uri":"https://accounts.google.com/o/oauth2/token","type":"service_account"}`

##### [`custom_claims`](https://www.krakend.io/docs/enterprise/authentication/gcloud/#custom_claims "Click to copy link to custom_claims") object

Custom private claims that you can optionally add to an ID token.

##### [`s2s_auth_header`](https://www.krakend.io/docs/enterprise/authentication/gcloud/#s2s_auth_header "Click to copy link to s2s_auth_header") string

The header name to use in service-to-service authentication. This is useful to honor the original Authorization header in case it’s needed by the backend (for example, CloudRun).

Example: `"X-Serverless-Authorization"`

Defaults to `""`

Schema: [https://www.krakend.io/schema/v3.0/auth/gcp.json](https://www.krakend.io/schema/v3.0/auth/gcp.json "JSON schema definition")

Example of configuration

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "version": 4,
    "endpoints": [
        {
            "endpoint": "/gcp",
            "output_encoding": "no-op",
            "backend": [
                {
                    "host": [ "https://hello-76fewi6rca-uc.a.run.app" ],
                    "url_pattern": "/someurl",
                    "encoding": "no-op",
                    "extra_config": {
                        "auth/gcp": {
                            "audience": "https://hello-76fewi6rca-uc.a.run.app"
                        }
                    }
                }
            ]
        }
    ]
}
```

### Additional resources

The following resources at Google will help you during your implementation.

- [Authentication at Google](https://cloud.google.com/docs/authentication)
- [Authentication use cases](https://cloud.google.com/docs/authentication/use-cases#run-functions)
- [How Application Default Credentials works](https://cloud.google.com/docs/authentication/application-default-credentials#attached-sa)
- [Get an ID token](https://cloud.google.com/docs/authentication/get-id-token) - `auth/gcp` does this job for you
- [Creating service-accounts with the CLI](https://cloud.google.com/sdk/gcloud/reference/iam/service-accounts/keys/create)

## Conflicting `Authorization` header

For Google Cloud service-to-service authentication, **particularly when invoking services like Cloud Run**, GCP officially supports using the `X-Serverless-Authorization: Bearer TOKEN` header as an alternative to `Authorization` (as detailed in the GCP documentation: [https://docs.cloud.google.com/run/docs/authenticating/service-to-service#acquire-token)](https://docs.cloud.google.com/run/docs/authenticating/service-to-service#acquire-token%29). This provides a clean separation and avoids header conflicts, so the original request `Authorization` header is unmodified and can reach the backend services (CloudRun) safely. A configuration example:

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "version": 4,
    "endpoints": [
        {
            "endpoint": "/gcp",
            "output_encoding": "no-op",
            "backend": [
                {
                    "host": [ "https://hello-76fewi6rca-uc.a.run.app" ],
                    "url_pattern": "/someurl-that-needs-original-authorization-header",
                    "encoding": "no-op",
                    "extra_config": {
                        "auth/gcp": {
                            "audience": "https://hello-76fewi6rca-uc.a.run.app",
                            "s2s_auth_header": "X-Serverless-Authorization"
                        }
                    }
                }
            ]
        }
    ]
}
```

## Port limitations on Cloud Run

When running KrakenD on Cloud Run, Google allowys to expose one port. Therefore if you want to expose additional services to the gateway such as custom metrics, Cloud Run won’t let you. In this case, you can create a new endpoint that internally uses as the `backend` host this additional port as `localhost:port`.

For example, you can have something like this:

```json
{
  "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
  "version": 4,
  "extra_config": {
    "telemetry/metrics": {
      "collection_time": "60s",
      "proxy_disabled": false,
      "router_disabled": false,
      "backend_disabled": false,
      "endpoint_disabled": false,
      "listen_address": ":8090"
    }
  },
  "endpoints": [
    {
      "endpoint": "/mymetrics",
      "backend": [
        {
          "host": ["localhost:8090"],
          "url_pattern": "/__stats"
        }
      ]
    }
  ]
}
```

This works because your container still has all the necessary ports available, only that Cloud Run won’t expose them. Through KrakenD you can remap them.

## Example of configuring your service account on GCP

Screenshots might vary

Google Cloud interface keeps changing over time. The following screenshots are examples that might not match exactly what you see in the future.

You can integrate GCP when KrakenD is hosted on GCP, or outside of it. Here is an orientation example of how to manually configure it.

Log in to the [Google Cloud Console](https://console.cloud.google.com) and access the **Cloud Run** panel.

If you don’t have any service yet, click Create New Service. Next, we selected the proposed test image, which is a hello-world application.

![Create a Service on Cloud Run](https://www.krakend.io/images/documentation/gcp/gcp_create_service.png)

Then check the “Require Authentication” option when creating the Service, so it cannot be freely accessed. ![Require authentication](https://www.krakend.io/images/documentation/gcp/gcp_require_auth.png)

We have named our first service “hello”, and it is now accessible under a newly generated URL and is displayed at the top.

![Create the hello service](https://www.krakend.io/images/documentation/gcp/gcp_1_create_hello_service.png)

We will now create the KrakenD configuration. The `host` and the `audience` match the new URL.

```json
{
    "$schema": "https://www.krakend.io/schema/v3.0/krakend.json",
    "version": 4,
    "endpoints": [
        {
            "endpoint": "/gcp",
            "output_encoding": "no-op",
            "backend": [
                {
                    "host": [ "https://hello-76fewi6rca-uc.a.run.app" ],
                    "url_pattern": "/someurl",
                    "encoding": "no-op",
                    "extra_config": {
                        "auth/gcp": {
                            "audience": "https://hello-76fewi6rca-uc.a.run.app"
                        }
                    }
                }
            ]
        }
    ]
}
```

Now you should decide whether KrakenD will run in Google or not.

If we want to host KrakenD on Cloud Run, we will create an image containing the configuration and push it to the Container Registry. Now we will repeat the process of creating a service. This time we will add the `krakend` service, and we will select the image we have just pushed.

In the creation screen, we do not set any authentication; the gateway will take care of this with the end user with JWT or similar.

![Create the krakend service](https://www.krakend.io/images/documentation/gcp/gcp_create_service_unauthenticated.png)

Depending on your Google Cloud configuration, the integration might immediately work because there could be a default service account allowing KrakenD to access the Hello service.

Whether this is the case or not, we want to contemplate the possibility of hosting KrakenD outside, so we will dig a little further into the **Service accounts**.

The **Service Accounts** are under the **“IAM & Admin”** section of our console.

We are going to create a new Service Account for our project.

![Create the service account](https://www.krakend.io/images/documentation/gcp/gcp_create_service_account.png) ![Create the service account](https://www.krakend.io/images/documentation/gcp/gcp_create_service_account_details.png)

If we are going to connect from outside Google, we will need to create the credentials. From the Service Account **Keys** tab we create new ones and select the JSON format. ![Create the service account](https://www.krakend.io/images/documentation/gcp/gcp_create_service_account_keys.png)

We can use this key from an external KrakenD to authenticate to GCP once we assign it to the Hello project. The last step is to assign the permissions to the hello application, so it allows KrakenD to interact with it.

Select the Service Hello and add permissions by clicking on “Add Principal”. ![Create a Service on Cloud Run](https://www.krakend.io/images/documentation/gcp/gcp_add_permissions.png)

In the next screen, choose the Service Account you have created and select the role “Cloud Run Invoker” from the list. Click on Save. ![Create a Service on Cloud Run](https://www.krakend.io/images/documentation/gcp/gcp_grant_access.png)

The last step you have to take is to include the credentials we just created. The key you downloaded must be copied in your KrakenD directory and referenced as a `credentials_file` entry, or copy and paste it as `credentials_json` (or even better, use a template and inject it).

Your Service is now ready. You should be able to access your Hello service from KrakenD.
