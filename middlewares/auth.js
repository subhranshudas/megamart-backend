function isAuthenticated(req, res, next) {
  // Check if the session exists and if the userId is set in the session
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware or route handler
    return next();
  } else {
    // User is not authenticated, respond with an error
    return res.status(401).json({ message: "Unauthorized access" });
  }
}

module.exports = isAuthenticated;
