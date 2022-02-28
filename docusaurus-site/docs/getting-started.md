---
sidebar_position: 2
---

# Getting Started

To integrate cMix with your application logic, each instance needs to be connected to the cMix network. This begins with creating a new client, then registering the client identity with the xx cMix network. The client session data is stored in an encrypted key-value (EKV) store containing client state and keys.

The rest of this document outlines the steps for building a simple messaging app. It covers the entire process of integrating the cMix Client API (xxDK) in your application, registering within the xxDK and setting up a connection with the cMix network, setting up listeners, as well as sending and receiving messages.

## Set Up the Client Locally

<!-- The following sections show how to connect to the public xx cMix network. When building your application, it is recommended to test with a [local instance of the cMix network](https://git.xx.network/elixxir/integration). -->

[Skip CLI setup](#import-the-api)

The command-line tool that comes with the client is useful for testing network functionality. It also comes in handy for acquiring an [NDF](https://xxnetwork.wiki/index.php/Network_Definition_File_(NDF)), a JSON file that describes the Nodes, Gateways, and other servers on the network and how to communicate with them.

:::note
The NDF is required for registering within the xxDK. It can be acquired via the command line or with the `DownloadAndVerifySignedNdfWithUrl()` function from the client API.
:::

Here are the commands for cloning and compiling the client (assuming [golang 1.17 or newer](https://go.dev/doc/install)). You’ll want to make sure to compile the right binary for your specific OS architecture:

```bash
git clone https://gitlab.com/elixxir/client.git client
cd client
go mod vendor -v
go mod tidy
go test ./...

# Compile a binary for your specific OS architecture using one of the following commands 

# Linux 64 bit binary
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags '-w -s' -o client.linux64 main.go
# Windows 64 bit binary
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags '-w -s' -o client.win64 main.go
# Windows 32 bit binary
GOOS=windows GOARCH=386 CGO_ENABLED=0 go build -ldflags '-w -s' -o client.win32 main.go
# Mac OSX 64 bit binary (intel)
GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -ldflags '-w -s' -o client.darwin64 main.go
```

You can pull up the complete usage guide for using the client CLI via the `--help` flag:

```bash
go run main.go --help
```

<!-- For more information on using the client CLI, see *Testing Network Functionality Locally With the Client CLI*. -->

## Download an NDF

As noted earlier, you can fetch the NDF either through the command line or using the `DownloadAndVerifySignedNdfWithUrl()` API access point. This section describes the steps involved when using the CLI.

[Skip this step](#import-the-api)

The `getndf` CLI command enables you to download the NDF from a [network gateway](./technical-glossary.md/#gateway-also-network-gateway). This does not require a pre-established client connection, but you will need the IP address for the gateway, a port, and an SSL certificate.

First, download an SSL certificate from the gateway:

```go
// Download an SSL certificate (assumes you are running a gateway locally)
openssl s_client -showcerts -connect localhost:8440 < /dev/null 2>&1 | openssl x509 -outform PEM > certfile.pem
```

Next, download the NDF from the gateway:

```go
// Fetch NDF (example usage for Gateways, assumes you are running a gateway locally)
go run main.go getndf --gwhost localhost:8440 --cert certfile.pem | jq . >ndf.json
```

You can also download an NDF directly for different environments by using the `--env` flag

```go
go run main.go getndf --env mainnet | jq . >ndf.json
// Or, run via the binary on 64 bit windows: 
./client.win64 getndf --env mainnet | jq . >ndf.json
```

For more information on the NDF and its structure, see [*Network Definition File (NDF)*](https://xxnetwork.wiki/index.php/Network_Definition_File_(NDF)).

## Import the API

The cMix client is designed to be used as a Go library, so you can import it the same as any other Go package:

```go
"gitlab.com/elixxir/client/api"
```

Note that the code listings below for our sample app assume you have also imported these libraries:

```go
import (
  "io/ioutil"
	"fmt"
	"os"

  // external
  jww "github.com/spf13/jwalterweatherman" // logging
)
```

You will need to import a few more packages along the way. However, we want to avoid unused import warnings from the compiler, so we will include them as needed. It is straightforward to switch the external libraries out for any alternatives you prefer.

:::tip
1. To ensure you are using the latest release version of the client, you can run `go get gitlab.com/elixxir/client@release`. This will update your `go.mod` file automatically.

2. It is also important to note, before continuing, that clients need to perform certain actions in a specified order, such as registering specific handlers before starting network threads. Additionally, some actions cannot be performed until connected to the network. The API will return errors saying that the network is not in a healthy state when it is having trouble connecting.
:::

## Create a Client Object

Creating a new client object will initialize a session directory containing the EKV store that will hold client state. This is done by calling the `NewClient()` function:

```go
func NewClient(ndfJSON string, storageDir string, password []byte,
 registrationCode string) error
```

`NewClient()` expects multiple arguments:

- `ndfJSON`: The first argument, `ndfJSON`, is string-formatted NDF data.
- `storageDir`: `storageDir` is the path to the directory that will store client state. It is a `string` type.
- `password`: The third argument, `password`, is used to create a user-specified password for accessing their sessions. It is expected to be a byte slice (`[]byte`).
- `registrationCode`: The final argument, `registrationCode`, is optional. It lets pre-selected users register a code with the registration server. Use an empty string to register without a code.

Here is how we have set up `NewClient()` in our messaging app:

```go
// You would ideally use a configuration tool to acquire these parameters
statePath := "statePath"
statePass := "password"
// The following connects to mainnet. For historical reasons, it is called a json file
// but it is actually a marshalled file with a cryptographic signature attached.
// This may change in the future. 
ndfURL := "https://elixxir-bins.s3.us-west-1.amazonaws.com/ndf/release.json"
certificatePath := "release.crt"
ndfPath := "ndf.json"

// Create the client if there is no session
if _, err := os.Stat(sessionPath); os.IsNotExist(err) {
	ndfJSON := ""
	if ndfPath != "" {
		ndfJSON, err = ioutil.ReadFile(ndfPath)
    if err != nil {
        jww.WARN.Printf("Could not read NDF: %+v")
    }
	} 
  if ndfJSON == "" {
		ndfJSON, err := api.DownloadAndVerifySignedNdfWithUrl(ndfURL, certificatePath)
		if err != nil {
			jww.FATAL.Panicf("Failed to download NDF: %+v", err)
		}
	}
	err = api.NewClient(string(ndfJSON), statePath, []byte(statePass), "")
	if err != nil {
		jww.FATAL.Panicf("Failed to create new client: %+v", err)
	}
}
```

There are two crucial steps here. 

1. You need to get an NDF, which you may already have from the [*Download an NDF*](#download-an-ndf) step. In the code above, we attempt to read from a file first, then try to download the release NDF with`DownloadAndVerifySignedNdfWithUrl()`, which dynamically downloads the NDF data a client needs from a specified URL. It takes two arguments:
    - `url`:  A publicly accessible URL pointing to the NDF data.
    - `cert`: The certificate for the scheduling/registration server.

:::note
There are multiple URL/certificate pairs associated with different environments. It is extremely important to use the correct pair for your specific environment. These include:

1. MainNet: [NDF URL](https://elixxir-bins.s3.us-west-1.amazonaws.com/ndf/mainnet.json) 
2. Release: [NDF URL](https://elixxir-bins.s3.us-west-1.amazonaws.com/ndf/release.json)  

For each environment (for example, mainnet), you can download the NDF and extract the signing certificate from the NDF with:
`echo -e $(base64 -d mainnet.json | head -2 | tail -1 | tr -dc '[[:print:]]' | jq .Registration.Tls_certificate) | sed 's/\"//g' > ndf.crt` 

You can also copy and paste the certificates directly from the [command line source code](https://git.xx.network/elixxir/client/-/blob/d8832766fe26b02ef90b7998b2f0083be77b7b0f/cmd/root.go#L56).
:::

2. Once you have an NDF, you can then call the `NewClient()` function. This will create a storage object for user data and generate cryptographic keys. It will also connect and register the client with the cMix network. Although `NewClient()` does not register a username, it creates a new user based on a cryptographic identity. That makes it possible to add a username later.

:::note
Aside from the normal client created by `NewClient()`, there are other types of clients you can create, such as a precanned client or a vanity client. For instance, a vanity client (`NewVanityClient()`) will create a user with a `receptionID` that starts with a supplied prefix. This is similar to Bitcoin's vanity addresses. <!-- See the [API reference](./quick-reference.md) for more detail. -->
:::

## Log In to Your Client Session

Once you have created a client object, the next step is to load and log in to the session you just initialized. To log in to your client session, you will need to call the `Login()` function:

```go
func Login(storageDir string, password []byte, parameters params.Network)
  (*Client, error)
```

The `Login()` function expects the same session directory and password used to create the client object. It also expects some network parameters, which you can fetch using the `params` interface via `params.GetDefaultNetwork()`. To use it, import `gitlab.com/elixxir/client/interfaces/params`: 

```go
// Login with the same sessionPath and sessionPass used to call NewClient()
// Assumes you have imported "gitlab.com/elixxir/client/interfaces/params"
client, err := api.Login(statePath, []byte(statePass), params.GetDefaultNetwork())
if err != nil {
	jww.FATAL.Panicf("Failed to initialize client: %+v", err)
}
```

Aside from logging you into your existing client session, the `Login()` function also initializes communication with the network and registers your client with the permissioning server. This enables you to keep track of network rounds.

To view the current user identity for a client, call the `GetUser()` method:

```go
user := client.GetUser()
```

<!-- For more information on default network parameters and how to override them, see *Fetching Network Parameters*. -->

## Register a Message Listener

To acknowledge and reply to received messages, you will need to register a listener. First, import the switchboard package and the message interface:

```go
"gitlab.com/elixxir/client/switchboard"
"gitlab.com/elixxir/client/interfaces/message"
```

Next, set up the listener. You will also need to create a receiver channel with a suitably large capacity and a type of `Message.Receive` :

```go
// Set up a reception handler
swboard := client.GetSwitchboard()
// Note: the receiverChannel needs to be large enough that your reception thread will
// process the messages. If it is too small, messages can be dropped or important xxDK
// threads could be blocked.
receiverChannel := make(chan message.Receive, 10000)
// Note that the name `listenerID` is arbitrary
listenerID := swboard.RegisterChannel("DefaultCLIReceiver",
	switchboard.AnyUser(), message.XxMessage, receiverChannel)
jww.INFO.Printf("Message ListenerID: %v", listenerID)
```

The switchboard from `GetSwitchboard()` is used for interprocess signaling about received messages. On the other hand, `RegisterChannel()` registers a new listener built around the passed channel (in this case, `receiverChannel`). Here is the function signature for `RegisterChannel()`:

```go
func (sw *Switchboard) RegisterChannel(name string, user *id.ID,
  messageType message.Type, newListener chan message.Receive) ListenerID
```

`RegisterChannel()` expects a name for the listener, a user ID (which you want to set to `switchboard.AnyUser()` to listen for messages from any user), a message type, and a channel. 

`RegisterChannel()` returns a listener ID that you want to keep handy if you need to delete the listener later.

:::caution
Note that we have used `swboard` for the variable holding the result of calling `client.GetSwitchboard()`, rather than `switchboard`. This avoids a clash with the imported `switchboard` package, which is used to access the `AnyUser()` type. 
:::

<!-- For more detail on registering message listeners, see *Registering Message Listeners*. -->

## Start Network Threads

The next step is to start the network follower. A network follower is a thread that keeps track of [rounds](./technical-glossary.md/#round) and network health. As mentioned earlier, the client cannot perform some actions (such as confirming authenticated channels) until the network is in a healthy state.

Generally, the network is in a healthy state when the health tracker sees rounds completed successfully.

To start a network follower, use the `StartNetworkFollower()` method:

```go
func (c *Client) StartNetworkFollower(timeout time.Duration) error
```

`StartNetworkFollower()` takes a single argument, a `Duration` type (from the `time` standard library) which specifies how much time to wait for the function call to succeed before timeout errors are returned. You will want to call `StartNetworkFollower()` when your application returns from sleep and close it when going back to sleep.

For our messaging app, we have also set up a function that waits until the network is healthy. Here is our sample code for starting network threads and waiting until the network is healthy:

```go
// Set networkFollowerTimeout to a value of your choice (type is of `time.Duration`)
err = client.StartNetworkFollower(networkFollowerTimeout)
if err != nil {
	jww.FATAL.Panicf("Failed to start network follower: %+v", err)
}

waitUntilConnected := func(connected chan bool) {
  // Assumes you have imported the `time` package
	waitTimeout := time.Duration(150)
	timeoutTimer := time.NewTimer(waitTimeout * time.Second)
	isConnected := false
	// Wait until we connect or panic if we cannot by a timeout
	for !isConnected {
		select {
		case isConnected = <-connected:
			jww.INFO.Printf("Network Status: %v\n",
				isConnected)
			break
		case <-timeoutTimer.C:
			jww.FATAL.Panic("timeout on connection")
		}
	}
}

// Create a tracker channel to be notified of network changes
connected := make(chan bool, 10)
// AddChannel() adds a channel to the list of Tracker channels that will be
// notified of network changes34e
client.GetHealth().AddChannel(connected)
// Wait until connected or crash on timeout
waitUntilConnected(connected)
```

Note that to use the above code listing from our sample app, you will need to have imported the standard `time` package. By now, your import section should look like this:

```go
import (
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"gitlab.com/elixxir/client/api"
	"gitlab.com/elixxir/client/interfaces/params"
	"gitlab.com/elixxir/client/interfaces/message"
	"gitlab.com/elixxir/client/switchboard"

	jww "github.com/spf13/jwalterweatherman" // logging
)
```

In summary, `StartNetworkFollower()` kicks off tracking of the network. It starts long-running threads and returns an object for checking state and stopping those threads. However, since these threads may become a significant drain on device batteries when offline, you will want to ensure they are stopped if there is no internet access.

## Request Authenticated Channels

There are two ways to send messages across the network: with or without end-to-end (E2E) encryption. Sending messages safely, with E2E encryption, requires an authenticated channel to be established between the communicating parties.

An authenticated channel is a state where both the sender and recipient have each verified their identities. Clients can send and receive authenticated channel requests.

Here is how to request an authenticated channel from another user:

```go
// Get your contact details
me := client.GetUser().GetContact()

roundID, authReqErr := client.RequestAuthenticatedChannel(recipientContact, me, "Hi! Let's connect!")
if authReqErr == nil {
	jww.INFO.Printf("Requested auth channel from: %s in round %d",
		recipientID, roundID)
} else {
	jww.FATAL.Panicf("%+v", err)
}
```

`RequestAuthenticatedChannel()` takes three arguments: the recipient's contact, the sender's contact, and an arbitrary message string:

```go
func (c *Client) RequestAuthenticatedChannel(recipient contact.Contact,
  me contact.Contact, message string) (id.Round, error)
```

Sender and recipient contact details can be acquired for their individual client instances using `client.GetUser().GetContact()`, which can be marshaled and written to/read from disk with the `.Marshal()` and `.Unmarshal(...)` functions.

The `RequestAuthenticatedChannel()` method returns the ID for the network round in which the request was sent, or an error if the request was unsuccessful (such as when a channel already exists or if a request was already received).

:::note
`RequestAuthenticatedChannel()` will not run if the network state is not healthy. However, it can be retried until it is successful.
:::

In our example above, we used the `recipientID`. This can be accessed via `client.GetUser().GetContact().ID`. Here is what the Contact data structure (returned by `GetContact()`) looks like:

```go
type Contact struct {
	ID             *id.ID
	DhPubKey       *cyclic.Int
  // The OwnershipProof field is only included for third-party contact data
  // such as returned by the GetAuthenticatedChannelRequest() method discussed below
	OwnershipProof []byte
	Facts          fact.FactList
}
```

### Testing With CLI-Generated Contact Files

We are running multiple client instances locally to test out authenticated channels for our messaging app. Although not the most ideal way to get it, this means that we can also fetch the recipient's contact details from CLI-generated contact files:

```go
// Sender's contact
me := client.GetUser().GetContact()

// Recipient's contact (read from a Client CLI-generated contact file)
contactData, _ := ioutil.ReadFile("../user2/user-contact.json")
// Assumes you have imported "gitlab.com/elixxir/crypto/contact"
// which provides an `Unmarshal` function to convert the byte slice ([]byte) output
// of `ioutil.ReadFile()` to the `Contact` type expected by `RequestAuthenticatedChannel()`
recipientContact, _ := contact.Unmarshal(contactData)
recipientID := recipientContact.ID

roundID, authReqErr := client.RequestAuthenticatedChannel(recipientContact, me, "Hi! Let's connect!")
if authReqErr == nil {
	jww.INFO.Printf("Requested auth channel from: %s in round %d",
		recipientID, roundID)
} else {
	jww.FATAL.Panicf("%+v", err)
}
```

To generate a contact file (such as `user-contact.json` above) via the CLI, use the `--writeContact` flag. You’ll want to send an unsafe (without E2E encryption) message to yourself using the following command, where `user-password` is your password and  `session-directory`  is the path to the directory that will store your client state:

```bash
# You may need to use the `--waitTimeout` flag to avoid timeout errors
# For example, `--waitTimeout 200` (time in seconds)
./client.win64 --password user-password --ndf ndf.json -l client.log -s session-directory --writeContact user-contact.json --unsafe -m "Hello World, without E2E Encryption" --waitTimeout 200
Sending to yYAztmoCoAH2VIr00zPxnj/ZRvdiDdURjdDWys0KYI4D: Hello World, without E2E Encryption
Message received: Hello World, without E2E Encryption
Received 1  
```

Note that when duplicating folders to create multiple client instances locally, you need to ensure you are not also copying over contact files and session folders. You can comfortably delete session folders since each new `NewClient()` call will generate new cryptographic identities, but only if there isn't an existing session.

<!-- For more detail on requesting authenticated channels, see *Requesting and Accepting Authenticated Channels*. -->

## Accept Authenticated Channels

Although we can now send authenticated channel requests, we have yet to be able to accept them. To give your application the ability to react to requests for authenticated channels, you first need to register a handler:

```go
// Set up auth request handler
authManager := client.GetAuthRegistrar()
authManager.AddGeneralRequestCallback(authChannnelCallbackFunction)
```

Calling the `GetAuthRegistrar()` method on the client returns a manager object which allows registration of authentication callbacks. Then you can use the `AddGeneralRequestCallback()` method on this object to register your handler.

Here is an example showing how to register a handler that simply prints the user ID of the requestor:

```go
// Simply prints the user id of the requestor.
func printChanRequest(requestor contact.Contact) {
	msg := fmt.Sprintf("Authentication channel request from: %s\n",
		requestor.ID)
	jww.INFO.Printf(msg)
	fmt.Printf(msg)
	msg = fmt.Sprintf("Authentication channel request message: %s\n", message)
	jww.INFO.Printf(msg)
	fmt.Printf(msg)
}

// Set up auth request handler.
authManager := client.GetAuthRegistrar()
authManager.AddGeneralRequestCallback(printChanRequest)
```

Let's see another example with a callback that first checks if a channel already exists for a recipient before confirming it automatically:

```go
confirmChanRequest := func(requestor contact.Contact, message string) {
	// Check if a channel exists for this recipientID
	recipientID := requestor.ID
	if client.HasAuthenticatedChannel(recipientID) {
		jww.INFO.Printf("Authenticated channel already in place for %s",
			recipientID)
		return
	}
	// GetAuthenticatedChannelRequest returns the contact received in a request if
	// one exists for the given userID.  Returns an error if no contact is found.
	recipientContact, err := client.GetAuthenticatedChannelRequest(recipientID)
	if err == nil {
		jww.INFO.Printf("Accepting existing channel request for %s",
			recipientID)
		// ConfirmAuthenticatedChannel() creates an authenticated channel out of a valid
		// received request and informs the requestor that their request has
		// been confirmed
		roundID, err := client.ConfirmAuthenticatedChannel(recipientContact)
		fmt.Println("Accepted existing channel request in round ", roundID)
		jww.INFO.Printf("Accepted existing channel request in round %v",
			roundID)
		if err != nil {
			jww.FATAL.Panicf("%+v", err)
		}
		return
	}
}

authManager := client.GetAuthRegistrar()
authManager.AddGeneralRequestCallback(confirmChanRequest)
```

Note that just like `RequestAuthenticatedChannel()`, `ConfirmAuthenticatedChannel()` will not run if the network state is not healthy. It also returns an error if a channel already exists, if a request does not exist, or if the contact passed in does not match the contact received in a request.

`ConfirmAuthenticatedChannel()` can also be retried (such as in cases where the network was initially unhealthy).

<!-- For more detail on accepting authenticated channels, see *Requesting and Accepting Authenticated Channels*. -->

## Send E2E Messages

Sending encrypted payloads requires an authenticated channel to be established between sender and recipient. Assuming that is the case, here is how to construct and send an e2e message:

```go
// Send safe message with authenticated channel, requires an authenticated channel

// Test message 
msgBody := "If this message is sent successfully, we'll have established first contact with aliens."

msg := message.Send{
	Recipient:   recipientID,
	Payload:     []byte(msgBody),
	MessageType: message.XxMessage,
}
// Get default network parameters for E2E payloads
paramsE2E := params.GetDefaultE2E()

fmt.Printf("Sending to %s: %s\n", recipientID, msgBody)
roundIDs, _, _, err := client.SendE2E(msg,
		paramsE2E)
if err != nil {
	jww.FATAL.Panicf("%+v", err)
}
jww.INFO.Printf("Message sent in RoundIDs: %+v\n", roundIDs)
```

There are three steps involved when sending messages:

1. **Generate message:** Sent messages have a `message.Send` type. You will need to include a recipient ID, the message payload (which should be a byte slice), and a message type (which should be `message.XxMessage`).
2. **Get default network parameters:** Next, you will need to get the default network parameters using `params.GetDefaultE2E()`. This again assumes you previously imported `gitlab.com/elixxir/client/interfaces/params`.
3. **Send message:** Finally, you can send your message using `client.SendE2E()`. This will return the list of rounds in which parts of your message were sent or an error if the call was unsuccessful.

:::note
In addition to the round IDs and error message, `client.SendE2E()` returns two additional items: the message ID and the timestamp for when the message was sent. <!-- See the API reference for more information. -->
:::

<!-- For more detail on sending messages and the different message types, see *Sending and Receiving Messages*. -->

## Receive Messages

We set up a listener earlier for incoming messages. However, `go run` terminates almost immediately after it is executed. So, we want to make sure to keep our receiving channel open and test that we can actually see received messages: 

```go
// Set `waitTimeout` to a value of your choice
timeoutTimer := time.NewTimer(waitTimeout * time.Second)
	select {
	case <-timeoutTimer.C:
		fmt.Println("Timed out!")
		break
	case msg := <-receiverChannel:
		fmt.Printf("Message received: %s\n", string(
			msg.Payload))
		break
	}
```

This will terminate your app after one message is received. Alternatively, you can use a loop to keep it running:

```go
for {
		msg := <-receiverChannel
		fmt.Println(string(msg.Payload))
	}
```

We have had to format our received messages via `string(msg.Payload)` in both cases. As you might recall from when we sent messages earlier, the payload is a byte slice.

Received messages have a type of `Message.Receive` and are structured this way:

```go
type Receive struct {
	ID             e2e.MessageID
	Payload        []byte
	MessageType    Type
	Sender         *id.ID
	RecipientID    *id.ID
	EphemeralID    ephemeral.Id
	RoundId        id.Round
	RoundTimestamp time.Time
	Timestamp      time.Time
	Encryption     EncryptionType
}
```

In addition to the payload, you can access other details such as the sender's ID, their recipient ID, the round ID in which the message was sent, the timestamp for when the sender sent the message, and more.

:::info
The `EphemeralID` is the time-based identity used to receive the message from the network. The sender generates an `EphemeralID` using the recipient’s `RecipientID`, then encrypts it in the packet that is sent over the network. Finally, the recipient polls the servers with their ephemeral IDs to pick up messages.

Ephemeral IDs, by design, overlap and conflict with other recipients to hide who receives what messages. Because they are temporal, different recipients conflict with each other over time.
:::

<!-- For more detail on receiving messages and the different message types, see *Sending and Receiving Messages*. -->

## Putting It All Together

On a high level, integrating the Client API with your application can be reduced to:

1. Generate an identity for your client and use this to connect to the cMix network.
2. Keep track of the network using network followers.
3. Register listeners for messages and authenticated channel requests.
4. Send and receive messages with or without encryption.

You will want to ensure that you perform these actions in the expected order, such as starting a network follower before registering a handler for authenticated channel requests.

Here is what our Go app (`main.go`) currently looks like, with most of our code samples so far reproduced here:

```go
package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"gitlab.com/elixxir/client/api"
	"gitlab.com/elixxir/client/interfaces/message"
	"gitlab.com/elixxir/client/interfaces/params"
	"gitlab.com/elixxir/client/switchboard"
	"gitlab.com/elixxir/crypto/contact"
	"gitlab.com/xx_network/primitives/id"

	// external
	jww "github.com/spf13/jwalterweatherman" // logging
)

func main() {

	// Create a new client object-------------------------------------------------------

	// You would ideally use a configuration tool to acquire these parameters
statePath := "statePath"
statePass := "password"
// The following connects to mainnet. For historical reasons it is called a json file
// but it is actually a marshalled file with a cryptographic signature attached.
// This may change in the future. 
ndfURL := "https://elixxir-bins.s3.us-west-1.amazonaws.com/ndf/release.json"
certificatePath := "release.crt"
ndfPath := "ndf.json"

// Create the client if there is no session
if _, err := os.Stat(sessionPath); os.IsNotExist(err) {
	ndfJSON := ""
	if ndfPath != "" {
		content, err := ioutil.ReadFile(ndfPath)
    if err != nil {
        jww.WARN.Printf("Could not read NDF: %+v")
    }
	} 
  if ndfJSON == "" {
		ndfJSON, err := api.DownloadAndVerifySignedNdfWithUrl(ndfURL, certificatePath)
		if err != nil {
			jww.FATAL.Panicf("Failed to download NDF: %+v", err)
		}
	}
	err = api.NewClient(string(ndfJSON), statePath, []byte(statePass), "")
	if err != nil {
		jww.FATAL.Panicf("Failed to create new client: %+v", err)
	}
}

	// Login to your client session-----------------------------------------------------

	// Login with the same sessionPath and sessionPass used to call NewClient()
// Assumes you have imported "gitlab.com/elixxir/client/interfaces/params"
client, err := api.Login(statePath, []byte(statePass), params.GetDefaultNetwork())
if err != nil {
	jww.FATAL.Panicf("Failed to initialize client: %+v", err)
}

	// view current user identity--------------------------------------------------------
	user := client.GetUser()
	fmt.Println(user)

	// Register a listener for messages--------------------------------------------------

	// Set up a reception handler
swboard := client.GetSwitchboard()
// Note: the receiverChannel needs to be large enough that your reception thread will
// process the messages. If it is too small, messages can be dropped or important xxDK
// threads could be blocked.
receiverChannel := make(chan message.Receive, 10000)
// Note that the name `listenerID` is arbitrary
listenerID := swboard.RegisterChannel("DefaultCLIReceiver",
	switchboard.AnyUser(), message.XxMessage, receiverChannel)
jww.INFO.Printf("Message ListenerID: %v", listenerID)

	// Start network threads------------------------------------------------------------

  // Set networkFollowerTimeout to an int64 of your choice (seconds)
err = client.StartNetworkFollower(networkFollowerTimeout)
if err != nil {
	jww.FATAL.Panicf("Failed to start network follower: %+v", err)
}

waitUntilConnected := func(connected chan bool) {
  // Assumes you have imported the `time` package
	waitTimeout := time.Duration(150)
	timeoutTimer := time.NewTimer(waitTimeout * time.Second)
	isConnected := false
	// Wait until we connect or panic if we cannot by a timeout
	for !isConnected {
		select {
		case isConnected = <-connected:
			jww.INFO.Printf("Network Status: %v\n",
				isConnected)
			break
		case <-timeoutTimer.C:
			jww.FATAL.Panic("timeout on connection")
		}
	}
}

// Create a tracker channel to be notified of network changes
connected := make(chan bool, 10)
// AddChannel() adds a channel to the list of Tracker channels that will be
// notified of network changes34e
client.GetHealth().AddChannel(connected)
// Wait until connected or crash on timeout
waitUntilConnected(connected)

	// Register a handler for authenticated channel requests-----------------------------

// Handler for authenticated channel requests
confirmChanRequest := func(requestor contact.Contact, message string) {
	// Check if a channel exists for this recipientID
	recipientID := requestor.ID
	if client.HasAuthenticatedChannel(recipientID) {
		jww.INFO.Printf("Authenticated channel already in place for %s",
			recipientID)
		return
	}
	// GetAuthenticatedChannelRequest returns the contact received in a request if
	// one exists for the given userID.  Returns an error if no contact is found.
	recipientContact, err := client.GetAuthenticatedChannelRequest(recipientID)
	if err == nil {
		jww.INFO.Printf("Accepting existing channel request for %s",
			recipientID)
		// ConfirmAuthenticatedChannel() creates an authenticated channel out of a valid
		// received request and informs the requestor that their request has
		// been confirmed
		roundID, err := client.ConfirmAuthenticatedChannel(recipientContact)
		fmt.Println("Accepted existing channel request in round ", roundID)
		jww.INFO.Printf("Accepted existing channel request in round %v",
			roundID)
		if err != nil {
			jww.FATAL.Panicf("%+v", err)
		}
		return
	}
}

// Register `confirmChanRequest` as the handler for auth channel requests
authManager := client.GetAuthRegistrar()
authManager.AddGeneralRequestCallback(confirmChanRequest)

	// Request auth channels from other users---------------------------------------------

	// Sender's contact for requesting auth channels
me := client.GetUser().GetContact()

// Recipient's contact (read from a Client CLI-generated contact file)
contactData, _ := ioutil.ReadFile("../user2/user-contact.json")
// Assumes you have imported "[gitlab.com/elixxir/crypto/contact](http://gitlab.com/elixxir/crypto/contact)"
// which provides an `Unmarshal` function to convert the byte slice ([]byte) output
// of `ioutil.ReadFile()` to the `Contact` type expected by `RequestAuthenticatedChannel()`
recipientContact, _ := contact.Unmarshal(contactData)
recipientID := recipientContact.ID

roundID, authReqErr := client.RequestAuthenticatedChannel(recipientContact, me, "Hi! Let's connect!")
if authReqErr == nil {
	jww.INFO.Printf("Requested auth channel from: %s in round %d",
		recipientID, roundID)
} else {
	jww.FATAL.Panicf("%+v", err)
}

	// Send a message to another user----------------------------------------------------

// Send safe message with authenticated channel, requires an authenticated channel

// Test message 
msgBody := "If this message is sent successfully, we'll have established first contact with aliens."

msg := message.Send{
	Recipient:   recipientID,
	Payload:     []byte(msgBody),
	MessageType: message.XxMessage,
}
// Get default network parameters for E2E payloads
paramsE2E := params.GetDefaultE2E()

fmt.Printf("Sending to %s: %s\n", recipientID, msgBody)
roundIDs, _, _, err := client.SendE2E(msg,
		paramsE2E)
if err != nil {
	jww.FATAL.Panicf("%+v", err)
}
jww.INFO.Printf("Message sent in RoundIDs: %+v\n", roundIDs)

	// Keep app running to receive messages-----------------------------------------------
	for {
		msg := <-receiverChannel
		fmt.Println(string(msg.Payload))
	}
}
```

If you would like to duplicate this app to simulate multiple users, you can simply comment out irrelevant lines when you need to switch between sending and receiving messages or requesting and accepting authenticated channels.

The sample app is also [available on Gitlab](https://git.xx.network/elixxir/xxdk-examples/-/tree/sample-messaging-app).

## Next Steps: The API Reference

For more comprehensive information on using the Client API, see the<!-- Guides and--> [API reference](./quick-reference.md) docs.