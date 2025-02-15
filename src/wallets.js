const crypto = require("crypto");

function createWallet() {
    const privateKey = "0x" + crypto.randomBytes(32).toString("hex");
    const address = "0x" + crypto.createHash("sha256").update(privateKey).digest("hex").slice(0, 40);
    return { privateKey, address };
}

module.exports = { createWallet };
