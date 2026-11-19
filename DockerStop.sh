#!/usr/bin/env bash
set -euo pipefail

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

    run_compose "$script_dir/docker-compose.yml" down
    printf 'Cracked Oura container stopped. Persistent data has been preserved.\n'
}

main "$@"
