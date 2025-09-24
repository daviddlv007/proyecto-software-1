// board-generator.service.ts
import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BoardDiagram, ClassNode, Attribute, RelationEdge } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardGeneratorService {

  constructor() {}

  generateSpringBootProject(diagram: BoardDiagram) {
    const zip = new JSZip();

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
    diagram.classes.forEach(cls => {
      entitiesFolder?.file(`${cls.name}.java`, this.generateEntity(cls, diagram));
      repositoriesFolder?.file(`${cls.name}Repository.java`, this.generateRepository(cls));
      servicesFolder?.file(`${cls.name}Service.java`, this.generateService(cls));
      controllersFolder?.file(`${cls.name}Controller.java`, this.generateController(cls));
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
    zip.file('spring-crud/pom.xml', this.generatePomXmlWithSwagger());

    // Descargar proyecto completo
    zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, 'spring-crud.zip'));
  }

  private mapType(type: Attribute['type']): string {
    switch(type) {
      case 'String': return 'String';
      case 'Integer': return 'Integer';
      case 'Real': return 'Double';
      case 'Boolean': return 'Boolean';
      case 'Date': return 'LocalDate';
      default: return 'String';
    }
  }

  private generateEntity(cls: ClassNode, diagram: BoardDiagram): string {
    const fields = cls.attributes
      .filter(a => a.name !== 'id')
      .map(a => `    private ${this.mapType(a.type)} ${a.name};`)
      .join('\n');

    const relationFields = this.generateForeignKeys(cls, diagram);

    return `
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "${cls.name.toLowerCase()}")
public class ${cls.name} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

${fields}
${relationFields}
}
`.trim();
  }

  /**
   * Genera un atributo foráneo básico para cada relación donde esta clase es destino.
   * Solo asociaciones de 1 a muchos.
   */
  private generateForeignKeys(cls: ClassNode, diagram: BoardDiagram): string {
    let result = '';

    const incomingRelations = diagram.relations.filter(r => r.targetId === cls.id && r.type === 'association');

    incomingRelations.forEach(rel => {
      const originClass = diagram.classes.find(c => c.id === rel.originId);
      if (originClass) {
        const fieldName = originClass.name.charAt(0).toLowerCase() + originClass.name.slice(1);
        result += `
    @ManyToOne
    @JoinColumn(name = "${fieldName}_id")
    private ${originClass.name} ${fieldName};
`;
      }
    });

    return result;
  }

  private generateRepository(cls: ClassNode): string {
    return `
package com.example.demo.repository;

import com.example.demo.entity.${cls.name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${cls.name}Repository extends JpaRepository<${cls.name}, Long> {}
`.trim();
  }

  private generateService(cls: ClassNode): string {
    return `
package com.example.demo.service;

import com.example.demo.entity.${cls.name};
import com.example.demo.repository.${cls.name}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ${cls.name}Service {

    private final ${cls.name}Repository repo;

    @Autowired
    public ${cls.name}Service(${cls.name}Repository repo) {
        this.repo = repo;
    }

    public List<${cls.name}> findAll() { return repo.findAll(); }
    public ${cls.name} findById(Long id) { return repo.findById(id).orElse(null); }
    public ${cls.name} save(${cls.name} entity) { return repo.save(entity); }
    public void delete(Long id) { repo.deleteById(id); }
}
`.trim();
  }

  private generateController(cls: ClassNode): string {
    const baseUrl = cls.name.toLowerCase() + 's';
    return `
package com.example.demo.controller;

import com.example.demo.entity.${cls.name};
import com.example.demo.service.${cls.name}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/${baseUrl}")
public class ${cls.name}Controller {

    private final ${cls.name}Service service;

    @Autowired
    public ${cls.name}Controller(${cls.name}Service service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<${cls.name}>> getAll() { return new ResponseEntity<>(service.findAll(), HttpStatus.OK); }

    @GetMapping("/{id}")
    public ResponseEntity<${cls.name}> getById(@PathVariable Long id) {
        ${cls.name} obj = service.findById(id);
        if(obj != null) return new ResponseEntity<>(obj, HttpStatus.OK);
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<${cls.name}> create(@RequestBody ${cls.name} obj) { return new ResponseEntity<>(service.save(obj), HttpStatus.CREATED); }

    @PutMapping("/{id}")
    public ResponseEntity<${cls.name}> update(@PathVariable Long id, @RequestBody ${cls.name} obj) {
        ${cls.name} updated = service.findById(id);
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

  private generatePomXmlWithSwagger(): string {
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

        <!-- Swagger/OpenAPI MVP -->
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
}
