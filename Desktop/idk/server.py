from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from Crypto.Cipher import AES
import base64

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

connected_users = set()
MAX_USERS = 5

SECRET_KEY = b"1234567890123456"  # Must match frontend key
IV = b"6543210987654321"

def encrypt_message(message):
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, IV)
    padded_message = message + (16 - len(message) % 16) * " "
    encrypted_bytes = cipher.encrypt(padded_message.encode("utf-8"))
    return base64.b64encode(encrypted_bytes).decode("utf-8")

def decrypt_message(encrypted_message):
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, IV)
    decoded_bytes = base64.b64decode(encrypted_message)
    decrypted_message = cipher.decrypt(decoded_bytes).decode("utf-8").strip()
    return decrypted_message

@socketio.on("join_chat")
def handle_join(username):
    if len(connected_users) >= MAX_USERS:
        emit("chat_status", {"success": False, "message": "Chatroom is full!"})
        return

    connected_users.add(username)
    emit("chat_status", {"success": True, "user_count": len(connected_users)}, broadcast=True)
    emit("update_users", len(connected_users), broadcast=True)

@socketio.on("leave_chat")
def handle_leave(username):
    connected_users.discard(username)
    emit("update_users", len(connected_users), broadcast=True)

@socketio.on("send_message")
def handle_send(data):
    sender = data["sender"]
    encrypted_message = data["message"]
    decrypted_message = decrypt_message(encrypted_message)

    print(f"Received: {decrypted_message}")  # Debugging

    emit("receive_message", {"sender": sender, "message": encrypted_message}, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5001, debug=True)
