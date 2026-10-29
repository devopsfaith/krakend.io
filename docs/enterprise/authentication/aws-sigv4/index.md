# AWS SigV4 Authentication for Service-to-Service Calls

> Learn how to implement secure AWS SigV4 authentication with KrakenD Enterprise. Step-by-step guide for seamless integration

Source: https://www.krakend.io/docs/enterprise/authentication/aws-sigv4/

Use AWS SigV4 authentication in KrakenD when your backend services or APIs require signed AWS requests to authorize access. This method signs HTTP requests with AWS Signature Version 4, allowing KrakenD to securely authenticate to AWS services or custom APIs that understand SigV4 signed requests. You might need this component when:

- When accessing AWS APIs or services that enforce SigV4 signing (e.g., presign an S3 link).
- When your internal services require AWS IAM-based authentication for secure service-to-service communication.
- When you want KrakenD to handle AWS SigV4 signing transparently without external tooling.

This signing works with any Amazon HTTP service requiring SigV4.

## Configuration of AWS SigV4

Configuring AWS SigV4 authentication involves specifying the service and region details in KrakenD’s backend `extra_config` while the authentication is external (see below). KrakenD will automatically sign requests using configured credentials and SigV4 protocol before forwarding to the backend.

```json
{
  "url_pattern": "/",
  "extra_config": {
    "auth/aws-sigv4": {
        "service": "execute-api",
        "region": "us-east-1",
        "assume_role_arn": "arn:aws:sts::{account ID}:assumed-role/{resource}",
        "sts_region": "us-west-1"
    }
  }
}
```

The available properties are:

##### Fields of aws-sigv4 Authentication

\* required fields

##### [`assume_role_arn`](https://www.krakend.io/docs/enterprise/authentication/aws-sigv4/#assume_role_arn "Click to copy link to assume_role_arn") string

The Amazon Resource Name (ARN) of the role to assume.

Example: `"arn:aws:sts::{account ID}:assumed-role/{resource}"`

##### [`debug`](https://www.krakend.io/docs/enterprise/authentication/aws-sigv4/#debug "Click to copy link to debug") boolean

Enables debug logging for AWS Sigv4 signing process.

Defaults to `false`

##### [`region`](https://www.krakend.io/docs/enterprise/authentication/aws-sigv4/#region "Click to copy link to region") * string

The AWS region where the service is deployed.

Example: `"us-east-1"`

##### [`service`](https://www.krakend.io/docs/enterprise/authentication/aws-sigv4/#service "Click to copy link to service") * string

The name of the service in AWS you’d like to sign the request.

Example: `"dynamodb"`

##### [`sts_region`](https://www.krakend.io/docs/enterprise/authentication/aws-sigv4/#sts_region "Click to copy link to sts_region") string

The AWS region where the STS service is deployed.

Example: `"us-west-1"`

Schema: [https://www.krakend.io/schema/v3.0/auth/aws-sigv4.json](https://www.krakend.io/schema/v3.0/auth/aws-sigv4.json "JSON schema definition")

### Authentication and connectivity

The KrakenD machine needs connectivity with your AWS account and the credentials to do so. There are several ways you can achieve this:

- Copying your AWS credentials in the default file, `~/.aws/credentials` (and maybe an additional `~/.aws/config` and the env var `AWS_PROFILE` if you have several profiles)
- Passing the environment variables with at least `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (and maybe `AWS_REGION`) when starting KrakenD.
- Having an IAM user with a policy and execution role that lets you invoke the function from the machine

#### Authentication examples

Mounting an existing `.aws` directory with the credentials in it (notice that the home of the Docker user is `krakend`):

Mounting the AWS profile 

```
$docker run --rm -it -p "8080:8080" \
    -e "AWS_PROFILE=default" \
    -v "/home/user/.aws:/home/krakend/.aws:ro" \
    -v "$PWD:/etc/krakend" krakend/krakend-ee:3.0.2
```

Passing the credentials directly:

Passing credentials as env vars 

```
$docker run --rm -it -p "8080:8080" \
    -e "AWS_ACCESS_KEY_ID=XXX" \
    -e "AWS_SECRET_ACCESS_KEY=XXX" \
    -e "AWS_REGION=eu-west-1" \
    -v "$PWD:/etc/krakend" krakend/krakend-ee:3.0.2
```
