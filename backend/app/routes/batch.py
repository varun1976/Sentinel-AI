from fastapi import APIRouter, File, UploadFile, HTTPException, Response
from app.services.batch_service import batch_service

router = APIRouter(tags=["Batch Analysis"])

@router.post("/batch-predict", summary="Upload CSV for Batch Machine Failure Risk Analysis")
async def batch_predict(file: UploadFile = File(...)):
    """
    Accepts a CSV file containing machine parameters, validates columns,
    runs model prediction & SHAP explainability, and returns batch predictions with top risk factors.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    try:
        contents = await file.read()
        summary, csv_string = batch_service.process_csv(contents)
        return summary
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing error: {str(e)}")

@router.post("/batch-predict/export", summary="Download Batch Predictions as CSV")
async def batch_predict_export(file: UploadFile = File(...)):
    """
    Processes uploaded CSV and directly returns a downloadable CSV file containing predictions,
    probabilities, risk levels, and top risk factors.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    try:
        contents = await file.read()
        summary, csv_string = batch_service.process_csv(contents)
        
        headers = {
            "Content-Disposition": f"attachment; filename=maintainxai_batch_predictions.csv"
        }
        return Response(content=csv_string, media_type="text/csv", headers=headers)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch export error: {str(e)}")
