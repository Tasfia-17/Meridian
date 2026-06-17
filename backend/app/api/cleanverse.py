from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.cleanverse import client, CleanverseError

router = APIRouter(prefix="/cleanverse", tags=["cleanverse"])


class APassQuery(BaseModel):
    chain: str
    address: str


class FaucetRequest(BaseModel):
    chain: str
    symbol: str
    deposit_address: str
    amount: str = "10"


class TxQuery(BaseModel):
    chain: str
    address: str
    symbol: str | None = None
    page: int = 1
    page_size: int = 20


class ValidatorVerify(BaseModel):
    chain: str
    contract_address: str
    user_address: str


def _wrap(coro):
    async def handler(*args, **kwargs):
        try:
            return await coro(*args, **kwargs)
        except CleanverseError as e:
            raise HTTPException(status_code=400, detail=str(e))
    return handler


@router.post("/query_apass")
async def query_apass(req: APassQuery):
    try:
        return await client.query_apass(req.chain, req.address)
    except CleanverseError as e:
        raise HTTPException(400, str(e))


@router.post("/query_txs")
async def query_txs(req: TxQuery):
    try:
        return await client.query_txs(req.chain, req.address, req.symbol, page=req.page, page_size=req.page_size)
    except CleanverseError as e:
        raise HTTPException(400, str(e))


@router.post("/faucet")
async def faucet(req: FaucetRequest):
    try:
        return await client.faucet(req.chain, req.symbol, req.deposit_address, req.amount)
    except CleanverseError as e:
        raise HTTPException(400, str(e))


@router.post("/validator/verify")
async def validator_verify(req: ValidatorVerify):
    try:
        return await client.validator_verify(req.chain, req.contract_address, req.user_address)
    except CleanverseError as e:
        raise HTTPException(400, str(e))


@router.post("/atoken_list")
async def atoken_list(chain: str = "base"):
    try:
        return await client.query_deposit_atoken_list(chain)
    except CleanverseError as e:
        raise HTTPException(400, str(e))
