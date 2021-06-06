-- ------------------------------------------------------
-- Server version	5.7.29

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `community_dev`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `community_dev` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `community_dev`;

--
-- Table structure for table `contributor_info`
--

DROP TABLE IF EXISTS `contributor_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contributor_info` (
                                    `id` int(11) NOT NULL AUTO_INCREMENT,
                                    `github` varchar(255) DEFAULT NULL,
                                    `name` varchar(255) DEFAULT NULL,
                                    `email` varchar(255) DEFAULT NULL,
                                    `location` varchar(255) DEFAULT NULL,
                                    `tel` varchar(25) DEFAULT NULL,
                                    `other` varchar(255) DEFAULT NULL,
                                    `company` varchar(255) DEFAULT NULL,
                                    `tp` varchar(100) DEFAULT NULL,
                                    `wechat` varchar(256) DEFAULT NULL,
                                    `address` varchar(255) DEFAULT NULL,
                                    `overseas` int(4) DEFAULT NULL,
                                    PRIMARY KEY (`id`),
                                    UNIQUE KEY `github` (`github`)
) ENGINE=InnoDB AUTO_INCREMENT=4212 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pulls`
--

DROP TABLE IF EXISTS `pulls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pulls` (
                         `id` int(11) NOT NULL AUTO_INCREMENT,
                         `owner` varchar(255) DEFAULT NULL,
                         `repo` varchar(255) DEFAULT NULL,
                         `pull_number` int(11) DEFAULT NULL,
                         `title` text,
                         `body` text,
                         `user` varchar(255) DEFAULT NULL,
                         `association` varchar(255) DEFAULT NULL,
                         `relation` varchar(255) DEFAULT NULL,
                         `label` text,
                         `status` varchar(128) DEFAULT NULL,
                         `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         `updated_at` timestamp NULL DEFAULT NULL,
                         `closed_at` timestamp NULL DEFAULT NULL,
                         `merged_at` timestamp NULL DEFAULT NULL,
                         `merge_commit_sha` varchar(256) DEFAULT NULL,
                         PRIMARY KEY (`id`),
                         UNIQUE KEY `pr_key` (`owner`,`repo`,`pull_number`),
                         KEY `index_pull_number` (`pull_number`)
) ENGINE=InnoDB AUTO_INCREMENT=78369 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sig`
--

DROP TABLE IF EXISTS `sig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sig` (
                       `id` int(11) NOT NULL AUTO_INCREMENT,
                       `name` varchar(255) DEFAULT NULL,
                       `info` varchar(255) DEFAULT NULL,
                       `sig_url` varchar(255) DEFAULT NULL,
                       `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       `channel` varchar(255) DEFAULT NULL,
                       `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       `status` int(11) NOT NULL DEFAULT '0',
                       `lgtm` int(11) DEFAULT '2',
                       PRIMARY KEY (`id`),
                       UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1007 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sig_member`
--

DROP TABLE IF EXISTS `sig_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sig_member` (
                              `id` int(11) NOT NULL AUTO_INCREMENT,
                              `sig_id` int(11) DEFAULT NULL,
                              `contributor_id` int(11) DEFAULT NULL,
                              `level` varchar(255) DEFAULT NULL,
                              `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                              `status` int(11) NOT NULL DEFAULT '0',
                              PRIMARY KEY (`id`),
                              UNIQUE KEY `sig_id` (`sig_id`,`contributor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1077 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

