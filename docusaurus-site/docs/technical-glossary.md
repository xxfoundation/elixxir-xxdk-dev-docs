---
sidebar_position: 6
---

# Technical Glossary

There are several terms and concepts in these docs that are specific to the cMix network. This page lists some of the most important and a few general computing terms.

## A

### **Authenticated Channel**

An authenticated channel is a state where both the sender and recipient have verified their identities. cMix clients can send and receive authenticated channel requests.

## C

### **Client**

A computer performing the 'client' role in a client-server network architecture.

### **cMix Client**

A cMix client is a unique user in the cMix network. It can send and receive private data. All cMix clients use the [Client API](https://git.xx.network/elixxir/client) to interact with the cMix network.

### **Client Session**

See **[Session](#session-also-client-session)**

### **Client Command-Line Interface (CLI)**

The Client CLI is a command-line tool intended for testing xx network functionality. It can send and receive messages and authenticated channel requests. For instructions on how to set it up, see [*Set Up the Client Locally*](./getting-started.md/#set-up-the-client-locally).

## G

### **Gateway (also Network Gateway)**

The public-facing component of a node. One exists for each node. Gateways store received messages and provide public access to data.

## P

### **Permissioning Server**

The permissioning server, also referred to as the scheduling server, manages the [NDF](#network-definition-file-ndf) for cMix clients and servers. It schedules cMix rounds within the network. 

### **Precanned Client**

A precanned client (created with `NewPrecannedClient()`) is used for integration testing and should not be used unless you are working on the cMix gateway and servers. You cannot connect to any public networks with a precanned client.

## R

### **Rekeying**

A process of renegotiating a key with a partner. This is triggered based on how frequently the current session key is used. When that passes a threshold, a renegotiation is triggered. The user then uses an unused session with its unique key and sends that over to their partner. The partner creates a new send and receive relationship with this public key to continue communication with their partner.

### **Round**

The process by which batches of messages are processed by the mixnet. Rounds are represented by positive integers in logs.

## S

### **Server**

A computer performing the 'server' role in a client-server network architecture.

### **Session (also Client Session)**

An encrypted key-value (EKV) store containing the cryptographic keys and state of a cMix client.

## U

### **User Discovery (UD)**

User Discovery helps users make first contact with other users. Using the "single use" package within the xxDK, User Discovery implements a completely private user lookup where the system cannot determine which user is querying. The system leverages Twilio to verify emails and phone numbers if the user would like to do so.

## N

### **Network Definition File (NDF)**

A JSON file required for registering a cMix client as a user within the cMix network. It describes how to communicate with the Nodes, Gateways, and other servers on the network. For more detail, see *[Network Definition File (NDF)](https://xxnetwork.wiki/index.php/Network_Definition_File_(NDF))*.

### **Network Gateway**

See **[Gateway](#gateway-also-network-gateway)**

### **Network Health**

The state of the network as tracked by network followers. It is either healthy or unhealthy. The network is in a healthy state when the health tracker sees rounds completed successfully and vice versa.

### **Node**

A core operator of the cMix network. Executes the cMix protocol and validates the xx blockchain.

## V

### **Vanity Client**

A user whose cMix ID starts with a supplied prefix (such as their username). It is created with the `NewVanityClient()` function, which generates IDs randomly until it meets the required set of criteria. Similar to Bitcoin's vanity addresses.