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
  `org_name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,  -- 기관명
  `title` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 제목
  `detail_url` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 상세페이지주소
  `posted_at` date DEFAULT NULL,  -- 작성일
  `writer` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 작성자
  `excluded` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 제외항목
  `category` varchar(40) COLLATE utf8_unicode_ci NOT NULL,  -- 분류
  `registered` tinyint(4) DEFAULT NULL,  -- 등록
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `use` tinyint(1) DEFAULT NULL,  -- 사용여부
  PRIMARY KEY (`nid`),
  UNIQUE KEY `unique_url` (`detail_url`)
) ENGINE=InnoDB AUTO_INCREMENT=405661 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

CREATE TABLE `settings_list` (
  `org_name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `url` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,
  `iframe` varchar(60) COLLATE utf8_unicode_ci DEFAULT NULL,
  `rowXpath` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `paging` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `startPage` tinyint(4) DEFAULT NULL,
  `endPage` tinyint(4) DEFAULT NULL,
  `login` varchar(300) COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `detail_url` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL,
  `posted_at` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `writer` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `excluded` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,
  `use` tinyint(1) DEFAULT NULL,
  `region` varchar(10) COLLATE utf8_unicode_ci DEFAULT 'NULL',
  `registered` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`org_name`),
  UNIQUE KEY `idx_org_name` (`org_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

CREATE TABLE `settings_keyword` (
  `use` tinyint(1) DEFAULT NULL,  -- 사용여부
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,  -- 검색명
  `keywords` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 검색어
  `exclusions` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 배제어
  `min_point` smallint(6) DEFAULT NULL,  -- 최소점수
  `division` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 적용분야
  `creator` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,  -- 작성자
  `remark` json DEFAULT NULL,  -- 비고
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

CREATE TABLE `logs_scraping` (
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

CREATE TABLE `errors_scraping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orgs` text NOT NULL,
  `time` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4

CREATE TABLE `settings_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `keywords` text COLLATE utf8_unicode_ci,
  `exclusions` text COLLATE utf8_unicode_ci,
  `min_point` int(11) DEFAULT '0',
  `division` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remark` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

```