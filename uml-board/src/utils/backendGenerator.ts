import { generatePostmanCollection } from './postmanGenerator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { NodeType, EdgeType } from './umlConstants';

type ClassNode = NodeType;
type RelationEdge = EdgeType;

function mapType(type: string): string {
    switch (type) {
        case 'Integer': return 'Integer';
        case 'Float': return 'Double';
        case 'Boolean': return 'Boolean';
        case 'Date': return 'LocalDate';
        case 'String': return 'String';
        default: return 'String';
    }
}

// Devuelve true si la clase ya tiene un atributo llamado 'id'
function hasIdField(cls: ClassNode): boolean {
    return (cls.attributes ?? []).some(a => a.name === 'id');
}

// Genera los campos de atributos simples (sin relaciones)
function generateSimpleFields(cls: ClassNode): string {
    const attrs = cls.attributes ?? [];
    return attrs
        .filter(a => a.name !== 'id')
        .map(a => `    private ${mapType(a.datatype)} ${a.name};`)
        .join('\n');
}

// Genera los campos foráneos con anotaciones JPA para CASCADE DELETE
function generateForeignKeyFields(cls: ClassNode, nodes: NodeType[], edges: EdgeType[]): string {
    let result = '';
    // Para clases asociativas, agregar foráneas a las dos clases relacionadas con CASCADE
    if (cls.asociativa && cls.relaciona) {
        console.log(`🔧 Procesando entidad asociativa: ${cls.label}`);
        console.log(`   Relaciona: [${cls.relaciona.join(', ')}]`);
        
        cls.relaciona.forEach(relId => {
            // Buscar primero por ID, luego por nombre si no se encuentra
            let relClass = nodes.find(n => n.id === relId);
            
            // Si no se encuentra por ID, buscar por nombre (para entidades importadas)
            if (!relClass) {
                relClass = nodes.find(n => n.label === relId);
            }
            
            if (relClass) {
                const fieldName = relClass.label.charAt(0).toLowerCase() + relClass.label.slice(1) + "Id";
                const constraintName = `FK_${cls.label.toUpperCase()}_${relClass.label.toUpperCase()}`;
                console.log(`   ✅ Agregando FK: ${fieldName} → ${relClass.label}`);
                result += `    @Column(name = "${fieldName}")\n`;
                result += `    @JoinColumn(name = "${fieldName}", referencedColumnName = "id",\n`;
                result += `               foreignKey = @ForeignKey(name = "${constraintName}",\n`;
                result += `                           foreignKeyDefinition = "FOREIGN KEY (${fieldName}) REFERENCES ${relClass.label.toLowerCase()}(id) ON DELETE CASCADE"))\n`;
                result += `    private Long ${fieldName};\n`;
            } else {
                console.warn(`❌ No se encontró clase relacionada para ID/nombre: ${relId}`);
            }
        });
        return result;
    }
    // Herencia: el campo foráneo va en la clase hija (origen), apuntando al padre (destino)
    edges.filter(r => r.tipo === 'herencia' && r.source === cls.id).forEach(rel => {
        const parentClass = nodes.find(c => c.id === rel.target && !c.asociativa);
        if (parentClass) {
            const fieldName = parentClass.label.charAt(0).toLowerCase() + parentClass.label.slice(1) + "Id";
            const constraintName = `FK_${cls.label.toUpperCase()}_${parentClass.label.toUpperCase()}`;
            result += `    @Column(name = "${fieldName}")\n`;
            result += `    @JoinColumn(name = "${fieldName}", referencedColumnName = "id",\n`;
            result += `               foreignKey = @ForeignKey(name = "${constraintName}",\n`;
            result += `                           foreignKeyDefinition = "FOREIGN KEY (${fieldName}) REFERENCES ${parentClass.label.toLowerCase()}(id) ON DELETE CASCADE"))\n`;
            result += `    private Long ${fieldName};\n`;
        }
    });
    // Para otras relaciones, agregar foráneas por cada relación donde esta clase es destino
    const incomingRelations = edges.filter(
        r =>
            r.target === cls.id &&
            ['asociacion', 'agregacion', 'composicion'].includes(r.tipo)
    );
    // Evitar duplicados
    const added = new Set<string>();
    incomingRelations.forEach(rel => {
        const originClass = nodes.find(c => c.id === rel.source && !c.asociativa);
        if (originClass) {
            const fieldName = originClass.label.charAt(0).toLowerCase() + originClass.label.slice(1) + "Id";
            if (!added.has(fieldName)) {
                const constraintName = `FK_${cls.label.toUpperCase()}_${originClass.label.toUpperCase()}`;
                result += `    @Column(name = "${fieldName}")\n`;
                result += `    @JoinColumn(name = "${fieldName}", referencedColumnName = "id",\n`;
                result += `               foreignKey = @ForeignKey(name = "${constraintName}",\n`;
                result += `                           foreignKeyDefinition = "FOREIGN KEY (${fieldName}) REFERENCES ${originClass.label.toLowerCase()}(id) ON DELETE CASCADE"))\n`;
                result += `    private Long ${fieldName};\n`;
                added.add(fieldName);
            }
        }
    });
    return result;
}

