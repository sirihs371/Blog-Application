# Blog Application (MERN Stack)

A beginner-friendly MERN blogging app with a glassmorphism UI.

## Features
- Register and log in with JWT authentication
- Authorization: only the author can edit or delete their own posts
- Create, edit, and delete blog posts
- Rich text editor (React Quill)
- Upload a cover image for each post
- Search posts by title/content
- Responsive layout and sample empty-state UI

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- MongoDB running locally, or a MongoDB Atlas connection string

## Run on Windows (CMD)

### 1. Extract the ZIP
Extract `Blog_Application_MERN.zip` into Downloads or another folder.

### 2. Configure the backend
Open CMD and run these commands (change the path if you extracted elsewhere):

```bat
cd %USERPROFILE%\Downloads\Blog_Application_MERN\server
copy .env.example .env
npm install
```

Open `server\.env` in Notepad and set `MONGO_URI` if you use MongoDB Atlas. For a local MongoDB service, the default URI usually works.

### 3. Start the backend
In the same CMD window:

```bat
npm run dev
```

Expected backend URL: `http://localhost:5000`

Keep this window open.

### 4. Start the frontend
Open a **second CMD window**:

```bat
cd %USERPROFILE%\Downloads\Blog_Application_MERN\client
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## MongoDB
Default local URI:
`mongodb://127.0.0.1:27017/blog_application`

If MongoDB is not installed/running, create a free MongoDB Atlas database and paste its connection string into `server\.env` as `MONGO_URI`.

## Important notes
- Uploaded images are stored in `server/uploads` during local development.
- Do not use the sample JWT secret in production. Set a long random `JWT_SECRET`.
- This project is intended for learning/local internship demos. For production, add rate limiting, stronger file validation/scanning, and cloud image storage.
