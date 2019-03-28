// short hand for querySelector
let message = []

const $ = (elementName) => document.querySelector(elementName)
const eventListen = (element, event, callback) => {
  document.querySelector(element).addEventListener(event, callback)
}


document.addEventListener('DOMContentLoaded', (e) => {
  const app = firebase.app()
  
  const db = firebase.firestore()
  
  const myPostsRef = db.collection('posts')
  
  const query = myPostsRef.orderBy('createdAt', 'desc').limit(2)
  
  // myPost.get()
  //   .then((doc) => {
  //     const data = doc.data()
  //     console.log(data)
  //   })
  
  // listen to the stream and get update
  // myPostsRef.onSnapshot((doc) => {
  //   const data = doc
  //   console.log(data)
  //
  //
  // })
  
  // query.get().then((posts) => {
  //   posts.forEach((doc) => {
  //     console.log(doc.data())
  //   })
  // })
  
  query.onSnapshot((posts) => {
    posts.forEach((doc) => {
      console.log(doc.data())
    })
  })
})


function updateTitle(e) {
  const db = firebase.firestore()
  const myPost = db.collection('posts').doc('firstpost')
  
  myPost.update({title: e.target.value})
}


async function firebaseAuth() {
  const provider = new firebase.auth.GoogleAuthProvider()
  
  
  const {user} = await firebase.auth().signInWithPopup(provider)
  
  console.log(user)
  
  let userinfoEl = $('#p-userinfo')
  userinfoEl.textContent = `Hello, ${user.displayName}`
  
  getCurrentUser()
}

function getCurrentUser() {
  let uid = 'K7XiltbklZSw4rYk2zGpPyCCflr2'
  let user = firebase.auth().currentUser
  
  console.log('current user', user)
}


function putNewPost() {
  const db = firebase.firestore()
  const postRef = db.collection('posts')
  
  let timeNow = new firebase.firestore.Timestamp(seconds = 1553698813)
  
  postRef.add({title: 'time item', createdAt: timeNow}).then((doc) => {
    console.log(doc)
  })
}
