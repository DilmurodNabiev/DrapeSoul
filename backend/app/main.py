import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes import admins, analytics, auth, categories, health, orders, products, telegram
from app.api.routes import settings as settings_routes
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    Path(settings.CATEGORY_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.RECEIPTS_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("DrapeSoul API started [%s]", settings.ENV)
    yield
    logger.info("DrapeSoul API shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


api_router = FastAPI()
app.include_router(health.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(telegram.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admins.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(settings_routes.router, prefix="/api")

static_path = Path(settings.UPLOAD_DIR)
if static_path.exists():
    app.mount("/static/uploads/products", StaticFiles(directory=str(static_path)), name="product-images")

categories_path = Path(settings.CATEGORY_UPLOAD_DIR)
if categories_path.exists():
    app.mount("/static/uploads/categories", StaticFiles(directory=str(categories_path)), name="category-images")

receipts_path = Path(settings.RECEIPTS_UPLOAD_DIR)
if receipts_path.exists():
    app.mount("/static/uploads/receipts", StaticFiles(directory=str(receipts_path)), name="receipt-images")
