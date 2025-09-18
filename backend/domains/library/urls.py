from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, PracticaViewSet, PlanSemanalViewSet, LogroViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'practicas', PracticaViewSet)
router.register(r'plansemanals', PlanSemanalViewSet)
router.register(r'logros', LogroViewSet)

urlpatterns = [
    path('', include(router.urls)),
]