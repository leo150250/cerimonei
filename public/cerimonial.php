<?php
$id = $_GET["id"];
$arquivo = file_get_contents($id.".json");
header('Content-Type: application/json; charset=utf-8');
echo $arquivo;
?>