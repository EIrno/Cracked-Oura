<div align="center">
  <img src="frontend/public/icon.png" alt="Cracked Oura Logo" width="128">
  <h1>Cracked Oura</h1>
  <p><b>Free application that gives you full access to your Oura ring data.</b></p>
  
  [![GitHub release](https://img.shields.io/github/v/release/EIrno/Cracked-Oura?label=Latest%20Release)](https://github.com/EIrno/Cracked-Oura/releases/latest)
  ![Status](https://img.shields.io/badge/Status-Alpha-red)
</div>

---

### Pay for the ring, not for the app that is not even that good
Oura ring paywalls the data behind a subscription, but luckily you can export your data from Oura and import it to Cracked Oura.

**Cracked Oura** is an open-source desktop application that provides full access to your health metrics, stored locally on your machine.

**Key Benefits**
- **No Subscription:** See all of your Oura ring data without subscription. 
- **Privacy First:** Your data is stored locally in an SQLite database. It never leaves your computer unless you export it.
- **Advanced Analytics:** Visualize trends, correlations, and deeper insights than the standard app provides. 

---

## Features

### Oura ring data without subscription
See all of your Oura ring data without subscription. Thanks to EU's right to data portability, you can export your data from Oura and import it to Cracked Oura. 

**Automation that requests your data from Oura and imports it to Cracked Oura.** This populates the local database with your data. Population can also be done manually by importing a zip file from Oura that you can find in https://membership.ouraring.com/data-export. 

### Desktop Dashboard that can be customized
View your Sleep, Readiness, and Activity scores, etc in a desktop dashboards that is at least as good as the official Oura dashboard. The dashboards can be customized to show the data that you want to see. 

### AI Health Analyst
Oura's own AI advisor is quite limited. It does not have access to your historical data and cannot answer questions about your health trends, because it has only a few days of data available. 

Cracked Oura can leverage LLMs to analyze your health data and provide insights. This feature is still experimental and under development and will be improved in the future. 


---

## Getting Started

### Installation
1.  **Download** the latest release for your operating system:
    -   [Download for macOS (.dmg)](https://github.com/EIrno/Cracked-Oura/releases)
    -   [Download for Windows (.exe)](https://github.com/EIrno/Cracked-Oura/releases) *(Coming Soon)*

2.  **Install & Run** the application.
3.  **Login** to your Oura account when prompted to sync your historical data.


> [!NOTE]
> Most of the features are still experimental and under development and will be improved in the future. 

> [!NOTE]
> This project is not affiliated with, associated with, or endorsed by Oura Health Oy. Use at your own risk.

---

## For Developers

We welcome contributions.

### Tech Stack
-   **Frontend:** Electron, React, TypeScript, Tailwind
-   **Backend:** Python, FastAPI, SQLite

### Build from Source
```bash
# 1. Clone Repository
git clone https://github.com/EIrno/Cracked-Oura.git
cd Cracked-Oura

# 2. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Setup Frontend
cd ../frontend
npm install
npm run dev
```

### Build for Production
To create a standalone application installer:
```bash
cd frontend
npm run build
# Output will be in frontend/dist-electron/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.
