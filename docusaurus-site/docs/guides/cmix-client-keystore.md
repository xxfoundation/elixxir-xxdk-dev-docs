# cMix Client Keystore

The cMix Client Keystore is a directory-backed encrypted key-value storage which contains cryptographic keys and state data. It is implemented by wrapping the [EKV library](https://git.xx.network/elixxir/ekv).

The keystore is initially populated by a small number of critical keys that define a client’s identity. It holds all the information necessary to send messages (transmission) as well as to receive messages (reception or message pickup) on the cMix network. The keystore is extended as needed to store key and state information for various subsystems (e.g., E2E messaging).

# Handling the Client Keystore

The Client Keystore requires a directory path where it will be initialized. A client must provide a path to a directory on a filesystem as well as a password that will be used to encrypt the contents of the directory. Once initialized, several encrypted files are generated at that path and used to store a variety of things that must persist across runs of the client. 

The password used to encrypt the contents of the keystore must be provided by the user or stored securely using secure storage, for example by using the [Android](https://developer.android.com/reference/android/security/KeyChain) or [iOS Keychain](https://developer.apple.com/documentation/security/keychain_services) APIs. 

# Key Generation on Initialization

The cMix Client Keystore must be initialized on first run. Initializing the keystore creates a series of keys for outbound (transmission) communication with the xx network. These transmission keys are then used to register and negotiate a key with each node on the network. 

The process generally takes 20~30 seconds on first run, but can take upwards of five minutes in rare cases. As a result, it is highly recommended in almost all cases to persist the initialized keystore across executions of the cMix client.

## Client Identity

At first, only the base data for sending messages (transmission) and receiving messages (reception) are stored in the keystore. These two sets of data include:

1. **Transmission Identity**
    1. **RSA Transmission Keys:** The transmission keys are a pair of RSA private/public keys used to register with the xx network. The public key is signed by the client registrar, a temporary system run by the foundation to allow the registration of new clients to be disabled in the event of certain network attacks. In the future, this system will be replaced with an on-chain registrar which registers new users for a fee in xx coins.
    2. **RSA Transmission ID:** This is a unique identifier used for sending messages over the network. It is generated using a salt and the RSA transmission public key.
2. **Legacy Reception Identity**
    1. **RSA Reception Keys:** The [User Discovery](../technical-glossary#user-discovery-ud) system run by the xx foundation requires a signed reception identity for registration. While registration identities are generally intended to be fungible, for the xx messenger and xx foundation user discovery server, they are not and must be signed. This allows it to piggy back off of the protection mechanisms described in the *RSA Transmission Keys* section above.  
    2. **RSA Reception ID:** This is a unique identifier used by a cMix client to receive messages. It will typically poll this ID when looking for messages sent from other users. This ID is generated from a combination of a salt and the RSA reception public key. 

## Other Critical Key Structures Stored in the Keystore

While a small set of keys are stored on initial execution, that group grows as various modules are exercised. Here are some of the more important keys which are stored in the client Keystore. This is not an exhaustive list.

- **E2E keys:** When a cMix client requests or receives requests for an authenticated connection with another client, it uses its end-to-end (E2E) identity. This is a pair of Diffie-Helman (DH) keys.
- **cMix state data**: Due to the decentralized nature of the xx network and the cMix protocol, there is no central repository for the state of message picking for an individual reception ID.  Instead, it is the client’s responsibility to build a picture of the network and track its own message pickup information. This data is stored in the keystore as the client runs. The bulk of the data and its handling can be found in the [/cmix/identity](https://git.xx.network/elixxir/client/-/tree/release/cmix/identity) package.
- **Network signatures:** As described in the *Client Identity* section above, the Transmission Identity as well as the Legacy Reception Identity are signed by the Network Registrar. These signatures are stored in [/storage/user](https://git.xx.network/elixxir/client/-/tree/release/storage/user) as the `TransmissionRegistrationValidationsSignature`, and the `ReceptionRegistrationValidationsSignature`*.*
- **Node keypairs:** Clients negotiate symmetric keys with every node in the network in order to receive the mixes the nodes are a part of. These keys are stored in the keystore in [/cmix/nodes](https://git.xx.network/elixxir/client/-/tree/release/cmix/nodes).