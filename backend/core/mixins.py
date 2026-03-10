from rest_framework import exceptions

class CompanyFilterMixin:
    """
    Mixin to filter querysets and handle creations per company (Multi-Tenancy).
    Assumes the model has a `company` field and the requesting user has a `profile.company`.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Superuser could bypass this if we want, but let's strictly tie it to UserProfile company for now
        if not hasattr(user, 'profile') or not user.profile.company:
            return queryset.none()
            
        return queryset.filter(company=user.profile.company)

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'profile') or not user.profile.company:
            raise exceptions.ValidationError({"detail": "Du har ingen tilknyttet virksomhed."})
        
        serializer.save(company=user.profile.company)
