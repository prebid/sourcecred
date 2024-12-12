#!/usr/bin/env bash

# Path to the codepath-notification file
NOTIFICATION_FILE="codepath-notification"

# SMTP Configuration
SMTP_SERVER="smtp.google.com"
SMTP_PORT="587"
USERNAME="$EMAIL_USERNAME"
PASSWORD="$EMAIL_PASSWORD"
FROM_EMAIL="info@prebid.org"

# Git command to get the list of changed files in the merge request
CHANGED_FILES=$(git diff --name-only origin/main...HEAD)
# Associative array to store file changes by email
declare -A EMAIL_BUCKETS

# Email sending function using sendemail
send_email() {
  local recipient=$1
  local file=$2
  echo "Sending notification to $recipient for changes in $file"

  SUBJECT="Code Path Change Notification"
  BODY="The following file was modified: $file"

  # Send email using sendemail
  echo "Sending email to $recipient with body=$BODY"
  # sendemail -f "$FROM_EMAIL" \
  #           -t "$recipient" \
  #           -u "$SUBJECT" \
  #           -m "$BODY" \
  #           -s "$SMTP_SERVER:$SMTP_PORT" \
  #           -xu "$USERNAME" \
  #           -xp "$PASSWORD" \
  #           -o tls=yes
}

# Process the codepath-notification file
while IFS= read -r line; do
  path_pattern=$(echo "$line" | awk '{print $1}')
  email=$(echo "$line" | awk '{print $2}')

  for file in $CHANGED_FILES; do
    if [[ $file == $path_pattern ]]; then
      # Append the file to the email bucket
      EMAIL_BUCKETS["$email"]+="$file\n"
    fi
  done
done < "$NOTIFICATION_FILE"

# Send emails for each recipient
for email in "${!EMAIL_BUCKETS[@]}"; do
  send_email "$email" "${EMAIL_BUCKETS[$email]}"
done
