from django.db import models

class Usuario(models.Model):
    id = models.AutoField(primary_key=True)
    nombre_usuario = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    class Meta:
        db_table = 'usuarios'
    def __str__(self):
        return str(self.id)

class Practica(models.Model):
    id = models.AutoField(primary_key=True)
    usuario_id = models.ForeignKey('Usuario', on_delete=models.CASCADE)
    archivo_audio = models.CharField(max_length=255)
    transcripcion = models.CharField(max_length=255)
    puntaje_fluidez = models.FloatField()
    muletillas = models.IntegerField()
    class Meta:
        db_table = 'practicas'
    def __str__(self):
        return str(self.id)

class PlanSemanal(models.Model):
    id = models.AutoField(primary_key=True)
    usuario_id = models.ForeignKey('Usuario', on_delete=models.CASCADE)
    ejercicios = models.TextField()
    semana_inicio = models.CharField(max_length=255)
    class Meta:
        db_table = 'plansemanals'
    def __str__(self):
        return str(self.id)

class Logro(models.Model):
    id = models.AutoField(primary_key=True)
    usuario_id = models.ForeignKey('Usuario', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255)
    fecha_obtenido = models.CharField(max_length=255)
    class Meta:
        db_table = 'logros'
    def __str__(self):
        return str(self.id)
