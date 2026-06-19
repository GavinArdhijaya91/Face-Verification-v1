from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
import os

router = APIRouter()

current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates_dir = os.path.join(current_dir, "templates")

templates = Jinja2Templates(directory=templates_dir)

@router.get("/")
async def read_home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@router.get("/result")
async def read_result(request: Request):
    return templates.TemplateResponse(request=request, name="result.html")

