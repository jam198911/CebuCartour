-- CebuCarTour — Railway-compatible schema
-- Run against Railway's MySQL (no CREATE DATABASE / USE needed)

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id                    INT             NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(255)    NOT NULL DEFAULT '',
  email                 VARCHAR(255)    NOT NULL,
  password              VARCHAR(255)    NOT NULL,
  role                  ENUM('admin','vendor','customer') NOT NULL DEFAULT 'customer',
  status                VARCHAR(50)     NOT NULL DEFAULT 'active',
  approvalStatus        VARCHAR(50)     NOT NULL DEFAULT 'approved',
  approved              BOOLEAN         NOT NULL DEFAULT TRUE,
  company               VARCHAR(255)    NOT NULL DEFAULT '',
  phone                 VARCHAR(50)     NOT NULL DEFAULT '',
  address               TEXT            NOT NULL DEFAULT '',
  idType                VARCHAR(100)    NOT NULL DEFAULT '',
  idNumber              VARCHAR(100)    NOT NULL DEFAULT '',
  services              JSON,
  bio                   TEXT            NOT NULL DEFAULT '',
  rejectionReason       TEXT            NOT NULL DEFAULT '',
  dob                   VARCHAR(50)     NOT NULL DEFAULT '',
  country               VARCHAR(100)    NOT NULL DEFAULT '',
  city                  VARCHAR(100)    NOT NULL DEFAULT '',
  postalCode            VARCHAR(20)     NOT NULL DEFAULT '',
  deletionRequested     BOOLEAN         NOT NULL DEFAULT FALSE,
  deletionReason        TEXT            NOT NULL DEFAULT '',
  deletionRequestedAt   VARCHAR(50)     NOT NULL DEFAULT '',
  joined                VARCHAR(20)     NOT NULL DEFAULT '',
  createdAt             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cars (
  id              INT             NOT NULL AUTO_INCREMENT,
  vendorId        INT             NOT NULL DEFAULT 0,
  name            VARCHAR(255)    NOT NULL DEFAULT '',
  type            VARCHAR(100)    NOT NULL DEFAULT '',
  location        VARCHAR(255)    NOT NULL DEFAULT '',
  fuel            VARCHAR(50)     NOT NULL DEFAULT '',
  transmission    VARCHAR(50)     NOT NULL DEFAULT '',
  image           LONGTEXT        NOT NULL,
  price           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  seats           INT             NOT NULL DEFAULT 4,
  available       BOOLEAN         NOT NULL DEFAULT TRUE,
  mileage         INT             NOT NULL DEFAULT 0,
  rating          DECIMAL(3,1)    NOT NULL DEFAULT 0.0,
  reviews         INT             NOT NULL DEFAULT 0,
  description     TEXT,
  createdAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tours (
  id              INT             NOT NULL AUTO_INCREMENT,
  vendorId        INT             NOT NULL DEFAULT 0,
  name            VARCHAR(255)    NOT NULL DEFAULT '',
  location        VARCHAR(255)    NOT NULL DEFAULT '',
  image           LONGTEXT        NOT NULL,
  category        VARCHAR(100)    NOT NULL DEFAULT '',
  duration        VARCHAR(100)    NOT NULL DEFAULT '',
  groupSize       INT             NOT NULL DEFAULT 0,
  price           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  available       BOOLEAN         NOT NULL DEFAULT TRUE,
  rating          DECIMAL(3,1)    NOT NULL DEFAULT 0.0,
  reviews         INT             NOT NULL DEFAULT 0,
  includes        JSON,
  description     TEXT,
  createdAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id              VARCHAR(20)     NOT NULL,
  userId          INT             NOT NULL DEFAULT 0,
  vendorId        INT             NOT NULL DEFAULT 0,
  itemId          INT             NOT NULL DEFAULT 0,
  type            VARCHAR(20)     NOT NULL DEFAULT '',
  status          VARCHAR(50)     NOT NULL DEFAULT 'pending',
  vendorStatus    VARCHAR(50)     NOT NULL DEFAULT 'pending',
  date            VARCHAR(30)     NOT NULL DEFAULT '',
  returnDate      VARCHAR(30)     NOT NULL DEFAULT '',
  pickTime        VARCHAR(30)     NOT NULL DEFAULT '',
  dropTime        VARCHAR(30)     NOT NULL DEFAULT '',
  pickup          VARCHAR(255)    NOT NULL DEFAULT '',
  dropoff         VARCHAR(255)    NOT NULL DEFAULT '',
  name            VARCHAR(255)    NOT NULL DEFAULT '',
  email           VARCHAR(255)    NOT NULL DEFAULT '',
  phone           VARCHAR(50)     NOT NULL DEFAULT '',
  guests          INT             NOT NULL DEFAULT 1,
  total           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  notes           TEXT,
  paymentMethod   VARCHAR(100)    NOT NULL DEFAULT '',
  paid            BOOLEAN         NOT NULL DEFAULT FALSE,
  rating          TINYINT         NULL DEFAULT NULL,
  ratingNote      TEXT            NULL DEFAULT NULL,
  createdAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS destinations (
  id              INT             NOT NULL AUTO_INCREMENT,
  name            VARCHAR(255)    NOT NULL DEFAULT '',
  tag             VARCHAR(100)    NOT NULL DEFAULT '',
  tagColor        VARCHAR(50)     NOT NULL DEFAULT '',
  img             VARCHAR(500)    NOT NULL DEFAULT '',
  location        VARCHAR(255)    NOT NULL DEFAULT '',
  bestTime        VARCHAR(100)    NOT NULL DEFAULT '',
  duration        VARCHAR(100)    NOT NULL DEFAULT '',
  difficulty      VARCHAR(50)     NOT NULL DEFAULT '',
  distance        VARCHAR(100)    NOT NULL DEFAULT '',
  description     TEXT,
  highlights      JSON,
  createdAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  name        VARCHAR(100)    NOT NULL,
  value       TEXT,
  updatedAt   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  token      VARCHAR(64)  NOT NULL UNIQUE,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
