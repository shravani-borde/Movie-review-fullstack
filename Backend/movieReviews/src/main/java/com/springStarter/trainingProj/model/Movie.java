package com.springStarter.trainingProj.model;

import jakarta.persistence.*;

@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String director;
    private Double rating;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
}