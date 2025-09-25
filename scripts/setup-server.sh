#!/usr/bin/env bash
set -euo pipefail

DEFAULT_SERVER_NAME="_"
DEFAULT_WEB_ROOT="/var/www/html"
DEFAULT_SERVICE_USER="www-data"

print_help() {
	cat <<'EOF'
Usage: setup-server.sh [options]

Re-provisions Node.js and nginx on a fresh Ubuntu/Debian server. The script:
  • Removes existing PM2 process manager and Node.js runtime packages
  • Installs Node.js 18.x from NodeSource
  • Installs and configures nginx with a single site in /etc/nginx/sites-available
  • Deploys the provided static site into /var/www/html (or a custom directory)

Options:
  --source <path>         Local path (on the server) to static assets that should be
                          copied into the web root. If omitted, the script will leave
                          the current contents in place.
  --web-root <path>       Directory to serve with nginx. Default: /var/www/html
  --server-name <name>    Value for nginx server_name directive. Default: _
  --service-user <name>   System user that should own the web root. Default: www-data
  -h, --help              Show this help message and exit.

Run this script as root (sudo). It is idempotent and safe to re-run.
EOF
}

require_root() {
	if [[ "${EUID}" -ne 0 ]]; then
		echo "[ERROR] This script must be run as root (use sudo)." >&2
		exit 1
	fi
}

log_step() {
	echo
	echo "➡️  $1"
}

log_info() {
	echo "ℹ️  $1"
}

log_success() {
	echo "✅ $1"
}

log_warn() {
	echo "⚠️  $1"
}

log_error() {
	echo "❌ $1" >&2
}

remove_pm2() {
	log_step "Removing PM2 (if present)"
	if command -v pm2 >/dev/null 2>&1; then
		pm2 kill || true
		pm2 delete all || true
		pm2 unstartup systemd || true
		if command -v npm >/dev/null 2>&1; then
			npm remove -g pm2 || true
		fi
		log_success "PM2 removed"
	else
		log_info "PM2 not found; skipping removal"
	fi
}

purge_node() {
	log_step "Removing Node.js packages"
	apt-get purge -y nodejs npm || true
	apt-get autoremove -y || true
	log_success "Node.js packages removed"
}

install_node() {
	log_step "Installing Node.js 18.x"
	curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
	apt-get install -y nodejs
	node -v
	npm -v
	log_success "Node.js $(node -v) installed"
}

install_nginx() {
	log_step "Installing nginx"
	apt-get install -y nginx
	systemctl enable nginx
	log_success "nginx installed and enabled"
}

reset_nginx_sites() {
	local server_name="$1"
	local web_root="$2"

	log_step "Resetting nginx site configuration"
	systemctl stop nginx || true

	rm -f /etc/nginx/sites-enabled/*
	rm -f /etc/nginx/sites-available/*

	cat <<NGINX > /etc/nginx/sites-available/uniwswap.conf
server {
    listen 80;
    listen [::]:80;
    server_name ${server_name};

    root ${web_root};
    index index.html index.htm;

    access_log /var/log/nginx/uniwswap-access.log;
    error_log /var/log/nginx/uniwswap-error.log warn;

	location / {
		try_files \$uri \$uri/ /index.html;
    }
}
NGINX

	ln -sf /etc/nginx/sites-available/uniwswap.conf /etc/nginx/sites-enabled/uniwswap.conf
	nginx -t
	systemctl restart nginx
	log_success "nginx reloaded with fresh configuration"
}

prepare_web_root() {
	local source_path="$1"
	local web_root="$2"
	local service_user="$3"

	log_step "Preparing web root at ${web_root}"
	mkdir -p "${web_root}"

	if [[ -n "${source_path}" ]]; then
		if [[ ! -d "${source_path}" ]]; then
			log_error "Source path ${source_path} does not exist or is not a directory"
			exit 1
		fi

		log_info "Syncing static assets from ${source_path}"
		rsync -a --delete "${source_path}/" "${web_root}/"
	else
		log_info "No source provided; leaving existing web root contents"
	fi

	find "${web_root}" -type d -exec chmod 755 {} +
	find "${web_root}" -type f -exec chmod 644 {} +
	chown -R "${service_user}:${service_user}" "${web_root}"
	log_success "Web root ready"
}

main() {
	require_root

	local source_path=""
	local web_root="${DEFAULT_WEB_ROOT}"
	local server_name="${DEFAULT_SERVER_NAME}"
	local service_user="${DEFAULT_SERVICE_USER}"

	while [[ $# -gt 0 ]]; do
		case "$1" in
			--source)
				source_path="$2"
				shift 2
				;;
			--web-root)
				web_root="$2"
				shift 2
				;;
			--server-name)
				server_name="$2"
				shift 2
				;;
			--service-user)
				service_user="$2"
				shift 2
				;;
			-h|--help)
				print_help
				exit 0
				;;
			*)
				log_error "Unknown option: $1"
				print_help
				exit 1
				;;
		esac
	done

	log_step "Updating apt cache"
	apt-get update

	remove_pm2
	purge_node
	install_node
	install_nginx
	apt-get install -y rsync
	prepare_web_root "${source_path}" "${web_root}" "${service_user}"
	reset_nginx_sites "${server_name}" "${web_root}"

	log_success "Server provisioning complete"
	log_info "Node.js version: $(node -v)"
	log_info "nginx status: $(systemctl is-active nginx)"
}

main "$@"
