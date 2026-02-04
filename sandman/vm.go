package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

const (
	VMDir           = "/tmp/lunel-vms"
	FirecrackerPath = "/usr/local/bin/firecracker"
	FirecrackerURL  = "https://github.com/firecracker-microvm/firecracker/releases/download/v1.14.1/firecracker-v1.14.1-x86_64.tgz"
)

// VMManager handles VM lifecycle
type VMManager struct {
	baseImagePath  string
	kernelPath     string
	stateMgr       *StateManager
	netMgr         *NetworkManager
	resourceMgr    *ResourceTracker
}

// NewVMManager creates a new VM manager
func NewVMManager(baseImagePath, kernelPath string, stateMgr *StateManager, netMgr *NetworkManager, resourceMgr *ResourceTracker) *VMManager {
	return &VMManager{
		baseImagePath: baseImagePath,
		kernelPath:    kernelPath,
		stateMgr:      stateMgr,
		netMgr:        netMgr,
		resourceMgr:   resourceMgr,
	}
}

// EnsureFirecracker ensures Firecracker is installed
func (vmm *VMManager) EnsureFirecracker() error {
	if _, err := os.Stat(FirecrackerPath); err == nil {
		// Already exists, check version
		output, err := exec.Command(FirecrackerPath, "--version").Output()
		if err == nil {
			fmt.Printf("Firecracker found: %s", string(output))
			return nil
		}
	}

	fmt.Println("Firecracker not found, downloading...")

	// Download and extract
	tmpDir, err := os.MkdirTemp("", "firecracker-download")
	if err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	tgzPath := filepath.Join(tmpDir, "firecracker.tgz")

	// Download
	if err := runCommand("curl", "-fSL", "-o", tgzPath, FirecrackerURL); err != nil {
		return fmt.Errorf("failed to download Firecracker: %w", err)
	}

	// Extract
	if err := runCommand("tar", "-xzf", tgzPath, "-C", tmpDir); err != nil {
		return fmt.Errorf("failed to extract Firecracker: %w", err)
	}

	// Find and copy firecracker binary
	matches, _ := filepath.Glob(filepath.Join(tmpDir, "release-*/firecracker-*-x86_64"))
	if len(matches) == 0 {
		return fmt.Errorf("firecracker binary not found in archive")
	}

	if err := runCommand("cp", matches[0], FirecrackerPath); err != nil {
		return fmt.Errorf("failed to install Firecracker: %w", err)
	}

	if err := runCommand("chmod", "+x", FirecrackerPath); err != nil {
		return fmt.Errorf("failed to make Firecracker executable: %w", err)
	}

	fmt.Println("Firecracker installed successfully")
	return nil
}

