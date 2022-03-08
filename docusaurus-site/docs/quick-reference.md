---
sidebar_position: 3
---

# API Quick Reference

This document provides brief descriptions of all public functions, types, and interfaces exposed by the Client API (xxDK). <!-- Each item links to a page with more detail.  -->

:::note
If you are new to the xxDK, you can start with the [Overview](./overview) and [Getting Started](./getting-started) docs.
:::

Note that if you're running the client locally, you can use `go doc` to explore the list of functions and interfaces.

```go
// cd into the `client` directory 
go doc -all ./api
go doc -all ./interfaces
```

## How to Use the API

The API exposes multiple functions, as well as types and their associated method sets. For example, browsing through the API will show you there is a `GetRoundEvents()` callback registration function that lets your client see round events:

```go
func (c *Client) GetRoundEvents() interfaces.RoundEvents
```

`GetRoundEvents()` returns a `RoundEvents` interface. Exploring the broader xxDK for this interface  reveals a few functions, such as `AddRoundEvent()` that enable monitoring of a specified event:

```go
type RoundEvents interface {
        // designates a callback to call on the specified event
        // rid is the id of the round the event occurs on
        // callback is the callback the event is triggered on
        // timeout is the amount of time before an error event is returned
        // valid states are the states which the event should trigger on
        AddRoundEvent(rid id.Round, callback ds.RoundEventCallback,
                timeout time.Duration, validStates ...states.Round) *ds.EventCallback

        // designates a go channel to signal the specified event
        // rid is the id of the round the event occurs on
        // eventChan is the channel the event is triggered on
        // timeout is the amount of time before an error event is returned
        // valid states are the states which the event should trigger on
        AddRoundEventChan(rid id.Round, eventChan chan ds.EventReturn,
                timeout time.Duration, validStates ...states.Round) *ds.EventCallback

        //Allows the un-registration of a round event before it triggers
        Remove(rid id.Round, e *ds.EventCallback)
}
```

Investigating the `callback` parameter of `AddRoundEvent()` yields the following prototype showing that you can receive a full `RoundInfo` object for any round event received by the client on the network:

```go
// Callbacks must use this function signature
type RoundEventCallback func(ri *pb.RoundInfo, timedOut bool)
```

## API Quick Reference

## Constants

```go
const (
        // SaltSize size of user salts
        SaltSize = 32
)
```

## Functions

### func CompressJpeg

```go
func CompressJpeg(imgBytes []byte) ([]byte, error)
```

`CompressJpeg` takes a JPEG image in byte format and compresses it based on desired output size.

### func CompressJpegForPreview

```go
func CompressJpegForPreview(imgBytes []byte) ([]byte, error)
```

`CompressJpegForPreview` takes a JPEG image in byte format and compresses it based on desired output size.

### func DownloadAndVerifySignedNdfWithUrl

```go
func DownloadAndVerifySignedNdfWithUrl(url, cert string) ([]byte, error)
```

`DownloadAndVerifySignedNdfWithUrl` retrieves the NDF from a specified URL. The NDF is processed into a protobuf containing a signature which is verified using the cert string passed in. The NDF is returned as marshaled byte data which may be used to start a client.

### func LoadSecretWithMnemonic

```go
func LoadSecretWithMnemonic(mnemonic, path string) (secret []byte, err error)
```

`LoadSecretWithMnemonic` loads the encrypted secret from storage and decrypts the secret using the given mnemonic.

### func NewClient

```go
func NewClient(ndfJSON, storageDir string, password []byte,
        registrationCode string) error 
```

`NewClient` creates client storage, generates keys, connects, and registers with the network. Note that this does not register a username/identity, but merely creates a new cryptographic identity for adding such information at a later date.

### func NewPrecannedClient

```go
func NewPrecannedClient(precannedID uint, defJSON, storageDir string,
        password []byte) error
```

`NewPrecannedClient` is used for integration testing and should not be used unless you are working on the cMix gateway and servers. You cannot connect to any public networks with a precanned client.

