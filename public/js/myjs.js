// helper functions
const $ = (elementName) => document.querySelector(elementName)
const eventListen = (element, event, callback) => {
  document.querySelector(element).addEventListener(event, callback)
}
const documentReady = (callback) => {
  document.addEventListener('DOMContentLoaded', callback)
}
// global elements
const loginPage = $('#login-container')
const mainPage = $('#mainpage-container')
const chatPage = $('#chat-container')
//-----
const loginButton = $('#button-login')


// firebase shortcuts
const getCurrentUser = () => firebase.auth().currentUser

// global variables
let db, app, user


// shortcuts for page display
const show = (el) => {
  el.style.display = 'block'
}
const hide = (el) => {
  el.style.display = 'none'
}


documentReady(() => {
  // activate side nav
  var elems = $('.sidenav')
  var instances = M.Sidenav.init(elems, {edge: 'left', draggable: true})
  
  app = firebase.app()
  db = firebase.firestore()
  
  show(loginPage)
  hide(mainPage)
  hide(chatPage)
  
})


loginButton.addEventListener('click', async (e) => {
  e.preventDefault()
  
  const provider = new firebase.auth.GoogleAuthProvider()
  await firebase.auth().signInWithPopup(provider)
  
  user = getCurrentUser()
  console.log(user)
  show(mainPage)
  hide(chatPage)
  hide(loginPage)
  
  updateSiderBarInformation()
  updateDB()
})


function updateSiderBarInformation() {
  $('#sidebar-displayName').textContent = user.displayName
  $('#sidebar-email').textContent = user.email
  $('#siderbar-avatar').setAttribute('src', user.photoURL)
}

function updateDB() {
  
}
