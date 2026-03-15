# 🔑 KeyVault v2 — License Management System

> Light mode đẹp · React 18 + Vite · Node.js + Express · JWT Auth · bcrypt

## ⚡ Chạy nhanh

### 1. Backend (bắt buộc)
```bash
cd backend
npm install
node server.js
# → API: http://localhost:3001
# → Admin: admin / admin123
```

### 2. Frontend
- **Không cần cài:** Mở `frontend/standalone.html` trong Chrome/Edge  
- **Dev mode:** `cd frontend && npm install && npm run dev`

---

## 👤 Người dùng
1. Vào trang chủ → **"Bắt đầu miễn phí"** (đăng ký)
2. Hoặc **"Đăng nhập"** nếu đã có tài khoản
3. Nhấn **"Nhập Key"** → nhập license key từ Admin
4. Xem danh sách key + modules đã mở khóa

## ⚙️ Admin
1. Vào trang chủ → **"Admin"** → đăng nhập `admin/admin123`
2. **Tạo Key** → chọn gói, modules, người dùng
3. **Tải ZIP** gồm `LICENSE.key` + `KeyVault-Setup.exe`
4. **Quản lý User**, xem **Activity Log**
5. **Quên mật khẩu** (demo: token hiện trực tiếp)

## 🛠 API
```
POST  /api/auth/admin/login
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
POST  /api/auth/forgot-password
POST  /api/auth/reset-password
POST  /api/keys/activate
GET   /api/admin/keys
POST  /api/admin/keys
GET   /api/admin/keys/:id/download  ← ZIP
PATCH /api/admin/keys/:id/revoke
DELETE /api/admin/keys/:id
GET   /api/admin/users
GET   /api/admin/stats
GET   /api/admin/logs
```

## Stack
Frontend: React 18, Vite, Framer Motion, Zustand, Axios, Lucide  
Backend:  Express, bcryptjs, jsonwebtoken, JSZip, date-fns  
DB: JSON file (data.json) — zero native deps  
Font: Plus Jakarta Sans + JetBrains Mono

© 2025 KeyVault Software
