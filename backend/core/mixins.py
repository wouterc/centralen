from rest_framework import exceptions
from .models import WorkspaceMembership

def get_active_membership(request):
    user = request.user
    if not user.is_authenticated:
        return None
        
    workspace_id = request.headers.get('X-Workspace-Id')
    memberships = user.memberships.select_related('company')
    
    if workspace_id:
        for m in memberships:
            # Match UUID string
            if str(m.company.id) == workspace_id:
                return m
        return None
    
    # Fallback 1: If user only has exactly 1 workspace, default to it
    if memberships.count() == 1:
        return memberships.first()
        
    # Fallback 2: Legacy fallback to profile's company
    if hasattr(user, 'profile') and user.profile.company:
        return user.memberships.filter(company=user.profile.company).first()
        
    return None

def get_active_company(request):
    m = get_active_membership(request)
    return m.company if m else None

class CompanyFilterMixin:
    """
    Mixin to filter querysets and handle creations per company (Multi-Tenancy).
    Assumes the model has a `company` field and uses `get_active_company` helper.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        company = get_active_company(self.request)
        
        if not company:
            return queryset.none()
            
        return queryset.filter(company=company)

    def perform_create(self, serializer):
        company = get_active_company(self.request)
        if not company:
            raise exceptions.ValidationError({"detail": "Du har intet valgt arbejdsrum."})
        
        serializer.save(company=company)
