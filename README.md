# Infraestructura Automatizada con Terraform y GitHub Actions

Esta infraestructura automatizada crea:
- Bucket S3 para almacenar el estado de Terraform
- Instancia EC2 t2.micro con volumen gp3 de 8GB

## Configuración

1. Configurar secrets en GitHub:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. El workflow se ejecuta automáticamente en pushes a main
3. Para destruir la infraestructura:
   - Ir a "Actions" > "Terraform CI/CD" > "Run workflow"
   - Seleccionar "Destroy environment" como true