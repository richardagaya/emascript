#!/bin/bash
# Script to properly set the FIREBASE_ADMIN_PRIVATE_KEY secret with correct formatting

PROJECT_ID="fxpro-2dc0c"

echo "Setting FIREBASE_ADMIN_PRIVATE_KEY with proper formatting..."
echo ""
echo "The private key will be formatted correctly with actual newlines."
echo ""

# Create a temporary file with the properly formatted key
cat > /tmp/firebase_key.txt << 'EOF'
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCuX6YGqplkrzbU
MNb7ZmxzH3nfEtPLBTliJw1bzHUnrKPsS58nFogC0Pz9FAG9pDDSKp/KaIcbL4X+
xEQgYbR0+HU01IGVptncoS5DPff1Zm1N7h99rGNHflKPQxUDzUE+aoiaPN1JWChW
BDi2S7N9g4pbkIUkp11cMGNJp9cp/KTYbs2ro8MzYlFHo80ikPRQizMjKiaNlWKI
1aAglTslQLGhFYe8hcDY8W/1BEUqtgD0kgbuHciV/MHiRZDmg7jsGQ8tKb0Eq24M
vhu8Q9++Lr0JddEwCo+7Vqcgz7vCg4CQVpkFLvh1GVPJHsuk9fzIxYgOLRxPjf6G
tqa8klf/AgMBAAECggEAVGoUd0y2VpImAmIkaO8EGFVIC/BS3IlKZtRN+L9Jhevj
LVzMjsEvFeHzX1cEorhuNAgTdArXQRdoEFYWPvDdyfSP1QP9OaPc+xyCR2Yj+EZe
KuhYkV/XbgBe2mDYtw7yA1PSjoxhegS1/jIr/EA4g84euEYF1qE5Jox8PGeG15lb
sbfKZbKigp9J8wgPcD47TsRhxI5pW1hYhKLhUfCfA8F+K+1Mzf44MnBeGy/U3h7L
vBZS9hwpj/l1MCrF91dBucgTZ8yQbGBDltfM2lD2nsGRMZki4GS92TIcUYhmrQsy
1i2XYfSJ+g+LXb07d3ncANWDbeiX5ud8/2kxncqWlQKBgQDrn+Gb5aI3qIhPi09m
+afuVuzK3Nnd3cOZ0dsxX9Sf8VHc9227t/odS71FsXLnymg3G1zxaAjRiqJfs/x7
qLlDmLUPGXBULwIP2a5ZMaSx34TJpM9bjlMPz1IEDoORo+KwwUKwhyclA5Uc+CQA
jRbxsTfBUq9SQpB8ladMqvWJxQKBgQC9c9SPOGEaqd/U/ZyPX6YTIavtNRKkS7PA
oTqrhZIujRxu3Hxy11rjgUHUW3XlxjvWENm4A1fvn7NoNyMvni5PquZwCPHB4Ely
zHUe5NWUpX1duHnd15aZv0aqS8uRWKpLM1PA3HhpqqP5YpArGqsm6H/gGQnpknnc
/A1pOPFq8wKBgGbpXdCJa2CD64VSg0umnwIqVSIFc+LDiTsVvXbDNErnS6oHJ5Zl
tIg3HGPkLRuv+/SVrvKBTdi3hFPoeM5J0yEDAZGmurkKDwx9NvkeBaDqz0SDB04l
y4GMO3YqIKzrt4cb4dTYMvCnr+kHODJFbVAC5yc4xfpXuGOxuXBy+utBAoGBAIfa
zA54C4onTw9ZXi+iE2Gcv8E2UcvnTVtRQtVEz3L6Ve1ZxxRDQjXqtt4lSAIhiT8U
jkvaefCnwOt2vpCjCeqvTtgAUf0JbSIZY9NnnZEeqyvN4fYnZyOReoccGzp7LoMG
p4ShlOeRKkznVSLT2O/pweldizIni6PgS22tG9HpAoGBAKpsi8AMPTevZU1OobUf
w1/RVweBSh2nQ+COttH4vDD4RhXE/vSWPTQRD5oAJMeDnovn/ngs/+nGpa9bH8nf
jLvl/GVnbNd9kfIkECQ2/C4srIRCw8QaHNUscf1w46s3jj5RzoS77sQHYxDC17/z
p7PG7SYRwasRPG5C2WWIDJod
-----END PRIVATE KEY-----
EOF

echo "Adding new version of the secret with properly formatted key..."
cat /tmp/firebase_key.txt | gcloud secrets versions add FIREBASE_ADMIN_PRIVATE_KEY \
  --data-file=- \
  --project=$PROJECT_ID

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully added new version with properly formatted private key!"
  echo ""
  echo "Cleaning up temporary file..."
  rm /tmp/firebase_key.txt
  echo ""
  echo "Now run: ./grant-secrets-access.sh"
  echo "Then push a commit to trigger deployment."
else
  echo ""
  echo "❌ Failed to add secret version"
  rm /tmp/firebase_key.txt
fi

