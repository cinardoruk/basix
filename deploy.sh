#!/bin/bash

set -euo pipefail

# clean up ssh_agent
cleanup() {
  if [[ -n "${SSH_AGENT_PID:-}" ]]; then
    echo "▶ Cleaning up SSH agent..."
    ssh-agent -k
  fi
}

# Run cleanup on script exit (success or failure)
trap cleanup EXIT

# get deployment envars
CONFIG_FILE="$(dirname "$0")/.build_deploy.env"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
else
  echo "❌ Missing config: $CONFIG_FILE"
  exit 1
fi

start_ssh_agent() {
	echo "▶ Starting SSH agent..."
	eval "$(ssh-agent -s)"

	echo "▶ Unlocking SSH key..."
	ssh-add "$VPS_SSH_KEY_PATH"

	# optional: test that it worked
	ssh -o BatchMode=yes -p "$VPS_SSH_PORT" "$VPS_SSH" 'echo "✅ Connected!"'
}

# conveniently run commands on remote machine
ssh_to_vps(){
	ssh -i "$VPS_SSH_KEY_PATH" -p "$VPS_SSH_PORT" "$VPS_SSH" "$@"
}

build(){
  echo "building react project with vite"

  ( cd $CLIENT_DIR && npx vite build )
}

rsync_frontend(){

  rsync -avz --delete --info=progress2 -e "ssh -p $VPS_SSH_PORT -i $VPS_SSH_KEY_PATH" "$CLIENT_DIST_DIR" "$VPS_USER@$VPS_HOST:$VPS_WORKTREE"

}

# rsync backend, run npm install to make sure we're not missing node modules
rsync_backend(){

  rsync -avz --delete \
    --exclude-from="$SERVER_DIR/.rsyncignore" \
    --info=progress2 \
    -e "ssh -p $VPS_SSH_PORT -i $VPS_SSH_KEY_PATH" \
    "$SERVER_DIR" "$VPS_USER@$VPS_HOST:$VPS_WORKTREE"

  ssh_to_vps "cd $VPS_WORKTREE/server && npm i"

}

start_backend(){

  ssh_to_vps "cd $VPS_WORKTREE/server && nohup npm start > server.log 2>&1 & disown"
  echo "✅ Backend started in background. Check logs with: ssh ... 'tail -f $VPS_WORKTREE/server/server.log'"

}

stop_backend(){
  ssh_to_vps "
  PID=\$(lsof -ti :5000)
  if [[ -n \"\$PID\" ]]; then
    kill \$PID && echo '✅ Stopped backend on port 5000 (PID:'\$PID')'
  else
    echo 'ℹ  No process running on port 5000'
  fi
      "
}

restart_backend(){
  echo "▶ Restarting backend..."
  stop_backend
  sleep 2
  start_backend
}

check_logs(){
  ssh_to_vps "tail -n 50 -f $VPS_WORKTREE/server/server.log"
}

browse_logs(){
  ssh_to_vps "less $VPS_WORKTREE/server/server.log"
}

usage() {
  echo "Usage: $0 [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  build              - Build React frontend with Vite"
  echo "  rsync_frontend     - Build and sync frontend to VPS"
  echo "  rsync_backend      - Sync backend to VPS and install dependencies"
  echo "  build_rsync_all    - Build and sync both frontend and backend"
  echo "  start_backend      - Start the Express backend on VPS"
  echo "  stop_backend       - Stop the Express backend on VPS"
  echo "  restart_backend    - Restart the Express backend on VPS"
  echo "  check_logs         - View live server logs (tail -f)"
  echo "  browse_logs        - Browse server logs (less)"
  echo "  help               - Show this help message"
}

main() {

  if [[ $# -eq 0 ]]; then
    usage
    exit 1
  fi
  start_ssh_agent

  for arg in "$@"; do
	  case $arg in
		  build)
			  build
			  ;;
		  rsync_frontend)
        build
			  rsync_frontend
			  ;;
		  rsync_backend)
			  rsync_backend
			  ;;
		  build_rsync_all)
			  build
        rsync_frontend
			  rsync_backend
			  ;;
		  start_backend)
			  start_backend
			  ;;
		  stop_backend)
			  stop_backend
			  ;;
		  restart_backend)
			  restart_backend
			  ;;
		  check_logs)
			  check_logs
			  ;;
		  browse_logs)
			  browse_logs
			  ;;
		  help)
			  usage
			  ;;
		  *)
			  echo "Error: Unknown option '$arg'"
			  usage
			  exit 1
			  ;;
	  esac
  done
}


main "$@"
