from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Team, Company, WorkspaceMembership, Invitation, WorkspaceRequest

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'navn', 'color', 'medlemmer']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['color', 'vidensbank_category_order']

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'navn', 'cvr', 'slug']

class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    
    class Meta:
        model = WorkspaceMembership
        fields = ['id', 'company', 'role', 'alias', 'color']

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['id', 'email', 'role', 'token', 'created_at']
        read_only_fields = ['id', 'token', 'created_at']

class WorkspaceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceRequest
        fields = ['id', 'email', 'company_name', 'token', 'created_at']
        read_only_fields = ['id', 'token', 'created_at']

class UserMinimalSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'color', 'role', 'display_name']

    def get_membership(self, obj):
        request = self.context.get('request')
        if not request: return None
        workspace_id = request.headers.get('X-Workspace-Id')
        if not workspace_id: return None
        return obj.memberships.filter(company_id=workspace_id).first()

    def get_color(self, obj):
        m = self.get_membership(obj)
        return m.color if m else getattr(obj, 'profile', None).color if hasattr(obj, 'profile') else '#3b82f6'

    def get_role(self, obj):
        m = self.get_membership(obj)
        return m.role if m else getattr(obj, 'profile', None).role if hasattr(obj, 'profile') else 'MEMBER'

    def get_display_name(self, obj):
        m = self.get_membership(obj)
        if m and m.alias: return m.alias
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class UserSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    vidensbank_category_order = serializers.JSONField(source='profile.vidensbank_category_order', required=False)
    language = serializers.CharField(source='profile.language', required=False, default='da')
    password = serializers.CharField(write_only=True, required=False)
    teams = TeamSerializer(many=True, read_only=True)
    memberships = WorkspaceMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'color', 'role', 'display_name', 'vidensbank_category_order', 'language', 'is_active', 'password', 'teams', 'memberships']

    def get_membership(self, obj):
        request = self.context.get('request')
        if not request: return None
        workspace_id = request.headers.get('X-Workspace-Id')
        if not workspace_id: return None
        # We assume the memberships are prefetched
        for m in obj.memberships.all():
            if str(m.company_id) == workspace_id:
                return m
        return None

    def get_color(self, obj):
        m = self.get_membership(obj)
        return m.color if m else getattr(obj, 'profile', None).color if hasattr(obj, 'profile') else '#3b82f6'

    def get_role(self, obj):
        m = self.get_membership(obj)
        return m.role if m else getattr(obj, 'profile', None).role if hasattr(obj, 'profile') else 'MEMBER'

    def get_display_name(self, obj):
        m = self.get_membership(obj)
        if m and m.alias: return m.alias
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def create(self, validated_data):
        # Extract profile data (source='profile.color' puts it under 'profile' key)
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        # Create standard user
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        # Color and Role are optional
        color = profile_data.get('color')
        role = profile_data.get('role')
        vidensbank_category_order = profile_data.get('vidensbank_category_order')
        language = profile_data.get('language')
        if language:
            language = language.split('-')[0].lower()
            if language not in ('en', 'da', 'nl', 'fr', 'de'):
                language = 'da'
        
        if color or role or vidensbank_category_order is not None or language:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if color: profile.color = color
            if language: profile.language = language
            if vidensbank_category_order is not None: profile.vidensbank_category_order = vidensbank_category_order
            if role: 
                profile.role = role
                # Sync with Django internal flags
                # ADMIN = Administrator (kan alt) -> is_superuser + is_staff
                # SUPERUSER = Superbruger (kan tilføje brugere) -> is_staff ONLY
                if role == 'ADMIN':
                    user.is_superuser = True
                    user.is_staff = True
                elif role == 'SUPERUSER':
                    user.is_superuser = False
                    user.is_staff = True
                else:
                    user.is_superuser = False
                    user.is_staff = False
                user.save()
            profile.save()
            
        return user

    def update(self, instance, validated_data):
        request = self.context.get('request')
        current_user = request.user if request else None
        
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        # Security checks
        is_admin_or_superuser = False
        if current_user:
            if current_user.is_superuser:
                is_admin_or_superuser = True
            else:
                from .mixins import get_active_membership
                m = get_active_membership(request)
                is_admin_or_superuser = m and m.role in ['ADMIN', 'SUPERUSER']

        # Only admins/superusers can change is_active
        if 'is_active' in validated_data and not is_admin_or_superuser:
            validated_data.pop('is_active')

        # Only admin/superusers can change roles
        role = profile_data.get('role')
        if role and not is_admin_or_superuser:
            profile_data.pop('role')
            role = None

        # Normal users can only update themselves (or admins can update anyone)
        if not is_admin_or_superuser and instance.id != current_user.id:
            # This should ideally be handled in the ViewSet permissions, 
            # but as a failsafe, we clear validated_data
            return instance

        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
            
        instance.save()
        
        # Update profile color and role
        color = profile_data.get('color')
        vidensbank_category_order = profile_data.get('vidensbank_category_order')
        language = profile_data.get('language')
        if language:
            language = language.split('-')[0].lower()
            if language not in ('en', 'da', 'nl', 'fr', 'de'):
                language = 'da'
        
        if color or role or vidensbank_category_order is not None or language:
            # Check if we should update a specific membership
            workspace_id = request.headers.get('X-Workspace-Id') if request else None
            membership = None
            if workspace_id:
                membership = WorkspaceMembership.objects.filter(user=instance, company_id=workspace_id).first()
            
            if membership:
                if color: membership.color = color
                if role: membership.role = role
                membership.save()
            else:
                # Fallback to global profile
                profile, _ = UserProfile.objects.get_or_create(user=instance)
                if color: profile.color = color
                if role: profile.role = role
                profile.save()

            if vidensbank_category_order is not None:
                profile, _ = UserProfile.objects.get_or_create(user=instance)
                profile.vidensbank_category_order = vidensbank_category_order
                profile.save()

            if language:
                profile, _ = UserProfile.objects.get_or_create(user=instance)
                profile.language = language
                profile.save()

            if role: 
                # Sync with Django internal flags (Admin/Superuser flags are still global for now)
                if role == 'ADMIN':
                    instance.is_superuser = True
                    instance.is_staff = True
                elif role == 'SUPERUSER':
                    instance.is_superuser = False
                    instance.is_staff = True
                else:
                    instance.is_superuser = False
                    instance.is_staff = False
                instance.save()
            
        return instance
