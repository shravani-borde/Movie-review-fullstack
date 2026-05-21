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
        return movieRepository.save(movie);
    }

    public void deleteMovie(Long id) {
        movieRepository.deleteById(id);
    }
    
    public Movie updateMovie(Long id, Movie updatedMovie) {
        Movie existing = movieRepository.findById(id).orElseThrow();
        existing.setName(updatedMovie.getName());
        existing.setDirector(updatedMovie.getDirector());
        existing.setRating(updatedMovie.getRating());
        return movieRepository.save(existing);
    }
}