<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Niedozwolona metoda.']);
    exit;
}

$to      = 'grotstal@grot-stal.pl';
$name    = htmlspecialchars(trim($_POST['name']    ?? ''), ENT_QUOTES, 'UTF-8');
$phone   = htmlspecialchars(trim($_POST['phone']   ?? ''), ENT_QUOTES, 'UTF-8');
$email   = htmlspecialchars(trim($_POST['email']   ?? ''), ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars(trim($_POST['subject'] ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

if (!$name || !$email || !$message) {
    echo json_encode(['success' => false, 'error' => 'Brak wymaganych pól.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Niepoprawny adres e-mail.']);
    exit;
}

$mail_subject = 'Zapytanie z formularza: ' . ($subject ?: 'Brak tematu');

$body  = "Nowe zapytanie ze strony internetowej Grot-Stal\n";
$body .= str_repeat('-', 48) . "\n\n";
$body .= "Imię i nazwisko: $name\n";
$body .= "Telefon:         " . ($phone ?: '—') . "\n";
$body .= "E-mail:          $email\n";
$body .= "Temat:           " . ($subject ?: '—') . "\n\n";
$body .= "Wiadomość:\n$message\n";

$headers  = "From: formularz@grot-stal.pl\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $mail_subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Błąd serwera. Spróbuj ponownie lub zadzwoń.']);
}
