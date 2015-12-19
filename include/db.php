<?php
declare(strict_types=1);

function connectDB(): PDO {
    static $PDO = null;
    if ($PDO === null) {
        $PDO = new PDO('sqlite:../pictoswap.sqlite');
        $PDO->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    return $PDO;
}
