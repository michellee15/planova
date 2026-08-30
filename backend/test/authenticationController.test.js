const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const userModelPath = require.resolve("../src/models/userModel");
const controllerPath = require.resolve(
  "../src/controllers/authenticationController"
);

const loadController = (userModel = {}) => {
  delete require.cache[controllerPath];
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: userModel,
  };
  return require(controllerPath);
};

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("registerUser creates an account immediately", async () => {
  let createdUserData;
  const controller = loadController({
    findUserByEmail: async () => null,
    createUser: async (data) => {
      createdUserData = data;
      return {id: 9, name: data.name, email: data.email};
    },
  });
  const response = createResponse();

  await controller.registerUser(
    {
      body: {
        name: "  Casey  ",
        email: "Casey@Example.com",
        password: "secret-password",
      },
    },
    response
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.message, "Account created. You can now sign in.");
  assert.equal(createdUserData.name, "Casey");
  assert.equal(createdUserData.email, "casey@example.com");
  assert.equal(typeof createdUserData.password_hash, "string");
  assert.deepEqual(Object.keys(createdUserData).sort(), [
    "email",
    "name",
    "password_hash",
  ]);
});

test("loginUser issues a JWT for a valid account", async () => {
  const passwordHash = await bcrypt.hash("secret-password", 4);
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-jwt-secret";
  const controller = loadController({
    findUserByEmail: async () => ({
      id: 11,
      name: "Casey",
      email: "casey@example.com",
      password_hash: passwordHash,
      created_at: new Date(),
    }),
  });
  const response = createResponse();

  try {
    await controller.loginUser(
      {
        body: {
          email: "casey@example.com",
          password: "secret-password",
        },
      },
      response
    );
  } finally {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.body.token, "string");
  assert.equal(response.body.user.email, "casey@example.com");
});
