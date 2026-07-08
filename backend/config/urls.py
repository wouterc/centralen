from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    UserViewSet, TeamViewSet, InvitationViewSet, CompanyViewSet, WorkspaceRequestViewSet, WorkspaceMembershipViewSet,
    login_view, logout_view, global_search, get_translations_view, accept_invitation
)
from opgaver.views import OpgaveViewSet, OpgaveKommentarViewSet, PinboardPostViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'opgaver', OpgaveViewSet, basename='opgave')
router.register(r'opgave-kommentarer', OpgaveKommentarViewSet, basename='opgave-kommentar')
router.register(r'prikbord-posts', PinboardPostViewSet, basename='prikbord-post')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'workspace-requests', WorkspaceRequestViewSet, basename='workspace-request')
router.register(r'memberships', WorkspaceMembershipViewSet, basename='membership')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/login/', login_view, name='api-login'),
    path('api/logout/', logout_view, name='api-logout'),
    path('api/search/', global_search, name='global-search'),
    path('api/translations/', get_translations_view, name='get-translations'),
    path('api/accept-invitation/<uuid:token>/', accept_invitation, name='accept-invitation'),
    path('api/', include(router.urls)),
    path('api/vidensbank/', include('vidensbank.urls')),
    path('api/tidsregistrering/', include('tidsregistrering.urls')),
    path('api/aarshjul/', include('aarshjul.urls')),
    path('api/applinks/', include('applinks.urls')),
    path('api/flowchart/', include('flowchart.urls')),
]
