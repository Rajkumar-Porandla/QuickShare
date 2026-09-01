<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,30,45&height=200&section=header&text=⚡%20QuickShare&fontSize=48&fontColor=ffffff&desc=Instant%20%7C%20Ephemeral%20%7C%20Cross-Device%20Text%20and%20File%20Sharing&descFontSize=18&descAlignY=68&descAlign=50" width="100%"/>
</div>

<div align="center">
  <a href="https://dexpop.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-dexpop.vercel.app-00C7B7?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
  </a>
  <a href="https://github.com/Rajkumar-Porandla/QuickShare">
    <img src="https://img.shields.io/badge/GitHub-QuickShare-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"/>
</div>

<br/>

## 🌐 Overview

**QuickShare** is a lightweight, zero-friction web application designed for instant, ephemeral text and file sharing between devices. Transfer snippets, code blocks, documents, and images across phones, laptops, and tablets in seconds using simple 6-character retrieval codes — no registration, no passwords, and zero persistent tracking.

🔗 **Live Application:** **[https://dexpop.vercel.app](https://dexpop.vercel.app)**

---

## ✨ Features

- ⚡ **Instant 6-Character Shortcodes:** Share text or files and receive a unique, easy-to-type 6-character code (e.g. `A7X9K2`).
- 📝 **Formatted Text & Code Sharing:** Paste code snippets, notes, URLs, or paragraphs with 1-click clipboard copying.
- 📁 **File & Image Uploads:** Drag-and-drop file transfer supporting uploads up to 10MB.
- 🖼️ **In-Browser Image Previews:** Preview shared images directly in your browser before downloading.
- ⏳ **Automatic 30-Minute Expiry:** All text and uploaded files are automatically purged from memory and disk after 30 minutes.
- 📱 **Fully Responsive UI:** Glassmorphic modern interface tailored for mobile and desktop screens.
- ☁️ **Vercel Serverless Architecture:** Configured for high performance on Vercel with ephemeral `/tmp` storage handling.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Glassmorphism & Animations), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **File Handling** | Multer, UUID v4, Node `fs` & `path` streams |
| **Middleware** | CORS, Compression |
| **Deployment** | Vercel Serverless (`vercel.json`) |

---

## 🔌 API Endpoints

### Text Sharing
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/share/text` | Upload text string. Returns `{ code, expiresAt }`. |
| `GET` | `/api/share/text/:code` | Retrieve stored text by code. |

### File Sharing
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/share/file` | Multipart file upload (`max 10MB`). Returns `{ code, expiresAt, originalName }`. |
| `GET` | `/api/share/file/:code` | Download file attachment by code. |
| `GET` | `/api/share/file/:code/info` | Fetch file metadata (`originalName`, `mimeType`, `size`, `expiresAt`). |
| `GET` | `/api/share/file/:code/preview` | Stream file inline for browser preview. |

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher)
- [npm](https://www.npmjs.com/)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rajkumar-Porandla/QuickShare.git
   cd QuickShare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local server:**
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📂 Project Structure

```
QuickShare/
├── public/
│   ├── index.html         # Main user interface
│   ├── style.css          # Modern dark glassmorphic styles
│   ├── app.js             # Client-side sharing & retrieval logic
│   ├── favicon.png        # Brand favicon
│   ├── robots.txt         # SEO configuration
│   └── sitemap.xml        # Sitemap indexing
├── server.js              # Express backend & API endpoints
├── vercel.json            # Vercel deployment configuration
├── package.json           # Dependencies & scripts
└── README.md              # Project documentation
```

---

## 🔒 Security & Privacy

- Files and text are **strictly ephemeral** and auto-deleted upon expiry (30-minute window).
- Periodic background cron cleanup runs every 60 seconds to prune expired files and release memory.
- File uploads are capped at 10MB per transfer.

---

## 👨‍💻 Author

**Rajkumar Porandla**
- GitHub: [@Rajkumar-Porandla](https://github.com/Rajkumar-Porandla)
- Email: [rajkumarporandla07@gmail.com](mailto:rajkumarporandla07@gmail.com)
- LinkedIn: [in/raj-kumar-porandla3025](https://www.linkedin.com/in/raj-kumar-porandla3025/)

---

## 📄 License

This project is licensed under the **ISC License**.
