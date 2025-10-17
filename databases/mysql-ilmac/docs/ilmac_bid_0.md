## 데이터베이스 생성
```sql
-- 데이터베이스 생성
CREATE DATABASE ilmac_bid;
```

## 사용자 생성/설정

```sql
-- 사용자 생성
CREATE USER 'ilmac_bid'@'%' IDENTIFIED BY 'ilmac_bid';

-- 사용자 권한 부여
GRANT ALL PRIVILEGES ON ilmac_bid.* TO 'ilmac_bid'@'%';
```

## 테이블 생성

```sql
CREATE TABLE `notices` (
  `nid` int(11) NOT NULL AUTO_INCREMENT,
  `sn` int(11) NOT NULL,
  `기관명` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `제목` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `상세페이지주소` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL,
  `작성일` date DEFAULT NULL,
  `작성자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scraped_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `relation` json DEFAULT NULL,
  PRIMARY KEY (`nid`),
  UNIQUE KEY `unique_url` (`상세페이지주소`)
) ENGINE=InnoDB AUTO_INCREMENT=405661 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

CREATE TABLE `settings_list` (
  `기관명` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `url` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,
  `iframe` varchar(60) COLLATE utf8_unicode_ci DEFAULT NULL,
  `rowXpath` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `paging` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `startPage` tinyint(4) DEFAULT NULL,
  `endPage` tinyint(4) DEFAULT NULL,
  `login` varchar(300) COLLATE utf8_unicode_ci DEFAULT NULL,
  `제목` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `상세페이지주소` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL,
  `작성일` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `작성자` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `제외항목` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,
  `use` tinyint(1) DEFAULT NULL,
  `지역` varchar(10) COLLATE utf8_unicode_ci DEFAULT 'NULL',
  `등록` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`기관명`),
  UNIQUE KEY `idx_org_name` (`기관명`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

CREATE TABLE `settings_keyword` (
  `use` tinyint(1) DEFAULT NULL,
  `검색명` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `검색어` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `배제어` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `최소점수` smallint(6) DEFAULT NULL,
  `적용분야` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `적용기관` varchar(40) COLLATE utf8_unicode_ci DEFAULT NULL,
  `적용지역` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `작성자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `메모` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`검색명`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `org_name` varchar(255) NOT NULL,
  `error_code` int(11) DEFAULT NULL,
  `error_message` text,
  `scraped_count` int(11) DEFAULT '0',
  `inserted_count` int(11) DEFAULT '0',
  `time` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4

CREATE TABLE `errors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orgs` text NOT NULL,
  `time` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4

```