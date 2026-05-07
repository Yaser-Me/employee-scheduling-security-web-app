"use strict";
const crypto = require("crypto");





/**
 * business layer
 *
 * @param {Object} persistence
 * @returns {Object}
 */
function createBusiness(persistence, emailSystem) {

    /**
     * checks login
     * @param {string} username
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    async function checkLogin(username, password) {
        const user = await persistence.findUser(username);

        if (!user) {
            return false;
        }

        const hash = crypto.createHash("sha256").update(password).digest("hex");

        if (user.password !== hash) {
            return false;
        }

        return true;
    }



    /**
     * makes a session for login
     * @param {string} username
     * @returns {Promise<string|null>}
     */
    async function createLoginSession(username) {
        const now = new Date();
        const expiry = new Date(now.getTime() + 300000); // 5 minutes
        const sessionKey = crypto.randomUUID();

        await persistence.saveSession(sessionKey, username, expiry);

        return sessionKey;
    }


    /**
     * checks if session is ok
     * @param {string} sessionKey
     * @returns {Promise<boolean>}
     */
    async function isValidSession(sessionKey) {
        if (!sessionKey) {
            return false;
        }

        const session = await persistence.findSession(sessionKey);

        if (!session) {
            return false;
        }

        const now = new Date();

        if (session.expiry <= now) {
            return false;
        }

        return true;
    }


    /**
     * removes one session
     * @param {string} sessionKey
     * @returns {Promise<void>}
     */
    async function logout(sessionKey) {
        if (!sessionKey) {
            return;
        }

        await persistence.deleteSession(sessionKey);
    }



    /**
     * adds 5 more minutes to session
     * @param {string} sessionKey
     * @returns {Promise<void>}
     */
    async function refreshSession(sessionKey) {
        if (!sessionKey) {
            return;
        }

        const now = new Date();
        const expiry = new Date(now.getTime() + 300000); // 5 minutes

        await persistence.updateSessionExpiry(sessionKey, expiry);
    }




    /**
     * writes one access log
     * @param {string} sessionKey
     * @param {string} url
     * @param {string} method
     * @returns {Promise<void>}
     */
    async function logAccess(sessionKey, url, method) {
        let username = "";

        if (sessionKey) {
            const session = await persistence.findSession(sessionKey);

            if (session) {
                username = session.username;
            }
        }

        await persistence.addAccessLog(username, url, method);
    }





    /**
     * return all employees
     * @returns {Promise<Array>}
     */
    async function getAllEmployees() {
        return await persistence.getEmployees();
    }

    /**
     * get one employee by id
     * @param {string} employeeId
     * @returns {Promise<Object|null>}
     */
    async function getEmployee(employeeId) {
        return await persistence.findEmployee(employeeId);
    }



    /**
     * updates employee details
     * @param {string} employeeId
     * @param {string} name
     * @param {string} phone
     * @returns {Promise<boolean>}
     */
    async function updateEmployeeDetails(employeeId, name, phone) {
        return await persistence.updateEmployee(employeeId, name, phone);
    }



    /**
     *  add employee and saves to file
     * @param {string} name
     * @param {string} phone
     * @returns {Promise<string>}
     */
    async function addNewEmployee(name, phone) {
        const employees = await persistence.getEmployees();

        const newId = generateNextEmployeeId(employees);

        employees.push({
            employeeId: newId,
            name: name,
            phone: phone
        });

        const ok = await persistence.saveEmployees(employees);
        if (ok) {
            return "Employee added";
        }
        return "Could not save employee";
    }

    /**
  * get schedule rows for an employee
  * @param {string} employeeId
  * @returns {Promise<Object>}
  */
    async function getEmployeeSchedule(employeeId) {
        const emp = await persistence.findEmployee(employeeId);

        if (!emp) {
            return { ok: false, message: "Employee doesn't exist", rows: [] };
        }

        const shifts = await persistence.getShifts();
        const rows = [];

        let i = 0;
        while (i < shifts.length) {
            const shift = shifts[i];

            if (shift && shift.employees) {
                let j = 0;

                while (j < shift.employees.length) {
                    if (String(shift.employees[j]) === employeeId) {
                        rows.push({
                            date: shift.date,
                            startTime: shift.startTime,
                            endTime: shift.endTime
                        });
                    }

                    j++;
                }
            }

            i++;
        }

        sortScheduleRows(rows);

        return { ok: true, message: "", rows: rows };
    }






    /**
     * gets documents for one employee
     * @param {string} employeeId
     * @returns {Promise<Array>}
     */
    async function getEmployeeDocuments(employeeId) {
        return await persistence.getEmployeeDocuments(employeeId);
    }

    /**
     * saves one uploaded document
     * @param {string} employeeId
     * @param {string} originalName
     * @param {string} storedName
     * @returns {Promise<Object>}
     */
    async function uploadEmployeeDocument(employeeId, originalName, storedName) {
        const emp = await persistence.findEmployee(employeeId);

        if (!emp) {
            return { ok: false, message: "Employee not found" };
        }

        const count = await persistence.countEmployeeDocuments(employeeId);

        if (count >= 5) {
            return { ok: false, message: "Max 5 documents allowed" };
        }

        await persistence.addEmployeeDocument(employeeId, originalName, storedName);

        return { ok: true, message: "" };
    }



    /**
 * gets one document by id
 * @param {string} docId
 * @returns {Promise<Object|null>}
 */
    async function getEmployeeDocument(docId) {
        return await persistence.findEmployeeDocument(docId);
    }














    /**
     * creates next id
     * @param {Array} employees
     * @returns {string}
     */
    function generateNextEmployeeId(employees) {
        let highest = 0;

        let i = 0;
        while (i < employees.length) {
            const e = employees[i];
            const id = e && e.employeeId ? String(e.employeeId) : "";

            const n = parseEmployeeNumber(id);
            if (n > highest) {
                highest = n;
            }

            i++;
        }

        const newNum = highest + 1;
        return "E" + pad3(newNum);
    }

    /**
     * reads number from id (E###)
     * @param { string} employeeId
     * @returns {number}
     */
    function parseEmployeeNumber(employeeId) {
        if (!employeeId) {
            return 0;
        }

        const id = String(employeeId);

        if (id.length !== 4) {
            return 0;
        }
        if (id[0] !== "E") {
            return 0;
        }

        const digits = id.substring(1);
        if (!isAllDigits(digits)) {
            return 0;
        }

        const n = Number(digits);
        if (!Number.isInteger(n) || n < 0) {
            return 0;
        }

        return n;
    }

    /**
     * pads number to 3 digits
     * @param {number} n
     * @returns {string}
     */
    function pad3(n) {
        const s = String(n);

        if (s.length >= 3) {
            return s;
        }

        if (s.length === 2) {
            return "0" + s;
        }
        return "00" + s;
    }

    /**
     * checks string is only digit
     * @param {string} text
     * @returns {boolean}
     */
    function isAllDigits(text) {

        if (!text || text.length === 0) {
            return false;
        }

        let i = 0;
        while (i < text.length) {
            const c = text[i];
            if (c < "0" || c > "9") {
                return false;
            }
            i++;
        }
        return true;
    }

    /**
     * checks if employee exist
     * @param {Array} employees
     * @param {string} employeeId
     * @returns {boolean}
     */
    function hasEmployee(employees, employeeId) {
        let i = 0;
        while (i < employees.length) {
            const e = employees[i];

            if (e && e.employeeId === employeeId) {
                return true;
            }
            i++;
        }
        return false;
    }

    /**
     * find shift by id
     * @param {Array} shifts
     * @param {string} shiftId
     * @returns {Object|null }
     */
    function findShift(shifts, shiftId) {
        let i = 0;
        while (i < shifts.length) {
            const s = shifts[i];
            if (s && s.shiftId === shiftId) {
                return s;
            }
            i++;
        }
        return null;
    }

    /**
     * check if assignment already exist
     * @param {Array} assignments
     * @param {string} employeeId
     * @param {string} shiftId
     * @returns {boolean}
     */


    /**
     * sort schedule rows by date then startTime
     * @param {Array} rows
     * @returns {void}
     */
    function sortScheduleRows(rows) {
        let x = 0;
        while (x < rows.length - 1) {
            let minIndex = x;

            let j = x + 1;
            while (j < rows.length) {
                const a = rows[j].date + " " + rows[j].startTime;
                const b = rows[minIndex].date + " " + rows[minIndex].startTime;

                if (a < b) {
                    minIndex = j;
                }
                j++;
            }

            if (minIndex !== x) {
                const temp = rows[x];
                rows[x] = rows[minIndex];
                rows[minIndex] = temp;
            }

            x++;
        }
    }




    async function startLogin(username, password) {
        const user = await persistence.findUser(username);

        if (!user) {
            return { ok: false, message: "invalid login" };
        }

        if (user.locked) {
            return { ok: false, message: "account is locked" };
        }

        const hash = crypto.createHash("sha256").update(password).digest("hex");

        if (user.password !== hash) {
            const failedLogins = await persistence.incrementFailedLogins(username);

            if (failedLogins === 3) {
                await emailSystem.sendSuspiciousActivityEmail(user.email);
            }

            if (failedLogins >= 10) {
                await persistence.lockUser(username);
                await emailSystem.sendAccountLockedEmail(user.email);
                return { ok: false, message: "account is locked" };
            }

            return { ok: false, message: "invalid login" };
        }

        await persistence.resetFailedLogins(username);

        const code = makeSixDigitCode();
        const expiry = new Date(Date.now() + 180000);

        await persistence.saveTwoFactorCode(username, code, expiry);
        await emailSystem.sendTwoFactorCode(user.email, code);

        return { ok: true, message: "" };
    }

    async function verifyTwoFactor(username, code) {
        const user = await persistence.findUser(username);

        if (!user) {
            return { ok: false, message: "invalid code" };
        }

        if (!user.twoFactorCode || !user.twoFactorExpiry) {
            return { ok: false, message: "no active code" };
        }

        const now = new Date();

        if (user.twoFactorExpiry <= now) {
            await persistence.clearTwoFactorCode(username);
            return { ok: false, message: "code expired" };
        }

        if (user.twoFactorCode !== code) {
            return { ok: false, message: "invalid code" };
        }

        await persistence.clearTwoFactorCode(username);

        const sessionKey = await createLoginSession(username);

        return {
            ok: true,
            sessionKey: sessionKey
        };
    }

    function makeSixDigitCode() {
        let code = "";
        let i = 0;

        while (i < 6) {
            const n = crypto.randomInt(0, 10);
            code += String(n);
            i++;
        }

        return code;
    }









    return {
        getAllEmployees: getAllEmployees,
        getEmployee: getEmployee,
        addNewEmployee: addNewEmployee,
        getEmployeeSchedule: getEmployeeSchedule,
        updateEmployeeDetails: updateEmployeeDetails,
        checkLogin: checkLogin,
        createLoginSession: createLoginSession,
        isValidSession: isValidSession,
        logout: logout,
        refreshSession: refreshSession,
        logAccess: logAccess,
        startLogin: startLogin,
        verifyTwoFactor: verifyTwoFactor,
        getEmployeeDocuments: getEmployeeDocuments,
        uploadEmployeeDocument: uploadEmployeeDocument,
        getEmployeeDocument: getEmployeeDocument,
    };
}

module.exports = { createBusiness };