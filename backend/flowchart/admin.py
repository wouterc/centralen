from django.contrib import admin
from .models import Flowchart, FlowchartNode, FlowchartEdge

admin.site.register(Flowchart)
admin.site.register(FlowchartNode)
admin.site.register(FlowchartEdge)
