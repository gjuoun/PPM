import {$} from './helper.js'
import * as db from './db.js'

let loggedInUser = null, currentConversation = ''
let chatListener = null, conversationListListener = null

// global elements
const loginPage = $('#login-container')
const mainPage = $('#mainpage-container')
const chatPage = $('#chat-container')

function scrollToChatBottom() {
  let chatEl = $('#chat-body')
  chatEl.scrollBy({top: chatEl.clientHeight, behaviour: 'smooth'})
}

// shortcuts for page display
const show = (el) => {
  el.style.display = 'block'
}
const hide = (el) => {
  el.style.display = 'none'
}

function closeSidenav() {
  let sidenavEl = $('.sidenav')
  let instance = M.Sidenav.getInstance(sidenavEl)
  instance.close()
}

function closeModal() {
  let modalEl = $('.modal')
  let instance = M.Modal.getInstance(modalEl)
  instance.close()
}

function switchToLoginPage() {
  show(loginPage)
  hide(mainPage)
  hide(chatPage)
}

function switchToMainPage() {
  show(mainPage)
  hide(chatPage)
  hide(loginPage)
  // unsubscribe the snapshot listener
  if (chatListener)
    chatListener()
}

function switchToChatPage() {
  show(chatPage)
  hide(mainPage)
  hide(loginPage)
  $('#chat-body').innerHTML = ''
  $('#chat-input').focus()
}


function updateSidernavInformation(user) {
  // console.log('siderbar', user)
  $('#sidebar-displayName').textContent = user.displayName
  $('#sidebar-email').textContent = user.email
  $('#siderbar-avatar').setAttribute('src', user.photoURL)
}


// loading page functions
function loadLoginPage() {
  switchToLoginPage()
}

async function loadMainPage(user) {
  updateSidernavInformation(user)
  await displayConversationList(user)
  switchToMainPage()
  listenToRealTimeConversationListUpdate(user)
}

async function loadChatPage(user, conversation) {
  let conversationSetting = conversation.members.find(member => member.uid === user.uid)
  currentConversation = conversation
  currentConversation.messages = []
  closeSidenav()
  closeModal()
  switchToChatPage()
  updateChatHeader(conversationSetting)
  listenToRealTimeMessageUpdate(conversation)
}


function listenToRealTimeMessageUpdate(conversation) {
  let mydb = firebase.firestore()
  let conversationRef = mydb.collection('conversations')
    .doc(conversation.conId).collection('messages')
  
  chatListener = conversationRef.orderBy('timestamp').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let newmsg = change.doc.data()
        if (!currentConversation.messages) {
          currentConversation.messages = []
          
        }
        currentConversation.messages.push(newmsg)
        console.log('new message', newmsg)
        displayMessage(newmsg)
        scrollToChatBottom()
      }
    })
  })
  
  currentConversation.messages = orderMessagesByTime(currentConversation.messages)
}

async function listenToRealTimeConversationListUpdate(user) {
  let mydb = firebase.firestore()
  let conversationRef = mydb.collection('users').doc(user.uid)
  
  conversationListListener = conversationRef.onSnapshot(async (doc) => {
    loggedInUser = doc.data()
    await displayConversationList(loggedInUser)
  })
  
  // currentConversation.messages = orderMessagesByTime(currentConversation.messages)
}


function orderMessagesByTime(messages) {
  return messages.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
}

function displayMessage(msg) {
  // console.log('msg', msg.sender)
  // console.log('loggedInUser', loggedInUser.uid)
  let template
  if (msg.sender === loggedInUser.uid)
    template = $('message-right-template>div').cloneNode(true)
  else
    template = $('message-left-template>div').cloneNode(true)
  template.querySelector('img')
    .setAttribute('src', msg.photoURL)
  template.querySelector('span').textContent = msg.content
  template.id = msg.msgId
  // append it to conversation list
  $('#chat-body').appendChild(template)
}


function sendMessage(msg) {
  db.postMessage(msg, loggedInUser, currentConversation.conId)
  // loadChatPage(loggedInUser, currentConversation)
}

