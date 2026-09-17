<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Credentials: true');

header('Content-Type: application/json');
date_default_timezone_set('Asia/Kolkata');

// Security and DB connection
define('INCLUDE_CHECK', true);
define('USER_SECURE_CHECK', true);

require '../../secret-credentials/crispr/connect.php';
require '../../secret-credentials/crispr/user-secure.php';
require '../../secret-credentials/crispr/user-secure-token-validations.php';

// Bunny Storage credentials (keep the AccessKey out of the webroot, like the other secrets):
//   $BUNNY_STORAGE_ZONE = 'your-storage-zone';
//   $BUNNY_STORAGE_HOST = 'storage.bunnycdn.com';      // region host, e.g. sg.storage.bunnycdn.com
//   $BUNNY_ACCESS_KEY   = 'your-storage-zone-password';
//   $BUNNY_CDN_BASE     = 'https://crisprlearning.b-cdn.net';
require '../../secret-credentials/crispr/bunny-storage.php';

$_POST = json_decode(file_get_contents('php://input'), true);

/* --------------------------------------------------------
   1) Fetch Candidate Key
-------------------------------------------------------- */

if ($TOKEN_USER_ID && $TOKEN_USER_ID > 0) {
    $sql = "SELECT candidateKey FROM registered_candidates WHERE id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $TOKEN_USER_ID);
} else {
    $sql = "SELECT candidateKey FROM registered_candidates WHERE candidateKey = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $TOKEN_USER_KEY);
}

$stmt->execute();
$result = $stmt->get_result();
$profileData = $result->fetch_assoc();
$stmt->close();

if (!$profileData) {
    die(json_encode(["status" => "error", "message" => "Profile not found"]));
}

$candidateKey = $profileData['candidateKey'];

/* --------------------------------------------------------
   2) Extract & Decode Photo Data
-------------------------------------------------------- */

$photo = $_POST['photo'] ?? null;

if (!$photo || trim($photo) === "") {
    die(json_encode(["status" => "error", "message" => "Invalid photo data"]));
}

// Strip the "data:image/jpeg;base64," prefix if present
if (strpos($photo, 'base64,') !== false) {
    $photo = substr($photo, strpos($photo, 'base64,') + 7);
}
$photo = str_replace(' ', '+', $photo);
$binary = base64_decode($photo, true);

if ($binary === false || strlen($binary) === 0) {
    die(json_encode(["status" => "error", "message" => "Could not decode photo data"]));
}

/* --------------------------------------------------------
   3) Upload to Bunny Storage
-------------------------------------------------------- */

$objectPath = "user-data/profiles/candidate/{$candidateKey}.jpg";
$uploadUrl  = "https://{$BUNNY_STORAGE_HOST}/{$BUNNY_STORAGE_ZONE}/{$objectPath}";
$cdnUrl     = "{$BUNNY_CDN_BASE}/{$objectPath}";

$ch = curl_init($uploadUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch, CURLOPT_POSTFIELDS, $binary);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "AccessKey: {$BUNNY_ACCESS_KEY}",
    "Content-Type: image/jpeg"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($httpCode < 200 || $httpCode >= 300) {
    die(json_encode([
        "status"  => "error",
        "message" => "Storage upload failed",
        "detail"  => $curlErr ?: $response
    ]));
}

/* --------------------------------------------------------
   4) Persist the CDN URL against the candidate
-------------------------------------------------------- */

$sql = "UPDATE registered_candidates SET idPhoto = ? WHERE candidateKey = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $cdnUrl, $candidateKey);
$success = $stmt->execute();
$stmt->close();

/* --------------------------------------------------------
   5) Response
-------------------------------------------------------- */

if ($success) {
    echo json_encode([
        "status"  => "success",
        "data"    => $cdnUrl,
        "message" => "ID photo uploaded successfully"
    ]);
} else {
    echo json_encode([
        "status"  => "error",
        "message" => "Uploaded to storage but failed to update record"
    ]);
}

$conn->close();
?>