### func NewProtoClient_Unsafe

```go
func NewProtoClient_Unsafe(ndfJSON, storageDir string, password,
        protoClientJSON []byte) error
```

`NewProtoClient_Unsafe` initializes a client object from a JSON containing predefined cryptographic which defines a user. This is designed for some specific deployment procedures and is generally unsafe. 

:::note
`NewProtoClient_Unsafe` is planned to be deprecated in favor of a new account backup API.
:::

### func NewVanityClient

```go
func NewVanityClient(ndfJSON, storageDir string, password []byte,
        registrationCode string, userIdPrefix string) error
```

`NewVanityClient` creates a user with a receptionID that starts with the supplied prefix It creates client storage, generates keys, connects, and registers with the network. Note that this does not register a username/identity, but merely creates a new cryptographic identity for adding such information at a later date.

### func StoreSecretWithMnemonic

```go
func StoreSecretWithMnemonic(secret []byte, path string) (string, error)
```

`StoreSecretWithMnemonic` creates a mnemonic and uses it to encrypt the secret. This encrypted data saved in storage.

## Types

### type Client

```go
type Client struct {
        // Has unexported fields.
}
```

### func Login

```go
func Login(storageDir string, password []byte, parameters params.Network) (*Client, error)
```

`Login` initializes a client object from existing storage.

### func LoginWithNewBaseNDF_UNSAFE

```go
func LoginWithNewBaseNDF_UNSAFE(storageDir string, password []byte,
        newBaseNdf string, parameters params.Network) (*Client, error)
```

`LoginWithNewBaseNDF_UNSAFE` initializes a client object from existing storage while replacing the base NDF. This is designed for some specific deployment procedures and is generally unsafe.

### func LoginWithProtoClient

```go
func LoginWithProtoClient(storageDir string, password []byte, protoClientJSON []byte,
        newBaseNdf string, parameters params.Network) (*Client, error)
```

`LoginWithProtoClient` creates a client object with a protoclient JSON containing the cryptographic primitives. This is designed for some specific deployment procedures and is generally unsafe.

### func OpenClient

```go
func OpenClient(storageDir string, password []byte, parameters params.Network) (*Client, error)
```

Open a client session, but do not connect to the network or log in.

### func (*Client) AddService

```go
func (c *Client) AddService(sp Service) error
```

`AddService` adds a service to be controlled by the client thread control; these will be started and stopped with the network follower.

### func (*Client) ConfirmAuthenticatedChannel

```go
func (c *Client) ConfirmAuthenticatedChannel(recipient contact.Contact) (id.Round, error)
```

`ConfirmAuthenticatedChannel` creates an authenticated channel out of a valid received request and sends a message to the requestor that the request has been confirmed. It will not run if the network state is not healthy. An error will be returned if a channel already exists, if a request does not exist, or if the passed in contact does not exactly match the received request. Can be retried.

### func (*Client) ConstructProtoUerFile

```go
func (c *Client) ConstructProtoUerFile() ([]byte, error)
```

`ConstructProtoUerFile` is a helper function which is used for proto client testing. This is used for development testing.

### func (*Client) DeleteAllRequests

```go
func (c *Client) DeleteAllRequests() error
```

`DeleteAllRequests` clears all requests from client's auth storage.

### func (*Client) DeleteContact

```go
func (c *Client) DeleteContact(partnerId *id.ID) error
```

`DeleteContact` removes a partner from the client's storage.

### func (*Client) DeleteReceiveRequests

```go
func (c *Client) DeleteReceiveRequests() error
```

`DeleteReceiveRequests` clears receive requests from client's auth storage.

### func (*Client) DeleteSentRequests

```go
func (c *Client) DeleteSentRequests() error
```

`DeleteSentRequests` clears sent requests from client's auth storage.

### func (*Client) GetAuthRegistrar

```go
func (c *Client) GetAuthRegistrar() interfaces.Auth
```

