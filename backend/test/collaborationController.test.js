const test = require("node:test");
const assert = require("node:assert/strict");

const modelPath = require.resolve("../src/models/collaborationModel");
const userModelPath = require.resolve("../src/models/userModel");
const controllerPath = require.resolve(
  "../src/controllers/collaborationController"
);

const loadControllerWithModels = (collaborationModel) => {
  delete require.cache[controllerPath];
  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: collaborationModel,
  };
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: {},
  };
  return require(controllerPath);
};

test("getCollaborators includes the owner for an invited editor", async () => {
  const owner = {
    user_id: 12,
    name: "User A",
    email: "usera@example.com",
    role: "owner",
  };
  const collaborators = [
    {
      id: 8,
      user_id: 22,
      name: "User B",
      email: "userb@example.com",
      status: "accepted",
    },
  ];
  const collaboratorCalls = [];
  const controller = loadControllerWithModels({
    getTripAccess: async () => "editor",
    getTripOwner: async () => owner,
    getCollaborators: async (...args) => {
      collaboratorCalls.push(args);
      return collaborators;
    },
  });
  let responseBody;
  const response = {
    json: (body) => {
      responseBody = body;
    },
    status: () => response,
  };

  await controller.getCollaborators(
    { params: { tripId: "44" }, user: { id: 22 } },
    response
  );

  assert.deepEqual(responseBody, {
    access_role: "editor",
    owner,
    collaborators,
  });
  assert.deepEqual(collaboratorCalls, [["44", false]]);
});
