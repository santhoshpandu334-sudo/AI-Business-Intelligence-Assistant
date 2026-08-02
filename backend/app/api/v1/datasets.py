import os
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    Dataset, DatasetFile, DatasetColumn, DatasetStatistics, 
    DataQualityReport, DataRecord, User, AuditLog
)
from app.schemas.schemas import (
    DatasetResponse, DatasetUpdate, DatasetSummaryResponse, 
    DatasetColumnResponse, DatasetStatisticsResponse
)
from app.api.deps import get_current_user, require_roles
from app.services.dataset_service import DatasetService
from app.services.insights_service import InsightsEngineService
from app.services.admin_service import AdminService

router = APIRouter()

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB Limit
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json'}

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Analyst"]))
):
    # 1. Extension & Format Check
    file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: .csv, .xlsx, .xls, .json"
        )

    # 2. File Size & Content Check
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds 100 MB limit ({len(contents)/(1024*1024):.1f} MB)."
        )
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    try:
        dataset = DatasetService.process_and_save_upload(
            db=db,
            file_name=file.filename,
            content_bytes=contents,
            owner_id=current_user.id,
            company_name=current_user.company_name or "Acme Corp",
            owner_name=current_user.full_name
        )
        # Auto-trigger AI insights generation
        InsightsEngineService.generate_all_insights(db, dataset.id)
        return dataset
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {str(e)}")

@router.get("/", response_model=List[DatasetResponse])
def list_datasets(
    search: Optional[str] = None,
    company: Optional[str] = None,
    user_name: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dataset)

    # Search filter
    if search:
        query = query.filter(Dataset.name.ilike(f"%{search}%"))
    if company:
        query = query.filter(Dataset.company_name == company)
    if user_name:
        query = query.filter(Dataset.owner_name.ilike(f"%{user_name}%"))

    # Sort
    if sort_by == "name":
        query = query.order_by(Dataset.name.asc())
    elif sort_by == "quality_score":
        query = query.order_by(Dataset.quality_score.desc())
    elif sort_by == "rows":
        query = query.order_by(Dataset.row_count.desc())
    else:
        query = query.order_by(Dataset.created_at.desc())

    datasets = query.all()
    if not datasets:
        # Seed default enterprise dataset if none exist
        default_ds = DatasetService.process_and_save_upload(
            db=db,
            file_name="Enterprise_Sales_2026.csv",
            content_bytes=(
                b"date,revenue,profit,region,category,customer_name\n"
                b"2026-01-15,120000,45000,Bangalore,Software,Acme Corp\n"
                b"2026-02-15,150000,55000,Hyderabad,Cloud,Global Tech\n"
                b"2026-03-15,98000,32000,Bangalore,Hardware,Alpha Solutions\n"
                b"2026-04-15,172000,68000,Hyderabad,SaaS,Omega Ventures"
            ),
            owner_id=current_user.id,
            company_name=current_user.company_name or "Acme Corp",
            owner_name=current_user.full_name
        )
        InsightsEngineService.generate_all_insights(db, default_ds.id)
        datasets = [default_ds]

    return datasets

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset_by_id(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return dataset

@router.put("/{dataset_id}", response_model=DatasetResponse)
def update_dataset_metadata(
    dataset_id: int,
    data_in: DatasetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager"]))
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if data_in.name:
        dataset.name = data_in.name
    if data_in.description is not None:
        dataset.description = data_in.description

    db.commit()
    db.refresh(dataset)

    AdminService.log_action(
        db, current_user.id, "RENAME_DATASET", 
        f"Dataset #{dataset.id}", f"Renamed dataset to '{dataset.name}'"
    )
    return dataset

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager"]))
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    dataset_name = dataset.name
    db.delete(dataset)
    db.commit()

    AdminService.log_action(
        db, current_user.id, "DELETE_DATASET", 
        f"Dataset #{dataset_id}", f"Deleted dataset '{dataset_name}'"
    )
    return {"message": f"Dataset '{dataset_name}' successfully deleted."}

@router.get("/{dataset_id}/summary", response_model=DatasetSummaryResponse)
def get_dataset_summary(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    return {
        "dataset": dataset,
        "file": dataset.files,
        "columns": dataset.columns or [],
        "statistics": dataset.statistics,
        "quality_report": dataset.quality_reports
    }

@router.get("/{dataset_id}/preview")
def get_dataset_preview(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(DataRecord).filter(DataRecord.dataset_id == dataset_id).order_by(DataRecord.row_index.asc()).limit(100).all()
    return [r.payload for r in records]

@router.get("/{dataset_id}/columns", response_model=List[DatasetColumnResponse])
def get_dataset_columns(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cols = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).all()
    return cols

@router.get("/{dataset_id}/statistics", response_model=DatasetStatisticsResponse)
def get_dataset_statistics(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = db.query(DatasetStatistics).filter(DatasetStatistics.dataset_id == dataset_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Statistics not available for this dataset.")
    return stats

@router.get("/{dataset_id}/download")
def download_dataset_file(
    dataset_id: int,
    cleaned: bool = Query(True, description="Set True for Cleaned dataset, False for Original raw dataset"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset or not dataset.files:
        raise HTTPException(status_code=404, detail="Dataset file records not found.")

    file_meta = dataset.files
    file_path = file_meta.cleaned_file_path if (cleaned and file_meta.cleaned_file_path) else file_meta.original_file_path

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File content not found on server storage.")

    prefix = "cleaned_" if cleaned else "original_"
    filename = f"{prefix}{file_meta.original_filename}"

    AdminService.log_action(
        db, current_user.id, "DOWNLOAD_DATASET", 
        f"Dataset #{dataset_id}", f"Downloaded {'cleaned' if cleaned else 'original'} file '{filename}'"
    )

    return FileResponse(path=file_path, filename=filename, media_type=file_meta.mime_type)
