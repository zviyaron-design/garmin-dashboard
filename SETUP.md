# Garmin Dashboard - Setup Guide

## Prerequisites

You need Node.js installed. To install:

1. Go to https://nodejs.org/
2. Download and install the LTS version
3. Restart your terminal

## Installation

1. Open terminal in the `garmin-dashboard` folder

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to http://localhost:3000

## Building for Production

To create a production build:

```bash
npm run build
```

The optimized files will be in the `dist` folder.

## Deploying

### Option 1: Netlify (Recommended)
1. Sign up at https://netlify.com
2. Drag and drop the `dist` folder
3. Your app is live!

### Option 2: Vercel
1. Sign up at https://vercel.com
2. Import your project
3. Deploy automatically

### Option 3: GitHub Pages
1. Push to GitHub
2. Enable GitHub Pages in settings
3. Select the `dist` folder

## Features

- ✅ Mobile-responsive design
- ✅ Interactive charts
- ✅ Multiple dashboard views
- ✅ Works offline after loading
- ✅ No backend required
- ✅ Fast and lightweight
