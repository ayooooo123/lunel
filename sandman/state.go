package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"syscall"
)

// StateManager handles state persistence with mutex protection
type StateManager struct {
	mu       sync.RWMutex
	state    *State
	filePath string
}

// NewStateManager creates a new state manager
func NewStateManager(filePath string) *StateManager {
	return &StateManager{
		state:    NewState(),
		filePath: filePath,
	}
}

// Load loads state from disk, returns true if loaded from existing file
func (sm *StateManager) Load() (bool, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	data, err := os.ReadFile(sm.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// No existing state, start fresh
			sm.state = NewState()
			return false, nil
		}
		return false, fmt.Errorf("failed to read state file: %w", err)
	}

	var state State
	if err := json.Unmarshal(data, &state); err != nil {
		return false, fmt.Errorf("failed to parse state file: %w", err)
	}

	if state.VMs == nil {
		state.VMs = make(map[string]*VM)
	}

	sm.state = &state
	return true, nil
}

// Save persists state to disk using atomic write
func (sm *StateManager) Save() error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	return sm.saveUnlocked()
}

// saveUnlocked saves without acquiring lock (caller must hold lock)
func (sm *StateManager) saveUnlocked() error {
	data, err := json.MarshalIndent(sm.state, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal state: %w", err)
	}

	// Atomic write: write to temp file, then rename
	tmpPath := sm.filePath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write temp state file: %w", err)
	}

	if err := os.Rename(tmpPath, sm.filePath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to rename state file: %w", err)
	}

	return nil
}

// GetVM returns a VM by sandbox ID (read-only copy)
func (sm *StateManager) GetVM(sandboxID string) (*VM, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	vm, ok := sm.state.VMs[sandboxID]
	if !ok {
		return nil, false
	}

	// Return a copy
	vmCopy := *vm
	return &vmCopy, true
}

// GetAllVMs returns all VMs (read-only copies)
func (sm *StateManager) GetAllVMs() []*VM {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	vms := make([]*VM, 0, len(sm.state.VMs))
	for _, vm := range sm.state.VMs {
		vmCopy := *vm
		vms = append(vms, &vmCopy)
	}
	return vms
}

// AddVM adds a new VM to state and saves
func (sm *StateManager) AddVM(vm *VM) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if _, exists := sm.state.VMs[vm.SandboxID]; exists {
		return fmt.Errorf("VM with sandbox_id %s already exists", vm.SandboxID)
	}

	sm.state.VMs[vm.SandboxID] = vm

	// Update resource tracking
	sm.state.AllocatedRAM += vm.Profile.RAMGb * 1024
	if vm.Profile.Dedicated {
		sm.state.AllocatedCPUs = append(sm.state.AllocatedCPUs, vm.AllocCPUs...)
	}

	return sm.saveUnlocked()
}

// RemoveVM removes a VM from state and saves
func (sm *StateManager) RemoveVM(sandboxID string) (*VM, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	vm, exists := sm.state.VMs[sandboxID]
	if !exists {
		return nil, fmt.Errorf("VM with sandbox_id %s not found", sandboxID)
	}

	delete(sm.state.VMs, sandboxID)

	// Update resource tracking
	sm.state.AllocatedRAM -= vm.Profile.RAMGb * 1024
	if sm.state.AllocatedRAM < 0 {
		sm.state.AllocatedRAM = 0
	}

	if vm.Profile.Dedicated {
		sm.state.AllocatedCPUs = removeCPUs(sm.state.AllocatedCPUs, vm.AllocCPUs)
	}

	if err := sm.saveUnlocked(); err != nil {
		// Add back on save failure
		sm.state.VMs[sandboxID] = vm
		return nil, err
	}

	return vm, nil
}

// AllocateIP allocates the next available IP address
func (sm *StateManager) AllocateIP() string {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	ip := fmt.Sprintf("172.16.0.%d", sm.state.NextIPIndex)
	sm.state.NextIPIndex++

	// Wrap around if needed (skip .0 and .1)
	if sm.state.NextIPIndex > 254 {
		sm.state.NextIPIndex = 2
	}

	return ip
}

// GetAllocatedResources returns current resource allocation
func (sm *StateManager) GetAllocatedResources() (cpuCount int, ramMb int, vmCount int) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	// Count actual CPU usage (dedicated + shared)
	cpuCount = 0
	for _, vm := range sm.state.VMs {
		cpuCount += vm.Profile.VCPUs
	}

	return cpuCount, sm.state.AllocatedRAM, len(sm.state.VMs)
}

// GetAllocatedCPUList returns list of allocated CPU cores
func (sm *StateManager) GetAllocatedCPUList() []int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	cpus := make([]int, len(sm.state.AllocatedCPUs))
	copy(cpus, sm.state.AllocatedCPUs)
	return cpus
}

// VMExists checks if a VM exists
func (sm *StateManager) VMExists(sandboxID string) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	_, exists := sm.state.VMs[sandboxID]
	return exists
}

// IsProcessAlive checks if a process with given PID is alive
func IsProcessAlive(pid int) bool {
	if pid <= 0 {
		return false
	}

	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	// Send signal 0 to check if process exists
	err = process.Signal(syscall.Signal(0))
	return err == nil
}

// CleanupDeadVMs removes VMs whose processes are dead
func (sm *StateManager) CleanupDeadVMs() []string {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	deadVMs := []string{}
	for id, vm := range sm.state.VMs {
		if !IsProcessAlive(vm.PID) {
			deadVMs = append(deadVMs, id)
		}
	}

	for _, id := range deadVMs {
		vm := sm.state.VMs[id]
		delete(sm.state.VMs, id)

		// Update resource tracking
		sm.state.AllocatedRAM -= vm.Profile.RAMGb * 1024
		if vm.Profile.Dedicated {
			sm.state.AllocatedCPUs = removeCPUs(sm.state.AllocatedCPUs, vm.AllocCPUs)
		}
	}

	if len(deadVMs) > 0 {
		sm.saveUnlocked()
	}

	return deadVMs
}

// GetStateFilePath returns the state file path
func GetStateFilePath() string {
	exe, err := os.Executable()
	if err != nil {
		return "sandman.json"
	}
	return filepath.Join(filepath.Dir(exe), "sandman.json")
}

// removeCPUs removes specified CPUs from a list
func removeCPUs(list, toRemove []int) []int {
	removeMap := make(map[int]bool)
	for _, cpu := range toRemove {
		removeMap[cpu] = true
	}

	result := []int{}
	for _, cpu := range list {
		if !removeMap[cpu] {
			result = append(result, cpu)
		}
	}
	return result
}
