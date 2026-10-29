# Verifying packages (PGP and SHA256)

Source: https://www.krakend.io/docs/overview/verifying-packages/

How to make sure what you are downloading is legit.

## PGP

We will check the detached signature [PGP](https://repo.krakend.io/bin/krakend_3.0.2_amd64_generic-linux.tar.gz.asc) against our package [KrakenD](https://repo.krakend.io/bin/krakend_3.0.2_amd64_generic-linux.tar.gz).

Term 

```
$gpg --verify krakend_3.0.2_amd64_generic-linux.tar.gz.asc krakend_3.0.2_amd64_generic-linux.tar.gz
gpg: Signature made Sun Mar 10 18:17:18 2019 UTC using RSA key ID 5DE6FD698AD6FDD2
gpg: Can't check signature: public key not found
```

We don’t have the packager public key (AB39BEA1) in our system. You need to retrieve the public key from a key server.

Term 

```
$gpg --keyserver keyserver.ubuntu.com --recv-key 5DE6FD698AD6FDD2
gpg: requesting key 5DE6FD698AD6FDD2 from hkp server keyserver.ubuntu.com
gpg: trustdb created
gpg: key 5DE6FD698AD6FDD2: public key "Devops Faith Package Manager <packages@devops.faith>" imported
gpg: Total number processed: 1
gpg: imported: 1	(RSA: 1)
```

Now you can verify the signature of the package:

Term 

```
$gpg --verify krakend_3.0.2_amd64_generic-linux.tar.gz.asc krakend_3.0.2_amd64_generic-linux.tar.gz
gpg: Signature made Sun Mar 10 18:17:18 2019 UTC using RSA key ID 5DE6FD698AD6FDD2
gpg: Good signature from "Devops Faith Package Manager <packages@devops.faith>"
gpg: WARNING: This key is not certified with a trusted signature!
gpg: There is no indication that the signature belongs to the owner.
Primary key fingerprint: 5B27 0F2E 01E3 75FD 9D56  35E2 5DE6 FD69 8AD6 FDD2
```

## SHA256

To make sure the binary downloaded matches our SHA256 ensure the next 2 commands produce the same [SHA](https://repo.krakend.io/bin/krakend_3.0.2_amd64_generic-linux.tar.gz.sha256) output.

Term 

```
$shasum -a 256 -b krakend_3.0.2_amd64_generic-linux.tar.gz
```

Compare it to:

Term 

```
$curl https://repo.krakend.io/bin/krakend_3.0.2_amd64_generic-linux.tar.gz.sha256
```
