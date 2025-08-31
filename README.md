# AIBUILD Assignment - Data Visualisation Dashboard

A web-based dashboard for analyzing retail procurement, sales, and inventory data from Excel files.

**🌐 Live Demo**: https://aibuild-assignment-git-main-chunyinns-projects.vercel.app/  
**📁 Repository**: https://github.com/ChunYinn/AIBUILD_ASSIGNMENT

## What I Built

### Core Features
- **Excel Import**: Upload .xlsx/.xls files with flexible column detection
- **Data Visualization**: Interactive charts showing inventory, procurement, and sales trends  
- **User Authentication**: JWT-based login system with secure password storage
- **Multi-Product Analysis**: Compare multiple products on the same chart

### Tech Stack
**Frontend**: React 19 + TypeScript, TailwindCSS, Recharts, Zustand  
**Backend**: FastAPI (Python), SQLModel, PostgreSQL (Supabase)  
**Deploy**: Vercel (frontend), Google Cloud Run (backend, dockerized with Podman)

## How It Works

1. **Login/Register** with username and password
2. **Upload Excel** files with your product data
3. **Select products** to analyze on the dashboard
4. **View interactive charts** comparing inventory, procurement amounts, and sales revenue

## Excel Format Support

The system handles various column naming conventions:
- Product info: `ID`, `Product ID`, `Name`, `Product Name`
- Inventory: `Opening Inventory`, `Opening Inventory on Day 1`
- Daily data: `Procurement Qty (Day 1)`, `Sales Price (Day 2)`, etc.

Supports unlimited days (not just 3) and automatically handles currency formatting.

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend  
```bash
cd backend
uv sync
# Add your .env file with DATABASE_URL and SECRET_KEY
uv run uvicorn app.main:app --reload
```

## Assignment Requirements ✅

**✅ Dashboard**: Interactive line charts with inventory/procurement/sales curves  
**✅ User Login**: Custom JWT auth with database storage  
**✅ Excel Import**: Upload, parse, and store Excel data  
**✅ Deployment**: Live app deployed and accessible

## Understanding of Requirements

The challenge was to transform Excel-based retail data into an interactive web dashboard. Instead of manually analyzing spreadsheets, users can now upload their data and immediately see visual trends across procurement, sales, and inventory levels.

## System Structure

**Frontend → Backend → Database**
- React app sends API requests to FastAPI backend
- Backend processes Excel files using Pandas
- Data stored in normalized PostgreSQL tables
- Charts rendered client-side with real-time data

**Database Design**:
- Users table with JWT authentication
- Products table linked to users
- Separate procurement_data and sales_data tables
- UUID primary keys with proper foreign key relationships

**API Flow**:
1. Upload Excel → Parse with Pandas → Validate data → Store in PostgreSQL
2. Dashboard request → Query aggregated data → Return JSON → Render charts

## Key Assumptions & Limitations

- Excel files must contain product and daily transaction data
- Files processed synchronously (large files may timeout)
- Original Excel files not stored, only parsed data retained
- Basic JWT auth without advanced security features (rate limiting, etc.)
- Current architecture handles moderate concurrent users

---

*Assignment completed for AIBUILD Pty Ltd*