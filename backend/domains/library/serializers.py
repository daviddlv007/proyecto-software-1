from rest_framework import serializers
from .models import Usuario, Practica, PlanSemanal, Logro

class UsuarioSerializer(serializers.ModelSerializer):
    nombreUsuario = serializers.CharField(source='nombre_usuario')
    class Meta:
        model = Usuario
        fields = ['id', 'nombreUsuario', 'email']

class PracticaSerializer(serializers.ModelSerializer):
    usuarioId = serializers.PrimaryKeyRelatedField(source='usuario_id', queryset=Usuario.objects.all())
    archivoAudio = serializers.CharField(source='archivo_audio')
    puntajeFluidez = serializers.FloatField(source='puntaje_fluidez')
    class Meta:
        model = Practica
        fields = ['id', 'usuarioId', 'archivoAudio', 'transcripcion', 'puntajeFluidez', 'muletillas']

class PlanSemanalSerializer(serializers.ModelSerializer):
    usuarioId = serializers.PrimaryKeyRelatedField(source='usuario_id', queryset=Usuario.objects.all())
    semanaInicio = serializers.CharField(source='semana_inicio')
    class Meta:
        model = PlanSemanal
        fields = ['id', 'usuarioId', 'ejercicios', 'semanaInicio']

class LogroSerializer(serializers.ModelSerializer):
    usuarioId = serializers.PrimaryKeyRelatedField(source='usuario_id', queryset=Usuario.objects.all())
    fechaObtenido = serializers.CharField(source='fecha_obtenido')
    class Meta:
        model = Logro
        fields = ['id', 'usuarioId', 'nombre', 'descripcion', 'fechaObtenido']
