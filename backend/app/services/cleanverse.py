"""
Cleanverse Cooperate API client.
Handles header injection, AES encryption for write endpoints,
and plain JSON for read endpoints.
"""
import uuid
from typing import Any

import httpx

from app.core.config import settings
from app.core.crypto import wrap


class CleanverseError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(f"[{code}] {message}")
        self.code = code


def _headers(request_id: str | None = None) -> dict:
    h = {
        "Content-Type": "application/json",
        "api-id": settings.cleanverse_api_id,
    }
    if request_id:
        h["X-Request-ID"] = request_id
    return h


def _rid() -> str:
    return str(uuid.uuid4())


def _check(data: dict) -> dict:
    code = data.get("code", "")
    if code != "0000":
        raise CleanverseError(code, data.get("message", "unknown error"))
    return data.get("data", {})


class CleanverseClient:
    def __init__(self):
        self._base = settings.cleanverse_base_url.rstrip("/")
        self._key = settings.cleanverse_api_key

    def _url(self, path: str) -> str:
        return f"{self._base}/{path.lstrip('/')}"

    async def _post_encrypted(self, path: str, payload: dict) -> dict:
        body = wrap(payload, self._key)
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(self._url(path), json=body, headers=_headers(_rid()))
            r.raise_for_status()
        return _check(r.json())

    async def _post_plain(self, path: str, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(self._url(path), json=payload, headers=_headers(_rid()))
            r.raise_for_status()
        return _check(r.json())

    async def _get(self, path: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(self._url(path), headers=_headers(_rid()))
            r.raise_for_status()
        return _check(r.json())

    # ── A-Pass ────────────────────────────────────────────────────────────────

    async def generate_apass(self, payload: dict) -> dict:
        return await self._post_encrypted("generate_apass", payload)

    async def query_apass(self, chain: str, address: str) -> dict:
        return await self._post_plain("query_apass", {"chain": chain, "address": address})

    async def verify_apass(self, chain: str, atoken: str, address: str) -> dict:
        return await self._post_plain("verify_apass", {"chain": chain, "atoken": atoken, "address": address})

    async def query_deposit_address(self, chain: str, address: str) -> dict:
        return await self._post_plain("query_deposit_address", {"chain": chain, "address": address})

    async def update_status(self, payload: dict) -> dict:
        return await self._post_encrypted("update_status", payload)

    # ── A-Token ───────────────────────────────────────────────────────────────

    async def query_deposit_atoken_list(self, chain: str, symbol: str | None = None) -> dict:
        body: dict[str, Any] = {"chain": chain}
        if symbol:
            body["symbol"] = symbol
        return await self._post_plain("query_deposit_atoken_list", body)

    async def query_txs(
        self,
        chain: str,
        address: str,
        symbol: str | None = None,
        start_time: int | None = None,
        end_time: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        body: dict[str, Any] = {"chain": chain, "address": address, "page": page, "pageSize": page_size}
        if symbol:
            body["symbol"] = symbol
        if start_time:
            body["startTime"] = start_time
        if end_time:
            body["endTime"] = end_time
        return await self._post_plain("query_txs", body)

    async def faucet(self, chain: str, symbol: str, deposit_address: str, amount: str) -> dict:
        return await self._post_plain("faucet", {
            "chain": chain,
            "symbol": symbol,
            "depositAddress": deposit_address,
            "amount": amount,
        })

    async def download_travel_rule(self, tx_hash: str, chain: str, address: str) -> dict:
        return await self._post_plain("download_travel_rule", {
            "txHash": tx_hash,
            "wallet": {"chain": chain, "address": address},
        })

    # ── Validator ─────────────────────────────────────────────────────────────

    async def validator_verify(self, chain: str, contract_address: str, user_address: str) -> dict:
        return await self._post_plain("validator/verify", {
            "chain": chain,
            "contract_address": contract_address,
            "user_address": user_address,
        })

    async def validator_is_register(self, chain: str, contract_address: str) -> dict:
        return await self._post_plain("validator/is_register", {
            "chain": chain,
            "contract_address": contract_address,
        })

    async def validator_rules(self, chain: str, contract_address: str) -> dict:
        return await self._post_plain("validator/rules", {
            "chain": chain,
            "contract_address": contract_address,
        })

    async def validator_is_paused(self, chain: str, contract_address: str) -> dict:
        return await self._post_plain("validator/is_paused", {
            "chain": chain,
            "contract_address": contract_address,
        })


client = CleanverseClient()
