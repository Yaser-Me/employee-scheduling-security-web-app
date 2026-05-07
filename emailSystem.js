"use strict";
/**
 * fake email system
 * just logs email messages to console
 * @returns {Object}
 */
function createEmailSystem() {
    /**
     * sends a 2fa code email
     * @param {string} toEmail
     * @param {string} code
     * @returns {Promise<void>}
     */
    async function sendTwoFactorCode(toEmail, code) {
        console.log("TO:", toEmail);
        console.log("SUBJECT: Your 2FA Code");
        console.log("MESSAGE: Your code is " + code);
    }

    /**
     * sends suspicious activity email
     * @param {string} toEmail
     * @returns {Promise<void>}
     */
    async function sendSuspiciousActivityEmail(toEmail) {
        console.log("TO:", toEmail);
        console.log("SUBJECT: Suspicious Activity");
        console.log("MESSAGE: There were multiple invalid login attempts on your account.");
    }

    /**
     * sends account locked email
     * @param {string} toEmail
     * @returns {Promise<void>}
     */
    async function sendAccountLockedEmail(toEmail) {
        console.log("TO:", toEmail);
        console.log("SUBJECT: Account Locked");
        console.log("MESSAGE: Your account has been locked after too many invalid login attempts.");
    }

    return {
        sendTwoFactorCode: sendTwoFactorCode,
        sendSuspiciousActivityEmail: sendSuspiciousActivityEmail,
        sendAccountLockedEmail: sendAccountLockedEmail
    };
}

module.exports = { createEmailSystem };