function generateEntity(cls: ClassNode, nodes: NodeType[], edges: EdgeType[]): string {
    const hasId = hasIdField(cls);
    const idField = !hasId
        ? `    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n`
        : '';
    const fields = generateSimpleFields(cls);
    const relationFields = generateForeignKeyFields(cls, nodes, edges);

    return `
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "${cls.label.toLowerCase()}")
public class ${cls.label} {

${idField}${fields ? fields + '\n' : ''}${relationFields}
}
`.trim();
}

function generateRepository(cls: ClassNode): string {
    return `
package com.example.demo.repository;

import com.example.demo.entity.${cls.label};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${cls.label}Repository extends JpaRepository<${cls.label}, Long> {}
`.trim();
}

function generateService(cls: ClassNode): string {
    return `
package com.example.demo.service;

import com.example.demo.entity.${cls.label};
import com.example.demo.repository.${cls.label}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ${cls.label}Service {

    private final ${cls.label}Repository repo;

    @Autowired
    public ${cls.label}Service(${cls.label}Repository repo) {
        this.repo = repo;
    }

    public List<${cls.label}> findAll() { return repo.findAll(); }
    public ${cls.label} findById(Long id) { return repo.findById(id).orElse(null); }
    public ${cls.label} save(${cls.label} entity) { return repo.save(entity); }
    public void delete(Long id) { repo.deleteById(id); }
}
`.trim();
}

function generateController(cls: ClassNode): string {
    const baseUrl = cls.label.toLowerCase() + 's';
    return `
package com.example.demo.controller;

import com.example.demo.entity.${cls.label};
import com.example.demo.service.${cls.label}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/${baseUrl}")
public class ${cls.label}Controller {

    private final ${cls.label}Service service;

    @Autowired
    public ${cls.label}Controller(${cls.label}Service service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<${cls.label}>> getAll() { return new ResponseEntity<>(service.findAll(), HttpStatus.OK); }

    @GetMapping("/{id}")
    public ResponseEntity<${cls.label}> getById(@PathVariable Long id) {
        ${cls.label} obj = service.findById(id);
        if(obj != null) return new ResponseEntity<>(obj, HttpStatus.OK);
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<${cls.label}> create(@RequestBody ${cls.label} obj) { return new ResponseEntity<>(service.save(obj), HttpStatus.CREATED); }

    @PutMapping("/{id}")
    public ResponseEntity<${cls.label}> update(@PathVariable Long id, @RequestBody ${cls.label} obj) {
        ${cls.label} updated = service.findById(id);
        if(updated != null) {
            obj.setId(updated.getId());
            return new ResponseEntity<>(service.save(obj), HttpStatus.OK);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
`.trim();
}

function generatePomXmlWithSwagger(): string {
    return `
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.3</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <!-- Bases de Datos Soportadas -->
        <!-- H2: Base de datos en memoria para desarrollo -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- PostgreSQL: Base de datos para producción -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Herramientas -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- API Documentation -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.2.0</version>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`.trim();
}

