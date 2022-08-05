# cMix Client Keystore

The cMix Client Keystore is a directory-backed encrypted key-value storage which contains cryptographic keys and state data. It is implemented by wrapping the [EKV library](https://git.xx.network/elixxir/ekv).

The keystore is initially populated by a small number of critical keys that define a client’s identity. It holds all the information necessary to send messages (transmission) as well as to receive messages (reception or message pickup) on the cMix network. The keystore is extended as needed to store key and state information for various subsystems (e.g., E2E messaging).

## Handling the Client Keystore

The Client Keystore requires a directory path where it will be initialized. A client must provide a path to a directory on a filesystem as well as a password that will be used to encrypt the contents of the directory. Once initialized, several encrypted files are generated at that path and used to store a variety of things that must persist across runs of the client. 

The password used to encrypt the contents of the keystore must be provided by the user or stored securely using secure storage, for example by using the [Android](https://developer.android.com/reference/android/security/KeyChain) or [iOS Keychain](https://developer.apple.com/documentation/security/keychain_services) APIs. 

# Key Generation on Initialization

The cMix client keystore must be initialized on first run. Initializing the keystore creates a series of keys for outbound (transmission) communication with the xx network. These transmission keys are then used to register and negotiate a key with each node on the network. 

The process generally takes 20~30 seconds on first run, but can take upwards of five minutes in rare cases. As a result, it is highly recommended in almost all cases to persist the initialized cMix client keystore across executions of the cMix client.

### Client Identity

At first, only the base data for sending messages (transmission) and receiving messages (reception) are stored in the keystore. These two sets of data include:

1. **Transmission Identity**
    1. **RSA Transmission Keys:** The transmission keys are a pair of RSA private/public keys used to register with the xx network for. The public key is signed by the client registrar, [*describe the function of the client registrar here? What is the significance of the signing?*].
    2. **RSA Transmission ID:** This is a unique identifier used for sending messages over the network. It is generated using a salt and the RSA transmission public key.
2. **Legacy Reception Identity**
    1. **RSA Reception Keys:** These are also used to register with the network. ~~The public key is signed by the client registrar.~~
    2. **RSA Reception ID:** This is a unique identifier used by a cMix client to receive messages. It will typically poll this ID when looking for messages sent from other users. This ID is generated from a combination of a salt and the RSA reception public key. 

## Other Critical Key Structures Stored in the Keystore

While a small set of keys are stored on initial execution, that group grows as various modules are exercised. Here are some of the more important keys which are stored in the client Keystore. This is not an exhaustive list.

- **E2E keys:** When a cMix client requests or receives requests for an authenticated connection with another client, it uses its end-to-end (E2E) identity. This is a pair of Diffie-Helman (DH) keys.
    1. **E2E DH Public Key:** The DH public key is used to verify the identity and ownership of messages sent. A user sends this key to a partner when requesting or receiving an authenticated connection. 
    2. **E2E DH Private Key:** The DH private key is used to decrypt messages received by a partner client. It ensures that only the intended recipient of a message can unlock it. The DH private key is generated using an E2E cryptographic group included in the network definition file (NDF). 
- cMix state data: [*Brief description of what the state data consists of*]
- Network signatures: [*Brief description?; TransmissionRegistrationValidationsSignature, ReceptionRegistrationValidationsSignature; Relevance?*]
- Node keypairs: [*Brief description*]