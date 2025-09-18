from rest_framework import viewsets
from .models import Usuario, Practica, PlanSemanal, Logro
from .serializers import UsuarioSerializer, PracticaSerializer, PlanSemanalSerializer, LogroSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class PracticaViewSet(viewsets.ModelViewSet):
    queryset = Practica.objects.all()
    serializer_class = PracticaSerializer

class PlanSemanalViewSet(viewsets.ModelViewSet):
    queryset = PlanSemanal.objects.all()
    serializer_class = PlanSemanalSerializer

class LogroViewSet(viewsets.ModelViewSet):
    queryset = Logro.objects.all()
    serializer_class = LogroSerializer
