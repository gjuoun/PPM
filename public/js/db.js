import User from './model.js'

const db = firebase.firestore()

// return google user object
async function getCurrentGoogleUser() {
  return firebase.auth().currentUser
}

async function updateUser(user) {
  return db.collection('users').doc(user.uid).set(user)
}


// return uid :str
async function createUser(googleUser) {
  const {displayName, uid, photoURL, email} = googleUser
  
  let newuser = {
    displayName,
    alias: displayName,
    uid,
    photoURL,
    email,
    settings: {},
    historyConversations: [],
    activeConversations: [],
    contacts: []
  }
  return db.collection('users').doc(uid).set(newuser)
}

async function getUserByUid(uid) {
  let result = await db.collection('users').doc(uid).get()
  if (result.exists) {
    return result.data()
  } else
    return null
}


// return conversationList: arr
async function getConversationList(user) {
  if (!user)
    return null
  const conversations = []
  
  for (let conversationId of user.activeConversations) {
    let conversationRef = db.collection('conversations').doc(conversationId)
    let result = await conversationRef.get()
    // load messages
    if (result.exists) {
      result = await result.data()
      // result.messages = []
      
      // let {docs} = await conversationRef.collection('messages').get()
      
      // push messages to conversationList
      // for (let doc of docs)
      //   result.messages.push(doc.data())
      
      conversations.push(result)
    }
  }
  // console.log('conversation', conversations)
  return conversations
}


async function getConversation(conversationId) {

}

async function getMessages(conversationId) {

}

async function postMessage(msg, user, conId) {
  let messagesRef = db.collection('conversations')
    .doc(conId).collection('messages')
  let now = parseInt((new Date().getTime()) / 1000)
  let firestoreTimestamp = new firebase.firestore.Timestamp(now, 0)
  let result = await messagesRef.add({
    content: msg,
    sender: user.uid,
    photoURL: user.photoURL,
    timestamp: firestoreTimestamp
  })
  // update msgId in the msg document
  let messageDoc = await messagesRef.doc(result.id).get()
  let message = await messageDoc.data()
  message.msgId = result.id
  await messagesRef.doc(result.id).set(message)
}


export {
  getCurrentGoogleUser,
  getUserByUid,
  createUser,
  updateUser,
  getConversationList,
  getConversation,
  getMessages,
  postMessage
}
