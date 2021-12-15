---
sidebar_position: 2
---

# Getting Started

To integrate cMix with your application logic, each instance needs to be connected to the cMix network. This begins with registering an identity within the xxDK as a user. This process creates a new client session, an encrypted key-value (EKV) store containing client state and keys, that is used going forward.

The rest of this document outlines the steps for building a simple messaging app. It covers the entire process of integrating the cMix Client API (xxDK) in your application, registering within the xxDK and setting up a connection with the cMix network, setting up listeners, as well as sending and receiving messages.

### Set Up the Client Locally

The command-line tool that comes with the client is useful for testing network functionality. It also comes in handy for acquiring an [NDF](https://xxnetwork.wiki/index.php/Network_Definition_File_(NDF)), a JSON file that describes the Nodes, Gateways, and other servers on the network, as well as how to communicate with them.

:::note

The NDF is required for registering within the xxDK. Currently, it can only be acquired via the command-line. However, an up-to-date copy will be available for download soon on the xx network website.

:::

Here are the commands for cloning and compiling the client (assuming golang 1.13 or newer):

```bash
$ git clone https://gitlab.com/elixxir/client.git client
$ cd client
$ go mod vendor -v
$ go mod tidy
$ go test ./...

# Compile a binary for your specific OS architecture using one of the following commands 

# Linux 64 bit binary
$ GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags '-w -s' -o client.linux64 main.go
# Windows 64 bit binary
$ GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags '-w -s' -o client.win64 main.go
# Windows 32 big binary
$ GOOS=windows GOARCH=386 CGO_ENABLED=0 go build -ldflags '-w -s' -o release/client.win32 main.go
# Mac OSX 64 bit binary (intel)
$ GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -ldflags '-w -s' -o release/client.darwin64 main.go
```

You can pull up the complete usage guide for using the CLI via:

```bash
# Note that your binary may be named differently.
# For example, on a 64-bit Windows architecture, it might be `client.win64`.
$ ./client --help
```

For more information on the network and its architecture, see *[Network Architecture](https://xxnetwork.wiki/index.php/Network_Architecture)*.

### Download an NDF

You can get an NDF from a network gateway or the permissioning server using the `getndf` CLI command (assuming you've set up the client locally in the previous step).

You can poll the NDF from both a gateway and the permissioning server without any pre-established client connection. However, you'll need an IP address, a port, and an ssl certificate:

```go
// Download an SSL certificate
openssl s_client -showcerts -connect permissioning.prod.cmix.rip:11420 < /dev/null 2>&1 | openssl x509 -outform PEM > certfile.pem

// Fetch NDF (example usage for Gateways, assumes you're running a gateway locally)
go run main.go getndf --gwhost localhost:8440 --cert path-to-cert-generated-earlier | jq . >ndf.json

// Fetch NDF (example usage for the Permissioning server)
go run main.go getndf --permhost permissioning.prod.cmix.rip:11420 --cert path-to-cert-generated-earlier | jq . >ndf.json
// This assumes you're running a fake permissioning server locally
go run main.go getndf --permhost localhost:18000 --cert path-to-cert-generated-earlier  | jq . >ndf.json
```

For more information on the NDF and its structure, see [Network Definition File (NDF)](https://xxnetwork.wiki/index.php/Network_Definition_File_(NDF)).

### Import the API

The cMix client is designed to be used as a Go library, so you can import it same as any other Go package:

```go
"gitlab.com/elixxir/client/api"
```

Note that the code listings below for our sample app assume you've also imported these libraries:

```go
import (
  "io/ioutil"
	"fmt"
	"os"

  // external
  jww "github.com/spf13/jwalterweatherman" // logging
)
```

You'll need to import a few more packages along the way. However, we want to avoid unused import warnings from the compiler, so we'll include them as needed. It's straightforward to switch the external libraries out for any alternatives you prefer.

:::info

1. To ensure you're using the latest release version of the client, you can run `go get [gitlab.com/elixxir/client@release](http://gitlab.com/elixxir/client@release)`. This will update your `go.mod` file automatically.

1. It's also important to note, before continuing, that clients need to perform certain actions in a specified order, such as registering certain handlers before starting network threads. Additionally, some actions cannot be performed until the network is in a healthy state.

:::

### Create a Client Object

Creating a new client object will initialize a session directory containing the EKV store that will hold client state. This is done by calling the `NewClient()` function:

```go
func NewClient(ndfJSON string, storageDir string, password []byte,
 registrationCode string) error
```

Here's how we've set it up in our messaging app:

```go
// You'd ideally use a configuration tool to acquire these parameters
sessionPath := "sessionPath"
sessionPass := "sessionPass"

// Create the client if there's no session
if _, err := os.Stat(sessionPath); os.IsNotExist(err) {
	// Load NDF (assumes you've saved it to your current working directory)
	// You'd ideally use a configuration tool to acquire this path
	ndfPath := "ndf.json"
	ndfJSON, err := ioutil.ReadFile(ndfPath)
	if err != nil {
		jww.FATAL.Panicf("Failed to read NDF: %+v", err)
	}
	err = api.NewClient(string(ndfJSON), sessionPath, []byte(sessionPass), "")
	if err != nil {
		jww.FATAL.Panicf("Failed to create new client: %+v", err)
	}
}
```

There are two important steps here. First, you need to get an NDF (which you should already have from the *Download an NDF* step above).

Next, you need to call the `NewClient()` function. This will create a storage object for user data and generate cryptographic keys. It'll also connect and register the client with the cMix network. Although `NewClient()` does not register a username, it creates a new user based on a cryptographic identity. That makes it possible to add a username later.

The `NewClient()` function expects multiple arguments:

- `ndfJSON`: The first argument, `ndfJSON`, is the result of reading the file at the path specified by `ndfPath`. However, since `ioutil.ReadFile()` returns a byte slice, we had to convert it to the `string` format expected by `NewClient()`.
- `sessionPath`: This is the path to the directory that will store your session and client state. It's also a `string` type.
- `sessionPass`: The third argument, `sessionPass`, is used to create a user-specified password for accessing their sessions. It's expected to be a byte slice (`[]byte`).
- `registrationCode`: When creating a client for the first time, you can also register a code with the registration server. Use an empty string argument to register without a code.

Once you've created a client object, the next step is to load and log in to the session you just initialized.

:::info

Note that there are other types of clients you can create, such as a precanned client or a vanity client. For instance, a vanity client (`NewVanityClient()`) will create a user with a `receptionID` that starts with a supplied prefix. This is similar to Bitcoin's vanity addresses. <!-- See the API reference for more detail. -->

:::

### Login to Your Client Session

To log in to your client session, you need to call the `Login()` function:

```go
func Login(storageDir string, password []byte, parameters params.Network)
  (*Client, error)
```

The `Login()` function expects the same session directory and password used to create the client object. It also expects some network parameters, which you can fetch using the `params` interface via `params.GetDefaultNetwork()`. To use it, import `gitlab.com/elixxir/client/interfaces/params`: 

```go
// Login with the same sessionPath and sessionPass used to call NewClient()
// Assumes you've imported "gitlab.com/elixxir/client/interfaces/params"
client, err := api.Login(sessionPath, []byte(sessionPass), params.GetDefaultNetwork())
		if err != nil {
			jww.FATAL.Panicf("Failed to initialize client: %+v", err)
		}
```

Aside from logging you in to your existing client session, the `Login()` function also initializes communication with the network and registers your client with the permissioning server. This enables you to keep track of network rounds.

To view the current user identity for a client, call the `GetUser()` method:

```go
user := client.GetUser()
```

For more information on default network parameters and how to override them, see *Fetching Network Parameters*.

### Register a Message Listener

To acknowledge and reply to received messages, you'll need to register a listener. First, import the switchboard package and the message interface:

```go
"gitlab.com/elixxir/client/switchboard"
"gitlab.com/elixxir/client/interfaces/message"
```

Next, set up the listener. You'll also need to create a receiver channel with a type of `Message.Receive` and a suitably large capacity:

```go
// Set up a reception handler
swboard := client.GetSwitchboard()
receiverChannel := make(chan message.Receive, 10000) // Needs to be large
// Note that the name `listenerID` is arbitrary
listenerID := swboard.RegisterChannel("DefaultCLIReceiver",
	switchboard.AnyUser(), message.Text, receiverChannel)
jww.INFO.Printf("Message ListenerID: %v", listenerID)
```

The switchboard from `GetSwitchboard()` is used for interprocess signalling about received messages. On the other hand, `RegisterChannel()` registers a new listener built around the passed channel (in this case, `receiverChannel`). Here's the function signature for `RegisterChannel()`:

```go
func (sw *Switchboard) RegisterChannel(name string, user *id.ID,
  messageType message.Type, newListener chan message.Receive) ListenerID
```

`RegisterChannel()` expects a name for the listener, a user ID (which you want to set to `switchboard.AnyUser()` to listen for messages from any user), a message type, and a channel. 

`RegisterChannel()` returns a listener ID that you want to keep handy if you need to delete the listener at a later time.

:::caution

Note that we've used `swboard` for the variable holding the result of calling `client.GetSwitchboard()`, rather than `switchboard`. This avoids a clash with the imported `switchboard` package which is used to access the `AnyUser()` type.

:::

<!-- For more detail on registering message listeners, see *Registering Message Listeners*. -->

### Start Network Threads

The next step is to start the network follower. A network follower is a thread that keeps track of rounds and network health. As mentioned earlier, some actions (such as confirming authenticated channels) cannot be performed until the network is confirmed to be in a healthy state.

Generally, the network is in a healthy state when the health tracker sees rounds completing successfully.

To start a network follower, use the `StartNetworkFollower()` method:

```go
func (c *Client) StartNetworkFollower(timeout time.Duration) error
```

`StartNetworkFollower()` takes a single argument, a `Duration` type (from the `time` standard library) which specifies how much time to wait for the function call to succeed before timeout errors are returned. You'll want to call `StartNetworkFollower()` when your application returns from sleep and close it when going back to sleep.

For our messaging app, we've also set up a function that waits until the network is healthy. Here's our sample code for starting network threads and waiting until the network is healthy:

```go
// Set networkFollowerTimeout to an int64 of your choice (seconds)
err = client.StartNetworkFollower(networkFollowerTimeout)
if err != nil {
	jww.FATAL.Panicf("Failed to start network follower: %+v", err)
}

waitUntilConnected := func(connected chan bool) {
  // Assumes you've imported the `time` package
	waitTimeout := time.Duration(150)
	timeoutTimer := time.NewTimer(waitTimeout * time.Second)
	isConnected := false
	//Wait until we connect or panic if we can't by a timeout
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

Note that to use the above code listing from our sample app, you'll need to have imported the standard `time` package. By now, your import section should look like this:

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

In summary, `StartNetworkFollower()` kicks off tracking of the network. It starts long running threads and returns an object for checking state and stopping those threads. However, since these threads may become a significant drain on device batteries when offline, ensure they are stopped if there is no internet access.

### Request Authenticated Channels

There are two ways to send messages across the network: with or without end-to-end (E2E) encryption. Sending messages safely, with E2E encryption, requires an authenticated channel to be established between the communicating parties.

An authenticated channel is a state where both the sender and recipient have each verified their identities. Clients can both send and receive authenticated channel requests.

Here's how to request an authenticated channel from another user:

```go
// Use `client.GetUser().GetContact()` to get sender/recipient contact details
me := client.GetUser().GetContact()

roundID, authReqErr := client.RequestAuthenticatedChannel(recipientContact, me, "Hi! Let's connect!")
if authReqErr == nil {
	jww.INFO.Printf("Requested auth channel from: %s in round %d",
		recipientID, roundID)
} else {
	jww.FATAL.Panicf("%+v", err)
}
```

`RequestAuthenticatedChannel()` takes three arguments: the recipient's contact, the sender's contact (each of which can be acquired for each client instance using `client.GetUser().GetContact()`), and an arbitrary message string:

```go
func (c *Client) RequestAuthenticatedChannel(recipient contact.Contact,
  me contact.Contact, message string) (id.Round, error)
```

The `RequestAuthenticatedChannel()` method returns the ID for the network round in which the request was sent, or an error if the request was unsuccessful (such as when a channel already exists or if a request was already received).

:::info

Note that `RequestAuthenticatedChannel()` will not run if the network state is not healthy. However, it can be retried until it's successful.

:::

In our example above, we used the recipientID. This can be accessed via `client.GetUser().GetContact().ID`. Here's what the Contact data structure (returned by `GetContact()`) looks like:

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

To test out authenticated channels for our messaging app, we're running multiple client instances locally. Although not the most ideal way to get it, this means that we can also fetch the recipient's contact details from CLI-generated contact files:

```go
// Sender's contact
me := client.GetUser().GetContact()

// Recipient's contact (read from a Client CLI-generated contact file)
contactData, _ := ioutil.ReadFile("../user2/user-contact.json")
// Assumes you've imported "[gitlab.com/elixxir/crypto/contact](http://gitlab.com/elixxir/crypto/contact)"
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

To generate a contact file (such as `user-contact.json` above) via the CLI, use the `--writeContact` flag. You can send an unsafe (without E2E encryption) message to yourself using the following command, including a password, an NDF, and a session directory:

```bash
# You may need to use the `--waitTimeout` flag to avoid timeout errors
# For example, `--waitTimeout 1200` (time in seconds)
./client.win64 --password user-password --ndf ndf.json -l client.log -s session-directory --writeContact user-contact.json --unsafe -m "Hello World, without E2E Encryption"  
```

Note that when duplicating folders to create multiple client instances locally, you need to ensure you're not also copying over contact files and session folders. You can comfortably delete session folders since new cryptographic identities will be generated on each new `NewClient()` call (but only if there isn't an existing session).

For more detail on requesting authenticated channels, see *Requesting and Accepting Authenticated Channels*.

### Accept Authenticated Channels

Although we can now send authenticated channel requests, we've yet to be able to accept them. To give your application the ability to react to requests for authenticated channels, you first need to register a handler:

```go
// Set up auth request handler
authManager := client.GetAuthRegistrar()
authManager.AddGeneralRequestCallback(authChannnelCallbackFunction)
```

Calling the `GetAuthRegistrar()` method on the client returns a manager object which allows registration of authentication callbacks. Then you can use the `AddGeneralRequestCallback()` method on this object to register your handler.

Here's an example showing how to register a handler that simply prints the user ID of the requestor:

```go
// Simply prints the user id of the requestor.
func printChanRequest(requestor contact.Contact, message string) {
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

Note that, just like `RequestAuthenticatedChannel()`, `ConfirmAuthenticatedChannel()` will not run if the network state is not healthy. It also returns an error if a channel already exists, if a request doesn't
exist, or if the contact passed in does not match the contact received in a request.

`ConfirmAuthenticatedChannel()` can also be retried (such as in cases where the network was initially unhealthy).

For more detail on accepting authenticated channels, see *Requesting and Accepting Authenticated Channels*.

### Send E2E and Unsafe Messages

As we've mentioned earlier, you can send messages with or without end-to-end encryption. Here's how to send an unsafe message:

```go
// Send unsafe message without E2E encryption
 
// Test message
msgBody := "If this message is sent successfully, we'll have established first contact with aliens."

msg := message.Send{
	Recipient:   recipientID,
	Payload:     []byte(msgBody),
	MessageType: message.Text,
}
// Get default network parameters for unsafe messages
paramsUnsafe := params.GetDefaultUnsafe()

fmt.Printf("Sending to %s: %s\n", recipientID, msgBody)
roundIDs, err := client.SendUnsafe(msg,
		paramsUnsafe)
if err != nil {
	jww.FATAL.Panicf("%+v", err)
}
jww.INFO.Printf("Message sent in RoundIDs: %+v\n", roundIDs)
```

To send an E2E payload, you simply need to switch out the `GetDefaultUnsafe()` and `SendUnsafe()` calls from our unsafe example above: 

```go
// Send safe message with authenticated channel

// Test message 
msgBody := "We should never have established first contact with aliens without an authenticated channel."

msg := message.Send{
	Recipient:   recipientID,
	Payload:     []byte(msgBody),
	MessageType: message.Text,
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

There are three steps involved in sending messages, whether it's an unsafe or encrypted payload:

1. **Generate your message:** Sent messages have a `message.Send` type. You'll need to include a recipient ID, the message payload (which should be a byte slice), and a message type (which should be `message.Text`).
2. **Get default network parameters:** Next, you'll need to get the default network parameters, either using `params.GetDefaultUnsafe()` for unsafe message or `params.GetDefaultE2E()` for E2E messages. This again assumes you previously imported `[gitlab.com/elixxir/client/interfaces/params](http://gitlab.com/elixxir/client/interfaces/params)`.
3. **Send your message:** Finally, you can send your message using `client.SendUnsafe()` or `client.SendE2E()`. This will return the list of rounds in which parts of your message was sent or an error if the call was unsuccessful.

:::info

In addition to the round IDs and error message, `client.SendE2E()` returns two additional items: the message ID and the timestamp for when the message was sent. <!-- See the API reference for more information. -->

:::

You can choose to send an unsafe or E2E payload, depending on whether an authenticated channel already exists between two users:

```go
// Import "gitlab.com/xx_network/primitives/id"

msgBody := "We should never have established first contact with aliens without an authenticated channel."
// Check if an auth channel already exists
// HasAuthenticatedChannel() returns a boolean
unsafe := client.HasAuthenticatedChannel(recipientID)

msg := message.Send{
	Recipient:   recipientID,
	Payload:     []byte(msgBody),
	MessageType: message.Text,
}
paramsE2E := params.GetDefaultE2E()
paramsUnsafe := params.GetDefaultUnsafe()

fmt.Printf("Sending to %s: %s\n", recipientID, msgBody)
// Assumes you've imported "gitlab.com/xx_network/primitives/id"
var roundIDs []id.Round
// Send a safe or unsafe message, depending on whether an auth channel already exists
if unsafe {
	roundIDs, err = client.SendUnsafe(msg,
		paramsUnsafe)
} else {
	roundIDs, _, _, err = client.SendE2E(msg,
		paramsE2E)
}
if err != nil {
	jww.FATAL.Panicf("%+v", err)
}
jww.INFO.Printf("RoundIDs: %+v\n", roundIDs)
```

Note that because we're declaring a variable to hold the returned list of rounds (with a type of `[]id.Round`), we've also needed to import `gitlab.com/xx_network/primitives/id`. Our import section for our messaging app now looks like:

```go
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

	jww "github.com/spf13/jwalterweatherman" // logging
)
```

For more detail on sending messages and the different message types, see *Sending and Receiving Messages*.

### Receive Messages

We set up a listener earlier for incoming messages. However, `go run` terminates almost immediately after it's executed. So, we want to make sure to keep our receiving channel open and test that we can actually see received messages: 

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

In both cases, we've had to format our received messages via `string(msg.Payload)`. As you might recall from when we sent messages earlier, the payload is a byte slice.

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

For more detail on receiving messages and the different message types, see *Sending and Receiving Messages*.

### Putting It All Together

On a high-level, the process of integrating the Client API with your application can be reduced to:

1. Generate an identity for your client and use this to connect to the cMix network.
2. Keep track of the network using network followers.
3. Register listeners for messages and authenticated channel requests.
4. Send and receive messages with or without encryption.

You'll want to ensure that you perform these actions in the expected order, such as starting a network follower before registering a handler for authenticated channel requests.

Here's what our Go app (`main.go`) currently looks like, with most of our code samples so far reproduced here:

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

	// You'd ideally use a configuration tool to acquire these parameters
	sessionPath := "sessionPath"
	sessionPass := "sessionPass"

	// Create the client if there's no session
	if _, err := os.Stat(sessionPath); os.IsNotExist(err) {
		// Load NDF (assumes you've saved it to your current working directory)
		// You'd ideally use a configuration tool to acquire this path
		ndfPath := "ndf.json"
		ndfJSON, err := ioutil.ReadFile(ndfPath)
		if err != nil {
			jww.FATAL.Panicf("Failed to read NDF: %+v", err)
		}
		err = api.NewClient(string(ndfJSON), sessionPath, []byte(sessionPass), "")
		if err != nil {
			jww.FATAL.Panicf("Failed to create new client: %+v", err)
		}
	}

	// Login to your client session-----------------------------------------------------

	// Login with the same sessionPath and sessionPass used to call NewClient()
	// Assumes you've imported "gitlab.com/elixxir/client/interfaces/params"
	client, err := api.Login(sessionPath, []byte(sessionPass), params.GetDefaultNetwork())
	if err != nil {
		jww.FATAL.Panicf("Failed to initialize client: %+v", err)
	}

	// view current user identity--------------------------------------------------------
	user := client.GetUser()
	fmt.Println(user)

	// Register a listener for messages--------------------------------------------------

	// Set up a reception handler
	swboard := client.GetSwitchboard()
	receiverChannel := make(chan message.Receive, 10000) // Needs to be large
	// Note that the name `listenerID` is arbitrary
	listenerID := swboard.RegisterChannel("DefaultCLIReceiver",
		switchboard.AnyUser(), message.Text, receiverChannel)
	jww.INFO.Printf("Message ListenerID: %v", listenerID)

	// Start network threads------------------------------------------------------------

  networkFollowerTimeout := 1200

	err = client.StartNetworkFollower(networkFollowerTimeout)
	if err != nil {
		jww.FATAL.Panicf("Failed to start network follower: %+v", err)
	}

	waitUntilConnected := func(connected chan bool) {
		waitTimeout := time.Duration(150)
		timeoutTimer := time.NewTimer(waitTimeout * time.Second)
		isConnected := false
		//Wait until we connect or panic if we can't by a timeout
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
  // notified of network changes
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
	// Assumes you've imported "gitlab.com/elixxir/crypto/contact" which provides
	// an `Unmarshal` function to convert the byte slice ([]byte) output 
	// of `ioutil.ReadFile()` to the `Contact` type expected by
	// `RequestAuthenticatedChannel()`
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
	msgBody := "If this message is sent successfully, we'll have established first contact with aliens."
	unsafe := client.HasAuthenticatedChannel(recipientID)

	msg := message.Send{
		Recipient:   recipientID,
		Payload:     []byte(msgBody),
		MessageType: message.Text,
	}
	paramsE2E := params.GetDefaultE2E()
	paramsUnsafe := params.GetDefaultUnsafe()

	fmt.Printf("Sending to %s: %s\n", recipientID, msgBody)
	fmt.Println("Sending to: ", recipientID, " , ", msgBody)
	var roundIDs []id.Round
	if unsafe {
		roundIDs, err = client.SendUnsafe(msg,
			paramsUnsafe)
	} else {
		roundIDs, _, _, err = client.SendE2E(msg,
			paramsE2E)
	}
	if err != nil {
		jww.FATAL.Panicf("%+v", err)
	}
	jww.INFO.Printf("RoundIDs: %+v\n", roundIDs)

	// Keep app running to receive messages-----------------------------------------------
	for {
		msg := <-receiverChannel
		fmt.Println(string(msg.Payload))
	}
}
```

If you'd like to duplicate this app to simulate multiple users, you can simply comment out irrelevant lines when you need to switch between sending or requesting and receiving or accepting messages and authenticated channels.

### Next Steps: The API Reference

For more comprehensive information on using the Client API, see the API reference docs.