# Managing the LICENSE file

> Activate your KrakenD Enterprise with the provided license file and learn how to automate its validity and expiration times.

Source: https://www.krakend.io/docs/enterprise/overview/license-file/

To run the Enterprise software, whether it is API Gateway or AI Gateway functionality, **you must provide a valid license**.

Single license for all products

KrakenD distributes the **API Gateway** and the **AI Gateway** under the same binary, and the `LICENSE` file you load during startup entitles you to use one product or both.

If you see an error in the logs for unlicensed content, reach out to [sales](https://www.krakend.io/contact-sales/).

## Where is the license?

The sales team sends the license file via email, containing a download link. Be sure to save the file(s) in a secure location. The file is named `LICENSE` (no extension) for the **production license**, and `LICENSE_DEV` for **non-production** environments (trials receive a single file).

## What happens if my LICENSE is wrong?

When the license file is expired, incorrect, or missing, KrakenD **won’t start**. If KrakenD is running and the license expires, the service **shuts down**. It is important to have your license up to date and take the necessary measures to ensure its successful rotation.

You can run `krakend license` to see if the installed `LICENSE` file is valid.

## License requirements

As long as you **don’t change the license content** (e.g., copy/paste partially), everything will be fine. Avoid copying and pasting the content, as you might leave a single character out, and nothing will work.

The `LICENSE` file:

- Uses the default path `/etc/krakend/LICENSE` and must be readable by the KrakenD process.
- It is a plain text file containing the certificate we gave you (it looks like a PEM file)
- Includes the necessary surrounding `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` literals.
- Accepts loading from a different path, filename (e.g., the development license LICENSE\_DEV), or environment variable **when specified**. See below.

## Checking the license validity

Automate license validation

To avoid problems, ensure that you automate periodic license validation so its expiration does not go unnoticed. Our sales team reaches out before that happens, but it’s better to be safe than sorry!

The command `krakend license` and several of its subcommands help you validate the installed `LICENSE` file. Use `krakend license --help` for the complete list of available subcommands and help. **Add this command to your automated development workflow** to be warned when the license is about to expire.

The `krakend license` command exits either with a:

- **non-zero status code** and a `KO:` message string when the license is not valid or
- **zero status code** and an `OK:` string when the file is valid in the requested time.

All license files start and end on the agreed dates at `00:00 UTC`.

For example, to check the expiration date of your license, you can do the following:

License is valid until... 

```
$krakend license valid-until
OK: License is valid until 2024-02-01 00:00:00 +0000 UTC
```

Or to find out the relative time:

License is valid for... 

```
$krakend license valid-for
OK: License is valid for the next 71 days, 6 hours, and 1 minutes
```

The following additional commands will help you check the license.

#### Is the LICENSE valid right now?

Execute the following command to know if your license is valid right now (although it could be invalid in the next second):

Is the license valid? 

```
$krakend license
OK: License is still valid
```

You can also check an arbitrary file name by passing the `--license` flag.

Is a custom license valid? 

```
$krakend license --license /path/to/devel_license
OK: License is still valid
```

When the license is invalid, you’ll see the reason:

Example of invalid license 

```
$krakend license
KO: x509: certificate has expired or is not yet valid: current time 2023-11-16T15:24:48+01:00 is after 2023-08-31T00:00:00Z
```

### KrakenD Licensee

For a valid license, you can retrieve who is the **licensee**:

Licensee information 

```
$krakend license licensee
ACME Inc.
```

For an invalid license, you won’t have any information.

### License info

To get a verbose version of the license capabilities, environment, and entitlements, you can spawn an **info** command:

License information 

```
$krakend license info
Production license for Foo Inc. [AI Gateway + Agent Gateway + API Gateway], valid until 2026-04-02
```

### Days left

Similarly, you can get the **remaining days** of a license as follows:

License days left 

```
$krakend license days-left
OK: License has 71 days remaining
```

### Automated license expiration checking

Because the command uses exit codes, you can include the `license` command in your automation and **abort a pipeline when the license is expired or about to expire**.

The command can check a license now or at a time in the future. Use the subcommand `valid-for` to determine if the license will remain valid after many hours or days. Use a numeric followed by `h` or `d` and no spaces. For instance:

License invalid in 3 months 

```
$krakend license valid-for 90d
KO: License will be invalid in 71 days, 5 hours, and 49 minutes
```

Checking a relative date is probably the most convenient way to set this up quickly in a pipeline, but you can also check an absolute date using `valid-until`. For instance:

Will the license be valid on a specific date? 

```
$krakend license valid-until 2024-11-10
KO: License will be invalid before 2024-11-10
```

Notice that the date format is `yyyy-mm-dd`.

### The LICENSE file is a certificate

Because our `LICENSE` file is a regular certificate, you can also use `openssl` to play with it.

For instance, you can execute `openssl x509 -in LICENSE -text -noout` to get all the information.

## Change the location of the LICENSE or use a non-production LICENSE\_DEV

The production `LICENSE` file is automatically loaded from `/etc/krakend/LICENSE`, although you can use a different type of license, rename it, or change its location using three different methods:

1. Set an environment variable `KRAKEND_LICENSE_PATH` pointing to the desired file. For instance, `KRAKEND_LICENSE_PATH=/path/to/prod_license.crt`. As long as the content inside is valid, the path or the extension you set (if any) does not matter.
2. Taking the content of the license from the `KRAKEND_LICENSE_BASE64` environment var (see below)
3. Passing the `--license` or `-l` flags when running the application. For instance:

Start with a development license 

```
$krakend run -c krakend.json --license ./LICENSE_DEV
```

The flag `--license` takes precedence if you also set the environment variable `KRAKEND_LICENSE_PATH`.

## Saving the license in the KRAKEND\_LICENSE\_BASE64 environment variable

Another possibility to pass the license to KrakenD is to save its contents in the `KRAKEND_LICENSE_BASE64` environment variable, encoded in base64. For instance:

Passing the LICENSE content in an env var 

```
$KRAKEND_LICENSE_BASE64="$(base64 LICENSE)" krakend run -c krakend.json
```

When you use this method, you must ensure that the content of the license is encoded correctly. **When decoded** in base64, it must contain byte-for-byte the same content of the LICENSE file.

If you declare both the `KRAKEND_LICENSE_BASE64` and the `--license` flag, the **environment variable always takes precedence**.

## How the license path is resolved

If you don’t change the license location using the environment variable or flag, KrakenD internally searches for `./LICENSE`. Because KrakenD’s [working directory](https://www.krakend.io/docs/enterprise/configuration/working-directory/) is `/etc/krakend`, the file is resolved to `/etc/krakend/LICENSE`. If, for any reason, you change the container’s working directory, you must update the `LICENSE` file to reflect the exact new location.

For instance, if you have a custom `Dockerfile` like this one:

```Dockerfile
FROM krakend/krakend-ee:3.0

WORKDIR /vault
COPY LICENSE .
```

In this example, when you change the working directory, all relative paths move to the new base directory. When KrakenD starts, it loads the license from `/vault/LICENSE` (as well as any other external file referenced in the configuration relatively).

## Storing the LICENSE in the Docker image

See [Generating a Docker artifact](https://www.krakend.io/docs/enterprise/deploying/docker/)

## Storing the LICENSE in Secret managers

You can store your LICENSE in any secret manager of your choice if you want to. However, ensure the line breaks are respected when retrieving them again. You must dump the contents of the secret in a `LICENSE` file somewhere in the container.

### AWS Secrets Manager

One of the particularities of AWS Secrets Manager is that it may encounter issues when storing **multiline content**. Therefore, we recommend keeping the `LICENSE` content in `base64` format when working with AWS in plain text.

You can create an AWS secret with your license with this command:

Term 

```
$aws secretsmanager create-secret --name krakend-valid_trough-2023_05_22 --secret-string "$(base64 LICENSE)"
{
 "Name": "krakend-valid_trough-2026_05_22",
 "ARN": "arn:aws:secretsmanager:eu-west-1:052351007912:secret:krakend-valid_trough-2026_05_22-OISgD6",
 "VersionId": "59f7c317-989a-4219-bdd2-b79bead69dd4"
}
```

Notice that we have added the license’s expiration date to the secret name. A practice like this will help you quickly realize the expiration date of any license without testing.

You can later retrieve the license file in your pipeline file with:

Decoding the base64 license 

```
$aws secretsmanager get-secret-value --secret-id krakend-valid_trough-2026_05_22 --query 'SecretString' --output text | base64 -d > LICENSE
```

*Note*: Depending on your computer’s operating system, the decoding of base64 might be `base64 -D` instead of `base64 -d`

## What happens when the license expires?

**Any running processes will shut down** when the KrakenD Enterprise license expires.

The KrakenD sales team is always in touch before this happens to work on the next renewal.

Suppose you no longer want to be an Enterprise customer. In that case, you can [downgrade to KrakenD Community](https://www.krakend.io/docs/enterprise/faq/switch-versions/#downgrade-to-community) very quickly and run in the open-source mode without the Enterprise functionalities.

## Updating your license

Replacing the file is not enough

To update the license, **restart or redeploy** the service to ensure it uses the new content.

When your license renewal comes, you must replace the file in the place and format you have decided, such as the `/etc/krakend/LICENSE`, another filename you decided, or the content of the `KRAKEND_LICENSE_BASE64`variable.

Whichever is the case, you **must restart or redeploy** KrakenD for the changes to take effect. That’s all!

## Development licenses

A developer license lets you test functionality during development, but it is limited in terms of throughput, as its performance degrades exponentially as you demand more throughput. This type of instance is not suitable for load testing or production workloads. In that case, you must use the production license. The limitations are:

- The logger level is forced to `DEBUG`, regardless of the `telemetry/logging` configuration.
- A `WARNING` log line is triggered at startup and each minute after that.

The Developer license gives you full access to all Enterprise features—including API and AI Gateway capabilities—so you can build, integrate, and validate your implementation without any functional restrictions. This license is designed for development and proof-of-concept work that does not justify a full license yet. Need to stress-test before going live? Just reach out, we’ll provide a temporary performance-testing license at no extra cost.
