import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.4.4"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.spring") version "1.9.22"
    kotlin("kapt") version "1.9.22"
}

group = "net.kalars"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17
java.targetCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    runtimeOnly("com.h2database:h2") // org.postgresql:postgresql
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    testImplementation("io.rest-assured:rest-assured")
    testImplementation("org.hamcrest:hamcrest")
    testImplementation("com.h2database:h2")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
}

tasks.withType<KotlinCompile>().all {
    kotlinOptions {
        jvmTarget = "17"
    }
}
tasks.withType<Test> {
    useJUnitPlatform()
}

kapt {
    correctErrorTypes = true
}
