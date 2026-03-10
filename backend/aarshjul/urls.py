from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AktivitetViewSet, AarshjulGruppeViewSet

router = DefaultRouter()
router.register(r'aktiviteter', AktivitetViewSet, basename='aktivitet')
router.register(r'grupper', AarshjulGruppeViewSet, basename='aarshjulgruppe')

urlpatterns = [
    path('', include(router.urls)),
]
