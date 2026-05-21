from celery import Celery
from app.core.config import settings


def create_celery_app() -> Celery:
    """Factory function to create and configure the Celery application."""
    celery_app = Celery(
        "propinspect",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
        include=["app.services.pipeline"],
    )
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        task_routes={
            "app.services.pipeline.run_inspection_pipeline": {"queue": "ai_queue"},
            "app.services.report_service.generate_pdf_report": {"queue": "reports_queue"},
        },
        task_soft_time_limit=3600,   # 1 hour soft limit
        task_time_limit=7200,        # 2 hour hard limit
        worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (memory leaks)
        result_expires=86400,           # Keep results for 24h
    )
    return celery_app


celery_app = create_celery_app()
