# GitHub Repository Setup Guide

This document provides step-by-step instructions for setting up a GitHub repository for the Cross-Chain Token Swap application.

## Creating a GitHub Repository

1. **Create a new repository on GitHub**
   - Go to [GitHub](https://github.com) and sign in to your account
   - Click on the "+" icon in the top right corner and select "New repository"
   - Repository name: `cross-chain-token-swap` (or your preferred name)
   - Description: "A Uniswap-inspired web application that simulates cross-chain token swaps and bridges"
   - Choose "Public" or "Private" based on your preference
   - Check "Add a README file" (we'll replace it with our detailed README)
   - Choose "Add .gitignore" and select "Node" from the template
   - Click "Create repository"

2. **Clone the repository to your local machine**
   ```bash
   git clone https://github.com/yourusername/cross-chain-token-swap.git
   cd cross-chain-token-swap
   ```

3. **Copy your project files to the repository folder**
   - Copy all files from your current project to the new repository folder
   - Ensure you don't copy the `.git` directory from your original project

## Setting Up the Repository

1. **Initialize Git in your project folder (if not already done)**
   ```bash
   git init
   ```

2. **Add your files to the repository**
   ```bash
   git add .
   ```

3. **Commit your changes**
   ```bash
   git commit -m "Initial commit: Cross-Chain Token Swap application"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main
   ```

## Setting Up GitHub Pages (Optional)

If you want to deploy your application to GitHub Pages:

1. **Build your application**
   ```bash
   npm run build
   ```

2. **Configure Next.js for static export**
   - Add the following to your `next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     basePath: '/cross-chain-token-swap',
     images: {
       unoptimized: true,
     },
   };
   
   module.exports = nextConfig;
   ```

3. **Create a GitHub workflow file**
   - Create a file at `.github/workflows/deploy.yml` with the following content:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: 18

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Deploy
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: out
             branch: gh-pages
   ```

4. **Push the changes to GitHub**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

5. **Enable GitHub Pages in repository settings**
   - Go to your repository on GitHub
   - Click on "Settings" > "Pages"
   - Set the source to "Deploy from a branch"
   - Select the "gh-pages" branch and "/ (root)" folder
   - Click "Save"

## Dependencies

The project uses the following key dependencies:

```json
{
  "dependencies": {
    "@apollo/client": "^3.13.4",
    "@axelar-network/axelarjs-sdk": "^0.17.2",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-tabs": "^1.1.3",
    "@tanstack/react-query": "^5.68.0",
    "@tanstack/react-query-devtools": "^5.68.0",
    "axios": "^1.8.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "ethers": "^5.7.2",
    "graphql": "^16.10.0",
    "lucide-react": "^0.482.0",
    "next": "15.2.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2"
  }
}
```

## Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Commit your changes with descriptive commit messages**
5. **Push to your fork**
6. **Create a Pull Request**

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/yourusername/cross-chain-token-swap/tags).
