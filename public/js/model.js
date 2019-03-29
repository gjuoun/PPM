class User {
  constructor(firebaseUser) {
    this.displayName = firebaseUser.displayName
    this.alias = firebaseUser.alias
    this.uid = firebaseUser.uid
    this.photoURL = firebaseUser.photoURL
    this.email = firebaseUser.email
    this.settings = firebaseUser.settings
    this.historyConversations = firebaseUser.historyConversations
    this.activeConversations = firebaseUser.activeConversations
    this.contacts = firebaseUser.contacts
  }
}

export default User
