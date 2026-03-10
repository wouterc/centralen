from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Team

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'navn', 'color', 'medlemmer']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['color', 'vidensbank_category_order']

class UserMinimalSerializer(serializers.ModelSerializer):
    color = serializers.CharField(source='profile.color', read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'color', 'role']

class UserSerializer(serializers.ModelSerializer):
    color = serializers.CharField(source='profile.color', required=False)
    role = serializers.CharField(source='profile.role', required=False)
    vidensbank_category_order = serializers.JSONField(source='profile.vidensbank_category_order', required=False)
    password = serializers.CharField(write_only=True, required=False)
    teams = TeamSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'color', 'role', 'vidensbank_category_order', 'is_active', 'password', 'teams']

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
        
        if color or role or vidensbank_category_order is not None:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if color: profile.color = color
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
            is_admin_or_superuser = current_user.is_superuser or (hasattr(current_user, 'profile') and current_user.profile.role in ['ADMIN', 'SUPERUSER'])

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
        
        if color or role or vidensbank_category_order is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            if color: profile.color = color
            if vidensbank_category_order is not None: profile.vidensbank_category_order = vidensbank_category_order
            if role: 
                profile.role = role
                # Sync with Django internal flags
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
            profile.save()
            
        return instance