function updateChatHeader(conversationSetting) {
  let {conversationTitle, conversationIcon} = conversationSetting
  let chatHeaderEl = $('#chat-header-title')
  chatHeaderEl.querySelector('img').setAttribute('src', conversationIcon)
  chatHeaderEl.querySelector('span').textContent = conversationTitle
  console.log(conversationSetting)
}


async function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider()
  await firebase.auth().signInWithPopup(provider)
  
  let googleUser = await db.getCurrentGoogleUser()
  loggedInUser = await db.getUserByUid(googleUser.uid)
  
  if (googleUser && loggedInUser) {
    loadMainPage(loggedInUser)
    await db.updateUser(loggedInUser)
  } else if (googleUser && !loggedInUser) {
    await db.createUser(googleUser)
    loggedInUser = await db.getUserByUid(googleUser.uid)
    loadMainPage(loggedInUser)
  }
}

async function signOut() {
  await firebase.auth().signOut()
  window.location.href = './'
}


async function displayConversationList(user) {
  let conversationList = await db.getConversationList(user)
  
  $('#conversation-list').innerHTML = ''
  
  for (let conversation of conversationList) {
    await displayConversation(user, conversation)
  }
}

async function displayConversation(user, conversation) {
  let {members, conId} = conversation
  let conversationSetting = members.find(member => member.uid === user.uid)
  
  let {conversationIcon, conversationTitle} = conversationSetting
  
  let template = $('conversation-template>li').cloneNode(true)
  template.querySelector('img')
    .setAttribute('src', conversationIcon)
  template.querySelector('span').textContent = conversationTitle
  template.querySelector('p').textContent = 'How are you?'
  template.id = conId
  template.addEventListener('click', (e) => {
    loadChatPage(user, conversation)
  })
  // append it to conversation list
  $('#conversation-list').appendChild(template)
}

async function displayContactsList() {
  
  let contactsListEl = $('#contacts-list')
  contactsListEl.innerHTML = ''
  
  let {contacts} = loggedInUser
  let usersList = []
  
  for (let contactUid of contacts) {
    let user = db.getUserByUid(contactUid)
    usersList.push(user)
  }
  
  Promise.all(usersList).then((users) => {
    for (let user of users)
      displayContact(loggedInUser, user)
  })
  
}


function displayContact(currentUser, targetUser) {
  let contactsListEl = $('#contacts-list')
  
  let template = $('contact-template>li').cloneNode(true)
  template.querySelector('img')
    .setAttribute('src', targetUser.photoURL)
  template.querySelector('span').textContent = targetUser.displayName
  template.querySelector('p').textContent = 'Last seen 9 mins ago'
  template.on('click', (e) => {
    createNewConversationOrLoadConversation(currentUser, targetUser)
  })
  contactsListEl.appendChild(template)
}

async function createNewConversationOrLoadConversation(currentUser, targetUser) {
  let conversations = await db.getConversations()
  // trying to find two members in a conversation
  for (const conversation of conversations) {
    let {conId, members} = conversation
    let membersUids = []
    for (const {uid} of members) {
      membersUids.push(uid)
    }
    if (membersUids.includes(currentUser.uid)
      && membersUids.includes(targetUser.uid)) {
      console.log('getConversation', conversation)
      // load conversation
      loadChatPage(currentUser, conversation)
    } else {
      // create and get new conversation
      let newConversation = await db.createNewConversation(currentUser, targetUser)
      currentUser.activeConversations.push(newConversation.conId)
      targetUser.activeConversations.push(newConversation.conId)
      currentUser.historyConversations.push(newConversation.conId)
      targetUser.historyConversations.push(newConversation.conId)
      
      await db.updateUser(currentUser)
      await db.updateUser(targetUser)
      loadChatPage(currentUser, newConversation)
    }
  }
}


export {
  signIn,
  signOut,
  loadMainPage,
  loadChatPage,
  loadLoginPage,
  switchToMainPage,
  sendMessage,
  closeSidenav,
  displayContactsList
}
