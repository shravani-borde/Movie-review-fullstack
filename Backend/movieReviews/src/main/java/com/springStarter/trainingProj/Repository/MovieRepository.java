package com.springStarter.trainingProj.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springStarter.trainingProj.model.Movie;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
}