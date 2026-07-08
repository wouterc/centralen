from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Company, Team


class NodeShape(models.TextChoices):
    RECTANGLE = 'rectangle', _('Rectangle (Process)')
    DIAMOND = 'diamond', _('Diamond (Decision)')
    OVAL = 'oval', _('Oval (Start/End)')


class Flowchart(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='flowcharts')
    team = models.ForeignKey(
        Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='flowcharts'
    )
    navn = models.CharField(max_length=255)
    beskrivelse = models.TextField(blank=True)
    oprettet = models.DateTimeField(auto_now_add=True)
    opdateret = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Flowchart')
        verbose_name_plural = _('Flowcharts')
        ordering = ['navn']

    def __str__(self):
        return self.navn


class FlowchartNode(models.Model):
    flowchart = models.ForeignKey(Flowchart, on_delete=models.CASCADE, related_name='nodes')
    node_id = models.CharField(max_length=100)
    navn = models.CharField(max_length=255)
    beskrivelse = models.TextField(blank=True)
    farve = models.CharField(max_length=20, default='#3b82f6')
    form_type = models.CharField(
        max_length=20, choices=NodeShape.choices, default=NodeShape.RECTANGLE
    )
    x_pos = models.FloatField(default=0)
    y_pos = models.FloatField(default=0)
    bredde = models.FloatField(default=160)
    hoejde = models.FloatField(default=60)

    class Meta:
        verbose_name = _('Flowchart Node')
        verbose_name_plural = _('Flowchart Nodes')
        unique_together = ('flowchart', 'node_id')

    def __str__(self):
        return f"{self.navn} ({self.flowchart.navn})"


class FlowchartEdge(models.Model):
    flowchart = models.ForeignKey(Flowchart, on_delete=models.CASCADE, related_name='edges')
    edge_id = models.CharField(max_length=100)
    source = models.ForeignKey(
        FlowchartNode, on_delete=models.CASCADE, related_name='outgoing_edges'
    )
    target = models.ForeignKey(
        FlowchartNode, on_delete=models.CASCADE, related_name='incoming_edges'
    )
    label = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _('Flowchart Edge')
        verbose_name_plural = _('Flowchart Edges')
        unique_together = ('flowchart', 'edge_id')

    def __str__(self):
        return f"{self.source.navn} → {self.target.navn}"
