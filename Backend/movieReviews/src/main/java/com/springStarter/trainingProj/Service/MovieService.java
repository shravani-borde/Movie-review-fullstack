package com.springStarter.trainingProj.Service;

import com.springStarter.trainingProj.model.Movie;
import com.springStarter.trainingProj.Repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Movie addMovie(Movie movie) {
        if (movie.getWatched() == null) movie.setWatched(false);
        return movieRepository.save(movie);
    }

    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new RuntimeException("Movie with id " + id + " not found");
        }
        movieRepository.deleteById(id);
    }

    public Movie updateMovie(Long id, Movie updatedMovie) {
        Movie existing = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie with id " + id + " not found"));
        existing.setName(updatedMovie.getName());
        existing.setDirector(updatedMovie.getDirector());
        existing.setRating(updatedMovie.getRating());
        existing.setImageUrl(updatedMovie.getImageUrl());
        existing.setGenre(updatedMovie.getGenre());
        existing.setWatched(updatedMovie.getWatched());
        return movieRepository.save(existing);
    }

    // NEW — just flips watched true/false
    public Movie toggleWatched(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie with id " + id + " not found"));
        movie.setWatched(!movie.getWatched());
        return movieRepository.save(movie);
    }
}