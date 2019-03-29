import {$} from './helper.js'
import User from './model.js'
import * as db from './db.js'
import * as action from './action.js'

// global variables
let app, user, conversationList, currentConversation


const whenDocumentIsReady = (callback) => {
  document.addEventListener('DOMContentLoaded', callback)
}


whenDocumentIsReady(async () => {
  // activate side nav
  var elems = $('.sidenav')
  var instances = M.Sidenav.init(elems, {edge: 'left', draggable: true})
  
  app = firebase.app()
  action.loadLoginPage()
  
})


$('#button-login').addEventListener('click', async (e) => {
  e.preventDefault()
  
  await action.signIn()
  let googleUser = await db.getCurrentGoogleUser()
  user = await db.getUserByUid(googleUser.uid)
  
  if (googleUser && user) {
    action.loadMainPage(user)
    // await db.getConversationList(user)
    // user.activeConversations.push('bEcPOope6KVoeHg8Ivmz')
    await db.updateUser(user)
  } else if (googleUser && !user) {
    await db.createUser(googleUser)
    user = await db.getUserByUid(googleUser.uid)
    action.loadMainPage(user)
  }
  
})

$('#button-chat-back').addEventListener('click', (e) => {
  // console.log(e)
  action.switchToMainPage()
})

$('#button-logout').addEventListener('click', async (e) => {
  // console.log(e)
  user = null
  await action.signOut()
})


