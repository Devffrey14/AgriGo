# AGRI-GO: LOCAL HOST DEPLOYMENT GUIDE

This guide provides step-by-step instructions for running the **Agri-GO** platform locally on your machine for testing, development, and offline evaluation.

---

## SYSTEM ARCHITECTURE OVERVIEW
* **Frontend:** React.js / Vite (Runs on `http://localhost:3000` or `http://localhost:5173`)
* **Backend API & AI Engine:** Python Flask, TensorFlow / Keras (Runs on `http://127.0.0.1:5000`)
* **Database:** SQLite (Local file-based database)

---

## PREREQUISITES
Ensure you have the following installed on your local machine:
* **Node.js** (v16+ recommended) and npm
* **Python** (v3.8 or v3.9+ recommended for TensorFlow compatibility)
* **Git**

---

## STEP 1: CLONE REPOSITORY
Clone the project repository and navigate into the root directory:
```bash
git clone [https://github.com/your-username/agri-go.git](https://github.com/your-username/agri-go.git)
cd agri-go

STEP 2: BACKEND & AI ENGINE SETUP (Flask)
Navigate to the backend directory:

Bash
cd server

Create and activate a Python virtual environment:
python -m venv venv
venv\Scripts\activate

Windows:
Bash
python -m venv venv
venv\Scripts\activate

macOS / Linux:
Bash
python3 -m venv venv
source venv/bin/activate

Install required Python packages:

Bash
pip install --upgrade pip
pip install -r requirements.txt

Run the Flask development server:

Bash
python app.py
The backend API will start running locally at http://127.0.0.1:5000.

STEP 3: FRONTEND SETUP (React)

Open a new terminal window/tab, navigate to the frontend directory from the project root:
Bash
cd client

Install node dependencies:
Bash
npm install

Configure the local environment variable:
Create a .env.local file in the frontend root directory and point it to your local backend:

Code snippet
REACT_APP_API_BASE_URL=[http://127.0.0.1:5000](http://127.0.0.1:5000)
# OR if using Vite:
VITE_API_BASE_URL=[http://127.0.0.1:5000](http://127.0.0.1:5000)

Start the frontend development server:

Bash
npm run dev
# OR if using standard React scripts:
npm start
The frontend client will open or run locally at http://localhost:3000 or http://localhost:5173.
