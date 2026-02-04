package main

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Profile represents a VM machine profile (e.g., "2-8-50-d")
type Profile struct {
	VCPUs     int    `json:"vcpus"`
	RAMGb     int    `json:"ram_gb"`
	StorageGb int    `json:"storage_gb"`
	Dedicated bool   `json:"dedicated"` // true = CPU pinning, false = shared
	Raw       string `json:"raw"`
}

// ParseProfile parses a profile string like "2-8-50-d"
func ParseProfile(s string) (*Profile, error) {
	re := regexp.MustCompile(`^(\d+)-(\d+)-(\d+)-([ds])$`)
	matches := re.FindStringSubmatch(s)
	if matches == nil {
		return nil, fmt.Errorf("invalid profile format: %s (expected: vcpus-ram_gb-storage_gb-d/s)", s)
	}

	vcpus, _ := strconv.Atoi(matches[1])
	ram, _ := strconv.Atoi(matches[2])
	storage, _ := strconv.Atoi(matches[3])
	dedicated := matches[4] == "d"

	if vcpus < 1 || vcpus > 128 {
		return nil, fmt.Errorf("vcpus must be between 1 and 128")
	}
	if ram < 1 || ram > 512 {
		return nil, fmt.Errorf("ram must be between 1 and 512 GB")
	}
	if storage < 1 || storage > 1000 {
		return nil, fmt.Errorf("storage must be between 1 and 1000 GB")
	}

	return &Profile{
		VCPUs:     vcpus,
		RAMGb:     ram,
		StorageGb: storage,
		Dedicated: dedicated,
		Raw:       s,
	}, nil
}

// VM represents a running virtual machine
type VM struct {
	SandboxID   string    `json:"sandbox_id"`
	RepoURL     string    `json:"repo_url"`
	Branch      string    `json:"branch"`
	Profile     Profile   `json:"profile"`
	TapDevice   string    `json:"tap_device"`
	IPAddress   string    `json:"ip_address"`
	MACAddress  string    `json:"mac_address"`
	PID         int       `json:"pid"`
	ImagePath   string    `json:"image_path"`
	ConfigPath  string    `json:"config_path"`
	SocketPath  string    `json:"socket_path"`
	CreatedAt   time.Time `json:"created_at"`
	AllocCPUs   []int     `json:"alloc_cpus,omitempty"` // For dedicated mode
}

// State represents the persisted state of Sandman
type State struct {
	VMs           map[string]*VM `json:"vms"`
	NextIPIndex   int            `json:"next_ip_index"`   // For IP allocation (172.16.0.X)
	AllocatedCPUs []int          `json:"allocated_cpus"`  // CPUs allocated to dedicated VMs
	AllocatedRAM  int            `json:"allocated_ram_mb"` // Total RAM allocated in MB
}

// NewState creates a new empty state
func NewState() *State {
	return &State{
		VMs:           make(map[string]*VM),
		NextIPIndex:   2, // Start from 172.16.0.2 (172.16.0.1 is host)
		AllocatedCPUs: []int{},
		AllocatedRAM:  0,
	}
}

// CreateVMRequest represents the API request to create a VM
type CreateVMRequest struct {
	SandboxID string `json:"sandbox_id"`
	RepoURL   string `json:"repo_url"`
	Branch    string `json:"branch"`
	Profile   string `json:"profile"`
}

// Validate validates the create request
func (r *CreateVMRequest) Validate() error {
	// Sandbox ID: alphanumeric, hyphens, underscores, 1-64 chars
	if !regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`).MatchString(r.SandboxID) {
		return fmt.Errorf("sandbox_id must be 1-64 alphanumeric characters (hyphens and underscores allowed)")
	}

	// Repo URL: must be https
	if !strings.HasPrefix(r.RepoURL, "https://") {
		return fmt.Errorf("repo_url must start with https://")
	}
	if len(r.RepoURL) > 500 {
		return fmt.Errorf("repo_url too long (max 500 chars)")
	}

	// Branch: alphanumeric, hyphens, underscores, slashes, dots
	if !regexp.MustCompile(`^[a-zA-Z0-9_./-]{1,100}$`).MatchString(r.Branch) {
		return fmt.Errorf("branch must be 1-100 valid branch characters")
	}

	// Profile: validated separately
	if _, err := ParseProfile(r.Profile); err != nil {
		return err
	}

	return nil
}

// VMResponse represents a VM in API responses
type VMResponse struct {
	SandboxID string  `json:"sandbox_id"`
	RepoURL   string  `json:"repo_url"`
	Branch    string  `json:"branch"`
	Profile   string  `json:"profile"`
	IPAddress string  `json:"ip_address"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

// ToResponse converts a VM to API response format
func (vm *VM) ToResponse(alive bool) VMResponse {
	status := "running"
	if !alive {
		status = "dead"
	}
	return VMResponse{
		SandboxID: vm.SandboxID,
		RepoURL:   vm.RepoURL,
		Branch:    vm.Branch,
		Profile:   vm.Profile.Raw,
		IPAddress: vm.IPAddress,
		Status:    status,
		CreatedAt: vm.CreatedAt.Format(time.RFC3339),
	}
}

// ResourcesResponse represents the API response for resource info
type ResourcesResponse struct {
	TotalCPUs     int `json:"total_cpus"`
	AvailableCPUs int `json:"available_cpus"`
	UsedCPUs      int `json:"used_cpus"`
	ReservedCPUs  int `json:"reserved_cpus"`

	TotalRAMGb     int `json:"total_ram_gb"`
	AvailableRAMGb int `json:"available_ram_gb"`
	UsedRAMGb      int `json:"used_ram_gb"`
	ReservedRAMGb  int `json:"reserved_ram_gb"`

	VMCount int `json:"vm_count"`
}

// ErrorResponse represents an API error
type ErrorResponse struct {
	Error string `json:"error"`
}
