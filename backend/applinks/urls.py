from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppLinkViewSet, AppPurposeViewSet

router = DefaultRouter()
router.register(r'links', AppLinkViewSet, basename='applink')
router.register(r'purposes', AppPurposeViewSet, basename='apppurpose')

urlpatterns = [
    path('', include(router.urls)),
]
