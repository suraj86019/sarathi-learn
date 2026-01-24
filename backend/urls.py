"""
Main Backend URLs Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """API root endpoint"""
    return Response({
        'message': 'Welcome to Sarathi Learn API',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'login': '/api/users/auth/login/',
                'logout': '/api/users/auth/logout/',
                'register': '/api/users/auth/register/',
                'refresh_token': '/api/users/auth/refresh/',
            },
            'users': {
                'list': '/api/users/users/',
                'me': '/api/users/users/me/',
                'update_profile': '/api/users/users/update_profile/',
                'change_password': '/api/users/users/change_password/',
            },
            'superadmin': '/api/superadmin/',
            'admin': '/api/admin/',
            'teachers': '/api/teachers/',
            'students': '/api/students/',
            'ai_machine': '/api/ai-machine/',
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for Railway deployment monitoring"""
    return Response({
        'status': 'healthy',
        'version': '1.0.0',
    })


urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API root
    path('api/', api_root, name='api-root'),
    
    # Health check endpoint for Railway
    path('api/health/', health_check, name='health-check'),
    
    # API endpoints
    path('api/users/', include('users.urls', namespace='users')),
    path('api/superadmin/', include('superadmin.urls')),  # Superadmin routes
    path('api/admin/', include('admins.urls')),  # Admin routes
    path('api/teachers/', include('teachers.urls', namespace='teachers')),  # Teacher routes
    path('api/students/', include('students.urls', namespace='students')),  # Student routes
    # path('api/ai-machine/', include('ai_machine.urls', namespace='ai_machine')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
