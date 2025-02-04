<div align="center">
  <img src="https://i.ibb.co.com/93GyKRPF/optrackss.png"  />
</div>

# Project Name : OpTrack 🧑‍🚀

"OpTrack" is a web application designed to streamline employee management in an organization. It supports role-based functionalities for Admins, HRs, and Employees, providing a tailored experience based on their responsibilities. The platform offers task submissions, salary management, payment handling via Stripe, performance tracking, and much more. This application is built with modern web technologies, ensuring a seamless, responsive, and efficient user experience.

## Key Features Of OpTrack 🎯

## Features

• Secure user authentication and authorization with JWT and Firebase. <br/>
• RESTful API endpoints for managing employees, tasks, payments, and roles. <br/>
• Integration with Stripe for handling payments.<br/>
• Middleware for handling CORS, cookies, and environment variables.<br/>

## Technology used on Next Step 👨🏻‍💻

## Backend :

• Express.js for the backend framework. <br/>
• MongoDB for the database. <br/>
• Stripe for payment processing. <br/>
• CORS: To manage cross-origin requests. <br/>
• JWT: For secure authentication and authorization. <br/>
• Dotenv for environment variables.<br/>
• Cookie Parser: For handling cookies <br/>

## Dependencies

• cookie-parser : "^1.4.7" <br/>
• cors: "^2.8.5" <br/>
• dotenv: "^16.4.7", <br/>
• express: "^4.21.2", <br/>
• jsonwebtoken: "^9.0.2", <br/>
• mongodb: "^6.12.0", <br/>
• stripe: "^17.5.0" <br/>

## Installation

### **1. Clone the Repository**  
```sh
git clone https://github.com/golamsarwar96/op-track-app-server.git
```
### **2. Install Dependencies**

```sh
npm install
```
### **3. Environment Configuration**
Create a .env file in the project root and add the following environment variables <br/>

```sh
# Database Configuration
MONGO_URI=mongodb://localhost:27017/optrack_db

# JWT Secret for Authentication
JWT_SECRET=your_jwt_secret_key

# Stripe API Keys
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### **4. Run the Project**
```sh
npm run dev
```

## Server Link 🌐
https://op-track-server.vercel.app/ <br/>

## Credentials :

- Email: admin@optrack.com
- Password: Asdf123
