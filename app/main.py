from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.routes import home, verify, analytics

import os

app = FastAPI(title="Face Verification System")

current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(home.router)
app.include_router(verify.router)
app.include_router(analytics.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
