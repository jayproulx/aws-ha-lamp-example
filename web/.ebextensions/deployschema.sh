#!/bin/sh
set -x
mysql --user=$RDS_USERNAME \
 	  --password=$RDS_PASSWORD \
 	  --host=$RDS_HOSTNAME \
 	  -e 'CREATE TABLE IF NOT EXISTS urler(id INT UNSIGNED NOT NULL AUTO_INCREMENT, author VARCHAR(63) NOT NULL, message TEXT, PRIMARY KEY (id))' \
 	  $RDS_DB_NAME
