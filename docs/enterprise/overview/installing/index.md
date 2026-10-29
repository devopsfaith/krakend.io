# Installing KrakenD Enterprise

> Get step-by-step instructions for installing the Enterprise Edition of KrakenD API Gateway to unlock advanced features and scalability

Source: https://www.krakend.io/docs/enterprise/overview/installing/

KrakenD Enterprise is delivered in several formats, including Docker, Linux packages (deb, rpm) and generic installation options.

Find your KrakenD License email

To use any Enterprise binaries, **check your inbox** and find our license activation email with the license details to activate the Enterprise content. Don’t have one? Ask for a trial version.

[Managing the License](https://www.krakend.io/docs/enterprise/overview/license-file/ "Managing the License") [Ask for a trial](https://www.krakend.io/contact-sales/ "Ask for a trial")

## Docker

If you are already familiar with Docker, the easiest way to get started is by pulling our KrakenD image

Pull KrakenD Enterprise 

```
$docker pull krakend/krakend-ee:3.0.2
```

After this command you will have in your local computer the krakend enterprise container.

Windows and Mac

**Windows and Mac** users have support through Docker containers.

## Linux

Copy the license certificate to the server(s). Replace `user@yourserver` with your actual username and IP address:

```bash
ssh user@yourserver mkdir -p /etc/krakend/
scp LICENSE user@yourserver:/etc/krakend/LICENSE
```

### CentOS/RockyLinux, Oracle Linux, and Redhat (yum)

The installation process requires following these steps:

1. Install the repo package
2. Install the KrakenD package
3. Start the KrakenD service

Paste this in the terminal:

Yum based 

```
$rpm -Uvh https://download.krakend.io/rpm/krakend-ee-repo-2.1-0.x86_64.rpm
yum install -y krakend-ee
systemctl start krakend-ee
```

### Fedora

Paste this in the terminal:

DNF based 

```
$rpm -Uvh https://download.krakend.io/rpm/krakend-ee-repo-2.1-0.x86_64.rpm
dnf install -y krakend-ee
systemctl start krakend-ee
```

The current KrakenD version will run at least in Centos 7 and Fedora 24

### Debian and Ubuntu

The installation process requires following these steps:

1. Add the key
2. Add the repo to the sources.list
3. Update your package list
4. Install the KrakenD service

Bottom line:

DEB based 

```
$apt install -y ca-certificates gnupg
apt-key adv --keyserver keyserver.ubuntu.com --recv 5DE6FD698AD6FDD2
echo "deb https://download.krakend.io/apt stable main" | tee /etc/apt/sources.list.d/krakend.list
apt-get update
apt-get install -y krakend-ee
```

Minimum supported versions are Debian 8, and Ubuntu 16.x.

### Generic Linux (`tar.gz`)

You can also download the `tar.gz` and decompress it anywhere. Instructions to check the SHA and PGP signature [here](https://www.krakend.io/docs/overview/verifying-packages/).

[Download latest `tar.gz` (AMD64)](https://download.krakend.io/bin/krakend-ee_3.0.2_amd64_generic-linux.tar.gz)

[Download latest `tar.gz` (ARM64)](https://download.krakend.io/bin/krakend-ee_3.0.2_arm64_generic-linux.tar.gz)

Once you have downloaded and uncompressed the binary, you should move the contents to each folder. You will need root permissions or add `sudo` to some of these commands:

```bash
mv usr/bin/krakend /usr/local/bin/krakend
mkdir -p /opt/krakend/
mv plugins /opt/krakend
chmod +x /usr/local/bin/krakend
```

Now you can type `krakend`.

To stop KrakenD graceful use any of these two commands:

```bash
killall -s SIGTERM krakend
killall -s SIGINT krakend
```