`GetAuthRegistrar` gets the object which allows the registration of auth callbacks.

### func (*Client) GetAuthenticatedChannelRequest

```go
func (c *Client) GetAuthenticatedChannelRequest(partner *id.ID) (contact.Contact, error)
```

`GetAuthenticatedChannelRequest` returns the contact received in a request if one exists for the given userID. Returns an error if no contact is found.

### func (*Client) GetBackup

```go
func (c *Client) GetBackup() *interfaces.BackupContainer
```

`GetBackup` returns a pointer to the backup container so that the backup can be set and triggered.

### func (*Client) GetComms

```go
func (c *Client) GetComms() *client.Comms
```

`GetComms` returns the client comms object.

### func (*Client) GetErrorsChannel

```go
func (c *Client) GetErrorsChannel() <-chan interfaces.ClientError
```

`GetErrorsChannel` returns a channel which passess errors from the long running threads controlled by `StartNetworkFollower` and `StopNetworkFollower.`

### func (*Client) GetHealth

```go
func (c *Client) GetHealth() interfaces.HealthTracker
```

`GetHealth` returns the health tracker for registration and polling.

### func (*Client) GetNetworkInterface

```go
func (c *Client) GetNetworkInterface() interfaces.NetworkManager
```

`GetNetworkInterface` returns the client’s network interface.

### func (*Client) GetNodeRegistrationStatus

```go
func (c *Client) GetNodeRegistrationStatus() (int, int, error)
```

`GetNodeRegistrationStatus` gets the current state of node registration in the network. It returns the total number of nodes in the NDF and the number of those with which the client is currently registered. An error is returned if the network is not healthy.

### func (*Client) GetPreferredBins

```go
func (c *Client) GetPreferredBins(countryCode string) ([]string, error)
```

`GetPreferredBins` returns the geographic bin or bins that the provided two-character country code is a part of.

### func (*Client) GetRateLimitParams

```go
func (c *Client) GetRateLimitParams() (uint32, uint32, int64)
```

`GetRateLimitParams` retrieves the rate limiting parameters.

### func (*Client) GetRelationshipFingerprint

```go
func (c *Client) GetRelationshipFingerprint(partner *id.ID) (string, error)
```

`GetRelationshipFingerprint` returns a unique 15 character fingerprint for an E2E relationship. An error is returned if no relationship with the partner is found.

### func (*Client) GetRng

```go
func (c *Client) GetRng() *fastRNG.StreamGenerator
```

`GetRng` returns the client’s rng (random number generator) object.

### func (*Client) GetRoundEvents

```go
func (c *Client) GetRoundEvents() interfaces.RoundEvents
```

`GetRoundEvents` registers a callback for round events.

### func (*Client) GetRoundResults

```go
func (c *Client) GetRoundResults(roundList []id.Round, timeout time.Duration,
        roundCallback RoundEventCallback) error
```

`GetRoundResults` adjudicates on the rounds requested. It checks if they are older rounds or in-progress rounds.

### func (*Client) GetStorage

```go
func (c *Client) GetStorage() *storage.Session
```

`GetStorage` returns the client storage object.

### func (*Client) GetSwitchboard

```go
func (c *Client) GetSwitchboard() interfaces.Switchboard
```

`GetSwitchboard` returns the switchboard for registration.

### func (*Client) GetUser

```go
func (c *Client) GetUser() user.User
```

`GetUser` returns the current user identity for this client. This can be serialized into a byte stream for out-of-band sharing.

### func (*Client) HasAuthenticatedChannel

```go
func (c *Client) HasAuthenticatedChannel(partner *id.ID) bool
```

`HasAuthenticatedChannel` returns true if an authenticated channel exists for a specified partner.

### func (*Client) HasRunningProcessies

```go
func (c *Client) HasRunningProcessies() bool
```

`HasRunningProcessies` checks if any background threads are running and returns `true` if one or more are.

