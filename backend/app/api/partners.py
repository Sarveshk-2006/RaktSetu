"""RAKTSETU API — Partner Network"""
from fastapi import APIRouter
from app.services.demo_data import ORGANISATIONS

router = APIRouter()


@router.get("/")
async def list_partners():
    return ORGANISATIONS
