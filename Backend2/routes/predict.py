from fastapi import APIRouter
from controllers.inference import predict_next_day
from controllers.inference import router

router = APIRouter()

@router.get("/predict")
def trigger_prediction():
    result = predict_next_day()
    return {"predicted_value": result}
