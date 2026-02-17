import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { 
        type: String, 
        enum: ['citizen', 'authority', 'admin'], 
        default: 'citizen' 
    },
    phoneNumber: { type: String },
    location: {
        city: String,
        district: String 
    },
    joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
export default User;
