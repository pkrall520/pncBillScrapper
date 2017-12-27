drop DATABASE pncscrapper;
CREATE DATABASE pncscrapper;
use pncscrapper;

CREATE TABLE `category` (
 `name` varchar(120) NOT NULL,
 `id` int(11) NOT NULL AUTO_INCREMENT,
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`)
);

CREATE TABLE `biller` (
 `name` varchar(120) NOT NULL,
 `freq` date NOT NULL,
 `category_id` int(11) NOT NULL,
 `id` int(11) NOT NULL AUTO_INCREMENT,
 PRIMARY KEY (`id`),
 FOREIGN KEY (category_id) REFERENCES category(category_id)
);

CREATE TABLE `transaction` (
 `amount` double NOT NULL,
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `biller_id` int(11) NOT NULL,
 `date` date NOT NULL,
 `is_income` tinyint(1) NOT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `id` (`id`),
 FOREIGN KEY (biller_id) REFERENCES biller(biller_id),
 KEY `date` (`date`)
);
