const test = require("node:test");
const assert = require("node:assert/strict");

const modelPath = require.resolve("../src/models/memberModel");
const controllerPath = require.resolve("../src/controllers/memberController");

const loadControllerWithModel = (memberModel) => {
  delete require.cache[controllerPath];
  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: memberModel,
  };
  return require(controllerPath);
};

test("deleteMember rejects deletion of a registered trip participant", async () => {
  const controller = loadControllerWithModel({
    deleteMember: async () => ({
      protected: true,
      member: { id: 9, trip_id: 11, user_id: 22, name: "Collaborator" },
    }),
  });
  let statusCode;
  let responseBody;
  const response = {
    status: (code) => {
      statusCode = code;
      return response;
    },
    json: (body) => {
      responseBody = body;
    },
  };

  await controller.deleteMember(
    { params: { id: "9" }, user: { id: 7 } },
    response
  );

  assert.equal(statusCode, 409);
  assert.deepEqual(responseBody, {
    message: "Registered members must be managed through trip collaboration settings.",
  });
});
