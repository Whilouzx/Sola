<?php
// Permitir CORS desde cualquier origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validación de archivo recibido
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No se recibió ningún archivo"]);
    exit;
}

$file = $_FILES['file'];

// Verificar errores
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Error al subir el archivo"]);
    exit;
}

// Validar formato de imagen
$allowed = ["jpg", "jpeg", "png", "gif", "webp"];
$ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));

if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Formato no permitido"]);
    exit;
}

// Validar tamaño (máx 5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Archivo demasiado grande"]);
    exit;
}

// Obtener nombre del producto y crear carpeta
$productName = isset($_POST['productName']) ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $_POST['productName']) : 'productos';
$uploadDir = $productName . "/";

// Crear la carpeta si no existe
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "No se pudo crear carpeta"]);
        exit;
    }
}

// Crear nombre único para la imagen
$newName = "img_" . time() . "_" . rand(1000, 9999) . "." . $ext;
$target = $uploadDir . $newName;

// Mover archivo a la carpeta del producto
if (move_uploaded_file($file["tmp_name"], $target)) {
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Imagen subida correctamente",
        "url" => $uploadDir . $newName,
        "fullUrl" => "https://springgreen-eel-515369.hostingersite.com/Inventario/" . $uploadDir . $newName
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "No se pudo guardar la imagen"]);
}
?>
