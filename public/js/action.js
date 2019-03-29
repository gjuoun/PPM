import {$} from './helper.js'
import * as db from './db.js'

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

function switchToLoginPage() {
  show(loginPage)
  hide(mainPage)
  hide(chatPage)
}

function switchToMainPage() {
  show(mainPage)
  hide(chatPage)
  hide(loginPage)
}

function switchToChatPage() {
  show(chatPage)
  hide(mainPage)
  hide(loginPage)
}


function updateSiderBarInformation(user) {
  // console.log('siderbar', user)
  $('#sidebar-displayName').textContent = user.displayName
  $('#sidebar-email').textContent = user.email
  $('#siderbar-avatar').setAttribute('src', user.photoURL)
}


// loading page functions
function loadLoginPage() {
  switchToLoginPage()
}

function loadMainPage(user) {
  switchToMainPage()
  updateSiderBarInformation(user)
  displayConversationList(user)
}

function loadChatPage(user, conversationSetting, conversation) {
  switchToChatPage()
  updateChatHeader(conversationSetting)
  displayMessages(user, conversation)
  // console.log(user, conversationSetting, conversation)
}

function displayMessages(user, conversation) {
  console.log(user, conversation)
  scrollToChatBottom()
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
  return firebase.auth().signInWithPopup(provider)
}

async function signOut() {
  await firebase.auth().signOut()
  // hide($('.sidenav-overlay'))
  // loadLoginPage()
  window.location.href = './'
}


async function displayConversationList(user) {
  let conversationList = await db.getConversationList(user)
  
  for (let conversation of conversationList) {
    await displayConversation(user, conversation)
  }
}

async function displayConversation(user, conversation) {
  let {members, conId, messages} = conversation
  let conversationSetting = members.find((member) => {
    return member.uid === user.uid
  })
  
  let {conversationIcon, conversationTitle} = conversationSetting
  
  let template = $('conversation-template>li').cloneNode(true)
  template.querySelector('img')
    .setAttribute('src', conversationIcon)
  template.querySelector('span').textContent = conversationTitle
  template.querySelector('p').textContent = 'How are you?'
  template.id = conId
  template.addEventListener('click', (e) => {
    loadChatPage(user, conversationSetting, conversation)
  })
  // append it to conversation list
  $('#conversation-list').appendChild(template)
}

export {
  signIn,
  signOut,
  loadMainPage,
  loadChatPage,
  loadLoginPage,
  switchToMainPage
}
