package com.springStarter.trainingProj;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.springStarter.trainingProj")
@EnableJpaRepositories(basePackages = "com.springStarter.trainingProj.Repository")
public class MovieReviewsApplication {
    public static void main(String[] args) {
        SpringApplication.run(MovieReviewsApplication.class, args);
    }
}