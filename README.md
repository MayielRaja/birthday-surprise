# 🎂 Birthday Surprise Website (Vercel + Firebase)

A beautiful, premium, serverless birthday wishes website designed for **SYAMA**. The website features a live countdown lock screen, an interactive birthday cake candle blowout sequence, a sealed letter card reveal, floating balloons, background music, a polaroid photo gallery, and a secure administrator dashboard to upload memories (photos, videos, audio clips).

---

## 🛠️ Tech Stack

### Frontend (User Interface)
*   **HTML5 & CSS3 (Vanilla)**: Custom layout modules, modern HSL blur blobs, responsive grids, and glassmorphic panels.
*   **JavaScript (ES6 Modules)**: Client-side routing, interactive states, time calculations, and direct database queries using the Firebase JS SDK.
*   **HTML5 Canvas API**: Powering the custom confetti particle animation system.
*   **CSS Keyframe Animations**: Directs balloon floating cycles, polaroid tilts, card scale-ups, and candle flame flickers.

### Cloud Backend & Database (Serverless)
*   **Vercel (Hosting)**: Premium, free hosting platform that serves static frontends with 100% uptime, instant loading speeds, and automatic SSL setup.
*   **Firebase Firestore (Database)**: Free, real-time Cloud NoSQL database storing configuration document states and memories metadata list documents.
*   **Firebase Storage (Asset Storage)**: Secure, free cloud storage bucket serving media file streams (images, videos, audios).

---

## 📂 Project Structure

```text
birthday-website/
├── package.json             # Local server script configuration
├── server.js                # Core Node.js HTTP local static server (for local dev testing only)
└── public/                  # Static assets uploaded directly to Vercel
    ├── admin.html           # Administrator login & uploads dashboard
    ├── index.html           # Main landing page HTML
    ├── css/
    │   └── style.css        # Main stylesheet
    ├── js/
    │   ├── firebase.js      # Firebase connection configuration settings
    │   ├── app.js           # Client script for countdown and cake clicks
    │   └── admin.js         # Editor client script connected to Firebase
```

---

## ☁️ Vercel + Firebase Cloud Deployment Guide

Follow these steps to deploy your website online completely for free:

### Step 1: Set Up Your Firebase Project
1.  Go to [console.firebase.google.com](https://console.firebase.google.com/) and sign up for a free account.
2.  Click **Add Project** and name it `syama-birthday-surprise`.
3.  In the project dashboard, click the **Web (</>)** icon to add a web app. Register it as `birthday-surprise`.
4.  Copy the `firebaseConfig` keys from the setup screen.
5.  In your local project folder, open `public/js/firebase.js` and paste these keys in the `firebaseConfig` block.
6.  Enable **Cloud Firestore** in the left sidebar:
    *   Click **Create Database**.
    *   Start in **Test Mode** (this allows read/write access immediately, required for your uploads). Select your region and hit save.
7.  Enable **Firebase Storage** in the left sidebar:
    *   Click **Get Started**, choose **Test Mode**, select your region, and hit save.

### Step 2: Push Your Code to GitHub
1.  Create a repository named `birthday-surprise` on [GitHub](https://github.com).
2.  Initialize Git and push your local files:
    *   Open Git Bash in your project folder.
    *   Run:
        ```bash
        git init
        git add .
        git commit -m "Initial commit with Firebase"
        git branch -M main
        git remote add origin https://github.com/YOUR-USERNAME/birthday-surprise.git
        git push -u origin main
        ```

### Step 3: Connect to Vercel
1.  Go to [vercel.com](https://vercel.com) and log in.
2.  Click **Add New** -> **Project**.
3.  Select your `birthday-surprise` GitHub repository and click **Import**.
4.  Since our website files are in the `public/` directory, set the **Root Directory** field to `public` (or leave it empty if Vercel finds it, but setting it to `public` makes it serve `public` directly!).
5.  Click **Deploy**.

Vercel will build your static files. Once complete, it will provide your live website link!
Now, you can visit `/admin` on your Vercel site, enter passcode `1234`, and upload memories. They will save permanently to the cloud and reveal automatically on her birthday!
