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
   2) Delete from Bunny Storage
-------------------------------------------------------- */

$objectPath = "user-data/profiles/candidate/{$candidateKey}.jpg";
$deleteUrl  = "https://{$BUNNY_STORAGE_HOST}/{$BUNNY_STORAGE_ZONE}/{$objectPath}";

$ch = curl_init($deleteUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "AccessKey: {$BUNNY_ACCESS_KEY}"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 200 = deleted, 404 = already gone — both are acceptable for removal
if ($httpCode !== 200 && $httpCode !== 404) {
    die(json_encode([
        "status"  => "error",
        "message" => "Storage delete failed",
        "detail"  => $response
    ]));
}

/* --------------------------------------------------------
   3) Clear the CDN URL on the candidate record
-------------------------------------------------------- */

$sql = "UPDATE registered_candidates SET idPhoto = NULL WHERE candidateKey = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $candidateKey);
$success = $stmt->execute();
$stmt->close();

/* --------------------------------------------------------
   4) Response
-------------------------------------------------------- */

if ($success) {
    echo json_encode([
        "status"  => "success",
        "message" => "ID photo removed successfully"
    ]);
} else {
    echo json_encode([
        "status"  => "error",
        "message" => "Removed from storage but failed to update record"
    ]);
}

$conn->close();
?>