// CreateVM creates and starts a new VM
func (vmm *VMManager) CreateVM(req *CreateVMRequest) (*VM, error) {
	profile, err := ParseProfile(req.Profile)
	if err != nil {
		return nil, err
	}

	// Check if VM already exists
	if vmm.stateMgr.VMExists(req.SandboxID) {
		return nil, fmt.Errorf("VM with sandbox_id %s already exists", req.SandboxID)
	}

	// Check resource availability
	allocCPUs, allocRAM, _ := vmm.stateMgr.GetAllocatedResources()
	if err := vmm.resourceMgr.CanAllocate(profile.VCPUs, profile.RAMGb*1024, allocCPUs, allocRAM); err != nil {
		return nil, err
	}

	// Allocate CPUs for dedicated mode
	var pinnedCPUs []int
	if profile.Dedicated {
		allocCPUList := vmm.stateMgr.GetAllocatedCPUList()
		pinnedCPUs, err = vmm.resourceMgr.FindFreeCPUs(profile.VCPUs, allocCPUList)
		if err != nil {
			return nil, err
		}
	}

	// Create VM directory
	if err := os.MkdirAll(VMDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create VM directory: %w", err)
	}

	// Allocate network resources
	ip := vmm.stateMgr.AllocateIP()
	mac := vmm.netMgr.GenerateMAC(req.SandboxID)

	tapDevice, err := vmm.netMgr.CreateTapDevice(req.SandboxID)
	if err != nil {
		return nil, fmt.Errorf("failed to create TAP device: %w", err)
	}

	// Setup paths
	imagePath := filepath.Join(VMDir, req.SandboxID+".ext4")
	configPath := filepath.Join(VMDir, req.SandboxID+".json")
	socketPath := filepath.Join(VMDir, req.SandboxID+".sock")

	// Cleanup function for failures
	cleanup := func() {
		vmm.netMgr.DeleteTapDevice(req.SandboxID)
		os.Remove(imagePath)
		os.Remove(configPath)
		os.Remove(socketPath)
	}

	// Copy and resize base image
	if err := vmm.prepareImage(imagePath, profile.StorageGb); err != nil {
		cleanup()
		return nil, fmt.Errorf("failed to prepare image: %w", err)
	}

	// Inject job config
	if err := vmm.injectJobConfig(imagePath, req.SandboxID, req.RepoURL, req.Branch); err != nil {
		cleanup()
		return nil, fmt.Errorf("failed to inject job config: %w", err)
	}

	// Configure VM network
	if err := vmm.netMgr.ConfigureVMNetwork(req.SandboxID, ip); err != nil {
		cleanup()
		return nil, fmt.Errorf("failed to configure network: %w", err)
	}

	// Generate Firecracker config
	if err := vmm.generateConfig(configPath, imagePath, socketPath, tapDevice, mac, profile); err != nil {
		cleanup()
		return nil, fmt.Errorf("failed to generate config: %w", err)
	}

	// Start Firecracker
	pid, err := vmm.startFirecracker(configPath, socketPath, pinnedCPUs)
	if err != nil {
		cleanup()
		return nil, fmt.Errorf("failed to start Firecracker: %w", err)
	}

	// Create VM record
	vm := &VM{
		SandboxID:  req.SandboxID,
		RepoURL:    req.RepoURL,
		Branch:     req.Branch,
		Profile:    *profile,
		TapDevice:  tapDevice,
		IPAddress:  ip,
		MACAddress: mac,
		PID:        pid,
		ImagePath:  imagePath,
		ConfigPath: configPath,
		SocketPath: socketPath,
		CreatedAt:  time.Now(),
		AllocCPUs:  pinnedCPUs,
	}

	// Save to state
	if err := vmm.stateMgr.AddVM(vm); err != nil {
		// Kill the process and cleanup
		syscall.Kill(pid, syscall.SIGKILL)
		cleanup()
		return nil, fmt.Errorf("failed to save VM state: %w", err)
	}

	return vm, nil
}

// DeleteVM stops and removes a VM
func (vmm *VMManager) DeleteVM(sandboxID string) error {
	vm, err := vmm.stateMgr.RemoveVM(sandboxID)
	if err != nil {
		return err
	}

	// Kill the Firecracker process
	if IsProcessAlive(vm.PID) {
		syscall.Kill(vm.PID, syscall.SIGKILL)
		// Give it a moment to die
		time.Sleep(100 * time.Millisecond)
	}

	// Cleanup network
	vmm.netMgr.CleanupVMNetwork(sandboxID, vm.IPAddress)
	vmm.netMgr.DeleteTapDevice(sandboxID)

	// Remove files
	os.Remove(vm.ImagePath)
	os.Remove(vm.ConfigPath)
	os.Remove(vm.SocketPath)

	return nil
}

// GetVM returns a VM by sandbox ID
func (vmm *VMManager) GetVM(sandboxID string) (*VM, bool) {
	return vmm.stateMgr.GetVM(sandboxID)
}

// ListVMs returns all VMs
func (vmm *VMManager) ListVMs() []*VM {
	return vmm.stateMgr.GetAllVMs()
}

// prepareImage copies and resizes the base image
func (vmm *VMManager) prepareImage(imagePath string, storageGb int) error {
	// Copy base image
	if err := runCommand("cp", vmm.baseImagePath, imagePath); err != nil {
		return fmt.Errorf("failed to copy base image: %w", err)
	}

	// Resize if needed (base image is 10GB)
	if storageGb > 10 {
		sizeStr := fmt.Sprintf("%dG", storageGb)
		if err := runCommand("truncate", "-s", sizeStr, imagePath); err != nil {
			return fmt.Errorf("failed to resize image: %w", err)
		}

		// Resize filesystem
		if err := runCommand("e2fsck", "-f", "-y", imagePath); err != nil {
			// e2fsck returns 1 if it fixed errors, which is okay
		}
		if err := runCommand("resize2fs", imagePath); err != nil {
			return fmt.Errorf("failed to resize filesystem: %w", err)
		}
	}

	return nil
}

