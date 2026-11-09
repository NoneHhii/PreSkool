import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://preskool-be.onrender.com";

/**
 * Khởi tạo kết nối Socket với JWT Token
 */
export const connectSocket = (token?: string): Socket => {
  const authToken = token || localStorage.getItem("token") || "";

  if (socket?.connected) {
    return socket;
  }

  // Nếu socket đã khởi tạo nhưng chưa kết nối, tái sử dụng hoặc tạo mới
  if (socket) {
    socket.auth = { token: authToken };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken, // Truyền JWT token qua handshake auth
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("🟢 [Socket] Đã kết nối thành công tới Realtime Server:", socket?.id);
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 [Socket] Lỗi kết nối Socket:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("🟡 [Socket] Đã ngắt kết nối:", reason);
  });

  return socket;
};

/**
 * Lấy instance socket hiện tại
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Ngắt kết nối khi User Đăng xuất (Logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("⚪ [Socket] Đã chủ động ngắt kết nối.");
  }
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
};

