from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OpgaveViewSet, OpgaveKommentarViewSet, PinboardPostViewSet

router = DefaultRouter()
router.register(r'opgaver', OpgaveViewSet)
router.register(r'opgave-kommentarer', OpgaveKommentarViewSet)
router.register(r'prikbord-posts', PinboardPostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
