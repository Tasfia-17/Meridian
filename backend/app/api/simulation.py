from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.state import get_state, set_state
from app.simulation.engine import SCENARIOS, recommend_route, run_scenario
from app.api.ws import broadcast

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.get("/scenarios")
async def list_scenarios():
    return [{"id": s.id, "name": s.name, "description": s.description} for s in SCENARIOS.values()]


class RunRequest(BaseModel):
    scenario_id: str


@router.post("/run")
async def run(req: RunRequest):
    snap = get_state()
    try:
        frames = run_scenario(req.scenario_id, snap)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Apply final frame as new live state
    if frames:
        final = frames[-1]
        set_state(final)
        await broadcast({"type": "simulation_result", "scenario_id": req.scenario_id, "frames": len(frames)})

    return {
        "scenario_id": req.scenario_id,
        "frames": [f.model_dump() for f in frames],
    }


class RouteRequest(BaseModel):
    from_node: str
    to_node: str


@router.post("/route")
async def route(req: RouteRequest):
    snap = get_state()
    path = recommend_route(snap, req.from_node, req.to_node)
    return {"path": path, "viable": path is not None}


@router.post("/reset")
async def reset():
    from app.services.seed import get_seed_snapshot
    set_state(get_seed_snapshot())
    return {"status": "reset"}
