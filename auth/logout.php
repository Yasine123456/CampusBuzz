<?php
session_start();
session_destroy();
header('Location: /nu/index.html');
exit;