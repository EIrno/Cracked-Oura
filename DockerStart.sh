#!/usr/bin/env bash
set -euo pipefail

load_env_file() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "$env_file"
        set +a
    fi
}

resolve_data_dir() {
    local script_dir="$1"
    local raw_path="${CRACKED_OURA_DATA_PATH:-./data}"
    local resolved_path

    if [[ "$raw_path" == /* ]]; then
        resolved_path="$raw_path"
    else
        resolved_path="$script_dir/$raw_path"
    fi

    mkdir -p "$resolved_path"
    printf '%s\n' "$resolved_path"
}

run_compose() {
    local compose_file="$1"
    shift

    if docker compose version >/dev/null 2>&1; then
        docker compose -f "$compose_file" "$@"
    elif command -v docker-compose >/dev/null 2>&1; then
        docker-compose -f "$compose_file" "$@"
    else
        printf 'Error: neither "docker compose" nor "docker-compose" is available.\n' >&2
        return 1
    fi
}

main() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    load_env_file "$script_dir/.env"

    export PUID="${PUID:-$(id -u)}"
    export PGID="${PGID:-$(id -g)}"

    local data_dir
    data_dir="$(resolve_data_dir "$script_dir")"

    local -a compose_args=("up" "-d")
    if [[ "${1:-}" == "--build" ]] || ! docker image inspect cracked-oura:latest >/dev/null 2>&1; then
        compose_args+=("--build")
    fi

    run_compose "$script_dir/docker-compose.yml" "${compose_args[@]}"

    local port="${CRACKED_OURA_PORT:-8000}"
    printf 'Cracked Oura is starting...\n'
    printf 'Web UI & API: http://localhost:%s\n' "$port"
    printf 'Persistent data directory: %s\n' "$data_dir"
}

main "$@"
