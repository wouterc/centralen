from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    KoderGrupperViewSet, OpgaverKodeViewSet, TidregViewSet, 
    BrugerProfilTimeViewSet, BrugerIndstillingTimeViewSet
)

router = DefaultRouter()
router.register(r'grupper', KoderGrupperViewSet)
router.register(r'koder', OpgaverKodeViewSet)
router.register(r'registreringer', TidregViewSet, basename='registreringer')
router.register(r'profiler', BrugerProfilTimeViewSet, basename='profiler')
router.register(r'indstillinger', BrugerIndstillingTimeViewSet, basename='indstillinger')

urlpatterns = [
    path('', include(router.urls)),
]
