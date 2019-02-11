DELIMITER //
CREATE PROCEDURE `get_acc_info`(
IN date_array VARCHAR(100), 
IN severity_array CHAR(100),
IN bbox TEXT)
BEGIN
SELECT `Accident_Index` AS id,`x_world_mercator`,`y_world_mercator`, CAST(RIGHT(`Date`, 4) AS UNSIGNED) AS year, 
CASE 
WHEN `casualty_severity` = 3 THEN 'Slight'
WHEN `casualty_severity` = 2 THEN 'Serious'
WHEN `casualty_severity` = 1 THEN 'Fatal'
ELSE 'Not recorded'
END AS casualty_severity
FROM cycling_accidents_05_17
WHERE FIND_IN_SET(RIGHT(`Date`, 4), date_array)
AND FIND_IN_SET(CAST(`casualty_severity` as CHAR(50)), severity_array)
AND MBRContains(GeomFromText(bbox), geom);
END//
DELIMITER ;


--CALL get_acc_info('2015','1,3', 'POLYGON((-180 -85.05112877980659,-180 85.05112877980659,180 85.05112877980659,180 -85.05112877980659,-180 -85.05112877980659))')


/* DELIMITER //
CREATE PROCEDURE `get_acc_count`(
IN date_array VARCHAR(100), 
IN severity_array CHAR(100),
IN bbox TEXT)
BEGIN
SELECT RIGHT(`Date`, 4) as `year`, COUNT(`acc_id`) as total 
FROM `cycling_accidents_05_17`
WHERE FIND_IN_SET(RIGHT(`Date`, 4), date_array)
AND FIND_IN_SET(CAST(`casualty_severity` as CHAR(50)), severity_array)
AND MBRContains(GeomFromText(bbox), geom)
GROUP BY RIGHT(`Date`, 4) 
ORDER BY `year` ASC;
END//
DELIMITER ; */

DELIMITER //
CREATE PROCEDURE `get_acc_count`(
IN date_array VARCHAR(100), 
IN severity_array CHAR(100),
IN bbox TEXT)
BEGIN
SELECT RIGHT(t1.`Date`, 4) as `year`,
IFNULL(COUNT(t2.`acc_id`), 0) as total
FROM `cycling_accidents_05_17` t1
LEFT JOIN `cycling_accidents_05_17` AS t2 ON t1.`acc_id` = t2.`acc_id`
AND FIND_IN_SET(RIGHT(t1.`Date`, 4), date_array)
AND FIND_IN_SET(CAST(t1.`casualty_severity` as CHAR(50)), severity_array)
AND MBRContains(GeomFromText(bbox), t1.geom)
GROUP BY RIGHT(t1.`Date`, 4)
ORDER BY `year` ASC;
END//
DELIMITER ;




