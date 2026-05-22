package com.springStarter.trainingProj.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Movie name cannot be empty")
    @Size(min = 1, max = 100, message = "Movie name must be between 1 and 100 characters")
    private String name;

    @NotBlank(message = "Director name cannot be empty")
    @Size(min = 1, max = 100, message = "Director name must be between 1 and 100 characters")
    private String director;

    @NotNull(message = "Rating cannot be empty")
    @Min(value = 0, message = "Rating must be at least 0")
    @Max(value = 10, message = "Rating must be at most 10")
    private Double rating;

    private String imageUrl;

    private String genre;           // NEW

    private Boolean watched = false; // NEW — defaults to false

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public Boolean getWatched() { return watched; }
    public void setWatched(Boolean watched) { this.watched = watched; }
}