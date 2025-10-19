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

// Genera los campos foráneos como Long (sin objetos anidados)
function generateForeignKeyFields(cls: ClassNode, nodes: NodeType[], edges: EdgeType[]): string {
    let result = '';
    // Para clases asociativas, agregar foráneas a las dos clases relacionadas
    if (cls.asociativa && cls.relaciona) {
        cls.relaciona.forEach(relId => {
            const relClass = nodes.find(n => n.id === relId);
            if (relClass) {
                const fieldName = relClass.label.charAt(0).toLowerCase() + relClass.label.slice(1) + "Id";
                result += `    private Long ${fieldName};\n`;
            }
        });
        return result;
    }
    // Herencia: el campo foráneo va en la clase hija (origen), apuntando al padre (destino)
    edges.filter(r => r.tipo === 'herencia' && r.source === cls.id).forEach(rel => {
        const parentClass = nodes.find(c => c.id === rel.target && !c.asociativa);
        if (parentClass) {
            const fieldName = parentClass.label.charAt(0).toLowerCase() + parentClass.label.slice(1) + "Id";
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

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.2.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`.trim();
}

export async function generarBackend(nodes: NodeType[], edges: EdgeType[]) {
    const zip = new JSZip();

    // Todas las clases (incluyendo asociativas)
    const classes = nodes;

    // Carpeta base del proyecto Spring Boot
    const basePath = 'spring-crud/src/main/java/com/example/demo';
    const entitiesFolder = zip.folder(`${basePath}/entity`);
    const repositoriesFolder = zip.folder(`${basePath}/repository`);
    const servicesFolder = zip.folder(`${basePath}/service`);
    const controllersFolder = zip.folder(`${basePath}/controller`);

    // Crear carpeta de recursos y README
    zip.folder('spring-crud/src/main/resources')?.file('application.properties', '');
    zip.file('spring-crud/README.md', '# Proyecto Spring Boot generado automáticamente');

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

    // Descargar proyecto completo
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'spring-crud.zip');
}