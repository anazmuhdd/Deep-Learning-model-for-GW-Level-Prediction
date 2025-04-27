from fastapi import APIRouter
from controllers.inference import predict_next_day, test_prediction_console, PredictionInput, generate_features_for_day

router = APIRouter()

@router.post("/predict")
def trigger_prediction(data: dict):
    return predict_next_day(PredictionInput(**data))

@router.post("/test-predict")
def trigger_console_prediction(data: dict):
    return test_prediction_console(PredictionInput(**data))

@router.post("/feature-engineer")
def handle_feature_engineering(data: PredictionInput):
    return generate_features_for_day(data)