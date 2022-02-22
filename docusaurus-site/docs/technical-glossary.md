---
sidebar_position: 6
---

# Technical Glossary

There are several terms and concepts used in the docs that are specific to the cMix network. This page lists some of the most important and a few general computing terms.

## A

### **Authenticated Channel**

An authenticated channel is a state where both the sender and recipient have verified their identities. Clients can send and receive authenticated channel requests.

## C

### **Client**

A cMix client is a unique user in the cMix network. It can send and receive private data. All cMix clients use the Client API to interact and send messages with the cMix network.

### **Client Session**

See **[Session](#session-also-client-session)**

### **Command-Line Interface (CLI)**

The Client CLI is a command-line tool intended for testing xx network functionality and not for regular user use. You can use it to send and accept messages and authenticated channels requests. For instructions on how to set it up, see *Testing Network Functionality Locally With the Client CLI*.

## G

### **Gateway (also Network Gateway)**

The public-facing component of a node. One exists for each node. Gateways store received messages and provide public access to data.

## P

### **Permissioning Server**

The permissioning server, also referred to as the scheduling server, manages the [NDF](#network-definition-file-ndf) for Clients and Servers and schedules cMix rounds within the network. 

### **Precanned Client**

A precanned client (created with the `NewPrecannedClient()` function) is used for integration testing and should not be used unless you are working on the cMix gateway and servers. You cannot connect to any public networks with a precanned client.

## R

### **Rekeying**

A process of renegotiating a key with a partner. This is triggered based on how frequently the current session key is used. When that passes a threshold, a renegotiation is triggered. The user then uses an unused session with its unique key and sends that over to their partner. The partner uses this public key and creates a new send and receive relationship to continue communication with their partner.

### **Round**

[TBD]

## S

### **Session (also Client Session)**

An encrypted key-value (EKV) store containing client state and keys.

## U

### **User Discovery (UD)**

User Discovery helps users make first contact with other users. Using the "single use" package within the xxDK, User Discovery implements a completely private user lookup where the system cannot determine which user is querying. The system leverages Twilio to verify emails and phone numbers if the user would like to do so.

## N

### **Network Definition File (NDF)**

A JSON file that describes the Nodes, Gateways, and other servers on the network, as well as how to communicate with them. For more detail, see *[Network Definition File (NDF)](https://xxnetwork.wiki/index.php/Network_Definition_File_(NDF))***.**

### **Network Gateway**

See **[Gateway](#gateway-also-network-gateway)**

### **Network Health**

The state of the network as tracked by network followers. It is either healthy or unhealthy. The network is in a healthy state when the health tracker sees rounds completed successfully and vice versa.

### **Node**

A core operator of the cMix network. Executes the cMix protocol and validates the xx blockchain.

## V

### **Vanity Client**

A user whose cMix ID starts with a supplied prefix (such as their username). It's created with the `NewVanityClient()` function, which generates IDs randomly until it meets the required set of criteria. Similar to Bitcoin's vanity addresses.