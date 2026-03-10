from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VidensKategoriViewSet, VidenViewSet, HjaelpPunktViewSet

router = DefaultRouter()
router.register(r'kategorier', VidensKategoriViewSet, basename='videnskategori')
router.register(r'artikler', VidenViewSet, basename='viden')
router.register(r'punkter', HjaelpPunktViewSet, basename='hjaelppunkt')

urlpatterns = [
    path('', include(router.urls)),
]
