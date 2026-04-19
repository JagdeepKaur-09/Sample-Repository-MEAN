const mongoose = require("mongoose"); 
// Import mongoose library to define schema and interact with MongoDB

// Create a schema for User collection
const userSchema = new mongoose.Schema({

  name: String, 
  // Stores the name of the user as a string

  email: { 
    type: String, 
    unique: true 
  }, 
  // Stores user email
  // 'unique: true' ensures no two users can register with the same email

  password: String, 
  // Stores user password (in real applications, it should be hashed for security)

  faceDescriptor: { 
    type: [Number], 
    default: [] 
  }, 
  // Stores facial recognition data as an array of numbers
  // Default value is an empty array if no data is provided

  consentGiven: { 
    type: Boolean, 
    default: false 
  }, 
  // Stores whether user has given consent for face recognition
  // Default is false (no consent)

}, { 
  timestamps: true 
});
// 'timestamps: true' automatically adds:
// createdAt → when user is created
// updatedAt → when user is updated

// Export the model so it can be used in other files
module.exports = mongoose.model("User", userSchema);