#!/bin/sh
# さくらの CRON から定期実行し、GitHub の DEPLOY_BRANCH に新しいコミットがあれば
# sakura-api/public の中身を DEPLOY_DIR に展開する。
# 例（CRON 設定）: */10 * * * * /bin/sh $HOME/bin/pull-deploy.sh >> $HOME/log/pull-deploy.log 2>&1

REPO_URL=https://github.com/aoshika-h/strava-app-project.git
DEPLOY_BRANCH=main
DEPLOY_DIR="$HOME/www/icu-proxy"
SRC_PATH=sakura-api/public
MIRROR="$HOME/git/strava-app-project.git"
STATE_FILE="$HOME/git/strava-app-project.deployed"

PATH=/usr/local/bin:/usr/bin:/bin
export PATH

if [ ! -d "$MIRROR" ]; then
    git clone --quiet --bare "$REPO_URL" "$MIRROR" || exit 1
fi

git --git-dir="$MIRROR" fetch --quiet origin "+refs/heads/$DEPLOY_BRANCH:refs/heads/$DEPLOY_BRANCH" || exit 1
rev=$(git --git-dir="$MIRROR" rev-parse "refs/heads/$DEPLOY_BRANCH") || exit 1

if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$rev" ]; then
    exit 0
fi

mkdir -p "$DEPLOY_DIR" || exit 1
if git --git-dir="$MIRROR" archive "$rev" "$SRC_PATH" | tar -x -f - -C "$DEPLOY_DIR" --strip-components 2; then
    echo "$rev" > "$STATE_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S') deploy: $SRC_PATH ($rev) -> $DEPLOY_DIR"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') deploy: 展開に失敗しました ($rev)" >&2
    exit 1
fi
