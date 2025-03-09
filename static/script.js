const socket = io.connect("https://individualproject-otqe.onrender.com"); 

let username = "";
const secretKey = CryptoJS.enc.Utf8.parse("1234567890123456"); // Must match server key
const iv = CryptoJS.enc.Utf8.parse("6543210987654321"); // Initialization Vector

function joinChat() {
    username = document.getElementById("username").value.trim();
    if (username === "") {
        document.getElementById("error-message").innerText = "Name is required!";
        return;
    }

    socket.emit("join_chat", username);
}

socket.on("chat_status", function(data) {
    if (data.success) {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("chatroom-container").style.display = "block";
        updateUserCount(data.user_count);
    } else {
        document.getElementById("error-message").innerText = data.message;
    }
});

socket.on("update_users", function(count) {
    updateUserCount(count);
});

socket.on("receive_message", function(data) {
    const decryptedMessage = decryptMessage(data.message);
    displayMessage(`${data.sender}: ${decryptedMessage}`);
});

function sendMessage() {
    const message = document.getElementById("message").value.trim();
    if (message !== "") {
        const encryptedMessage = encryptMessage(message);
        socket.emit("send_message", { sender: username, message: encryptedMessage });
        document.getElementById("message").value = "";
    }
}

function leaveChat() {
    socket.emit("leave_chat", username);
    location.reload();
}

function displayMessage(text) {
    const chatWindow = document.getElementById("chat-window");
    const msgDiv = document.createElement("div");
    msgDiv.textContent = text;
    chatWindow.appendChild(msgDiv);
}

// Update user count display
function updateUserCount(count) {
    document.getElementById("user-count").innerText = count;
}

// AES Encryption
function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, secretKey, { iv: iv }).toString();
}

// AES Decryption
function decryptMessage(encryptedMessage) {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey, { iv: iv });
    return bytes.toString(CryptoJS.enc.Utf8);
}
