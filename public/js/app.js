import {$} from './helper.js'
import * as action from './action.js'

// global variables
let app

// custom JQuery like syntax initializer
Element.prototype.on = Element.prototype.addEventListener
Document.prototype.ready = (cb) => document.addEventListener('DOMContentLoaded', cb)


$(document).ready(() => {
  // activate side nav
  var elems = $('.sidenav')
  var instances = M.Sidenav.init(elems, {edge: 'left', draggable: true})
  
  app = firebase.app()
  action.loadLoginPage()
  
})


$('#button-login').on('click', async (e) => {
  e.preventDefault()
  
  await action.signIn()
})

$('#button-chat-back').on('click', (e) => {
  // console.log(e)
  action.switchToMainPage()
})

$('#button-logout').on('click', async (e) => {
  
  await action.signOut()
})


$('#button-send').on('click', async (e) => {
  let inputEL = $('#chat-input')
  let msg = inputEL.value.trim()
  if (msg)
    action.sendMessage(msg)
  inputEL.value = ''
  inputEL.focus()
  
})

$('#chat-input').on('keyup', async (e) => {
  let inputEL = $('#chat-input')
  
  if (e.keyCode === 13) {
    e.preventDefault()
    let msg = inputEL.value.trim()
    if (msg)
      action.sendMessage(msg)
    inputEL.value = ''
    inputEL.focus()
  }
})



