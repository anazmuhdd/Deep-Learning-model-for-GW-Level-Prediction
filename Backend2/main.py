from fastapi import FastAPI
from routes import predict

app = FastAPI()

# Include prediction routes
app.include_router(predict.router, prefix="/api", tags=["Prediction"])

@app.get("/")
def home():
    return {"message": "FastAPI Groundwater Prediction API is running"}
