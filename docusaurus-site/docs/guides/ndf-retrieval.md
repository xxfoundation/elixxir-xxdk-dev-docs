---
sidebar_position: 6
---

# NDF Retrieval

This guide will instruct how one can fetch the NDF either through the command line or using the xxDK.

The team maintains an encoded [NDF online](https://elixxir-bins.s3.us-west-1.amazonaws.com/ndf/mainnet.json) which has comprehensive list of publicly available gateway addresses and their certificates. The data is base64 encoded (use `base64 -D` on the file to read). The reader may take this list or use their own methods to find gateway information depending on their trust model (see [Vetting Gateways section](https://www.notion.so/NDF-Retrieval-3899220500444ec4a71b05f954672728) below). 

From this list, a [trustworthy gateway](https://www.notion.so/NDF-Retrieval-3899220500444ec4a71b05f954672728) should be determined by the reader. To avoid influencing or suggesting which gateways should be trusted, all examples in this guide use a local network. `localhost:8440` should be replaced with a trusted gateway address when fetching an NDF off of a live network.

## **CLI Steps**

---

The getndf CLI command enables you to download the NDF from a [network gateway](https://xxdk-dev.xx.network/technical-glossary/#gateway-also-network-gateway). This does not require a pre-established client connection, but you will need the IP address, port, and an SSL certificate for the gateway:

```bash
// Download an SSL certificate using OpenSSL 1.0.1 or newer (check your version if you get an error)  
openssl s_client -showcerts -connect localhost:8440 < /dev/null 2>&1 | openssl x509 -outform PEM > certfile.pem
// Fetch NDF from a gateway
go run main.go getndf --gwhost localhost:8440 --cert certfile.pem | jq . >ndf.json
```

If you are trying to connect to one of the public networks, we recommend you download an NDF directly for different environments by using the `--env` flag. This will download the NDF directly from a URL hosted by the xx network team:

```bash
// Download an NDF using the team environment URL
go run main.go getndf --env mainnet | jq . >ndf.json
```

## xxDK **Steps**

---

There are two (2) methods via the xxDK to retrieve an NDF. This does not require a pre-established client connection.

### Downloading from Gateway

---

You may download an NDF from a selected gateway using the xxdk using the call `DownloadNdfFromGateway`. Below is an example code snippet using that xxDK call:

```bash
// Gateway contact information
certPath := "gateway.crt"
address := "localhost:8440"

// Read certificate from file
cert, err := utils.ReadFile(certPath)
if err != nil {
	jww.FATAL.Panicf("Failed to read file: %+v", err)
}
    
// Download NDF from targeted gateway
resp, err := xxdk.DownloadNdfFromGateway(address, cert)
if err != nil {
	jww.FATAL.Panicf("%v", err)
}
```

### Downloading from URL

---

You may download an NDF using the xxDK from the URL provided by the xx network team using the call `DownloadAndVerifySignedNdfWithUrl`. The URL contains a signed version of the NDF which requires a certificate to verify that signature. There are several running environments each with [their own URL and certificate](https://git.xx.network/elixxir/client/-/blob/release/cmd/deployment.go). Below is an example code snippet using that xxDK call:

```bash
// Network environment parameters.
certificatePath := “path/to/certificate.crt
ndfUrl := “<insertURL>”
     
// Read certificate
cert, err := ioutil.ReadFile(certificatePath)
if err != nil {
	jww.FATAL.Panicf("Failed to read certificate: %v", err)
}

// Download NDF from URL
ndfJSON, err = xxdk.DownloadAndVerifySignedNdfWithUrl(ndfURL, string(cert))
if err != nil {
	jww.FATAL.Panicf("Failed to download NDF: %+v", err)
}
```

## Vetting Gateways

---

When downloading an NDF from a gateway, it’s important to ensure that the targeted gateway can be trusted. There are many ways to do this; the team provides a few possible strategies for the reader to develop trust with a gateway. This is not intended to be a comprehensive guide for establishing trust with gateways, but instead a way to suggest possible avenues.

As an entry point, the team publishes a publicly available list of gateways in the published encoding of the NDF. You can download that, decode it, and select a gateway from there. It is better, however, to have some trust in the gateway as the wrong NDF can be provided by the gateway that would connect you to the wrong network. There are 3 general methods you can use: 

- **Gateway run by you or an acquaintance.** If you know someone who runs a gateway, or you are running a gateway, you can use that information to connect to your gateway to get an NDF
- **Longest running gateways.** The longest running gateways can be found by browsing the [dashboard](https://dashboard.xx.network/) by clicking on the node information or via the [wallet](https://wallet.xx.network/#/staking) by browsing the staked validators.
- **Team run gateways.** If you trust the team, you can select the team gateway. The details of the team gateway are:
    
    > Name: xx west
    > 
    > 
    > Node ID: `c6wptSinakErZHrk0SlgGQXExETPYYLB2CwpLNze6FMC`
    > 
    > Validator wallet: `6Wb9wqBLi8iBhpnNqqWDVPcqfRQMkqTZWq9cAsALwC7W68h4`
    > 
    > Gateway ID: `c6wptSinakErZHrk0SlgGQXExETPYYLB2CwpLNze6FMB`
    > 
    > Address: `161.35.228.41:22840`
    > 
    > Tls_certificate: 
    > 
    > ```bash
    > -----BEGIN CERTIFICATE-----
    > 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
    > -----END CERTIFICATE-----
    > ```
    >