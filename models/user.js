const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// has the password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);

    // hash password
    this.password = await bcrypt.hash(this.password, salt);

    // continue saving the document
    next();
  } catch (err) {
    next(err);
  }
});

/**
 *
 * @param {*} password req body password
 * @returns
 */
UserSchema.methods.comparePassword = function (password) {
  // this.password = hashed password from mongodb
  return bcrypt.compare(password, this.password);
};

// mongoose takes "User" model and makes it as "users" collection in mongoDB
module.exports = mongoose.model("User", UserSchema);
