-- create user
CREATE USER 'cosc203' IDENTIFIED BY 'password';
GRANT ALL ON *.* TO 'cosc203' WITH GRANT OPTION;

-- create database
DROP TABLE IF EXISTS ConservationStatus;
DROP TABLE IF EXISTS Bird;
DROP TABLE IF EXISTS Photos;


DROP DATABASE ASGN2;

CREATE DATABASE ASGN2;
USE ASGN2;

-- create tables
CREATE TABLE ConservationStatus (
    status_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(255) NOT NULL,
    status_colour CHAR(7) NOT NULL
);


-- create Bird table
CREATE TABLE Bird (
    bird_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    primary_name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255) NOT NULL,
    order_name VARCHAR(255) NOT NULL,
    family VARCHAR(255) NOT NULL,
    weight INT,
    length INT,
    status_id INT NOT NULL,
    FOREIGN KEY (status_id) REFERENCES ConservationStatus (status_id)
);

-- create Photos table
CREATE TABLE Photos (
    -- photo_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    bird_id INT NOT NULL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    photographer VARCHAR(255) NOT NULL,
    FOREIGN KEY (bird_id) REFERENCES Bird (bird_id)
);