// injectJobConfig mounts the image and writes job config
func (vmm *VMManager) injectJobConfig(imagePath, sandboxID, repoURL, branch string) error {
	mountPoint := "/mnt/sandman-" + sandboxID

	if err := os.MkdirAll(mountPoint, 0755); err != nil {
		return err
	}
	defer os.Remove(mountPoint)

	// Mount
	if err := runCommand("mount", imagePath, mountPoint); err != nil {
		return fmt.Errorf("failed to mount image: %w", err)
	}
	defer runCommand("umount", mountPoint)

	// Write job config
	configDir := filepath.Join(mountPoint, "etc", "lunel")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	jobConfig := map[string]string{
		"repo_url":   repoURL,
		"sandbox_id": sandboxID,
		"branch":     branch,
	}

	data, err := json.MarshalIndent(jobConfig, "", "  ")
	if err != nil {
		return err
	}

	configPath := filepath.Join(configDir, "job.json")
	return os.WriteFile(configPath, data, 0644)
}

// generateConfig generates Firecracker config file
func (vmm *VMManager) generateConfig(configPath, imagePath, socketPath, tapDevice, mac string, profile *Profile) error {
	config := map[string]interface{}{
		"boot-source": map[string]interface{}{
			"kernel_image_path": vmm.kernelPath,
			"boot_args":         "console=ttyS0 reboot=k panic=1 pci=off root=/dev/vda rw init=/sbin/init random.trust_cpu=on random.trust_bootloader=on",
		},
		"drives": []map[string]interface{}{
			{
				"drive_id":       "rootfs",
				"path_on_host":   imagePath,
				"is_root_device": true,
				"is_read_only":   false,
			},
		},
		"machine-config": map[string]interface{}{
			"vcpu_count":   profile.VCPUs,
			"mem_size_mib": profile.RAMGb * 1024,
		},
		"network-interfaces": []map[string]interface{}{
			{
				"iface_id":      "eth0",
				"guest_mac":     mac,
				"host_dev_name": tapDevice,
			},
		},
		"entropy-device": map[string]interface{}{
			"rate_limiter": nil,
		},
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

// startFirecracker starts the Firecracker process
func (vmm *VMManager) startFirecracker(configPath, socketPath string, pinnedCPUs []int) (int, error) {
	var cmd *exec.Cmd

	if len(pinnedCPUs) > 0 {
		// Use taskset for CPU pinning
		cpuList := cpuListToString(pinnedCPUs)
		cmd = exec.Command("taskset", "-c", cpuList, FirecrackerPath, "--api-sock", socketPath, "--config-file", configPath)
	} else {
		cmd = exec.Command(FirecrackerPath, "--api-sock", socketPath, "--config-file", configPath)
	}

	// Detach from terminal
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setsid: true,
	}

	// Redirect output to null (we don't need VM logs)
	devNull, _ := os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	cmd.Stdout = devNull
	cmd.Stderr = devNull

	if err := cmd.Start(); err != nil {
		return 0, err
	}

	// Give it a moment to start
	time.Sleep(200 * time.Millisecond)

	// Check if it's still running
	if !IsProcessAlive(cmd.Process.Pid) {
		return 0, fmt.Errorf("Firecracker process died immediately")
	}

	return cmd.Process.Pid, nil
}

// CleanupDeadVMs cleans up resources for dead VMs
func (vmm *VMManager) CleanupDeadVMs() {
	deadVMs := vmm.stateMgr.CleanupDeadVMs()
	for _, sandboxID := range deadVMs {
		// We don't have the VM details anymore, but we can try to clean up by sandbox ID
		vmm.netMgr.DeleteTapDevice(sandboxID)
		os.Remove(filepath.Join(VMDir, sandboxID+".ext4"))
		os.Remove(filepath.Join(VMDir, sandboxID+".json"))
		os.Remove(filepath.Join(VMDir, sandboxID+".sock"))
		fmt.Printf("Cleaned up dead VM: %s\n", sandboxID)
	}
}

// cpuListToString converts CPU list to taskset format (e.g., "2,3,4")
func cpuListToString(cpus []int) string {
	strs := make([]string, len(cpus))
	for i, cpu := range cpus {
		strs[i] = fmt.Sprintf("%d", cpu)
	}
	return strings.Join(strs, ",")
}
