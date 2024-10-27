<?php
// Ensure database connection is established
require_once 'db_connection.php'; // Example file to include the $conn connection

// Retrieve token from the request
$json = file_get_contents('php://input');
$data = json_decode($json, true);
$token = isset($data['token']) ? trim($data['token']) : null;

if (!$token) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing token']);
    exit;
}

// Verify if the token has already been accessed
try {
    $stmt = $conn->prepare("SELECT is_accessed FROM queue WHERE token = ?");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $queue = $result->fetch_assoc();

    if ($queue) {
        if ($queue['is_accessed']) {
            echo json_encode(['status' => 'already_accessed']);
        } else {
            $stmt = $conn->prepare("UPDATE queue SET is_accessed = TRUE WHERE token = ?");
            $stmt->bind_param('s', $token);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode(['status' => 'access_granted']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update access status']);
            }
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server error']);
    error_log('Error verifying token: ' . $e->getMessage());
}

$conn->close();
?>