### func (*Client) MakePrecannedAuthenticatedChannel

```go
func (c *Client) MakePrecannedAuthenticatedChannel(precannedID uint) (contact.Contact, error)
```

`MakePrecannedAuthenticatedChannel` creates an insecure e2e relationship with a precanned user.

:::note
`MakePrecannedAuthenticatedChannel` is used for integration testing and is unavailable on public networks.
:::

### func (*Client) MakePrecannedContact

```go
func (c *Client) MakePrecannedContact(precannedID uint) contact.Contact
```

`MakePrecannedContact` creates an insecure e2e contact object for a precanned user.

### func (*Client) NetworkFollowerStatus

```go
func (c *Client) NetworkFollowerStatus() Status
```

`NetworkFollowerStatus` gets the state of the network follower. It returns:

- `Stopped` - 0
- `Starting` - 1000
- `Running` - 2000
- `Stopping` - 3000

### func (*Client) NewCMIXMessage

```go
func (c *Client) NewCMIXMessage(contents []byte) (format.Message, error)
```

`NewCMIXMessage` creates a new cMix message with the right properties for the current cMix network.

### func (*Client) RegisterEventCallback

```go
func (c *Client) RegisterEventCallback(name string,
        myFunc interfaces.EventCallbackFunction) error
```

`RegisterEventCallback` records the given function to receive `ReportableEvent` objects. It returns the internal index of the callback so that it can be deleted later.

### func (*Client) RegisterForNotifications

```go
func (c *Client) RegisterForNotifications(token string) error
```

`RegisterForNotifications` allows a client to register for push notifications. Note that clients are not required to register for push notifications especially as these rely on third parties i.e., Firebase, that may represent a security risk to the user.

### func (*Client) ReportEvent

```go
func (c *Client) ReportEvent(priority int, category, evtType, details string)
```

`ReportEvent` reports an event from the client to API users, providing a priority, category, event type, and details.

### func (*Client) RequestAuthenticatedChannel

```go
func (c *Client) RequestAuthenticatedChannel(recipient, me contact.Contact,
        message string) (id.Round, error)
```

`RequestAuthenticatedChannel` sends a request to another party to establish an authenticated channel. It will not run if the network state is not healthy. An error will be returned if a channel already exists or if a request was already received. When a confirmation occurs, the channel will be created and the callback will be called. Can be retried.

### func (*Client) ResetSession

```go
func (c *Client) ResetSession(recipient, me contact.Contact,
        message string) (id.Round, error)
```

`ResetSession` resets an authenticate channel that already exists.

### func (*Client) SendCMIX

```go
func (c *Client) SendCMIX(msg format.Message, recipientID *id.ID,
        param params.CMIX) (id.Round, ephemeral.Id, error)
```

`SendCMIX` sends a "raw" CMIX message payload to the provided recipient. Note that both `SendE2E` and `SendUnsafe` call `SendCMIX`. Returns the round ID of the round the payload was sent or an error if it fails.

### func (*Client) SendE2E

```go
func (c *Client) SendE2E(m message.Send, param params.E2E) ([]id.Round,
        e2e.MessageID, time.Time, error)
```

`SendE2E` sends an end-to-end payload to the provided recipient with the provided message type. Returns the list of rounds in which parts of the message were sent or an error if it fails.

### func (*Client) SendManyCMIX

```go
func (c *Client) SendManyCMIX(messages []message.TargetedCmixMessage,
        params params.CMIX) (id.Round, []ephemeral.Id, error)
```

`SendManyCMIX` sends many "raw" CMIX message payloads to each of the provided recipients. Used for group chat functionality. Returns the round ID of the round the payload was sent or an error if it fails.

### func (*Client) SendUnsafe

```go
func (c *Client) SendUnsafe(m message.Send, param params.Unsafe) ([]id.Round,
        error)
```

`SendUnsafe` sends an unencrypted payload to the provided recipient with the provided message type. Returns the list of rounds in which parts of the message were sent or an error if it fails. NOTE: Do not use this function unless you know what you are doing.

