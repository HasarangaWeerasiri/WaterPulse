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
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                // Sri Lankan mobile number regex: allows 0 or +94 prefix and ensures 10 digits
                return /^(?:0|94|\+94)?7(?:0|1|2|4|5|6|7|8)\d{7}$/.test(v);
            },
            message: props => `${props.value} is not a valid Sri Lankan phone number!`
        }
    },
    location: {
        city: String,
        district: String 
    },
    joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
export default User;
