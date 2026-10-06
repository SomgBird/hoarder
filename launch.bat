@echo off
start powershell -NoExit -Command "cd backend; conda activate hoarder; uvicorn app.main:app --reload"
start powershell -NoExit -Command "cd frontend; npm run dev"