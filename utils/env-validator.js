/**
 * Validates the presence of required environment variables.
 * @param {string | string[]} vars - A single environment variable name or an array of names.
 * @throws Will throw an error if any required environment variable is missing.
 */
function validateEnv(vars) {
  const variables = Array.isArray(vars) ? vars : [vars]; // Ensure it's always an array
  const missingVars = variables.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

module.exports = { validateEnv };