export async function generarBackend(nodes: NodeType[], edges: EdgeType[], boardName?: string) {
    console.log(`🔧 Generando backend Spring Boot${boardName ? ` para "${boardName}"` : ''}...`);
    console.log(`📊 Clases detectadas: ${nodes.length}`);
    console.log(`🔗 Relaciones detectadas: ${edges.length}`);
    
    const zip = new JSZip();

    // Todas las clases (incluyendo asociativas)
    const classes = nodes;

    // Carpeta base del proyecto Spring Boot
    const basePath = 'spring-crud/src/main/java/com/example/demo';
    const entitiesFolder = zip.folder(`${basePath}/entity`);
    const repositoriesFolder = zip.folder(`${basePath}/repository`);
    const servicesFolder = zip.folder(`${basePath}/service`);
    const controllersFolder = zip.folder(`${basePath}/controller`);

    // Crear carpeta de recursos y configuración mejorada
    const resourcesFolder = zip.folder('spring-crud/src/main/resources');
    resourcesFolder?.file('application.properties', `# Configuración Base de Datos (por defecto H2)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# Configuración JPA/Hibernate - Compatible múltiples BD
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.hbm2ddl.create_namespaces=true

# IMPORTANTE: Habilitar foreign keys para CASCADE DELETE
spring.jpa.properties.hibernate.globally_quoted_identifiers=true
spring.jpa.properties.hibernate.physical_naming_strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl

# Consola H2 (solo para desarrollo)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Para cambiar a PostgreSQL, descomenta estas líneas:
# spring.datasource.url=jdbc:postgresql://localhost:5432/demo
# spring.datasource.driver-class-name=org.postgresql.Driver
# spring.datasource.username=postgres
# spring.datasource.password=password
`);

    // README mejorado con instrucciones
    zip.file('spring-crud/README.md', `# Proyecto Spring Boot con CASCADE DELETE

## ✅ Borrado en Cascada Automático

Este proyecto está configurado para **borrado en cascada automático** en cualquier base de datos.

### 🎯 Cómo Funciona:

- Al eliminar una entidad padre, **automáticamente se eliminan** todas las entidades hijas
- Configurado con anotaciones JPA estándar (compatible con todas las BD)
- No requiere configuración adicional

### 🗄️ Bases de Datos Soportadas:

- **H2** (por defecto) - Base de datos en memoria para desarrollo y testing
- **PostgreSQL** - Base de datos para producción (descomenta las líneas en \`application.properties\`)

### 🚀 Ejecutar el Proyecto:

1. \`mvn clean install\`
2. \`mvn spring-boot:run\`
3. Accede a: \`http://localhost:8080/h2-console\` (para H2)

### 📝 Ejemplo de Uso:

\`\`\`bash
# Eliminar un curso (automáticamente elimina inscripciones relacionadas)
DELETE /cursos/1

# Eliminar un estudiante (automáticamente elimina inscripciones relacionadas) 
DELETE /estudiantes/1
\`\`\`

### 🔧 Cambiar Base de Datos:

Solo modifica \`application.properties\` y agrega la dependencia correspondiente en \`pom.xml\`
`);

    // Crear archivos Java de entidades, repositorios, servicios y controladores
    classes.forEach(cls => {
        entitiesFolder?.file(`${cls.label}.java`, generateEntity(cls, nodes, edges));
        repositoriesFolder?.file(`${cls.label}Repository.java`, generateRepository(cls));
        servicesFolder?.file(`${cls.label}Service.java`, generateService(cls));
        controllersFolder?.file(`${cls.label}Controller.java`, generateController(cls));
    });

    // Crear clase principal DemoApplication.java
    const mainFolder = zip.folder(basePath);
    mainFolder?.file('DemoApplication.java', `
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
`.trim());

    // Crear pom.xml con dependencia mínima de Swagger/OpenAPI
    zip.file('spring-crud/pom.xml', generatePomXmlWithSwagger());

    // Generar archivo de colección Postman con endpoints CRUD
    zip.file('spring-crud/DemoAPI.postman_collection.json', generatePostmanCollection(classes, nodes, edges));

    console.log(`✅ Backend Spring Boot generado exitosamente${boardName ? ` para "${boardName}"` : ''}`);
    console.log(`📦 Archivo de descarga: spring-crud.zip`);

    // Descargar proyecto completo
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'spring-crud.zip');
}