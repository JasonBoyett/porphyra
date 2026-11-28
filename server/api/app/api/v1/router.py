from fastapi import APIRouter

from app.api.v1.church_membership.get import router as church_membership_get_router
from app.api.v1.churches.routes import router as churches_router
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
from app.api.v1.invitations.routes import router as invitations_router
from app.api.v1.me.get import router as me_get_router
from app.api.v1.permissions.get import router as permissions_get_router
from app.api.v1.sync.websocket import router as sync_websocket_router

router = APIRouter(prefix="/api/v1")
router.include_router(church_membership_get_router, prefix="/church-memberships")
router.include_router(churches_router, prefix="/churches")
router.include_router(invitations_router, prefix="/invitations")
router.include_router(dashboard_get_router, prefix="/dashboard")
router.include_router(campus_event_post_router, prefix="/events/campus")
router.include_router(campus_event_get_router, prefix="/events/campus")
router.include_router(church_event_post_router, prefix="/events/church")
router.include_router(campus_ministry_post_router, prefix="/events/campus")
router.include_router(campus_team_post_router, prefix="/events/campus")
router.include_router(campus_team_volunteer_post_router, prefix="/events/campus")
router.include_router(campus_team_confirmation_post_router, prefix="/events/campus")
router.include_router(me_get_router, prefix="/me")
router.include_router(permissions_get_router, prefix="/permissions")
router.include_router(sync_websocket_router, prefix="/sync")
