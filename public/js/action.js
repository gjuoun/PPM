import {$} from './helper.js'
import * as db from './db.js'

let currentUser = null, currentConversation = ''
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

function openSearchbar() {
  let normalEl = $('#nav-normal')
  let searchEl = $('#nav-search')
  let inputSearchEl = $('#input-search')
  let inputSearchListener = null
  hide(normalEl)
  show(searchEl)
  inputSearchEl.focus()
  
  inputSearchEl.addEventListener('keyup', keyupFunction)
  
  inputSearchEl.on('blur', (e) => {
    closeSearchbar()
  })
  
  
}

async function keyupFunction(e) {
  let inputSearchEl = $('#input-search')
  e.preventDefault()
  
  if (e.keyCode === 13) {
    let userInput = inputSearchEl.value
    await searchUser(userInput)
  }
}

async function searchUser(userInput) {
  let findUser = await db.getUserByEmail(userInput)
  if (findUser)
    if (findUser.uid !== currentUser.uid) {
      await searchToTalk(findUser)
    } else {
      alert('Self talk is not allowed.')
    }
  else
    alert('No such a user')
}

async function searchToTalk(targetUser) {
  let currentUserUpdated = await db.getUserByUid(currentUser.uid)
  let targetUserUpdated = await db.getUserByUid(targetUser.uid)
  
  let currentContact = currentUserUpdated.contacts
  let targetContact = targetUserUpdated.contacts
  
  if (currentContact.includes(targetUserUpdated.uid)
    && targetContact.includes(currentUserUpdated.uid)) {
    let conv = await db.findTargetConversationByTwoUserId(currentUserUpdated.uid, targetUserUpdated.uid)
    await loadChatPage(currentUserUpdated, conv)
  } else {
    console.log('not multi user')
    if (!targetContact.includes(currentUserUpdated.uid)
      && !currentContact.includes(targetUserUpdated.uid)) {
      
      currentContact.push(targetUserUpdated.uid)
      targetContact.push(currentUserUpdated.uid)
      
      let newConversation = await db.createNewConversation(currentUserUpdated, targetUserUpdated)
      
      // update contact list
      currentUserUpdated.contacts = currentContact
      targetUserUpdated.contacts = targetContact
      // update conversation list
      currentUserUpdated.activeConversations.push(newConversation.conId)
      targetUserUpdated.activeConversations.push(newConversation.conId)
      
      await db.updateUser(currentUserUpdated)
      await db.updateUser(targetUserUpdated)
      await loadChatPage(currentUserUpdated, newConversation)
    }
  }
}


function closeSearchbar() {
  let normalEl = $('#nav-normal')
  let searchEl = $('#nav-search')
  let inputSearchEl = $('#input-search')
  inputSearchEl.value = ''
  inputSearchEl.removeEventListener('keyup', keyupFunction)
  
  hide(searchEl)
  show(normalEl)
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
    currentUser = doc.data()
    
    await displayConversationList(currentUser)
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
  if (msg.sender === currentUser.uid)
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
  db.postMessage(msg, currentUser, currentConversation.conId)
  // loadChatPage(loggedInUser, currentConversation)
}

function updateChatHeader(conversationSetting) {
  let {conversationTitle, conversationIcon} = conversationSetting
  let chatHeaderEl = $('#chat-header-title')
  chatHeaderEl.querySelector('img').setAttribute('src', conversationIcon)
  chatHeaderEl.querySelector('span').textContent = conversationTitle
  // console.log(conversationSetting)
}


async function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider()
  await firebase.auth().signInWithPopup(provider)
  
  let googleUser = await db.getCurrentGoogleUser()
  currentUser = await db.getUserByUid(googleUser.uid)
  
  if (googleUser && currentUser) {
    loadMainPage(currentUser)
    await db.updateUser(currentUser)
  } else if (googleUser && !currentUser) {
    await db.createUser(googleUser)
    currentUser = await db.getUserByUid(googleUser.uid)
    loadMainPage(currentUser)
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
  
  let updatedUesr = await db.getUserByUid(currentUser.uid)
  
  let {contacts} = updatedUesr
  let usersList = []
  
  for (let contactUid of contacts) {
    let user = db.getUserByUid(contactUid)
    usersList.push(user)
  }
  
  Promise.all(usersList).then((users) => {
    for (let targetUser of users)
      displayContact(currentUser, targetUser)
  })
  
}


function displayContact(currentUser, targetUser) {
  let contactsListEl = $('#contacts-list')
  
  let template = $('contact-template>li').cloneNode(true)
  template.id = 'contact-' + targetUser.uid
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
  let currentUserUpdated = await db.getUserByUid(currentUser.uid)
  let targetUserUpdated = await db.getUserByUid(targetUser.uid)
  
  // console.log('we have ', currentUserUpdated)
  // console.log('we have targer', targetUserUpdated)
  
  // trying to find two members in a conversation
  let findMembers = false
  for (const conversation of conversations) {
    
    let {members: [first, second]} = conversation
    let membersUids = [first.uid, second.uid]
    
    if (membersUids.includes(targetUserUpdated.uid) && membersUids.includes(currentUser.uid)) {
      findMembers = true
      // load conversation
      await loadChatPage(currentUserUpdated, conversation)
      break
    }
  }
  
  if (!findMembers) {
    // create and get new conversation
    console.log()
    let newConversation = await db.createNewConversation(currentUserUpdated, targetUserUpdated)
    console.log('new conv', newConversation)
    currentUserUpdated.activeConversations.push(newConversation.conId)
    targetUserUpdated.activeConversations.push(newConversation.conId)
    // currentUserUpdated.historyConversations.push(newConversation.conId)
    // targetUserUpdated.historyConversations.push(newConversation.conId)
    //
    console.log('new conversation', newConversation)
    await db.updateUser(currentUserUpdated)
    await db.updateUser(targetUserUpdated)
    await loadChatPage(currentUserUpdated, newConversation)
    
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
  displayContactsList,
  openSearchbar,
  closeSearchbar
}