### func (*Client) SetProxiedBins

```go
func (c *Client) SetProxiedBins(binStrings []string) error
```

`SetProxiedBins` updates the host pool filter that filters out gateways that are not in one of the specified bins.

### func (*Client) StartNetworkFollower

```go
func (c *Client) StartNetworkFollower(timeout time.Duration) error
```

`StartNetworkFollower` kicks off the tracking of the network. It starts long running network client threads and returns an object for checking state and stopping those threads. Call this when returning from sleep and close when going back to sleep. These threads may become a significant drain on battery when offline; ensure they are stopped if there is no internet access.

**Threads Started:**

1. Network Follower (/network/follow.go) - Tracks the network events and hands them off to workers for handling
2. Historical Round Retrieval (/network/rounds/historical.go) - Retrieves data about rounds which are too old to be stored by the client
3. Message Retrieval Worker Group (/network/rounds/retrieve.go) - Requests all messages in a given round from the gateway of the last node
4. Message Handling Worker Group (/network/message/handle.go) - Decrypts and partitions messages when signals via the Switchboard
5. Health Tracker (/network/health) - Via the network instance tracks the state of the network
6. Garbled Messages (/network/message/garbled.go) - Can be signaled to check all recent messages which could be be decoded
Uses a message store on disk for persistence
7. Critical Messages (/network/message/critical.go) - Ensures all protocol layer mandatory messages are sent
Uses a message store on disk for persistence
8. KeyExchange Trigger (/keyExchange/trigger.go) -Responds to sent rekeys and executes them
9. KeyExchange Confirm (/keyExchange/confirm.go) - Responds to confirmations of successful rekey operations
10. Auth Callback (/auth/callback.go) - Handles both auth confirm and requests

### func (*Client) StopNetworkFollower

```go
func (c *Client) StopNetworkFollower() error
```

`StopNetworkFollower` stops the network follower if it is running. It returns errors if the follower is in the wrong state to stop or if it fails to stop it. If the network follower is running and this fails, the client object will most likely be in an unrecoverable state and need to be trashed.

### func (*Client) UnregisterEventCallback

```go
func (c *Client) UnregisterEventCallback(name string)
```

`UnregisterEventCallback` deletes the callback identified by the index. It returns an error if it fails.

### func (*Client) UnregisterForNotifications

```go
func (c *Client) UnregisterForNotifications() error
```

`UnregisterForNotifications` turns off notifications for this client.

### func (*Client) VerifyOwnership

```go
func (c *Client) VerifyOwnership(received, verified contact.Contact) bool
```

`VerifyOwnership` checks if the ownership proof on a passed contact matches the identity in a verified contact.

### type RoundEventCallback

```go
type RoundEventCallback func(allRoundsSucceeded, timedOut bool, rounds map[id.Round]RoundResult)
```

Callback interface which reports the requested rounds. Designed such that the caller may decide how much detail they need.

`allRoundsSucceeded`: Returns false if any rounds in the round map were unsuccessful. Returns true if ALL rounds were successful.

`timedOut`: Returns true if any of the rounds timed out while being monitored. Returns false if all rounds statuses were returned.

`rounds`: Contains a mapping of all previously requested rounds to their respective round results.

### type RoundResult

```go
type RoundResult uint
```

Enum of possible round results to pass back

### Const

```go
const (
        TimeOut RoundResult = iota
        Failed
        Succeeded
)
```

### func (RoundResult) String

```go
func (rr RoundResult) String() string
```

### type Service

```go
type Service func() (stoppable.Stoppable, error)
```

A service process starts itself in a new thread, returning from the originator a stoppable to control it.

### type Status

```go
type Status int
```

### Const

```go
const (
        Stopped  Status = 0
        Running  Status = 2000
        Stopping Status = 3000
)
```

### func (Status) String

```go
func (s Status) String() string
```