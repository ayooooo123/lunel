<img src="asset/sandman.png" alt="Sandman" width="240" height="240">

# Sandman

Firecracker VM manager daemon for Lunel. Exposes an HTTP API to create, manage, and destroy sandboxed microVMs.

## Requirements

- Linux with KVM support
- Root access
- Base rootfs.ext4 image
- Linux kernel (vmlinux) for Firecracker

## Installation

```bash
go build -o sandman .
```

## Usage

```bash
sudo ./sandman \
  --auth=<64-char-alphanumeric-token> \
  --image=/path/to/rootfs.ext4 \
  --kernel=/path/to/vmlinux-5.10.bin \
  --port=6677
```

### Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--auth` | Yes | - | 64 character alphanumeric authentication token |
| `--image` | Yes | - | Path to base rootfs.ext4 image |
| `--kernel` | Yes | - | Path to vmlinux kernel binary |
| `--port` | No | 6677 | API server port |

## API

All endpoints (except `/health`) require authentication via Bearer token:

```
Authorization: Bearer <token>
```

### Endpoints

#### Health Check
```
GET /health
```
Returns `{"status": "ok"}` - no authentication required.

#### Get Resources
```
GET /resources
```
Returns system resource information:
```json
{
  "total_cpus": 12,
  "available_cpus": 10,
  "used_cpus": 2,
  "reserved_cpus": 2,
  "total_ram_gb": 32,
  "available_ram_gb": 18,
  "used_ram_gb": 4,
  "reserved_ram_gb": 10,
  "vm_count": 1
}
```

#### List VMs
```
GET /vms
```
Returns array of all VMs.

#### Create VM
```
POST /vms
Content-Type: application/json

{
  "sandbox_id": "my-sandbox-123",
  "repo_url": "https://github.com/user/repo.git",
  "branch": "main",
  "profile": "2-4-20-s"
}
```

**Profile format:** `<vcpus>-<ram_gb>-<storage_gb>-<mode>`
- `vcpus`: Number of virtual CPUs (1-128)
- `ram_gb`: RAM in gigabytes (1-512)
- `storage_gb`: Storage in gigabytes (1-1000)
- `mode`: `d` for dedicated (CPU pinning) or `s` for shared

Examples:
- `2-4-20-s` - 2 vCPUs, 4GB RAM, 20GB storage, shared
- `4-8-50-d` - 4 vCPUs, 8GB RAM, 50GB storage, dedicated with CPU pinning

**Response:**
```json
{
  "sandbox_id": "my-sandbox-123",
  "repo_url": "https://github.com/user/repo.git",
  "branch": "main",
  "profile": "2-4-20-s",
  "ip_address": "172.16.0.2",
  "status": "running",
  "created_at": "2026-01-28T10:30:00Z"
}
```

#### Get VM
```
GET /vms/:sandbox_id
```

#### Delete VM
```
DELETE /vms/:sandbox_id
```

## Resource Management

Sandman reserves resources for the host OS:
- **2 CPUs** reserved for host
- **10 GB RAM** reserved for host

VM creation will be rejected if requested resources exceed available capacity.

## State Persistence

Sandman persists state to `sandman.json` in the same directory as the binary. On restart:
1. Loads existing state
2. Verifies which VMs are still alive
3. Cleans up dead VMs
4. Continues managing live VMs

VMs continue running if Sandman is stopped/restarted.

## VM Lifecycle

1. **Create**: Copies base image, resizes to requested storage, injects job config, creates TAP device, starts Firecracker
2. **Run**: VM boots, clones repo, runs workload
3. **Delete**: Kills Firecracker process, removes TAP device, deletes image

## Network

Each VM gets:
- Unique TAP device
- IP address from 172.16.0.0/24 subnet (host is 172.16.0.1)
- Unique MAC address based on sandbox_id
- NAT for outbound internet access
