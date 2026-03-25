# 🔑 KeyVault v2 — License Management System

> Light mode đẹp · React 18 + Vite · Node.js + Express · JWT Auth · bcrypt

## ⚡ Chạy nhanh

### 1. Backend (bắt buộc)
```bash
cd backend
npm install

# Copy .env.example → .env và điều chỉnh
cp .env.example .env

node server.js
# → API: http://localhost:3001
# → Admin: admin / admin123
```

**Cấu hình .env:**
```
JWT_SECRET=your-super-secret-key-here-min-32-chars  # ⚠️ PHẢI ĐỔI trong production
ADMIN_PASSWORD=admin123
PORT=3001
CORS_ALLOWED_ORIGINS=http://localhost:5173
MONGODB_URI=                                         # (tùy chọn)
```

**Database Options:**
- **MongoDB**: Đặt `MONGODB_URI=...` để dùng MongoDB
- **SQLite** (nếu compile được): Tự động dùng `data.db`
- **JSON Fallback** (mặc định): Lưu dữ liệu vào `data.json` (zero native deps)

### 2. Frontend
- **Không cần cài:** Mở `frontend/standalone.html` trong Chrome/Edge  
- **Dev mode:** 
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Cấu hình .env (tùy chọn):**
```
VITE_API_BASE=http://localhost:3001/api  # Để trống = auto-detect
```

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

## 🔒 Security Notes

- **JWT_SECRET**: ⚠️ PHẢI đặt `JWT_SECRET` khác trong `.env` production. Default fallback chỉ cho dev.
- **Admin Password**: Đổi `admin123` → mật khẩu mạnh ở `.env`
- **CORS**: Set `CORS_ALLOWED_ORIGINS` cho domains được phép
- **Environment Variables**: Không commit `.env` (đã trong `.gitignore`)
- **Input Validation**: Tất cả input được validate (email, plan, modules)
- **Permission Check**: Admin-only endpoints, user chỉ truy cập keys của họ
- **Error Handling**: Improved error messages cho client debugging

## 📦 Stack
Frontend: React 18, Vite, Framer Motion, Zustand, Axios, Lucide  
Backend:  Express, bcryptjs, jsonwebtoken, JSZip, date-fns  
Database: 
  - **MongoDB** (production) - via `MONGODB_URI` env var
  - **SQLite** (optional) - via `better-sqlite3` if available
  - **JSON** (fallback) - pure JS, zero native deps, auto-used if SQLite fails
Font: Plus Jakarta Sans + JetBrains Mono

© 2025 KeyVault Software
