from fastapi import FastAPI
from routes import predict
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
# ✅ Add CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or replace with ["http://localhost:5000"] for stricter control
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include prediction routes
app.include_router(predict.router, prefix="/api", tags=["Prediction"])

@app.get("/")
def home():
    return {"message": "FastAPI Groundwater Prediction API is running"}
