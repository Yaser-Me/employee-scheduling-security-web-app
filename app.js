"use strict";
const path = require("path");
const express = require("express");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const multer = require("multer");

const fs = require("fs");

const { createEmailSystem } = require("./emailSystem");


const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "employee_docs"));
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + "-" + file.originalname;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }

    cb(null, true);
  }
});





// I need these to talk to the logic layers
const createPersistence = require("./persistence");
const { createBusiness } = require("./business");

// setup handlebars for the views
app.engine("hbs", exphbs.engine({ extname: ".hbs", defaultLayout: false }));
app.set("view engine", "hbs");

// just point directly to the folders
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));



const persistence = createPersistence();
const emailSystem = createEmailSystem();
const business = createBusiness(persistence, emailSystem);



app.get("/login", function (req, res) {
  let message = "";

  if (req.query.message) {
    message = String(req.query.message);
  }

  res.render("login", { message: message });
});




app.post("/login", async function (req, res) {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();

  const result = await business.startLogin(username, password);

  if (!result.ok) {
    res.redirect("/login?message=" + encodeURIComponent(result.message));
    return;
  }

  res.redirect("/twofactor?username=" + encodeURIComponent(username));
});




app.get("/twofactor", function (req, res) {
  const username = String(req.query.username || "").trim();
  let message = "";

  if (req.query.message) {
    message = String(req.query.message);
  }

  res.render("twofactor", {
    username: username,
    message: message
  });
});

app.post("/twofactor", async function (req, res) {
  const username = String(req.body.username || "").trim();
  const code = String(req.body.code || "").trim();

  const result = await business.verifyTwoFactor(username, code);

  if (!result.ok) {
    res.redirect("/twofactor?username=" + encodeURIComponent(username) + "&message=" + encodeURIComponent(result.message));
    return;
  }

  res.cookie("sessionKey", result.sessionKey);
  res.redirect("/");
});


app.get("/logout", async function (req, res) {
  const sessionKey = req.cookies.sessionKey;

  await business.logout(sessionKey);

  res.clearCookie("sessionKey");
  res.redirect("/login");
});


app.use(async function (req, res, next) {
  const sessionKey = req.cookies.sessionKey;
  const ok = await business.isValidSession(sessionKey);

  if (!ok) {
    await business.logAccess(sessionKey, req.originalUrl, req.method);
    res.redirect("/login?message=please login");
    return;
  }

  await business.refreshSession(sessionKey);
  await business.logAccess(sessionKey, req.originalUrl, req.method);
  next();
});




// landing page: show all the names from the database
app.get("/", async function (req, res) {
  const employees = await business.getAllEmployees();
  res.render("home", { employees: employees });
});




app.get("/employee/:id/photo", async function (req, res) {
  const employeeId = String(req.params.id).trim();

  const emp = await business.getEmployee(employeeId);
  if (!emp) {
    res.status(404).send("Employee not found");
    return;
  }

  let fileName = "employee.png";

  if (emp.photo && String(emp.photo).trim().length > 0) {
    fileName = String(emp.photo).trim();
  }

  const filePath = path.join(__dirname, "photos", fileName);
  res.sendFile(filePath);
});



// employee details page
app.get("/employee/:id", async function (req, res) {
  const employeeId = String(req.params.id).trim();

  const emp = await business.getEmployee(employeeId);
  if (!emp) {
    res.status(404).send("Employee not found");
    return;
  }

  const result = await business.getEmployeeSchedule(employeeId);
  const documents = await business.getEmployeeDocuments(employeeId);

  let rows = [];
  if (result.ok) {
    rows = result.rows;
  }

  const shifts = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];

    let startClass = "";
    const hourText = row.startTime.split(":")[0];
    const hour = parseInt(hourText);

    if (hour < 12) {
      startClass = "morning";
    }

    shifts.push({
      date: row.date,
      startTime: row.startTime,

      endTime: row.endTime,
      startClass: startClass
    });

    i++;
  }

  res.render("employee", { employee: emp, shifts: shifts, documents: documents });
});




app.post("/employee/:id/upload", function (req, res) {
  const employeeId = String(req.params.id).trim();

  upload.single("document")(req, res, async function (err) {
    if (err) {
      res.send(String(err.message || "Upload failed"));
      return;
    }

    if (!req.file) {
      res.send("Please choose a PDF file");
      return;
    }

    const result = await business.uploadEmployeeDocument(
      employeeId,
      req.file.originalname,
      req.file.filename
    );

        if (!result.ok) {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, function (err) {
          if (err) {
            console.log(err);
          }
        });
      }

      res.send(result.message);
      return;
    }

    res.redirect("/employee/" + employeeId);
  });
});





app.get("/document/:id", async function (req, res) {
  const docId = String(req.params.id).trim();

  const doc = await business.getEmployeeDocument(docId);
  if (!doc) {
    res.status(404).send("Document not found");
    return;
  }

  const filePath = path.join(__dirname, "employee_docs", doc.storedName);
  res.sendFile(filePath);
});



// connect to the database, then start the server if it works
persistence.connect().then(function () {
  console.log("Connected to MongoDB successfully");

  app.listen(8000, function () {
    console.log("the server is running at http://localhost:8000");
  });
}).catch(function (err) {
  console.log("Could not connect to MongoDB");
  console.log(err);
});



app.get("/employee/:id/edit", async function (req, res) {
  const employeeId = String(req.params.id).trim();

  const emp = await business.getEmployee(employeeId);
  if (!emp) {
    res.status(404).send("Employee not found");
    return;
  }

  res.render("edit-employee", { employee: emp });
});

function isValidPhone(phone) {
  if (!phone || phone.length !== 9) {
    return false;
  }

  let i = 0;
  while (i < phone.length) {
    const c = phone[i];

    if (i === 4) {
      if (c !== "-") {
        return false;
      }
    } else {
      if (c < "0" || c > "9") {
        return false;
      }
    }

    i++;
  }

  return true;
}

app.post("/employee/:id/edit", async function (req, res) {
  const employeeId = String(req.params.id).trim();

  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();

  // check if name is empty
  if (name.length === 0) {
    res.send("Name must not be empty");
    return;
  }

  // check phone format dddd-dddd
  if (!isValidPhone(phone)) {
    res.send("Phone must be like 5555-0101");
    return;
  }

  const ok = await business.updateEmployeeDetails(employeeId, name, phone);
  if (!ok) {
    res.status(404).send("Employee not found");
    return;
  }

  // PRG: after post, go back to landing page
  res.redirect("/");
});