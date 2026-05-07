const { MongoClient, ObjectId } = require("mongodb");

const DB_NAME = "infs3201_winter2026";

let client;
let db;

/**
 * connects to mongodb
 * @returns {Promise<void>}
 */
async function connect() {
  const uri = process.env.MONGO_URI;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);
}

/**
 * closes mongodb connection
 * @returns {Promise<void>}
 */
async function close() {
  if (client) {
    await client.close();
  }
}

/**
 * gets all employees
 * @returns {Promise<Array>}
 */
async function getEmployees() {
  return await db.collection("employees").find({}).toArray();
}

/**
 * saves the full employees list
 * @param {Array} employees
 * @returns {Promise<boolean>}
 */
async function saveEmployees(employees) {
  try {
    const col = db.collection("employees");
    await col.deleteMany({});
    if (employees.length > 0) {
      await col.insertMany(employees);
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

/**
 * finds employee by id
 * @param {string} employeeId
 * @returns {Promise<Object|null>}
 */
async function findEmployee(employeeId) {
  return await db.collection("employees").findOne({ _id: new ObjectId(employeeId) });
}

/**
 * gets all shifts
 * @returns {Promise<Array>}
 */
async function getShifts() {
  return await db.collection("shifts").find({}).toArray();
}

/**
 * finds shift by id
 * @param {string} shiftId
 * @returns {Promise<Object|null>}
 */
async function findShift(shiftId) {
  return await db.collection("shifts").findOne({ _id: new ObjectId(shiftId) });
}

/**
 * updates employee name and phone
 * @param {string} employeeId
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<boolean>}
 */
async function updateEmployee(employeeId, name, phone) {
  try {
    const col = db.collection("employees");
    const result = await col.updateOne(
      { _id: new ObjectId(employeeId) },
      { $set: { name: name, phone: phone } }
    );

    if (result.modifiedCount > 0) {
      return true;
    }

    if (result.matchedCount > 0) {
      return true;
    }

    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}





/**
 * finds user by username
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
async function findUser(username) {
  return await db.collection("users").findOne({ username: username });
}





/**
 * saves one session
 * @param {string} sessionKey
 * @param {string} username
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function saveSession(sessionKey, username, expiry) {
  await db.collection("sessions").insertOne({
    sessionKey: sessionKey,
    username: username,
    expiry: expiry
  });
}






/**
 * gets one session by key
 * @param {string} sessionKey
 * @returns {Promise<Object|null>}
 */
async function findSession(sessionKey) {
  return await db.collection("sessions").findOne({ sessionKey: sessionKey });
}





/**
 * deletes one session
 * @param {string} sessionKey
 * @returns {Promise<void>}
 */
async function deleteSession(sessionKey) {
  await db.collection("sessions").deleteOne({ sessionKey: sessionKey });
}





/**
 * updates session expiry
 * @param {string} sessionKey
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function updateSessionExpiry(sessionKey, expiry) {
  await db.collection("sessions").updateOne(
    { sessionKey: sessionKey },
    { $set: { expiry: expiry } }
  );
}






/**
 * adds one access log row
 * @param {string} username
 * @param {string} url
 * @param {string} method
 * @returns {Promise<void>}
 */
async function addAccessLog(username, url, method) {
  await db.collection("security_log").insertOne({
    timestamp: new Date(),
    username: username,
    url: url,
    method: method
  });
}





/**
 * resets failed login count
 * @param {string} username
 * @returns {Promise<void>}
 */
async function resetFailedLogins(username) {
  await db.collection("users").updateOne(
    { username: username },
    { $set: { failedLogins: 0 } }
  );
}

/**
 * adds 1 failed login
 * @param {string} username
 * @returns {Promise<number>}
 */
async function incrementFailedLogins(username) {
  const col = db.collection("users");

  await col.updateOne(
    { username: username },
    { $inc: { failedLogins: 1 } }
  );

  const user = await col.findOne({ username: username });

  if (!user) {
    return 0;
  }

  return user.failedLogins;
}

/**
 * locks one user
 * @param {string} username
 * @returns {Promise<void>}
 */
async function lockUser(username) {
  await db.collection("users").updateOne(
    { username: username },
    { $set: { locked: true } }
  );
}

/**
 * saves 2fa code and expiry
 * @param {string} username
 * @param {string} code
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function saveTwoFactorCode(username, code, expiry) {
  await db.collection("users").updateOne(
    { username: username },
    {
      $set: {
        twoFactorCode: code,
        twoFactorExpiry: expiry
      }
    }
  );
}

/**
 * clears 2fa code and expiry
 * @param {string} username
 * @returns {Promise<void>}
 */
async function clearTwoFactorCode(username) {
  await db.collection("users").updateOne(
    { username: username },
    {
      $set: {
        twoFactorCode: "",
        twoFactorExpiry: null
      }
    }
  );
}






/**
 * gets documents for one employee
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
async function getEmployeeDocuments(employeeId) {
  return await db.collection("employee_docs").find({ employeeId: employeeId }).toArray();
}

/**
 * counts documents for one employee
 * @param {string} employeeId
 * @returns {Promise<number>}
 */
async function countEmployeeDocuments(employeeId) {
  return await db.collection("employee_docs").countDocuments({ employeeId: employeeId });
}

/**
 * to save one document row
 * @param {string} employeeId
 * @param {string} originalName
 * @param {string} storedName
 * @returns {Promise<void>}
 */
async function addEmployeeDocument(employeeId, originalName, storedName) {
  await db.collection("employee_docs").insertOne({
    employeeId: employeeId,
    originalName: originalName,
    storedName: storedName,
    uploadedAt: new Date()
  });
}

/**
 * finds one document by id
 * @param {string} docId
 * @returns {Promise<Object|null>}
 */
async function findEmployeeDocument(docId) {
  return await db.collection("employee_docs").findOne({ _id: new ObjectId(docId) });
}






/**
 * creates persistence object
 * @returns {Object}
 */
function createPersistence() {
  return {
    connect: connect,
    close: close,
    getEmployees: getEmployees,
    saveEmployees: saveEmployees,
    findEmployee: findEmployee,
    getShifts: getShifts,
    findShift: findShift,
    updateEmployee: updateEmployee,
    findUser: findUser,
    saveSession: saveSession,
    findSession: findSession,
    deleteSession: deleteSession,
    updateSessionExpiry: updateSessionExpiry,
    addAccessLog: addAccessLog,
    resetFailedLogins: resetFailedLogins,
    incrementFailedLogins: incrementFailedLogins,
    lockUser: lockUser,
    saveTwoFactorCode: saveTwoFactorCode,
    clearTwoFactorCode: clearTwoFactorCode,
    getEmployeeDocuments: getEmployeeDocuments,
    countEmployeeDocuments: countEmployeeDocuments,
    addEmployeeDocument: addEmployeeDocument,
    findEmployeeDocument: findEmployeeDocument,




  };
}

module.exports = createPersistence;