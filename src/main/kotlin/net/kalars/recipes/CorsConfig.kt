package net.kalars.recipes

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class CorsConfig {
    private val logger = LoggerFactory.getLogger(CorsConfig::class.java)

    @Value("\${frontend.url}")
    lateinit var frontendUrl: String

    @Bean
    fun corsConfigurer(): WebMvcConfigurer {
        return object : WebMvcConfigurer {
            override fun addCorsMappings(registry: CorsRegistry) {
                logger.info("Configuring CORS")
                registry.addMapping("/api/**")
                    .allowedOrigins(frontendUrl) // Replace with your frontend URL
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
            }
        }
    }
}
