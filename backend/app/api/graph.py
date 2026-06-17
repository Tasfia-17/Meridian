from fastapi import APIRouter
from app.services.state import get_state
from app.services.compliance import get_history
from app.services.prediction import full_risk_report

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/snapshot")
async def snapshot():
    return get_state()


@router.get("/history")
async def history(since: int | None = None):
    return {"snapshots": [s.model_dump() for s in get_history(since)]}


@router.get("/risk")
async def risk():
    return full_risk_report(get_state())
