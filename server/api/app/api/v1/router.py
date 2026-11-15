from fastapi import APIRouter

from app.api.v1.church_membership.get import router as church_membership_get_router
from app.api.v1.dashboard.get import router as dashboard_get_router
from app.api.v1.events.campus.get import router as campus_event_get_router
from app.api.v1.events.campus.ministries.post import (
	router as campus_ministry_post_router,
)
from app.api.v1.events.campus.post import router as campus_event_post_router
from app.api.v1.events.campus.teams.confirmation.post import (
	router as campus_team_confirmation_post_router,
)
from app.api.v1.events.campus.teams.post import router as campus_team_post_router
from app.api.v1.events.campus.teams.volunteers.post import (
	router as campus_team_volunteer_post_router,
)
from app.api.v1.events.church.post import router as church_event_post_router
from app.api.v1.me.get import router as me_get_router

router = APIRouter(prefix="/api/v1")
router.include_router(church_membership_get_router, prefix="/church-memberships")
router.include_router(dashboard_get_router, prefix="/dashboard")
router.include_router(campus_event_post_router, prefix="/events/campus")
router.include_router(campus_event_get_router, prefix="/events/campus")
router.include_router(church_event_post_router, prefix="/events/church")
router.include_router(campus_ministry_post_router, prefix="/events/campus")
router.include_router(campus_team_post_router, prefix="/events/campus")
router.include_router(campus_team_volunteer_post_router, prefix="/events/campus")
router.include_router(campus_team_confirmation_post_router, prefix="/events/campus")
router.include_router(me_get_router, prefix="/me")
