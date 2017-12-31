drop DATABASE IF EXISTS pncscrapper;
CREATE DATABASE pncscrapper;
use pncscrapper;

CREATE TABLE `category` (
  `name` varchar(120) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

-- Remove Freq and make a link table so you can get a calc date
CREATE TABLE `freq` (
  `name` varchar(120) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

CREATE TABLE `biller` (
  `name` varchar(120) NOT NULL,
  `search_code` varchar(120) NOT NULL,
  `freq_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (category_id) REFERENCES category(id),
  FOREIGN KEY (freq_id) REFERENCES freq(id)
);

CREATE TABLE `transaction` (
  `amount` double NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `biller_id` int(11) NOT NULL,
  `pay_date` date NOT NULL,
  `created_date` date NOT NULL,
  `is_income` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  FOREIGN KEY (biller_id) REFERENCES biller(id),
  KEY `pay_date` (`pay_date`)
);

insert into  category(name) values ('Carly'), ('Phillip'), ('Auto'), ('House');
insert into freq(name) values ('daily'), ('weekly'), ('biweekly'), ('monthly'), ('on this day');

insert into biller(name, search_code, freq_id, category_id)
  SELECT
    'Capital One Crediit Card',
    'CAPITAL ONE',
    f.id as freq,
    cate.id cat_id
  FROM freq f, category cate
  WHERE f.name = 'monthly' and cate.name = 'Carly';

  select * from (select b.name, b.freq_id, b.category_id, b.id as biller_id, t.amount, max(t.pay_date) as pay_date from biller b
  right join transaction t
  on t.biller_id = b.id
  where b.freq_id = 4
  group by b.name) as innerSelect
  where innerSelect.pay_date < DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH )

insert into transaction(amount, biller_id, pay_date, created_date, is_income)
  select 150.25, b.id,CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP, false from biller b where b.name = 'Capital One Crediit Card';
