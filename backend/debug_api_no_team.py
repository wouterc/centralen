import json
from django.contrib.auth.models import User
from opgaver.views import OpgaveViewSet
from rest_framework.test import APIRequestFactory, force_authenticate

try:
    user = User.objects.get(username='WC')
    factory = APIRequestFactory()
    view = OpgaveViewSet.as_view({'get': 'list'})
    
    # NO team parameter
    request = factory.get('/api/opgaver/')
    force_authenticate(request, user=user)
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Data Length: {len(response.data)}")
    for i, item in enumerate(response.data):
        print(f"Task {i}: ID={item['id']}, Team={item['team']}, Status='{item['status']}'")

except Exception as e:
    print(f"Error: {e}")
