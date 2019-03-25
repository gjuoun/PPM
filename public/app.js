// short hand for querySelector
const qs = (elementName) => document.querySelector(elementName)

document.addEventListener('DOMContentLoaded', (e) => {
  const app = firebase.app()
})


async function firebaseAuth() {
  const provider = new firebase.auth.GoogleAuthProvider()
  
  
  const {user} = await firebase.auth().signInWithPopup(provider)
  
  console.log(user)
  
  let userinfoEl = qs('#p-userinfo')
  userinfoEl.textContent = `Hello, ${user.displayName}`
  
  getCurrentUser()
}

function getCurrentUser() {
  let uid  = 'K7XiltbklZSw4rYk2zGpPyCCflr2'
  let user = firebase.auth().currentUser
  
  console.log('current user', user)
}

