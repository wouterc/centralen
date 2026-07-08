from django.contrib.auth.models import User
from django.db.models import Q

class EmailAuthBackend:
    """
    Authenticate using an e-mail address.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # We allow checking for both username and email kwarg
        login_id = kwargs.get('email') or username
        if not login_id:
            return None
            
        try:
            # Check both email and username just in case, but prefer email
            user = User.objects.get(Q(email__iexact=login_id) | Q(username__iexact=login_id))
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # If multiple users have the same email, pick the first one and warn.
            # In Phase 2, email uniqueness should be enforced.
            user = User.objects.filter(Q(email__iexact=login_id) | Q(username__iexact=login_id)).order_by('id').first()
            if user.check_password(password):
                return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
