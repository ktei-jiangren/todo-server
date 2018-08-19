const Datastore = require("@google-cloud/datastore");
const uuidv4 = require("uuid/v4");

const NAMESPACE = "todo";

const datastore = new Datastore({
  namespace: NAMESPACE,
  projectId: process.env.PROJECT_ID
});

async function getById(id) {
  const key = datastore.key(["Item", id]);
  const items = await datastore.get(key);
  return items.length > 0 ? items[0] : null;
}

async function save(item) {
  item.id = item.id || uuidv4();
  const key = datastore.key(["Item", item.id]);
  await datastore.save({
    key,
    data: item
  });
  return item;
}

async function getAllByUserId(userId) {
  const query = datastore
    .createQuery(NAMESPACE, "Item")
    .filter("userId", "=", userId);
  const items = await datastore.runQuery(query);
  return items;
}

async function remove(id) {
  const key = datastore.key(["Item", id]);
  await datastore.delete(key);
}

exports.getById = getById;
exports.getAllByUserId = getAllByUserId;
exports.save = save;
exports.remove = remove;
