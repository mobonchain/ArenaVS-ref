const axios = require("axios");
const fs = require("fs");
const readline = require("readline-sync");
const chalk = require("chalk");
const { randomUA } = require("./src/utils");
const { createWallet } = require("./src/wallets");
const { HttpsProxyAgent } = require("https-proxy-agent");

console.clear();

const API_URL = "https://quest-api.arenavs.com/api/v1/users/initialize";

const toolName = "🔹 Auto Referral ArenaVS - by Mob 🔹";
const screenWidth = process.stdout.columns || 80;
const centeredTitle = toolName.padStart((screenWidth + toolName.length) / 2);
console.log(chalk.cyanBright.bold(centeredTitle));
console.log(chalk.gray("─".repeat(screenWidth) + "\n"));

console.log(chalk.redBright.bold(` ⚠ CẢNH BÁO: `) + chalk.yellowBright(`Một khi đã chạy Tool thì đừng hỏi có bị ban không nhé! :))`) + chalk.bold(`\n📜 Mã nguồn chỉ phục vụ mục đích học tập!`));
console.log(chalk.bold(`🎯 Kênh Telegram : `) + chalk.yellowBright(`https://t.me/xTopAME`));
console.log(chalk.bold(`🎯 Follow Mob on X : `) + chalk.blueBright(`https://x.com/gitmob_`));
console.log(chalk.gray("─".repeat(screenWidth) + "\n"));

function getValidInput(promptMessage, validChoices) {
    let choice;
    do {
        choice = readline.question(promptMessage);
        if (!validChoices.includes(choice)) {
            console.log(chalk.redBright("❌ Lựa chọn không hợp lệ! Vui lòng nhập lại."));
        }
    } while (!validChoices.includes(choice));
    return choice;
}

const walletChoice = getValidInput(
    chalk.cyanBright.bold("🟢 Chọn phương thức tạo tài khoản:\n") +
    chalk.greenBright("  1️⃣  Dùng địa chỉ ví có trong wallet.txt\n") +
    chalk.yellowBright("  2️⃣  Tạo ví mới\n") +
    chalk.cyanBright.bold("\n🔹 Nhập lựa chọn (1 hoặc 2): "),
    ["1", "2"]
);

const proxyChoice = getValidInput(
    chalk.cyanBright.bold("\n🟢 Chọn phương thức sử dụng Proxy:\n") +
    chalk.greenBright("  1️⃣  Dùng proxy có sẵn trong proxy.txt\n") +
    chalk.yellowBright("  2️⃣  Không dùng proxy\n") +
    chalk.cyanBright.bold("\n🔹 Nhập lựa chọn (1 hoặc 2): "),
    ["1", "2"]
);

const referralCode = readline.question(chalk.greenBright("\n✉ Nhập mã giới thiệu: "));

let wallets = [];
let proxies = [];

if (fs.existsSync("wallet.txt")) {
    wallets = fs.readFileSync("wallet.txt", "utf-8").split("\n").map(w => w.trim()).filter(w => w);
}

if (proxyChoice === "1" && fs.existsSync("proxy.txt")) {
    proxies = fs.readFileSync("proxy.txt", "utf-8").split("\n").map(p => p.trim()).filter(p => p);
}

let refCount = wallets.length;
if (walletChoice === "2") {
    refCount = parseInt(readline.question(chalk.blueBright("\n🔹 Nhập số lượng tài khoản cần tạo: ")), 10);
}
if (proxyChoice === "1") {
    refCount = Math.min(wallets.length, proxies.length);
}

console.log(chalk.cyanBright(`\n🚀 Bắt đầu tạo ${refCount} tài khoản...\n`));

async function checkProxyAndCreateAccount(proxy, walletAddress) {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await axios.get("https://api.ipify.org?format=json", { httpsAgent: proxyAgent, timeout: 5000 });

        if (response.status === 200) {
            console.log(chalk.greenBright(`🟢 Proxy Hoạt Động: ${proxy} - IP: ${response.data.ip}`));

            await createAccount(walletAddress, proxy);
        } else {
            console.log(chalk.redBright(`❌ Proxy Không Hợp Lệ: ${proxy}`));
        }
    } catch (error) {
        console.log(chalk.redBright(`❌ Proxy Chết: ${proxy} - Lỗi: ${error.message}`));
    }
}

async function createAccount(walletAddress, proxy) {
    try {
        let agent = null;
        if (proxy) {
            agent = new HttpsProxyAgent(proxy);
        }

        const response = await axios.post(API_URL, {
            walletAddress,
            referralCode
        }, {
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json",
                "User-Agent": randomUA(),
                "Referer": "https://quest.arenavs.com/"
            },
            httpsAgent: agent
        });

        console.log(chalk.greenBright(`✅ Tạo tài khoản thành công với ví: ${walletAddress}`));
        return response.data;
    } catch (error) {
        console.error(chalk.redBright(`❌ Lỗi khi tạo tài khoản: ${walletAddress} - ${error.message}`));
    }
}

(async () => {
    for (let i = 0; i < refCount; i++) {
        let walletAddress;
        let privateKey = null;

        if (walletChoice === "2") {
            const wallet = createWallet();
            walletAddress = wallet.address;
            privateKey = wallet.privateKey;

            fs.appendFileSync("wallet.txt", walletAddress + "\n");
            fs.appendFileSync("privatekey.txt", privateKey + "\n");
            console.log(chalk.blueBright(`🆕 Tạo ví mới: ${walletAddress}`));
        } else {
            walletAddress = wallets[i % wallets.length];
        }

        const proxy = proxyChoice === "1" ? proxies[i % proxies.length] : null;

        if (proxy) {
            await checkProxyAndCreateAccount(proxy, walletAddress);
        } else {
            await createAccount(walletAddress, null);
        }
    }

    console.log(chalk.magentaBright("\n🎉 Hoàn thành tạo tài khoản!\n"));
})();
