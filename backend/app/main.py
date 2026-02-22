from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio
from .databricks_client import DatabricksClient

app = FastAPI(title="SweetReturns Agent Decision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for connection in dead:
            self.active_connections.remove(connection)


manager = ConnectionManager()
db_client = DatabricksClient()


class NewsInput(BaseModel):
    news_text: str


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "sweetreturns-api"}


@app.websocket("/ws/agent-stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    scenario = "covid_crash"
    timestamp = 0
    try:
        while True:
            try:
                # Receive time/scenario from client with timeout
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                scenario = data.get("scenario", scenario)
                timestamp = data.get("timestamp", timestamp)
            except asyncio.TimeoutError:
                # No data received, continue with last known state
                pass
            except Exception:
                break

            # Query Databricks for agent flows
            flows = await db_client.get_agent_flows(scenario, timestamp)

            # Stream back to client
            await websocket.send_json({"type": "agent_flows", "data": flows})

            await asyncio.sleep(0.1)  # 10 FPS update rate
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@app.post("/inject-news")
async def inject_news(payload: NewsInput):
    """Live Hero Feature: Inject fake news and get real-time agent reaction"""
    news_text = payload.news_text

    # Call FinBERT on Databricks Model Serving
    sentiment = await db_client.analyze_sentiment(news_text)
    affected_stocks = await db_client.get_affected_stocks(news_text)
    agent_reaction = await db_client.compute_agent_reaction(sentiment, affected_stocks)

    # Broadcast to all connected clients
    await manager.broadcast({
        "type": "breaking_news",
        "news": news_text,
        "sentiment": sentiment,
        "agent_reaction": agent_reaction,
    })

    return {
        "sentiment": sentiment["label"],
        "score": sentiment["score"],
        "affected_tickers": affected_stocks,
        "message": "News broadcasted to agents"
    }
