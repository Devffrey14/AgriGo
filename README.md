Agri-Go: The Digital Pulse of Ghanaian Agriculture
Agri-Go is a high-tech, precision-driven agricultural ecosystem designed to bridge the gap between rural production and urban consumption. It serves as a digital gateway that empowers Ghanaian farmers with AI-driven diagnostic tools and direct market access, ensuring food security and economic resilience.

Core Features
Intelligent Diagnostics: An AI-powered portal where farmers can instantly diagnose diseases in crops and poultry by uploading images for real-time biological insights.

Integrated Marketplace: A streamlined platform that eliminates middlemen, allowing farmers to list produce—from grains and tubers to live poultry—and connect directly with buyers.

Direct Communication: Integrated "click-to-call" functionality enabling seamless contact between verified farmers and consumers.

Real-time Inventory Tracking: Transparent pricing and live tracking of available produce units, such as kilograms, bags, or heads.

Verified Farmer Network: A specialized ID system to ensure all sellers are verified by the Agri-Go network for quality and safety.

Technical Stack
Frontend
React: A component-based UI library for a responsive and dynamic user experience.

Tailwind CSS: Used for modern, "ultra-compact" styling and mobile-first design.

Lucide-React: For high-quality, lightweight iconography.

Backend
Flask (Python): A lightweight WSGI web application framework for API development.

SQLite3: A serverless, self-contained SQL database engine used for managing user data and produce listings.

AI & Data Science
Convolutional Neural Networks (CNN): Lightweight image analysis models optimized for agricultural disease detection.

TensorFlow/Python: Core technologies used for building diagnostic AI models.

Database Schema
The system utilizes an integrated relational database to manage users and produce:

Users Table: Stores fullname, telephone, email (unique), password, location, and farm_type.

Produce Table: Linked to the users table via farmer_id, storing item details, pricing, and availability.

Installation & Setup
Prerequisites
Node.js (for React frontend)

Python 3.11 (for Flask backend)

Backend Setup
Navigate to the server directory: cd server

Install dependencies (if applicable): pip install flask

Initialize the database and run the server:

Bash
python app.py
Frontend Setup
Navigate to the client directory: cd client

Install dependencies: npm install

Start the development server:

Bash
npm start
Developer
Jeffrey Ntow Botchwey

Full-Stack Developer & AI Solutions Architect

Founder, JENPACK Technologies

Agri-Go: Ensuring that the backbone of our economy—the farmer—is finally farming smarter, not harder.
