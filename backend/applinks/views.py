from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AppLink, AppPurpose
from .serializers import AppLinkSerializer, AppPurposeSerializer
from core.mixins import CompanyFilterMixin
import os

class AppPurposeViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = AppPurpose.objects.all()
    serializer_class = AppPurposeSerializer
    permission_classes = [permissions.IsAuthenticated]

class AppLinkViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = AppLink.objects.all()
    serializer_class = AppLinkSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        applink = self.get_object()
        path = applink.path.strip()
        
        # Check if it's a URL
        if path.startswith(('http://', 'https://', 'mailto:')):
            try:
                os.startfile(path)
                return Response({'status': 'success', 'message': f'"{applink.title}" åbnet i browser'})
            except Exception as e:
                return Response({'status': 'error', 'message': f'Kunne ikke åbne link: {str(e)}'}, status=500)
        
        # Otherwise assume it's a file path
        if os.path.exists(path):
            try:
                os.startfile(path)
                return Response({'status': 'success', 'message': f'"{applink.title}" blev åbnet på serveren'})
            except Exception as e:
                return Response({'status': 'error', 'message': f'Kunne ikke åbne fil: {str(e)}'}, status=500)
        else:
            return Response({'status': 'error', 'message': f'Stien blev ikke fundet: {path}'}, status=404)

    @action(detail=True, methods=['post'])
    def open_folder(self, request, pk=None):
        applink = self.get_object()
        path = applink.path.strip()
        
        if path.startswith(('http://', 'https://', 'mailto:')):
            return Response({'status': 'error', 'message': 'Kan ikke åbne mappe for et link'}, status=400)
            
        directory = os.path.dirname(path)
        if os.path.exists(directory):
            try:
                import subprocess
                # Using explorer.exe explicitly often helps with bringing the window to front on Windows
                subprocess.Popen(['explorer', directory])
                return Response({'status': 'success', 'message': f'Mappen for "{applink.title}" blev åbnet'})
            except Exception as e:
                # Fallback to os.startfile
                try:
                    os.startfile(directory)
                    return Response({'status': 'success', 'message': f'Mappen for "{applink.title}" blev åbnet'})
                except Exception as start_err:
                    return Response({'status': 'error', 'message': f'Kunne ikke åbne mappe: {str(start_err)}'}, status=500)
        else:
            return Response({'status': 'error', 'message': f'Mappen blev ikke fundet: {directory}'}, status=404)
