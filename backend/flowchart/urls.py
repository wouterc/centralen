from rest_framework.routers import DefaultRouter
from .views import FlowchartViewSet, FlowchartNodeViewSet, FlowchartEdgeViewSet

router = DefaultRouter()
router.register('flowcharts', FlowchartViewSet, basename='flowchart')
router.register('flowchart-nodes', FlowchartNodeViewSet, basename='flowchart-node')
router.register('flowchart-edges', FlowchartEdgeViewSet, basename='flowchart-edge')

urlpatterns = router.urls
