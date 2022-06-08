sidebar_position: 3
---

# iOS SDK

## Installation
The Elixxir SDK requires the use of the [Swift Package Manager](https://swift.org/package-manager/)—a tool for managing the distribution of Swift code. To use the SDK, add it to dependencies in your `Package.swift` file.

```swift
dependencies: [
    .package(url: "https://git.xx.network/elixxir/elixxir-dapps-sdk-swift")
]
```

## Initialization
The instructions below describe how to initialize the client and connect to the network.

1. First, you will need to create a secure area to store client data. You can do this by creating a `PasswordStorage` for saving and loading your client storage. For example purposes we will use UserDefaults, but really encourage you to not use it and use `Keychain`  instead. 

```swift
let demoPasswordStorage = PasswordStorage(
  save: { password in
    UserDefaults.standard.set(password, forKey: "SDKPassword")
  },
  load: {
    UserDefaults.standard.value(forKey: "SDKPassword") as! Data
  })
```

2. Next, create a client storage to manage client data stored on disk.

```swift
let clientStorage = ClientStorage.live(passwordStorage: demoPasswordStorage)
```

3. If a client storage already exists, load it instead of creating a new one.

```swift
let client = Client

/*
//loadClient is a blocking call, do it on the background thread
//createClient is a blocking call, do it on the background thread
*/

if clientStorage.hasStoredClient() {
   client = try? clientStorage.loadClient()
} else {
   client = try? clientStorage.createClient()
}
```

4. Next, create an identity. You will need to create a connection later.

```swift
/*
//Blocking call, do it on the background thread
*/
let myIdentity = try client.makeIdentity()
```

5. Start the network follower.

```swift
let networkFollower = client.networkFollower

/*
//Blocking call, do it on the background thread
//Time is in millisecond
*/
try networkFollower.start(timeoutMS: 30_000) 
```

6. Finally, wait for the network to be connected.       

```swift
/*
//Blocking call, do it on the background thread
//Time is in millisecond
*/
let isConnected = client.waitForNetwork(30_000)  
guard isConnected else { /* try again */ }
```

## Send Rest-like message
The instructions below describe how to use the restlike API to send requests and receive messages like a rest API.

1. First, to initiate a connection with the remote, use an unauthenticated connection. (To get remote identity, please refer to [this](https://git.xx.network/elixxir/client/-/blob/release/restlike/README.md) )

```swift
/*
//Blocking call, do it on the background thread
// You need your remote identity.
*/
let connection = try client.connect(withAuthentication: false, recipientContact: REMOTE_IDENTITY, myIdentity: myIdentity)
```

2. Next, create a RequestSender.

```swift
let restLikeRequestSender = RestlikeRequestSender.live(authenticated: false)
```

3. Create your request that you will send.

```swift
/*
//All fields are customizable to meet your remote configuration
//Content accepts any json encoded object, this is where you include your request body
//Method number is used to refer to get, post, put, etc.
*/
let request = RestlikeMessage(
   version: Int,
   headers: YOUR_HEADERS,
   content: YOUR_JSON_ENCODED_MODEL,
   method: Int,
   Uri: String,
   error: String)
```

4. Send your request and wait for a response.

```swift
/*
//Blocking call, do it on the background thread
//Response is RestLikeMessage object
*/

let response = try? restLikeRequestSender.send(
   client.getId(),
   connection!.getId(),
   request)

/* 
//Jumping to the main thread to update any UI with the response
*/
DispatchQueue.main.async {
   let message = response 
//Use the response message here to update UI
}
```

## Send E2E message
1. Initiate a connection with the remote. We will use an unauthenticated connection.  (To get remote identity, please refer to [this](https://git.xx.network/elixxir/client/-/blob/release/restlike/README.md) )

```swift
/*
//Blocking call, do it on the background thread
// You need your remote identity.
*/
let connection = try client.connect(
  withAuthentication: false,
  recipientContact: REMOTE_IDENTITY,
  myIdentity: myIdentity)
```

2. Setup your messages listener.

```swift
/*
//Blocking call, do it on the background thread
//messageType value must be same as the value you will use to send a message
*/
connection.listen(messageType: Int) { message in
/* 
//Jumping to the main thread to update any UI with the message
*/
  DispatchQueue.main.async {
    let msg = message
    //Use the received message here to update UI
  }
}
```

3. Send the message and wait to get the send report, which contains the delivery status.

```swift
/*
//Blocking call, do it on the background thread
//messageType value must be same as the value you used to setup your messages listener
*/
let sendReport = try connection?.send(
  messageType: Int,
  payload: YOUR_JSON_ENCODED_MODEL)
```

4. Wait for the message to be delivered and update the UI if needed.

```swift
/*
//Blocking call, do it on the background thread
//Time is in millisecond
*/

client.waitForDelivery(report: sendReport, timeoutMS: 30_000) { result in
/* 
//Jumping to the main thread to update any UI
*/
  DispatchQueue.main.async {
    switch result {
      case .delivered(let roundResults):
      // You can stop loading indicator here for example
      case .notDelivered:
      //Show error popup here for example
    }
  }
}
```


