#!/bin/bash

# Variables
SOURCE_DIR="/home/albert/MyProjects/SpringProjects/bandWristManagement"
DEPLOY_DIR="/home/albert/Desktop/bandWrist_railway"
REPO_URL="https://github.com/Reader-Mobile-fest2-fun/pre-production.git"
BRANCH="master"
HISTORICAL_DIR="$DEPLOY_DIR/historicalBuilds"
HISTORICAL_LOG="$HISTORICAL_DIR/historicalBuilds.txt"
SOURCE_JAR="invitenosqlhilla-1.0-SNAPSHOT.jar"
RAILWAY_LOG="$DEPLOY_DIR/railway_deploy.log"

# Ensure historicalBuilds directory exists
mkdir -p "$HISTORICAL_DIR"

# Step 1: Prompt for title, description, and version reset
echo "Enter build title:"
read TITLE
echo "Enter build description:"
read DESCRIPTION
echo "Reset version (e.g., '1.1.0' or '2.0.0')? If empty, increment patch (e.g., 1.0.0 to 1.0.1):"
read RESET_VERSION

# Step 2: Determine new JAR name
LATEST_JAR=$(ls -t "$DEPLOY_DIR"/bandWristManager_v*.jar 2>/dev/null | head -n 1)
if [ -z "$LATEST_JAR" ]; then
    # No previous JAR, start at 1.0.0
    JAR_VERSION="1.0.0"
elif [ -n "$RESET_VERSION" ]; then
    # User provided a new version (e.g., 1.1.0, 2.0.0)
    if [[ "$RESET_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        JAR_VERSION="$RESET_VERSION"
    else
        echo "Invalid reset version format! Use X.Y.Z (e.g., 1.1.0)"; exit 1
    fi
else
    # Extract version from latest JAR (e.g., bandWristManager_v1.0.0.jar -> 1.0.0)
    CURRENT_VERSION=$(basename "$LATEST_JAR" | sed -n 's/.*_v\(.*\)\.jar$/\1/p')
    if [[ "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
        MAJOR=${BASH_REMATCH[1]}
        MINOR=${BASH_REMATCH[2]}
        PATCH=${BASH_REMATCH[3]}
        JAR_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
    else
        echo "Invalid version format in $LATEST_JAR! Expected X.Y.Z"; exit 1
    fi
fi
JAR_NAME="bandWristManager_v${JAR_VERSION}.jar"

# Step 3: Build new JAR
echo "Building new JAR in $SOURCE_DIR..."
cd "$SOURCE_DIR" || { echo "Source directory not found!"; exit 1; }
# Ensure mvnw is executable
if [ ! -x "./mvnw" ]; then
    echo "Setting executable permissions for mvnw..."
    chmod +x ./mvnw || { echo "Failed to set permissions for mvnw!"; exit 1; }
fi
# Clear target directory
echo "Clearing $SOURCE_DIR/target..."
rm -rf target || { echo "Failed to clear target directory!"; exit 1; }
# Build JAR
./mvnw clean package -Pproduction -DskipTests || { echo "Maven build failed!"; exit 1; }

# Step 4: Copy and rename new JAR to deployment directory and project directory
echo "Copying and renaming JAR $SOURCE_JAR to $JAR_NAME in $DEPLOY_DIR and $SOURCE_DIR..."
if [ ! -f "target/$SOURCE_JAR" ]; then
    echo "JAR $SOURCE_JAR not found in $SOURCE_DIR/target!"; exit 1
fi
cp "target/$SOURCE_JAR" "$DEPLOY_DIR/$JAR_NAME" || { echo "JAR copy to $DEPLOY_DIR failed!"; exit 1; }


# Step 5: Update historicalBuilds.txt
echo "Updating $HISTORICAL_LOG..."
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "JAR: $JAR_NAME | Date: $CURRENT_DATE | Title: $TITLE | Description: $DESCRIPTION" >> "$HISTORICAL_LOG"

# Step 6: Update Dockerfile
echo "Updating Dockerfile..."
cd "$DEPLOY_DIR" || { echo "Deploy directory not found!"; exit 1; }
cat > Dockerfile << EOF
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY $JAR_NAME /app/$JAR_NAME
EXPOSE 8080
CMD ["java", "-jar", "/app/$JAR_NAME"]
EOF

# Step 7: Commit and push to GitHub
echo "Pushing to GitHub..."
git add "$JAR_NAME" Dockerfile .gitignore || { echo "Git add failed!"; exit 1; }
git commit -m "Deploy $JAR_NAME: $TITLE" || { echo "Git commit failed!"; exit 1; }
git push origin "$BRANCH" || { echo "Git push failed!"; exit 1; }

# Step 8: Move old JARs to historicalBuilds
if ls "$DEPLOY_DIR"/bandWristManager_v*.jar 2>/dev/null | grep -v "$JAR_NAME" >/dev/null; then
    echo "Moving old JAR(s) to $HISTORICAL_DIR..."
    for jar in "$DEPLOY_DIR"/bandWristManager_v*.jar; do
        if [ "$(basename "$jar")" != "$JAR_NAME" ]; then
            mv "$jar" "$HISTORICAL_DIR" || { echo "Move failed for $jar!"; exit 1; }
        fi
    done
fi

# Step 9: Deploy to Railway
echo "Deploying to Railway..."
if ! timeout 300 railway up --service impartial-essence >> "$RAILWAY_LOG" 2>&1; then
    echo "Railway deployment failed! Check $RAILWAY_LOG for details."
    cat "$RAILWAY_LOG"
    exit 1
fi

# Step 10: Monitor logs
echo "Checking deployment logs..."
railway logs >> "$RAILWAY_LOG" 2>&1
cat "$RAILWAY_LOG"

echo "Deployment complete! URL: https://impartial-essence.up.railway.app"
